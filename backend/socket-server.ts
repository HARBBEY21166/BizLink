
import 'dotenv/config'; // Make sure to install dotenv and configure it
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import clientPromise from '../src/lib/mongodb'; // Adjusted path
import { ObjectId } from 'mongodb';
import type { MongoChatMessageDocument } from '../src/types'; // Adjusted path

const PORT = parseInt(process.env.SOCKET_IO_PORT || '3001', 10);
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'bizlink_db';

const httpServer = createServer();
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Log the incoming origin for debugging purposes
      console.log(`[Socket.IO CORS] Request from origin: ${origin}`);
      const clientURL = process.env.NEXT_PUBLIC_CLIENT_URL;

      if (!origin) { // Allow requests with no origin (like mobile apps or curl requests)
        return callback(null, true);
      }
      
      const allowedOrigins = [clientURL, "http://localhost:9002", "http://127.0.0.1:9002"];
      // Add more specific origins if NEXT_PUBLIC_CLIENT_URL is dynamic or has variations
      // e.g. if clientURL could be http://localhost:9002 or http://local.bizlink.app:9002
      // For simplicity, we are checking against a fixed set here plus the env var.

      if (allowedOrigins.some(allowed => origin.startsWith(allowed!))) {
        return callback(null, true);
      }
      
      console.error(`[Socket.IO CORS] Origin ${origin} not allowed. Allowed: ${allowedOrigins.join(', ')}`);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ["GET", "POST"]
  }
});

interface UserSocketMap {
  [userId: string]: string; // userId -> socketId
}
const userSocketMap: UserSocketMap = {};

const getRoomName = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join('_');
};

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Socket connected: ${socket.id}`);

  socket.on('storeUserId', (userId: string) => {
    if (userId) {
      userSocketMap[userId] = socket.id;
      console.log(`[Socket.IO] User ${userId} registered with socket ${socket.id}`);
    }
  });

  socket.on('joinChat', ({ chatPartnerId }: { chatPartnerId: string }) => {
    const currentUserId = Object.keys(userSocketMap).find(key => userSocketMap[key] === socket.id);
    if (currentUserId && chatPartnerId) {
      const roomName = getRoomName(currentUserId, chatPartnerId);
      socket.join(roomName);
      console.log(`[Socket.IO] Socket ${socket.id} (User ${currentUserId}) joined room: ${roomName}`);
      socket.data.currentRoom = roomName; 
      socket.data.currentUserId = currentUserId; 
    } else {
        console.warn(`[Socket.IO] Could not join chat for socket ${socket.id}: userId or chatPartnerId missing`);
    }
  });


  socket.on('sendMessage', async (data: { senderId: string; receiverId: string; message: string; tempId?: string }) => {
    const { senderId, receiverId, message, tempId } = data;
    const roomName = getRoomName(senderId, receiverId);

    if (!senderId || !receiverId || !message) {
      console.error('[Socket.IO sendMessage] Missing data', data);
      socket.emit('messageError', { tempId, error: 'Missing senderId, receiverId, or message' });
      return;
    }
    
    try {
      const client = await clientPromise;
      const db = client.db(MONGODB_DB_NAME);
      const messagesCollection = db.collection<Omit<MongoChatMessageDocument, '_id'>>('messages');
      
      const newMessage: Omit<MongoChatMessageDocument, '_id'> = {
        senderId: new ObjectId(senderId),
        receiverId: new ObjectId(receiverId),
        message,
        timestamp: new Date(),
        isRead: false,
      };

      const result = await messagesCollection.insertOne(newMessage);
      
      if (result.insertedId) {
        const savedMessageForEmit = {
          id: result.insertedId.toString(),
          senderId,
          receiverId,
          message,
          timestamp: newMessage.timestamp.toISOString(),
          isRead: newMessage.isRead,
          tempId, 
        };
        io.to(roomName).emit('receiveMessage', savedMessageForEmit);
        console.log(`[Socket.IO] Message from ${senderId} to ${receiverId} in room ${roomName}: ${message}`);
      } else {
        throw new Error("Failed to insert message into DB.");
      }

    } catch (error) {
      console.error('[Socket.IO] Error saving or sending message:', error);
      socket.emit('messageError', { tempId, error: 'Failed to save or send message' });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`[Socket.IO] Socket disconnected: ${socket.id}, reason: ${reason}`);
    const userId = Object.keys(userSocketMap).find(key => userSocketMap[key] === socket.id);
    if (userId) {
      delete userSocketMap[userId];
      console.log(`[Socket.IO] User ${userId} unregistered from socket map.`);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`[Socket.IO] Server running on port ${PORT}`);
});

process.on('SIGINT', () => {
    console.log('[Socket.IO] Server shutting down...');
    io.close(() => {
        console.log('[Socket.IO] Server closed.');
        httpServer.close(() => {
            console.log('[HTTP] Server closed.');
            process.exit(0);
        });
    });
});

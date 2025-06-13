import 'dotenv/config'; // Make sure to install dotenv and configure it
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import clientPromise from './lib/mongodb'; // Your MongoDB client promise
import { ObjectId } from 'mongodb';
import type { MongoChatMessageDocument } from './types';

const PORT = parseInt(process.env.SOCKET_IO_PORT || '3001', 10);
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'bizlink_db';

const httpServer = createServer();
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:9002", // Your Next.js app URL
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
  console.log(`Socket connected: ${socket.id}`);

  // Store user ID with socket ID upon connection (client should emit 'storeUserId' with their ID)
  socket.on('storeUserId', (userId: string) => {
    if (userId) {
      userSocketMap[userId] = socket.id;
      console.log(`User ${userId} registered with socket ${socket.id}`);
    }
  });

  socket.on('joinChat', ({ chatPartnerId }: { chatPartnerId: string }) => {
    const currentUserId = Object.keys(userSocketMap).find(key => userSocketMap[key] === socket.id);
    if (currentUserId && chatPartnerId) {
      const roomName = getRoomName(currentUserId, chatPartnerId);
      socket.join(roomName);
      console.log(`Socket ${socket.id} (User ${currentUserId}) joined room: ${roomName}`);
      socket.data.currentRoom = roomName; // Store current room on socket
      socket.data.currentUserId = currentUserId; // Store userId on socket
    } else {
        console.warn(`Could not join chat for socket ${socket.id}: userId or chatPartnerId missing`);
    }
  });


  socket.on('sendMessage', async (data: { senderId: string; receiverId: string; message: string; tempId?: string }) => {
    const { senderId, receiverId, message, tempId } = data;
    const roomName = getRoomName(senderId, receiverId);

    if (!senderId || !receiverId || !message) {
      console.error('sendMessage: Missing data', data);
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
          tempId, // Include tempId if provided by client for optimistic updates
        };
        io.to(roomName).emit('receiveMessage', savedMessageForEmit);
        console.log(`Message from ${senderId} to ${receiverId} in room ${roomName}: ${message}`);
      } else {
        throw new Error("Failed to insert message into DB.");
      }

    } catch (error) {
      console.error('Error saving or sending message:', error);
      socket.emit('messageError', { tempId, error: 'Failed to save or send message' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    // Remove user from map on disconnect
    const userId = Object.keys(userSocketMap).find(key => userSocketMap[key] === socket.id);
    if (userId) {
      delete userSocketMap[userId];
      console.log(`User ${userId} unregistered from socket map.`);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});

process.on('SIGINT', () => {
    console.log('Socket.IO server shutting down...');
    io.close(() => {
        console.log('Socket.IO server closed.');
        httpServer.close(() => {
            console.log('HTTP server closed.');
            process.exit(0);
        });
    });
});
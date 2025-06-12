# BizLink

## Description

BizLink is a platform designed to connect investors and entrepreneurs. It facilitates collaboration through user profiles, a real-time chat system, and an AI-powered pitch deck analyzer to help entrepreneurs refine their proposals and investors identify promising opportunities.

## Core Features

Based on the project blueprint, BizLink includes the following core features:

*   **User Authentication:** Secure registration and login for both investor and entrepreneur roles.
*   **Personalized Dashboards:** Tailored dashboards providing relevant information and functionalities for each user type.
*   **Comprehensive User Profiles:** Users can create and manage detailed profiles to showcase their background, interests, and needs.
*   **Collaboration Request Management:** A system for sending, receiving, and managing collaboration requests between users.
*   **Real-Time Chat:** Instant messaging functionality to enable direct communication and negotiation.
*   **AI Pitch Deck Analyzer:** An intelligent tool that analyzes pitch decks, provides a score, identifies strengths and weaknesses, and offers actionable advice for improvement.
*   **Responsive Design:** The application is designed to be accessible and functional across various devices, including desktops and mobile phones.

## Technologies Used

*   **Frontend:** Next.js, React, Tailwind CSS
*   **Backend:** Node.js, Express.js (likely, based on API routes), MongoDB (for database)
*   **Other:** TypeScript, various UI component libraries (Shadcn UI)

## Setup Instructions

1.  **Clone the repository:**
    
```bash
git clone <repository_url>
    cd BizLink
```
2.  **Install dependencies:**
    
```bash
npm install
```
    or
    
```bash
yarn install
```
    or
    
```bash
pnpm install
```
3.  **Set up environment variables:**
    Create a `.env.local` file in the root directory and add the necessary environment variables. This will likely include:
    *   Database connection string (e.g., `MONGODB_URI`)
    *   Authentication secrets
    *   API keys for AI services

    
```
MONGODB_URI=your_mongodb_connection_string
    # Add other necessary environment variables
```
4.  **Run the development server:**
    
```bash
npm run dev
```
    or
    
```bash
yarn dev
```
    or
    
```bash
pnpm dev
```
    The application should now be running at `http://localhost:3000`.


## Contact Information

For questions, suggestions, or collaboration inquiries, please contact:

*   Abiodun Aina
*  https://abbeyscript.netlify.app/
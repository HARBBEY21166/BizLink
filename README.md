
# BizLink - Professional Networking Platform

## Description

BizLink is a dynamic, full-stack professional networking platform designed to connect innovative entrepreneurs with visionary investors. It facilitates meaningful collaborations through comprehensive user profiles, a real-time (polling-based) chat system, collaboration request management, and advanced AI-powered tools like a pitch deck analyzer.

## Core Features

BizLink includes the following core features:

*   **User Authentication:** Secure registration and login for Investor, Entrepreneur, and Admin roles using JWT and bcrypt.
*   **Password Reset:** Secure "Forgot Password" functionality with email-based token reset.
*   **Role-Based Dashboards:**
    *   **Investor Dashboard:** Discover and filter entrepreneurs, view profiles, send collaboration requests, manage sent requests, and bookmark profiles.
    *   **Entrepreneur Dashboard:** Manage received collaboration requests (accept/reject), view investor profiles, and bookmark profiles.
    *   **Admin Panel:** View platform statistics (user counts, request statuses) and manage a list of all users.
*   **Comprehensive User Profiles:** Users can create, view, and manage detailed profiles showcasing their background, interests, startup details (for entrepreneurs), or investment focus (for investors).
*   **Collaboration Request Management:** A system for investors to send collaboration requests to entrepreneurs, and for entrepreneurs to accept or reject them.
*   **Chat System:** Direct messaging functionality between connected users (polling-based).
*   **AI Pitch Deck Analyzer:** An intelligent tool (powered by Genkit and Google's Gemini model) that analyzes uploaded pitch decks, provides a score, identifies strengths and weaknesses, and offers actionable advice.
*   **Bookmarking System:** Users can bookmark profiles of interest for quick access.
*   **In-App Notifications:** Users receive notifications for new messages, new collaboration requests, and updates to request statuses.
*   **Profile Completion Guide:** Helps users complete their profiles to enhance visibility.
*   **Responsive Design:** The application is designed to be accessible and functional across various devices.
*   **Dark Mode:** User-selectable light and dark themes.

## Technologies Used

*   **Frontend:**
    *   Framework: Next.js (with App Router)
    *   Language: React, TypeScript
    *   Styling: Tailwind CSS
    *   UI Components: Shadcn UI
    *   State Management: React Context API & Hooks (built-in to Next.js/React)
    *   API Integration: Native Fetch API
*   **Backend (Next.js API Routes):**
    *   Runtime: Node.js
    *   Framework: Next.js API Routes
    *   Database: MongoDB (using the native MongoDB driver)
    *   Authentication: JWT (jsonwebtoken), bcryptjs
    *   AI Integration: Genkit (with Google AI/Gemini models)
    *   Mail Service: Nodemailer (for password resets)
*   **Version Control:** Git + GitHub

## Setup Instructions

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd BizLink
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    # or
    # pnpm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the root directory by copying `.env.example` (if provided) or creating it from scratch. Add the necessary environment variables:
    ```env
    # MongoDB Configuration
    MONGODB_URI=your_mongodb_connection_string
    MONGODB_DB_NAME=bizlink_db # Optional, defaults to 'bizlink_db' in code if not set

    # JWT Authentication
    JWT_SECRET=your_strong_jwt_secret_key

    # Nodemailer Configuration (for Password Resets)
    EMAIL_HOST=your_smtp_host
    EMAIL_PORT=your_smtp_port # e.g., 587 for TLS, 465 for SSL
    EMAIL_USER=your_email_username
    EMAIL_PASS=your_email_password_or_app_password
    EMAIL_FROM="BizLink No-Reply <your_from_email@example.com>"
    EMAIL_SECURE=false # true if port is 465, false for 587 (STARTTLS)

    # Application URL (Important for password reset links)
    NEXT_PUBLIC_APP_URL=http://localhost:9002 # Change to your deployed URL in production

    # Genkit/Google AI (if using specific API keys directly, often configured in code)
    # GOOGLE_API_KEY=your_google_ai_api_key # Example, check genkit.ts for actual configuration
    ```

4.  **Run Genkit Development Server (Optional, for AI flow testing):**
    Open a separate terminal and run:
    ```bash
    npm run genkit:dev
    # or for auto-reloading on changes
    # npm run genkit:watch
    ```

5.  **Run the Next.js development server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    # or
    # pnpm dev
    ```
    The application should now typically be running at `http://localhost:9002` (or the port specified in the `dev` script).

## Contact Information

For questions, suggestions, or collaboration inquiries, please contact:
*   Abiodun Aina
*   [abbeyscript.netlify.app](https://abbeyscript.netlify.app/)
```
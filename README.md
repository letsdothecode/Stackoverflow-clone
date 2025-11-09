# StackOverflow Clone

A full-stack StackOverflow clone application with authentication, questions, answers, language settings, and more.

## Project Structure

```
stackoverflow-clone/
├── server/          # Backend Express.js server
├── stack/           # Frontend Next.js application
└── README.md        # This file
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Setup Instructions

### 1. Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `server` directory (copy from `.env.example`):
   ```bash
   # Minimum required for basic functionality
   PORT=5000
   JWT_SECRET=your-secret-key-change-this-in-production
   
   # Optional - for email features (language change for French, password reset)
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   
   # Optional - for SMS features (language change for other languages)
   TWILIO_ACCOUNT_SID=your-twilio-account-sid
   TWILIO_AUTH_TOKEN=your-twilio-auth-token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

4. Start the backend server:
   ```bash
   npm start
   ```
   
   The server will run on `http://localhost:5000`

### 2. Frontend Setup

1. Navigate to the stack directory:
   ```bash
   cd stack
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Create a `.env.local` file in the `stack` directory:
   ```bash
   NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   
   The frontend will run on `http://localhost:3000`

## Quick Start (PowerShell)

### Option 1: Use the Helper Scripts

1. Start backend server:
   ```powershell
   .\start-backend.ps1
   ```

2. Start frontend server (in a new terminal):
   ```powershell
   .\start-frontend.ps1
   ```

### Option 2: Start Both Servers

```powershell
.\start-servers.ps1
```

## Development Mode

### Language Settings Feature

The language settings feature works in development mode without email/SMS configuration:

- **French language**: Requires email setup. In dev mode, OTP will be returned in the API response and shown in the UI.
- **Other languages**: Require SMS setup. In dev mode, OTP will be returned in the API response and shown in the UI.

The OTP will be automatically filled in the input field in development mode for convenience.

### Authentication

The application requires JWT authentication. Make sure to set `JWT_SECRET` in your `.env` file.

## Features

- User authentication (signup, login)
- Questions and answers
- Language settings with OTP verification
- User profiles
- Rewards system
- Subscription plans
- And more...

## API Endpoints

### Language Settings

- `GET /language` - Get user's current language
- `POST /language/request-change` - Request language change (sends OTP)
- `POST /language/verify-change` - Verify OTP and change language

### Authentication

- `POST /user/signup` - User registration
- `POST /user/login` - User login

## Troubleshooting

### Backend server not starting

1. Check if port 5000 is available
2. Verify that `.env` file exists in the `server` directory
3. Check that `JWT_SECRET` is set in `.env`
4. Look at the terminal output for error messages

### Frontend can't connect to backend

1. Verify backend is running on `http://localhost:5000`
2. Check browser console for CORS errors
3. Verify `NEXT_PUBLIC_BACKEND_URL` is set correctly (or defaults to `http://localhost:5000`)

### Language settings not working

1. Make sure you're logged in
2. Check browser console for errors
3. In development mode, OTP will be shown in the response message
4. For production, configure email (French) or SMS (other languages) in `.env`

## Deployment

This application can be deployed to various platforms. See the deployment guides for detailed instructions:

### Frontend Deployment
- **[Vercel Deployment Guide](VERCEL_DEPLOY.md)** ⭐ Recommended (Best for Next.js)
- [Netlify Deployment Guide](NETLIFY_DEPLOY.md)

### Backend Deployment
- **[Render Deployment Guide](RENDER_DEPLOY.md)** ⭐ Recommended (Free tier, persistent storage)
- [Railway Deployment Guide](RAILWAY_DEPLOY.md)

### Complete Guide
- [Complete Deployment Guide](DEPLOYMENT_GUIDE.md)

### Quick Deployment Summary

1. **Deploy Backend** (Render, Railway, or Heroku):
   - Set root directory to `server`
   - Add environment variables (see RENDER_DEPLOY.md or RAILWAY_DEPLOY.md)
   - Get your backend URL

2. **Deploy Frontend** (Vercel or Netlify):
   - Set root directory to `stack`
   - Add environment variable: `NEXT_PUBLIC_BACKEND_URL=<your-backend-url>`
   - Deploy!

## License

ISC


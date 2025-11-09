# Deploying StackOverflow Clone to Netlify

This guide will help you deploy your Next.js frontend to Netlify. Since you have a separate Express.js backend, you'll need to host the backend separately (we'll cover that too).

## Prerequisites

1. A GitHub account (your code should be pushed to GitHub)
2. A Netlify account (sign up at https://www.netlify.com)
3. Your backend server hosted somewhere (Railway, Render, Heroku, etc.)

## Part 1: Deploy Frontend to Netlify

### Option A: Deploy via Netlify Dashboard (Recommended for beginners)

1. **Login to Netlify**
   - Go to https://app.netlify.com
   - Sign in with your GitHub account

2. **Create a New Site**
   - Click "Add new site" → "Import an existing project"
   - Select "GitHub" and authorize Netlify
   - Choose your repository: `letsdothecode/Stackoverflow-clone`

3. **Configure Build Settings**
   - **Base directory:** `stack`
   - **Build command:** `npm run build`
   - **Publish directory:** `stack/.next`
   - **Node version:** `18.x` (or your preferred version)

4. **Set Environment Variables**
   - Go to Site settings → Environment variables
   - Add the following:
     ```
     NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com
     ```
   - Replace `https://your-backend-url.com` with your actual backend URL

5. **Deploy**
   - Click "Deploy site"
   - Netlify will build and deploy your site
   - Wait for the build to complete

### Option B: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Navigate to your frontend directory**
   ```bash
   cd stack
   ```

4. **Initialize Netlify**
   ```bash
   netlify init
   ```
   - Follow the prompts to connect to your site
   - Set build command: `npm run build`
   - Set publish directory: `.next`

5. **Set Environment Variables**
   ```bash
   netlify env:set NEXT_PUBLIC_BACKEND_URL https://your-backend-url.com
   ```

6. **Deploy**
   ```bash
   netlify deploy --prod
   ```

## Part 2: Create Netlify Configuration File

Create a `netlify.toml` file in the `stack` directory:

```toml
[build]
  base = "stack"
  command = "npm run build"
  publish = "stack/.next"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# API proxy (optional - if you want to proxy API calls)
# [[redirects]]
#   from = "/api/*"
#   to = "https://your-backend-url.com/api/:splat"
#   status = 200
#   force = true
```

## Part 3: Update Next.js Configuration for Production

Update `stack/next.config.ts` to handle production builds:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone', // For better Netlify compatibility
  env: {
    BACKEND_URL: process.env.BACKEND_URL,
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:5000',
  },
  // If you're using images from external domains
  images: {
    domains: ['your-backend-url.com'],
  },
};

export default nextConfig;
```

## Part 4: Host Backend Separately

Since Netlify is for frontend hosting, you need to host your Express.js backend elsewhere. Here are recommended options:

### Option 1: Railway (Recommended - Easy & Free tier available)

1. **Sign up at Railway**: https://railway.app
2. **Create New Project** → "Deploy from GitHub repo"
3. **Select your repository**
4. **Configure:**
   - Root Directory: `server`
   - Build Command: (leave empty or `npm install`)
   - Start Command: `npm start`
5. **Set Environment Variables:**
   - Add all your `.env` variables in Railway dashboard
   - Railway will provide a URL like: `https://your-app.railway.app`
6. **Update Frontend:**
   - Update `NEXT_PUBLIC_BACKEND_URL` in Netlify to point to Railway URL

### Option 2: Render (Free tier available)

1. **Sign up at Render**: https://render.com
2. **Create New Web Service**
3. **Connect GitHub repository**
4. **Configure:**
   - Name: `stackoverflow-backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Root Directory: `server`
5. **Set Environment Variables**
6. **Deploy**
7. **Update Netlify** with Render URL

### Option 3: Heroku (Paid, but reliable)

1. **Install Heroku CLI**
2. **Login**: `heroku login`
3. **Create app**: `heroku create your-app-name`
4. **Set config vars**: `heroku config:set JWT_SECRET=your-secret`
5. **Deploy**: `git push heroku main`

### Option 4: Vercel (For Next.js API routes - requires refactoring)

If you want to use Vercel, you'd need to convert your Express routes to Next.js API routes.

## Part 5: Update CORS in Backend

Make sure your backend allows requests from your Netlify domain:

```javascript
// server/index.js
const cors = require('cors');

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://your-netlify-site.netlify.app',
    'https://your-custom-domain.com'
  ],
  credentials: true
};

app.use(cors(corsOptions));
```

## Part 6: Custom Domain (Optional)

1. **In Netlify Dashboard:**
   - Go to Domain settings
   - Click "Add custom domain"
   - Follow the instructions to configure DNS

2. **Update Backend CORS:**
   - Add your custom domain to the CORS origins list

## Troubleshooting

### Build Fails on Netlify

1. **Check build logs** in Netlify dashboard
2. **Verify Node version** matches your local environment
3. **Check environment variables** are set correctly
4. **Ensure all dependencies** are in `package.json`

### Frontend Can't Connect to Backend

1. **Verify backend URL** is correct in environment variables
2. **Check CORS settings** in backend
3. **Ensure backend is running** and accessible
4. **Check browser console** for CORS errors

### Environment Variables Not Working

1. **Use `NEXT_PUBLIC_` prefix** for client-side variables
2. **Redeploy** after changing environment variables
3. **Check variable names** are correct (case-sensitive)

## Quick Deploy Checklist

- [ ] Backend deployed and running (Railway/Render/Heroku)
- [ ] Backend URL is accessible
- [ ] CORS configured in backend for Netlify domain
- [ ] Frontend code pushed to GitHub
- [ ] Netlify site created and connected to GitHub
- [ ] Build settings configured correctly
- [ ] Environment variables set in Netlify
- [ ] `NEXT_PUBLIC_BACKEND_URL` points to your backend
- [ ] Site deployed successfully
- [ ] Test the application in production

## Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Railway Documentation](https://docs.railway.app/)
- [Render Documentation](https://render.com/docs)

## Support

If you encounter issues:
1. Check Netlify build logs
2. Check browser console for errors
3. Verify backend is running and accessible
4. Check CORS configuration
5. Verify environment variables are set correctly


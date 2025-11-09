# Complete Deployment Guide

This guide will walk you through deploying your StackOverflow Clone application.

## Architecture

- **Frontend (Next.js)**: Deploy to Vercel (Recommended) or Netlify
- **Backend (Express.js)**: Deploy to Railway, Render, or Heroku

## Quick Start

### Option 1: Deploy to Vercel (Recommended for Next.js)

1. **Deploy Backend to Railway**:
   - Go to https://railway.app and sign up
   - Create a new project from GitHub repo
   - Set root directory to `server`
   - Add environment variables (see RAILWAY_DEPLOY.md)
   - Get your Railway URL (e.g., `https://your-app.railway.app`)

2. **Deploy Frontend to Vercel**:
   - Go to https://vercel.com and sign up
   - Import your GitHub repository
   - Set root directory to `stack`
   - Add environment variable: `NEXT_PUBLIC_BACKEND_URL=https://your-app.railway.app`
   - Deploy!
   - See `VERCEL_DEPLOY.md` for detailed instructions

### Option 2: Deploy to Netlify

1. **Deploy Backend to Railway**:
   - Go to https://railway.app and sign up
   - Create a new project from GitHub repo
   - Set root directory to `server`
   - Add environment variables (see RAILWAY_DEPLOY.md)
   - Get your Railway URL (e.g., `https://your-app.railway.app`)

2. **Deploy Frontend to Netlify**:
   - Go to https://app.netlify.com and sign up
   - Import your GitHub repository
   - Configure build settings:
     - Base directory: `stack`
     - Build command: `npm run build`
     - Publish directory: `stack/.next`
   - Add environment variable:
     - `NEXT_PUBLIC_BACKEND_URL=https://your-app.railway.app`
   - Deploy!

### Option 3: Deploy Backend to Render

1. **Deploy Backend to Render**:
   - Go to https://render.com and sign up
   - Create a new Web Service from GitHub repo
   - Set root directory to `server`
   - Add environment variables (see RENDER_DEPLOY.md)
   - Get your Render URL (e.g., `https://your-app.onrender.com`)

2. **Deploy Frontend to Vercel/Netlify**:
   - Follow steps from Option 1 or Option 2
   - Use your Render backend URL instead of Railway URL
   - Add environment variable: `NEXT_PUBLIC_BACKEND_URL=https://your-app.onrender.com`

## Detailed Instructions

See the following files for detailed instructions:
- `VERCEL_DEPLOY.md` - Complete Vercel deployment guide (Recommended for Frontend)
- `NETLIFY_DEPLOY.md` - Complete Netlify deployment guide
- `RAILWAY_DEPLOY.md` - Complete Railway deployment guide (Backend)
- `RENDER_DEPLOY.md` - Complete Render deployment guide (Backend) ⭐

## Environment Variables Checklist

### Backend (Railway/Render)
- [ ] `PORT=5000` (Railway) or `PORT=10000` (Render - auto-set)
- [ ] `JWT_SECRET=your-secret-key`
- [ ] `NODE_ENV=production`
- [ ] `FRONTEND_URL=https://your-vercel-site.vercel.app` (or Netlify URL)
- [ ] `NETLIFY_URL=https://your-netlify-site.netlify.app` (if using Netlify)
- [ ] `VERCEL_URL=https://your-vercel-site.vercel.app` (if using Vercel)
- [ ] `RENDER_URL=https://your-backend.onrender.com` (if using Render)
- [ ] `DATABASE_PATH=/opt/render/project/src/server/data/database.sqlite` (Render with persistent disk)
- [ ] (Optional) Email/SMS configuration

### Frontend (Vercel/Netlify)
- [ ] `NEXT_PUBLIC_BACKEND_URL=https://your-app.railway.app` (or Render URL)

## Testing Your Deployment

1. **Test Backend:**
   - Visit: `https://your-app.railway.app`
   - Should see: "Stackoverflow clone is running perfect"

2. **Test Frontend:**
   - Visit: `https://your-netlify-site.netlify.app`
   - Should see your application
   - Try logging in
   - Test language settings

3. **Check CORS:**
   - Open browser console
   - Look for CORS errors
   - If errors occur, verify backend CORS configuration

## Troubleshooting

### Build Fails on Netlify
- Check build logs
- Verify Node version (should be 18+)
- Ensure all dependencies are in package.json
- Check that base directory is set to `stack`

### Frontend Can't Connect to Backend
- Verify `NEXT_PUBLIC_BACKEND_URL` is set correctly
- Check backend is running and accessible
- Verify CORS is configured in backend
- Check browser console for errors

### CORS Errors
- Verify `FRONTEND_URL` is set in Railway
- Check that Netlify URL is added to backend CORS
- Review CORS configuration in `server/index.js`

## Alternative Platforms

### Backend Alternatives
- **Render**: https://render.com (Free tier available) ⭐ Recommended
- **Railway**: https://railway.app (Free tier available)
- **Heroku**: https://heroku.com (Paid, but reliable)
- **DigitalOcean App Platform**: https://www.digitalocean.com/products/app-platform
- **Fly.io**: https://fly.io (Free tier available)

### Frontend Alternatives
- **Vercel**: https://vercel.com (Made by Next.js creators) ⭐ Recommended
- **Netlify**: https://netlify.com (Great alternative)
- **Cloudflare Pages**: https://pages.cloudflare.com
- **AWS Amplify**: https://aws.amazon.com/amplify

## Next Steps

1. Set up custom domain (optional)
2. Configure SSL certificates (automatic on Netlify/Railway)
3. Set up monitoring and logging
4. Configure backups for database
5. Set up CI/CD for automatic deployments

## Support

If you encounter issues:
1. Check the deployment logs
2. Review the troubleshooting sections
3. Verify all environment variables are set
4. Check that both services are running
5. Review CORS configuration

## Resources

- [Vercel Documentation](https://vercel.com/docs) ⭐
- [Netlify Documentation](https://docs.netlify.com/)
- [Railway Documentation](https://docs.railway.app/)
- [Render Documentation](https://render.com/docs) ⭐
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)


# Deploy StackOverflow Clone on Vercel

This guide will walk you through deploying your StackOverflow Clone frontend to Vercel. The backend should be deployed separately (e.g., Railway, Render, or Heroku).

## Architecture

- **Frontend (Next.js)**: Deploy to Vercel
- **Backend (Express.js)**: Deploy to Railway, Render, or Heroku (separate deployment)

## Prerequisites

1. A GitHub account
2. A Vercel account (sign up at https://vercel.com)
3. Backend deployed and accessible (Railway, Render, etc.)
4. Backend URL ready (e.g., `https://your-backend.railway.app`)

## Step-by-Step Deployment Guide

### Step 1: Prepare Your Repository

1. Make sure your code is pushed to GitHub
2. Verify that your `stack` folder contains the Next.js application
3. Ensure `stack/package.json` has the correct build scripts

### Step 2: Deploy Backend (If Not Already Deployed)

If you haven't deployed your backend yet:

1. **Deploy to Railway** (Recommended):
   - Go to https://railway.app
   - Create a new project from GitHub repo
   - Set root directory to `server`
   - Add environment variables (see RAILWAY_DEPLOY.md)
   - Get your Railway URL (e.g., `https://your-app.railway.app`)

2. **Alternative: Deploy to Render**:
   - Go to https://render.com
   - Create a new Web Service
   - Connect your GitHub repository
   - Set root directory to `server`
   - Add environment variables
   - Get your Render URL

### Step 3: Update Backend CORS Configuration

Make sure your backend allows requests from Vercel. The backend code has been updated to include:
- `*.vercel.app` domains
- `*.vercel.dev` domains
- `VERCEL_URL` environment variable

If you're using a separate backend deployment, ensure it includes Vercel URLs in CORS settings.

### Step 4: Deploy Frontend to Vercel

#### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Sign in to Vercel**:
   - Go to https://vercel.com
   - Sign in with your GitHub account

2. **Import Your Project**:
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Select your repository

3. **Configure Project Settings**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `stack`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

4. **Environment Variables**:
   - Click "Environment Variables"
   - Add the following variable:
     - **Name**: `NEXT_PUBLIC_BACKEND_URL`
     - **Value**: `https://your-backend.railway.app` (your backend URL)
     - **Environment**: Production, Preview, and Development

5. **Deploy**:
   - Click "Deploy"
   - Wait for the deployment to complete
   - Your app will be live at `https://your-project.vercel.app`

#### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Navigate to Stack Directory**:
   ```bash
   cd stack
   ```

4. **Deploy**:
   ```bash
   vercel
   ```

5. **Set Environment Variables**:
   ```bash
   vercel env add NEXT_PUBLIC_BACKEND_URL
   # Enter your backend URL when prompted
   ```

6. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

### Step 5: Configure Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Click "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions
5. Vercel will automatically provision SSL certificates

## Environment Variables

### Frontend (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_BACKEND_URL` | Your backend API URL | `https://your-app.railway.app` |

### Backend (Railway/Render)

Make sure your backend has these environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `JWT_SECRET` | JWT secret key | `your-secret-key` |
| `NODE_ENV` | Environment | `production` |
| `FRONTEND_URL` | Vercel frontend URL | `https://your-project.vercel.app` |
| `VERCEL_URL` | Vercel URL (optional) | `https://your-project.vercel.app` |

## Testing Your Deployment

1. **Test Frontend**:
   - Visit your Vercel URL: `https://your-project.vercel.app`
   - The app should load successfully
   - Check browser console for any errors

2. **Test Backend Connection**:
   - Try logging in
   - Create a question
   - Test language settings
   - Verify API calls are working

3. **Check CORS**:
   - Open browser console (F12)
   - Look for CORS errors
   - If errors occur, verify backend CORS configuration includes Vercel URLs

## Vercel-Specific Features

### Automatic Deployments

- **Production**: Deploys from your main/master branch
- **Preview**: Deploys for every pull request
- **Development**: Deploys from other branches

### Performance Optimizations

Vercel automatically provides:
- CDN distribution
- Automatic HTTPS
- Image optimization
- Edge caching
- Serverless functions (if needed)

### Analytics (Optional)

1. Go to your project settings
2. Enable Vercel Analytics
3. View performance metrics and user analytics

## Troubleshooting

### Build Fails on Vercel

**Issue**: Build command fails
**Solution**:
- Check build logs in Vercel dashboard
- Verify Node.js version (Vercel uses Node 18+ by default)
- Ensure all dependencies are in `package.json`
- Check that root directory is set to `stack`
- Verify `stack/package.json` exists and has correct scripts

### Frontend Can't Connect to Backend

**Issue**: API calls fail
**Solution**:
- Verify `NEXT_PUBLIC_BACKEND_URL` is set correctly in Vercel
- Check backend is running and accessible
- Verify CORS is configured in backend to allow Vercel URLs
- Check browser console for specific error messages
- Test backend URL directly in browser

### CORS Errors

**Issue**: CORS errors in browser console
**Solution**:
- Verify `FRONTEND_URL` is set in backend with your Vercel URL
- Check backend CORS configuration includes:
  - `*.vercel.app` pattern
  - `*.vercel.dev` pattern
  - Your specific Vercel URL
- Review CORS configuration in `server/index.js`

### Environment Variables Not Working

**Issue**: Environment variables not accessible
**Solution**:
- Ensure variables start with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding environment variables
- Check variable names match exactly (case-sensitive)
- Verify variables are set for correct environment (Production/Preview/Development)

### 404 Errors on Page Refresh

**Issue**: Getting 404 when refreshing pages
**Solution**:
- This is usually not an issue with Next.js on Vercel
- If using custom routing, verify `next.config.ts` is configured correctly
- Check that all pages are in the `pages` directory

## Advanced Configuration

### Custom Build Settings

If you need custom build settings, create `vercel.json` in the root:

```json
{
  "buildCommand": "cd stack && npm run build",
  "outputDirectory": "stack/.next",
  "installCommand": "cd stack && npm install",
  "framework": null,
  "rootDirectory": "stack"
}
```

### Serverless Functions (Optional)

If you want to convert your backend to Vercel serverless functions:

1. Create `stack/pages/api/` directory structure
2. Convert Express routes to serverless functions
3. Note: SQLite won't work with serverless functions (consider PostgreSQL)

### CI/CD with GitHub

Vercel automatically:
- Deploys on every push to main branch
- Creates preview deployments for pull requests
- Runs builds automatically
- Provides deployment URLs

## Comparison: Vercel vs Netlify

| Feature | Vercel | Netlify |
|---------|--------|---------|
| Next.js Support | Native (made by Vercel) | Good support |
| Build Time | Fast | Fast |
| Preview Deployments | Automatic | Automatic |
| Custom Domains | Free SSL | Free SSL |
| Serverless Functions | Included | Included |
| Analytics | Built-in (paid) | Built-in (paid) |

## Next Steps

1. **Set up custom domain** (optional)
2. **Enable Vercel Analytics** (optional)
3. **Configure monitoring** and error tracking
4. **Set up database backups** for backend
5. **Configure automatic deployments** from GitHub
6. **Set up staging environment** for testing

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Environment Variables in Vercel](https://vercel.com/docs/environment-variables)
- [Custom Domains](https://vercel.com/docs/custom-domains)

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review this troubleshooting guide
3. Verify all environment variables are set
4. Check backend is running and accessible
5. Review CORS configuration
6. Check Vercel status page: https://www.vercel-status.com

## Quick Reference

### Deploy Command (CLI)
```bash
cd stack
vercel --prod
```

### Environment Variables (CLI)
```bash
vercel env add NEXT_PUBLIC_BACKEND_URL
```

### View Logs (CLI)
```bash
vercel logs
```

### List Deployments (CLI)
```bash
vercel list
```


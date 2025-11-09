# Deploying Backend to Railway

Railway is an excellent platform for hosting your Express.js backend. It offers a free tier and is very easy to use.

## Step 1: Sign Up for Railway

1. Go to https://railway.app
2. Sign up with your GitHub account
3. Complete the onboarding process

## Step 2: Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository: `letsdothecode/Stackoverflow-clone`
4. Railway will detect it's a Node.js project

## Step 3: Configure the Service

1. **Set Root Directory:**
   - Click on your service
   - Go to "Settings"
   - Set "Root Directory" to `server`

2. **Configure Start Command:**
   - In "Settings" → "Deploy"
   - Start Command: `npm start`
   - (Railway will auto-detect this, but you can verify)

3. **Set Environment Variables:**
   - Go to "Variables" tab
   - Add the following variables:
     ```
     PORT=5000
     JWT_SECRET=your-secret-key-here
     NODE_ENV=production
     
     # Optional - for email features
     EMAIL_USER=your-email@gmail.com
     EMAIL_PASS=your-app-password
     
     # Optional - for SMS features
     TWILIO_ACCOUNT_SID=your-twilio-account-sid
     TWILIO_AUTH_TOKEN=your-twilio-auth-token
     TWILIO_PHONE_NUMBER=+1234567890
     
     # Optional - for Cloudinary
     CLOUDINARY_CLOUD_NAME=your-cloud-name
     CLOUDINARY_API_KEY=your-api-key
     CLOUDINARY_API_SECRET=your-api-secret
     
     # Optional - Frontend URL for CORS
     FRONTEND_URL=https://your-netlify-site.netlify.app
     NETLIFY_URL=https://your-netlify-site.netlify.app
     ```

## Step 4: Deploy

1. Railway will automatically start deploying
2. Wait for the deployment to complete
3. Railway will provide you with a URL like: `https://your-app.railway.app`

## Step 5: Update Netlify Environment Variables

1. Go to your Netlify dashboard
2. Navigate to Site settings → Environment variables
3. Update `NEXT_PUBLIC_BACKEND_URL` to your Railway URL:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://your-app.railway.app
   ```
4. Redeploy your Netlify site

## Step 6: Update Backend CORS (if needed)

The backend CORS is already configured to accept requests from Netlify domains. If you have a custom domain, make sure to add it to the `FRONTEND_URL` environment variable in Railway.

## Step 7: Database

Railway will persist your SQLite database file. However, for production, consider:
- Using PostgreSQL (Railway offers a PostgreSQL service)
- Or ensure your database file is backed up

## Troubleshooting

### Deployment Fails

1. Check the Railway logs
2. Verify all environment variables are set
3. Ensure `JWT_SECRET` is set
4. Check that the root directory is set to `server`

### Database Issues

1. Railway persists files, but for production, consider PostgreSQL
2. Check database file permissions
3. Verify database path is correct

### CORS Errors

1. Verify `FRONTEND_URL` is set in Railway
2. Check that your Netlify URL is correct
3. Review the CORS configuration in `server/index.js`

## Railway CLI (Optional)

You can also use Railway CLI for deployment:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Deploy
railway up
```

## Free Tier Limits

Railway's free tier includes:
- $5 worth of usage per month
- Enough for small to medium applications
- Automatic sleep after 30 days of inactivity (wakes on request)

## Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Railway Pricing](https://railway.app/pricing)


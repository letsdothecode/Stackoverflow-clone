# Deploying Backend to Render

Render is an excellent platform for hosting your Express.js backend. It offers a free tier with persistent storage and is very easy to use.

## Step 1: Sign Up for Render

1. Go to https://render.com
2. Sign up with your GitHub account (recommended) or email
3. Complete the onboarding process

## Step 2: Create New Web Service

1. Click "New +" in the dashboard
2. Select "Web Service"
3. Connect your GitHub repository:
   - Click "Connect account" if not already connected
   - Select your repository: `your-username/stackoverflow-clone`
   - Click "Connect"

## Step 3: Configure the Web Service

### Basic Settings

1. **Name**: Give your service a name (e.g., `stackoverflow-backend`)
2. **Region**: Choose the region closest to your users (e.g., `Oregon (US West)`)
3. **Branch**: Select the branch to deploy (usually `main` or `master`)
4. **Root Directory**: Set to `server`
5. **Runtime**: Select `Node`
6. **Build Command**: `npm install --production=false` (or just `npm install`)
7. **Start Command**: `npm start` (this will run `node index.js` - DO NOT use nodemon)

### Environment Variables

Click on "Environment" and add the following variables:

#### Required Variables

```
PORT=10000
JWT_SECRET=your-secret-key-here-change-this-in-production
NODE_ENV=production
```

**Note**: Render automatically sets the `PORT` environment variable. The app will use `process.env.PORT` or default to 5000. Render typically uses port 10000, but you should use `process.env.PORT` which Render provides.

#### Optional Variables

```
# Frontend URL for CORS
FRONTEND_URL=https://your-frontend.vercel.app
VERCEL_URL=https://your-frontend.vercel.app
NETLIFY_URL=https://your-frontend.netlify.app
RENDER_URL=https://your-backend.onrender.com

# Email configuration (for password reset, language changes)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# SMS configuration (for language changes)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Payment gateways (if using)
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
STRIPE_SECRET_KEY=your-stripe-secret-key
```

## Step 4: Configure Persistent Disk (For SQLite Database)

**Important**: Render's free tier provides ephemeral filesystem, which means files are deleted when the service restarts. For SQLite database persistence:

1. Go to your service settings
2. Scroll down to "Persistent Disk"
3. Click "Mount Persistent Disk"
4. Set the mount path to `/opt/render/project/src/server/data` (or create a `data` directory)
5. Update your database configuration to use this path

**Alternative**: Consider using Render's PostgreSQL service for production (recommended).

### Update Database Path for Persistent Disk

You'll need to update `server/config/database.js` to use the persistent disk:

```javascript
import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use persistent disk on Render, or local path in development
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false,
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true
  }
});

export default sequelize;
```

Then set `DATABASE_PATH` environment variable in Render:
```
DATABASE_PATH=/opt/render/project/src/server/data/database.sqlite
```

## Step 5: Deploy

1. Click "Create Web Service"
2. Render will start building and deploying your application
3. Wait for the deployment to complete (usually 2-5 minutes)
4. Your service will be available at: `https://your-service-name.onrender.com`

## Step 6: Update Frontend Environment Variables

1. Go to your frontend deployment (Vercel/Netlify)
2. Update the environment variable:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://your-service-name.onrender.com
   ```
3. Redeploy your frontend

## Step 7: Update Backend CORS (if needed)

The backend CORS configuration has been updated to include Render URLs. Make sure your `FRONTEND_URL` environment variable is set correctly in Render.

## Database Options on Render

### Option 1: SQLite with Persistent Disk (Free Tier)

- Mount a persistent disk
- Update database path to use the mounted disk
- Data persists across deployments

### Option 2: PostgreSQL (Recommended for Production)

1. Create a PostgreSQL database on Render:
   - Click "New +" → "PostgreSQL"
   - Create a new database
   - Note the connection string

2. Update your database configuration to use PostgreSQL
3. Update environment variables with the PostgreSQL connection string

## Step 8: Run Database Seeds (if needed)

If you need to seed subscription plans or other initial data:

1. Go to your service's "Shell" tab in Render dashboard
2. Run:
   ```bash
   npm run seed-plans
   ```

Or add it to your build command:
```
npm install && npm run seed-plans
```

## Render Configuration File (Optional)

Create a `render.yaml` file in your repository root for infrastructure as code:

```yaml
services:
  - type: web
    name: stackoverflow-backend
    env: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        generateValue: true
      - key: PORT
        value: 10000
    disk:
      name: data-disk
      mountPath: /opt/render/project/src/server/data
      sizeGB: 1
```

## Troubleshooting

### Deployment Fails

1. **Check Build Logs**:
   - Go to your service dashboard
   - Click on "Logs" tab
   - Look for error messages

2. **Common Issues**:
   - Missing environment variables (especially `JWT_SECRET`)
   - Incorrect root directory (should be `server`)
   - Wrong start command
   - Node version mismatch

3. **Verify Settings**:
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start` or `node index.js`

### Database Issues

1. **Database not persisting**:
   - Ensure persistent disk is mounted
   - Verify database path is correct
   - Check disk mount path in settings

2. **Database connection errors**:
   - Verify database file path
   - Check file permissions
   - Ensure database directory exists

3. **Consider PostgreSQL**:
   - More reliable for production
   - Better performance
   - Automatic backups

### Service Sleeping (Free Tier)

Render's free tier services sleep after 15 minutes of inactivity. When a request comes in:
- The service wakes up (takes ~30 seconds)
- First request may be slow
- Subsequent requests are fast

**Solutions**:
- Upgrade to a paid plan (services don't sleep)
- Use a ping service to keep the service awake (not recommended for production)
- Accept the cold start delay (fine for development)

### CORS Errors

1. **Verify CORS Configuration**:
   - Check `FRONTEND_URL` is set in Render
   - Verify frontend URL matches your deployment
   - Check CORS configuration in `server/index.js`

2. **Update CORS**:
   - Add your frontend URL to `FRONTEND_URL` environment variable
   - Ensure Render URL pattern is in CORS config
   - Redeploy backend

### Port Issues

Render automatically sets the `PORT` environment variable. Your app should use:
```javascript
const PORT = process.env.PORT || 5000;
```

This is already configured in your `server/index.js`.

### Build Timeout

If your build takes too long:
1. Check dependencies in `package.json`
2. Remove unused dependencies
3. Use `npm ci` instead of `npm install` for faster builds
4. Consider using `.npmrc` for faster installs

### Nodemon Permission Denied Error

**Issue**: `sh: 1: nodemon: Permission denied`

**Solution**:
1. Make sure `package.json` has the correct start script:
   ```json
   "scripts": {
     "start": "node index.js",
     "dev": "nodemon index.js"
   }
   ```
2. Ensure `nodemon` is in `devDependencies`, not `dependencies`:
   ```json
   "devDependencies": {
     "nodemon": "^3.1.10"
   }
   ```
3. In Render dashboard, verify the **Start Command** is set to `npm start` (NOT `nodemon index.js`)
4. If using `render.yaml`, ensure `startCommand` is `npm start`
5. Redeploy after making these changes

### Module Not Found Error (Case Sensitivity)

**Issue**: `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/opt/render/project/src/server/models/Question.js'`

**Cause**: Linux (which Render uses) is case-sensitive for file names. If your files are named `question.js` (lowercase) but you're importing `Question.js` (uppercase), it will fail.

**Solution**:
1. Check your actual file names in the `server/models/` directory
2. Ensure all imports in `server/models/index.js` match the exact file names (case-sensitive)
3. Common fixes:
   - `Question.js` → `question.js`
   - `Post.js` → `post.js`
   - `Reward.js` → `reward.js`
   - `SubscriptionPlan.js` → `subscriptionPlan.js`
   - etc.
4. Test locally on Linux or use a case-sensitive file system to catch these issues early
5. Redeploy after fixing the imports

## Free Tier Limits

Render's free tier includes:
- **750 hours/month** of service time
- **100 GB bandwidth/month**
- **Services sleep** after 15 minutes of inactivity
- **512 MB RAM**
- **0.5 CPU**
- **Persistent disks** available (optional)

## Upgrading to Paid Plans

If you need:
- **No sleep**: Services stay awake 24/7
- **More resources**: More RAM and CPU
- **Better performance**: Faster response times
- **Priority support**: Faster issue resolution

Consider upgrading to a paid plan starting at $7/month.

## Render CLI (Optional)

You can also use Render CLI for deployment:

```bash
# Install Render CLI
npm i -g render-cli

# Login
render login

# Deploy
render deploy
```

## Environment-Specific Configuration

### Development
```bash
NODE_ENV=development
PORT=5000
```

### Production (Render)
```bash
NODE_ENV=production
PORT=10000  # Render sets this automatically
```

## Security Best Practices

1. **Never commit secrets**: Use environment variables
2. **Use strong JWT_SECRET**: Generate a random string
3. **Enable HTTPS**: Render provides this automatically
4. **Set CORS properly**: Only allow your frontend domains
5. **Use environment variables**: Never hardcode secrets

## Monitoring and Logs

1. **View Logs**:
   - Go to your service dashboard
   - Click "Logs" tab
   - View real-time logs

2. **Metrics**:
   - View CPU and memory usage
   - Monitor request rates
   - Check error rates

3. **Alerts**:
   - Set up alerts for errors
   - Monitor service health
   - Get notified of issues

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Render Pricing](https://render.com/pricing)
- [Render Node.js Guide](https://render.com/docs/node-version)
- [Persistent Disks on Render](https://render.com/docs/persistent-disks)
- [PostgreSQL on Render](https://render.com/docs/databases)

## Quick Reference

### Service URL
```
https://your-service-name.onrender.com
```

### Environment Variables (Minimum)
```
PORT=10000
JWT_SECRET=your-secret-key
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
```

### Commands
```bash
# Build
npm install

# Start
npm start

# Seed database
npm run seed-plans
```

## Next Steps

1. ✅ Deploy backend to Render
2. ✅ Get your Render URL
3. ✅ Update frontend environment variables
4. ✅ Test your deployment
5. ✅ Set up monitoring
6. ✅ Configure custom domain (optional)
7. ✅ Set up database backups (if using SQLite)
8. ✅ Consider upgrading to PostgreSQL

## Support

If you encounter issues:
1. Check Render logs
2. Review this troubleshooting guide
3. Verify all environment variables are set
4. Check Render status: https://status.render.com
5. Contact Render support if needed


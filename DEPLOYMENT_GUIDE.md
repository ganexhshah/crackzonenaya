# Vercel Deployment Guide

## Prerequisites
- GitHub account
- Vercel account (sign up at vercel.com)
- Both frontend and backend code ready

## Project Structure
```
crackzonenaya/
├── frontend/          # Next.js application
├── backend/           # Express + Prisma API
├── .gitignore
└── DEPLOYMENT_GUIDE.md
```

## Step 1: Prepare for Deployment

### 1.1 Test Local Builds

**Frontend Build Test:**
```bash
cd frontend
npm install
npm run build
```

**Backend Build Test:**
```bash
cd backend
npm install
npm run build
```

If there are any errors, fix them before proceeding.

### 1.2 Update Environment Variables

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app/api
```

**Backend (.env):**
```env
DATABASE_URL="your-postgresql-connection-string"
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_REFRESH_SECRET="your-refresh-secret-key"
REDIS_URL="your-redis-connection-string"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
EMAIL_FROM="your-email@gmail.com"
FRONTEND_URL="https://your-frontend.vercel.app"
NODE_ENV="production"
```

## Step 2: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Ready for deployment"

# Add remote
git remote add origin https://github.com/ganexhshah/crackzonenaya.git

# Push to main branch
git branch -M main
git push -u origin main
```

## Step 3: Deploy Backend to Vercel

### 3.1 Import Backend Project
1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Select "backend" as the root directory
5. Framework Preset: "Other"

### 3.2 Configure Backend Build Settings
- **Build Command:** `npm run build && npx prisma generate`
- **Output Directory:** `dist`
- **Install Command:** `npm install`
- **Root Directory:** `backend`

### 3.3 Add Backend Environment Variables
In Vercel project settings, add all environment variables from backend/.env:
- DATABASE_URL
- JWT_SECRET
- JWT_REFRESH_SECRET
- REDIS_URL
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- EMAIL_HOST
- EMAIL_PORT
- EMAIL_USER
- EMAIL_PASSWORD
- EMAIL_FROM
- FRONTEND_URL (will update after frontend deployment)
- NODE_ENV=production

### 3.4 Deploy Backend
Click "Deploy" and wait for deployment to complete.

**Copy the backend URL:** `https://your-backend.vercel.app`

## Step 4: Deploy Frontend to Vercel

### 4.1 Import Frontend Project
1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import the same GitHub repository
4. Select "frontend" as the root directory
5. Framework Preset: "Next.js"

### 4.2 Configure Frontend Build Settings
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`
- **Root Directory:** `frontend`

### 4.3 Add Frontend Environment Variables
In Vercel project settings, add:
```
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app/api
```

### 4.4 Deploy Frontend
Click "Deploy" and wait for deployment to complete.

**Copy the frontend URL:** `https://your-frontend.vercel.app`

## Step 5: Update Backend Environment

1. Go to backend project in Vercel
2. Settings → Environment Variables
3. Update `FRONTEND_URL` to your frontend URL
4. Redeploy the backend

## Step 6: Database Setup

### 6.1 Set Up PostgreSQL Database
**Option 1: Vercel Postgres**
1. In your backend Vercel project
2. Go to Storage tab
3. Create Postgres Database
4. Copy connection string
5. Update DATABASE_URL in environment variables

**Option 2: External Provider (Recommended)**
- Supabase: https://supabase.com
- Neon: https://neon.tech
- Railway: https://railway.app

### 6.2 Run Prisma Migrations
After setting up database:
```bash
cd backend
npx prisma db push
npx prisma generate
```

Or use Vercel CLI:
```bash
vercel env pull
npx prisma db push
```

### 6.3 Seed Database (Optional)
```bash
npm run seed
```

## Step 7: Set Up Redis

**Option 1: Upstash Redis (Recommended for Vercel)**
1. Go to https://upstash.com
2. Create a Redis database
3. Copy the connection string
4. Update REDIS_URL in backend environment variables

**Option 2: Redis Cloud**
1. Go to https://redis.com/try-free
2. Create a free database
3. Copy connection string
4. Update REDIS_URL

## Step 8: Verify Deployment

### 8.1 Test Backend
Visit: `https://your-backend.vercel.app/api/health`

Should return: `{"status": "ok"}`

### 8.2 Test Frontend
Visit: `https://your-frontend.vercel.app`

Should load the landing page.

### 8.3 Test Full Flow
1. Register a new user
2. Verify email (check email)
3. Login
4. Test dashboard features

## Step 9: Set Up Custom Domains (Optional)

### Backend Domain
1. Go to backend project → Settings → Domains
2. Add your custom domain (e.g., api.yourdomain.com)
3. Update DNS records as instructed
4. Update FRONTEND_URL and NEXT_PUBLIC_API_URL

### Frontend Domain
1. Go to frontend project → Settings → Domains
2. Add your custom domain (e.g., yourdomain.com)
3. Update DNS records as instructed

## Continuous Deployment

Once set up, every push to the main branch will automatically deploy:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

Vercel will automatically:
1. Build your project
2. Run tests (if configured)
3. Deploy to production
4. Provide preview URLs for pull requests

## Troubleshooting

### Build Errors

**Frontend Build Fails:**
```bash
cd frontend
npm run build
# Fix any TypeScript or build errors
```

**Backend Build Fails:**
```bash
cd backend
npm run build
# Fix any TypeScript errors
```

### Environment Variable Issues
- Ensure all required variables are set in Vercel
- Check for typos in variable names
- Restart deployment after adding variables

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check if database allows connections from Vercel IPs
- Run `npx prisma db push` to sync schema

### CORS Issues
- Verify FRONTEND_URL in backend matches your frontend domain
- Check CORS configuration in backend/src/index.ts

### Redis Connection Issues
- Verify REDIS_URL is correct
- Check if Redis provider allows connections from Vercel
- Test connection with Redis CLI

## Monitoring

### Vercel Dashboard
- View deployment logs
- Monitor function execution
- Check error rates

### Set Up Logging
Consider adding:
- Sentry for error tracking
- LogRocket for session replay
- Vercel Analytics for performance

## Security Checklist

- [ ] All environment variables are set
- [ ] JWT secrets are strong and unique
- [ ] Database has proper access controls
- [ ] CORS is configured correctly
- [ ] Rate limiting is enabled
- [ ] Email credentials are secure
- [ ] Cloudinary API keys are protected
- [ ] Redis is password protected

## Performance Optimization

### Frontend
- Enable Next.js Image Optimization
- Use ISR (Incremental Static Regeneration) where possible
- Implement proper caching strategies

### Backend
- Enable Redis caching
- Optimize database queries
- Use connection pooling
- Implement rate limiting

## Backup Strategy

### Database Backups
- Set up automated backups with your database provider
- Test restore procedures regularly

### Code Backups
- GitHub serves as your code backup
- Consider setting up branch protection rules

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review function logs in Vercel dashboard
3. Check GitHub Actions (if configured)
4. Consult Vercel documentation: https://vercel.com/docs

## Quick Commands Reference

```bash
# Test builds locally
cd frontend && npm run build
cd backend && npm run build

# Push to GitHub
git add .
git commit -m "Update"
git push origin main

# Pull environment variables (Vercel CLI)
vercel env pull

# Run Prisma migrations
npx prisma db push
npx prisma generate

# View deployment logs
vercel logs

# Redeploy
vercel --prod
```

## Environment Variables Template

Save this as `.env.template` for reference:

**Frontend:**
```
NEXT_PUBLIC_API_URL=
```

**Backend:**
```
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
REDIS_URL=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=
FRONTEND_URL=
NODE_ENV=production
```

## Post-Deployment Checklist

- [ ] Backend is accessible
- [ ] Frontend is accessible
- [ ] Database is connected
- [ ] Redis is connected
- [ ] Email sending works
- [ ] File uploads work (Cloudinary)
- [ ] Authentication works
- [ ] All API endpoints respond correctly
- [ ] CORS is configured properly
- [ ] Environment variables are set
- [ ] Custom domains configured (if applicable)
- [ ] SSL certificates are active
- [ ] Monitoring is set up

## Success!

Your application is now live on Vercel! 🎉

**Frontend:** https://your-frontend.vercel.app
**Backend:** https://your-backend.vercel.app

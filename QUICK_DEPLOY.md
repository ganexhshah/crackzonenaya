# Quick Deployment Steps

## 1. Pre-Deployment Check
```bash
node pre-deploy-check.js
```

## 2. Test Builds Locally

### Frontend
```bash
cd frontend
npm install
npm run build
cd ..
```

### Backend
```bash
cd backend
npm install
npm run build
cd ..
```

## 3. Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git remote add origin https://github.com/ganexhshah/crackzonenaya.git
git branch -M main
git push -u origin main
```

## 4. Deploy Backend on Vercel

1. Go to https://vercel.com/new
2. Import `ganexhshah/crackzonenaya`
3. **Root Directory:** `backend`
4. **Framework:** Other
5. **Build Command:** `npm run build && npx prisma generate`
6. **Output Directory:** `dist`
7. **Install Command:** `npm install`

### Add Environment Variables:
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key
REDIS_URL=redis://...
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
FRONTEND_URL=https://your-frontend.vercel.app
NODE_ENV=production
```

8. Click **Deploy**
9. **Copy backend URL:** `https://your-backend-xxx.vercel.app`

## 5. Deploy Frontend on Vercel

1. Go to https://vercel.com/new
2. Import `ganexhshah/crackzonenaya` (same repo)
3. **Root Directory:** `frontend`
4. **Framework:** Next.js
5. **Build Command:** `npm run build`
6. **Output Directory:** `.next`
7. **Install Command:** `npm install`

### Add Environment Variable:
```
NEXT_PUBLIC_API_URL=https://your-backend-xxx.vercel.app/api
```

8. Click **Deploy**
9. **Copy frontend URL:** `https://your-frontend-xxx.vercel.app`

## 6. Update Backend FRONTEND_URL

1. Go to backend project on Vercel
2. Settings → Environment Variables
3. Update `FRONTEND_URL` to your frontend URL
4. Redeploy backend

## 7. Set Up Database

### Option A: Vercel Postgres
1. Backend project → Storage → Create Database
2. Copy connection string
3. Update `DATABASE_URL` in environment variables

### Option B: Supabase (Recommended)
1. Go to https://supabase.com
2. Create new project
3. Copy connection string from Settings → Database
4. Update `DATABASE_URL` in environment variables

### Run Migrations:
```bash
cd backend
npx prisma db push
npx prisma generate
npm run seed
```

## 8. Set Up Redis

### Upstash Redis (Recommended)
1. Go to https://upstash.com
2. Create Redis database
3. Copy connection string
4. Update `REDIS_URL` in backend environment variables
5. Redeploy backend

## 9. Test Your Deployment

### Backend Health Check:
Visit: `https://your-backend-xxx.vercel.app/api/health`

### Frontend:
Visit: `https://your-frontend-xxx.vercel.app`

### Full Test:
1. Register new user
2. Verify email
3. Login
4. Test features

## 10. Done! 🎉

Your app is live:
- **Frontend:** https://your-frontend-xxx.vercel.app
- **Backend:** https://your-backend-xxx.vercel.app

## Future Updates

Just push to GitHub:
```bash
git add .
git commit -m "Your update"
git push origin main
```

Vercel will automatically deploy!

## Troubleshooting

### Build Fails?
```bash
# Test locally first
cd frontend && npm run build
cd backend && npm run build
```

### Environment Variables Missing?
- Check Vercel project settings
- Ensure all variables are added
- Redeploy after adding variables

### Database Connection Error?
- Verify DATABASE_URL is correct
- Run `npx prisma db push`
- Check database allows Vercel connections

### CORS Error?
- Verify FRONTEND_URL in backend matches frontend domain
- Check CORS configuration in backend/src/index.ts

## Need Help?

Check DEPLOYMENT_GUIDE.md for detailed instructions.

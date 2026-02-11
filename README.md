# CrackZone Naya - Gaming Tournament Platform

A full-stack gaming tournament and scrim management platform built with Next.js, Express, Prisma, and PostgreSQL.

## 🚀 Features

- **User Authentication** - Register, login, email verification, password reset
- **Profile Management** - User profiles with game stats and achievements
- **Team System** - Create and manage gaming teams
- **Tournament Management** - Browse and register for tournaments
- **Scrim System** - Schedule and manage practice matches
- **Match Tracking** - Track match results and statistics
- **Wallet System** - Manage tournament fees and winnings
- **Admin Dashboard** - Complete admin panel for platform management
- **Real-time Updates** - WebSocket support for live updates
- **File Uploads** - Cloudinary integration for images
- **Email Notifications** - Automated email system
- **Caching** - Redis caching for improved performance

## 📁 Project Structure

```
crackzonenaya/
├── frontend/          # Next.js 16 application
│   ├── src/
│   │   ├── app/      # App router pages
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── services/
│   └── package.json
│
├── backend/           # Express + Prisma API
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── utils/
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
└── DEPLOYMENT_GUIDE.md
```

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **UI Components:** Radix UI + shadcn/ui
- **Forms:** React Hook Form + Zod
- **State Management:** React Context
- **HTTP Client:** Fetch API

### Backend
- **Runtime:** Node.js
- **Framework:** Express 5
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT
- **Caching:** Redis
- **File Storage:** Cloudinary
- **Email:** Nodemailer
- **WebSocket:** ws

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Redis server
- Cloudinary account
- Email service (Gmail recommended)

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/ganexhshah/crackzonenaya.git
cd crackzonenaya
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

### 3. Setup Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your backend URL
npm run dev
```

### 4. Access Application
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:5000

## 🌐 Deployment

### Deploy to Vercel

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

**Quick Deploy:**
1. Run pre-deployment check: `node pre-deploy-check.js`
2. Push to GitHub
3. Deploy backend to Vercel (root: `backend`)
4. Deploy frontend to Vercel (root: `frontend`)
5. Configure environment variables
6. Set up database and Redis

See [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) for step-by-step guide.

## 🔐 Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Backend (.env)
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
REDIS_URL="redis://..."
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
EMAIL_FROM="your-email@gmail.com"
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-otp` - Verify email OTP
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/refresh` - Refresh access token

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/avatar` - Upload avatar
- `GET /api/users/:id` - Get user by ID

### Teams
- `GET /api/teams` - List teams
- `POST /api/teams` - Create team
- `GET /api/teams/:id` - Get team details
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team
- `POST /api/teams/:id/join` - Join team
- `POST /api/teams/:id/leave` - Leave team

### Tournaments
- `GET /api/tournaments` - List tournaments
- `POST /api/tournaments` - Create tournament (admin)
- `GET /api/tournaments/:id` - Get tournament details
- `POST /api/tournaments/:id/register` - Register for tournament

### Matches
- `GET /api/matches` - List matches
- `GET /api/matches/:id` - Get match details
- `POST /api/matches/:id/result` - Submit match result

### Wallet
- `GET /api/wallet` - Get wallet balance
- `POST /api/wallet/deposit` - Deposit funds
- `GET /api/wallet/transactions` - Get transaction history

## 🧪 Testing

### Frontend
```bash
cd frontend
npm run build  # Test production build
npm run lint   # Run linter
```

### Backend
```bash
cd backend
npm run build  # Test production build
npm test       # Run tests (if configured)
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is private and proprietary.

## 👥 Team

- **Developer:** Ganesh Shah
- **GitHub:** [@ganexhshah](https://github.com/ganexhshah)

## 📞 Support

For support, email your-email@example.com or open an issue on GitHub.

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Live streaming integration
- [ ] Advanced analytics dashboard
- [ ] Tournament brackets visualization
- [ ] In-app chat system
- [ ] Payment gateway integration
- [ ] Multi-language support
- [ ] Dark/Light theme toggle

## ⚡ Performance

- Redis caching for frequently accessed data
- Image optimization with Cloudinary
- Database query optimization with Prisma
- Next.js automatic code splitting
- API rate limiting

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- Input validation with Zod
- SQL injection prevention with Prisma
- XSS protection
- CORS configuration
- Rate limiting
- Environment variable protection

## 📊 Database Schema

See `backend/prisma/schema.prisma` for complete database schema.

**Main Models:**
- User
- Profile
- Team
- TeamMember
- Tournament
- Match
- Scrim
- Transaction
- PaymentMethod

## 🎨 UI Components

Built with shadcn/ui components:
- Forms, Buttons, Cards
- Dialogs, Dropdowns, Modals
- Tables, Tabs, Tooltips
- Avatars, Badges, Progress bars
- And more...

## 📱 Responsive Design

- Mobile-first approach
- Responsive layouts for all screen sizes
- Touch-friendly interfaces
- Mobile bottom navigation
- Optimized for tablets and desktops

---

Made with ❤️ by Ganesh Shah

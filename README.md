# GolfHeroes - Golf Draw Platform

A production-ready web application for running monthly golf draws with charity impact. Built with modern tech stack for scalability and performance.

## 🎯 Core Features

- **User Authentication**: Supabase Auth (email/password)
- **Subscription Management**: Stripe (monthly & yearly plans)
- **Golf Score Tracking**: Stableford format (1-45), max 5 scores per user
- **Monthly Draws**: Automatic draw matching user scores
- **Charity Integration**: User-selected charities with contribution tracking
- **Winner Verification**: Screenshot proof submission and admin approval
- **Responsive Design**: Mobile-first, emotion-driven UI with Framer Motion
- **Admin Panel**: Full control over users, draws, charities, and payouts

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + Framer Motion
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (JWT)
- **Payments**: Stripe
- **Email**: Resend
- **Deployment**: Vercel

## 📦 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account (free tier available)
- Stripe account (free tier available)
- Resend account (for email)
- Vercel account (optional, for deployment)

### Installation & Setup

**See [SETUP.md](./SETUP.md) for complete step-by-step instructions.**

Quick start:

```bash
# Clone and install
npm install

# Create environment variables
cp .env.example .env.local

# Run database schema manually in Supabase SQL Editor
# Source of truth: supabase/schema.sql

# Seed initial data manually in Supabase SQL Editor
# Source of truth: supabase/seed.sql
npm run seed

# Start development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (public)           # Public pages (homepage, charities, pricing)
│   ├── (auth)             # Auth pages (sign/log/reset)
│   ├── (dashboard)        # User dashboard pages
│   ├── (admin)            # Admin panel pages
│   ├── api/               # API routes & server actions
│   └── layout.tsx         # Root layout
├── components/
│   ├── ui/                # Reusable UI components
│   ├── dashboard/         # Dashboard-specific components
│   ├── admin/             # Admin panel components
│   └── providers.tsx      # App providers
├── lib/
│   ├── supabase.ts        # Supabase client
│   ├── stripe.ts          # Stripe utilities
│   ├── draw-engine.ts     # Draw logic
│   └── constants.ts       # App constants
├── types/
│   └── database.ts        # Database type definitions
├── utils/
│   ├── validators.ts      # Input validation
│   ├── formatters.ts      # Data formatting
│   └── helpers.ts         # Utility functions
├── hooks/                 # Custom React hooks
└── styles/
    └── globals.css        # Global styles
```

## 🔐 Environment Variables

All required environment variables are listed in `.env.example`. Copy to `.env.local` and populate with your credentials.

**Key variables:**
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Stripe: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`
- Resend: `RESEND_API_KEY`
- App: `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_CURRENCY`

## 📊 Database Schema

The application uses PostgreSQL (via Supabase) with the following main tables:

- `users` - User accounts with role
- `subscriptions` - Stripe subscription tracking
- `golf_scores` - User scores (max 5 per user)
- `charities` - Charity directory
- `user_charity` - User charity selection
- `draws` - Monthly draw records
- `draw_results` - Draw outcomes and winners
- `winner_proofs` - Screenshot verification
- `prize_pool_config` - Prize tier calculations

See [SETUP.md](./SETUP.md) for complete schema.

## 🧑‍💼 User Roles

1. **Public Visitor**: Browse homepage, charities, pricing
2. **Subscriber**: Full dashboard, score entry, draw participation
3. **Admin**: User management, draw configuration, winner verification

## 💳 Subscription Plans

- **Monthly**: £X/month (configurable in Stripe)
- **Yearly**: £X/year (configurable in Stripe)
- Minimum 10% of fee goes to selected charity

## 🎁 Prize Structure

- **5-match**: 40% of pool (rolls over if unopened)
- **4-match**: 35% of pool
- **3-match**: 25% of pool

## 📧 Email Notifications

The app sends transactional emails for:
- Signup confirmation
- Subscription activation/renewal/cancellation
- Draw results published
- Winner notification
- Winner verification approved/rejected
- Payout completed

## 🚀 Deployment

The app is configured for deployment on Vercel:

```bash
# Deploy to Vercel
vercel deploy --prod
```

Ensure all environment variables are configured in Vercel project settings.

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run migrate` - Prints instructions for running `supabase/schema.sql`
- `npm run seed` - Prints instructions for running `supabase/seed.sql`
- `npm run make-admin` - Promote user to admin

Example:

```bash
node scripts/make-admin.js user@example.com
```

## 🧪 Testing

Testing utilities are set up but not yet implemented. Add test files alongside components:

```
src/components/MyComponent.tsx
src/components/__tests__/MyComponent.test.tsx
```

## 💡 Design Philosophy

- **Emotion-driven**: Focus on charitable impact, not traditional golf imagery
- **Modern**: Clean, gradient-based design with micro-interactions
- **Mobile-first**: Fully responsive on all device sizes
- **Accessibility**: WCAG compliance, keyboard navigation, semantic HTML

## 🔒 Security

- HTTPS enforced
- JWT-based authentication via Supabase
- Environment variables never hardcoded
- SQL injection protection via Supabase
- CSRF protection via Next.js
- Subscription validation on every protected request

## 📈 Scalability

Architecture supports:
- Multi-country expansion (currency, locale configurable)
- Teams and corporate accounts (data structure ready)
- Campaign module (placeholder structure)
- React Native code sharing (business logic separated)

## 🐛 Troubleshooting

See [SETUP.md](./SETUP.md) troubleshooting section.

## 📄 License

Proprietary - All rights reserved.

## 🤝 Contributing

Internal development only.

---

**Built with ❤️ for charity impact.**

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# 🏆 AuctionHub - E-commerce Auction Platform

A modern, real-time auction platform built with React, TypeScript, Supabase, and Tailwind CSS. Features live bidding, user authentication, payment processing, and comprehensive auction management.

## ✨ Features

### 🎯 Core Functionality
- **Real-time Bidding**: Live auction updates with instant bid notifications
- **User Authentication**: Secure signup/login with role-based access control
- **Auto-bidding**: Smart automatic bidding up to user-defined limits
- **Search & Filters**: Advanced search with category, price, and condition filters
- **Watchlist**: Save interesting auctions for later
- **Payment Integration**: Secure payment processing with Razorpay

### 👥 User Roles
- **Bidders**: Browse, bid, and manage auction participation
- **Sellers**: Create and manage auction listings
- **Admins**: Platform oversight and user management

### 🎨 Modern UI/UX
- Beautiful, responsive design with shadcn/ui components
- Mobile-first responsive layout
- Smooth animations and transitions
- Dark/light mode support
- Accessibility-focused design

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- Supabase account
- Razorpay account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd deva-ecomb
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your Supabase and Razorpay credentials.

4. **Set up Supabase database**
   - Create a new Supabase project
   - Run the SQL schema from `supabase-schema.sql` in the SQL editor
   - Update your environment variables with the project URL and anon key

5. **Start the development server**
   ```bash
   bun run dev
   # or
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 🗄️ Database Schema

The application uses PostgreSQL via Supabase with the following main tables:

- **users** - User profiles and authentication
- **categories** - Auction categories
- **auctions** - Auction listings with details
- **bids** - Bid history and tracking
- **watchlist** - User's saved auctions
- **transactions** - Payment and order management
- **notifications** - Real-time user notifications

### Key Features of the Schema:
- Row Level Security (RLS) for data protection
- Real-time subscriptions for live updates
- Automatic triggers for data consistency
- Comprehensive indexing for performance

## 🏗️ Architecture

### Frontend Stack
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Modern component library
- **React Router** - Client-side routing
- **React Hook Form** - Form management
- **date-fns** - Date utilities

### Backend Services
- **Supabase** - Database, Auth, Real-time, Storage
- **Razorpay** - Payment processing
- **Vercel/Netlify** - Deployment (recommended)

### Real-time Features
- Live bid updates using Supabase real-time subscriptions
- Instant notifications for outbid alerts
- Real-time auction status changes
- Live countdown timers

## 📱 Pages & Components

### Core Pages
- **HomePage** - Landing page with features and categories
- **AuctionBrowsePage** - Browse and search auctions
- **DashboardPage** - User dashboard with bids and watchlist
- **LoginPage/SignupPage** - Authentication pages

### Key Components
- **AuctionCard** - Reusable auction display component
- **BiddingForm** - Interactive bidding interface
- **SearchFilters** - Advanced search and filtering
- **Navigation** - Responsive navigation with user menu

## 🔧 Configuration

### Environment Variables
```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Razorpay
VITE_RAZORPAY_KEY_ID=your_razorpay_key

# App Config
VITE_APP_NAME=AuctionHub
VITE_APP_URL=http://localhost:5173
```

### Supabase Setup
1. Create a new project at [supabase.com](https://supabase.com)
2. Run the provided SQL schema
3. Enable real-time on the `auctions` and `bids` tables
4. Configure RLS policies for security

### Payment Setup
1. Create a Razorpay account
2. Get your test/live API keys
3. Configure webhook endpoints for payment confirmations

## 🚀 Deployment

### Frontend Deployment (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Database Migration
The Supabase database will automatically apply migrations. For production:
1. Create a production Supabase project
2. Run the schema SQL in the production environment
3. Update environment variables

## 🧪 Testing

Run the test suite:
```bash
bun test
# or
npm test
```

### Test Coverage
- Component unit tests
- Integration tests for auction flows
- Authentication flow tests
- Payment integration tests

## 📋 Development Roadmap

### Phase 1 ✅
- [x] Basic auction browsing
- [x] User authentication
- [x] Bidding functionality
- [x] Responsive design

### Phase 2 🚧
- [ ] Real-time updates
- [ ] Payment integration
- [ ] Admin dashboard
- [ ] Advanced search

### Phase 3 📅
- [ ] Mobile app
- [ ] Advanced analytics
- [ ] API rate limiting
- [ ] Advanced security features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use conventional commit messages
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Lucide](https://lucide.dev/) for the icon set

## 📞 Support

For support, email support@auctionhub.com or join our Discord server.

---

Built with ❤️ for the modern web

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

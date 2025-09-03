# Sleeper Fantasy Football Analyzer

A modern fantasy football analysis tool that integrates with Sleeper Fantasy Football to help you make better lineup decisions and stay on top of your leagues.

## 🚀 Live Demo

**[View Live App on Vercel →]([https://vercel.com/pranavthoppes-projects/game-tracker/8nduvETXnL14X37vgAdrzYW9sX9P]))**

## ✨ Features

### 📊 League Management
- **Multi-League Support**: View and analyze all your Sleeper leagues across different seasons
- **Season Navigation**: Browse historical seasons (±5 years from current)
- **Member Selection**: Analyze any league member's team

### 🏈 Fantasy Analysis
- **My Roster**: View your complete roster with starters and bench players
- **Live Schedule**: See NFL games by week with real-time status
- **Broadcast Guide**: Find which network is broadcasting each game
- **Matchup Analysis**: Deep dive into specific games with starting lineups
- **Fantasy Player Tracking**: See which of your players are in each game

### 🎯 Smart Features
- **Position-Based Organization**: Color-coded positions (QB, RB, WR, TE, K, DEF)
- **Injury Status**: Real-time injury reports and status updates
- **Starter Indicators**: Clear distinction between starters and bench players
- **Fantasy Player Highlights**: Your players are highlighted in matchup views
- **Depth Chart Integration**: See where players rank on their NFL team's depth chart

## 🛠 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) with App Router
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **Data Fetching**: [TanStack Query](https://tanstack.com/query) (React Query)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Deployment**: [Vercel](https://vercel.com/)

## 🏗 Architecture

### Database Schema
- **Players**: Complete NFL player database with positions, teams, injury status
- **Schedule**: NFL game schedule with broadcast information
- **Teams**: Team records and statistics
- **Sync Logs**: Track data synchronization status

### API Integration
- **Sleeper API**: Fetches league data, rosters, and member information
- **Internal APIs**: Custom endpoints for player data, schedules, and team analysis

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Sleeper Fantasy Football account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/sleeper-fantasy-analyzer.git
   cd sleeper-fantasy-analyzer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your `.env.local`:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/sleeper_ff"
   DIRECT_URL="postgresql://username:password@localhost:5432/sleeper_ff"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## 📱 How to Use

### 1. Sign In
- Enter your Sleeper username to access your leagues
- The app will fetch all leagues associated with your account

### 2. Select League & Season
- Choose from your available leagues
- Use the season dropdown to analyze different years
- Click on any league to expand options

### 3. Analyze Your Team
- Click "Analyze" to view detailed team analysis
- Navigate between Schedule and Broadcast views
- Use week navigation to plan ahead

### 4. Explore Matchups
- Click on any game to see detailed matchup analysis
- View starting lineups for both teams
- See which of your fantasy players are playing
- Track injury reports and player status

## 🔧 Development

### Project Structure
```
├── app/
│   ├── api/           # API routes for Sleeper integration
│   ├── home/          # Main application pages
│   └── hooks/         # Custom React hooks
├── components/        # Reusable UI components
├── lib/              # Utility functions and database
├── prisma/           # Database schema and migrations
└── public/           # Static assets
```

### Key Components
- **`RosterCard`**: Displays user's fantasy roster with player details
- **`ScheduleCard`**: Shows NFL schedule for selected week
- **`BroadcastCard`**: Organizes games by broadcast network
- **`MatchupCard`**: Detailed game analysis with starting lineups

### Custom Hooks
- **`useStarters`**: Fetches NFL starting lineups
- **`usePlayersByIds`**: Batch fetch player data
- **`useSchedule`**: Manages NFL schedule and current week

## 🚢 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy automatically on every push to main branch

### Database Setup
- Use [Vercel Postgres](https://vercel.com/storage/postgres) for production
- Or connect to your preferred PostgreSQL provider
- Run `npx prisma db push` to create tables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Sleeper API](https://docs.sleeper.app/) for providing comprehensive fantasy football data
- [shadcn/ui](https://ui.shadcn.com/) for beautiful, accessible UI components
- [Lucide](https://lucide.dev/) for the icon library

## 📞 Support

If you have questions or run into issues:
- Open an [Issue](https://github.com/your-username/sleeper-fantasy-analyzer/issues)
- Check the [Sleeper API Documentation](https://docs.sleeper.app/)

---

**Built with ❤️ for fantasy football enthusiasts**

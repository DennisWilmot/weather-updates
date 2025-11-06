# Tropical Storm Melissa Tracker

A Next.js application for tracking Tropical Storm Melissa in relation to Jamaica, featuring a community submission feed for real-time status updates.

## Features

- **Storm Updates**: Real-time tracking of Tropical Storm Melissa with distance calculations and movement data
- **Community Feed**: Submit and view community status updates (power, WiFi, road conditions) with parish/community filtering
- **Emergency Contacts**: Comprehensive directory of emergency contacts organized by category
- **Real-time Updates**: Auto-refreshing data and live community feed updates

## Tech Stack

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Mantine UI** for components and styling
- **Supabase** for database and real-time features
- **Drizzle ORM** for database operations
- **PostgreSQL** for data storage

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd hurricane-melissa-update
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Fill in your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_postgres_connection_string
```

### 3. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from the project settings
3. Get your Postgres connection string from the database settings
4. Enable Row Level Security (RLS) with public read/write policies for the `submissions` table
5. Enable Realtime on the `submissions` table

### 4. Database Setup

Generate and run the database migrations:

```bash
# Generate migration files
npm run db:generate

# Push schema to Supabase
npm run db:push
```

### 5. Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── melissa/route.ts          # Storm data API
│   │   └── submissions/route.ts      # Community feed API
│   ├── layout.tsx                    # Root layout with Mantine provider
│   └── page.tsx                      # Main page with tabs
├── components/
│   ├── StormUpdates.tsx              # Storm data display
│   ├── CommunityFeed.tsx             # Community submission feed
│   └── EmergencyContacts.tsx         # Emergency contacts directory
├── lib/
│   ├── db/
│   │   ├── schema.ts                 # Drizzle schema
│   │   └── index.ts                  # Database client
│   └── supabase.ts                   # Supabase client
├── data/
│   ├── emergency-contacts.json       # Emergency contact data
│   └── jamaica-locations.json        # Parish/community data
└── drizzle.config.ts                 # Drizzle configuration
```

## API Endpoints

- `GET /api/melissa` - Fetch current storm data from NHC
- `GET /api/submissions` - Fetch community submissions with optional filtering
- `POST /api/submissions` - Submit new community status update

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DATABASE_URL`
4. Deploy

The application will be automatically deployed and available at your Vercel URL.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
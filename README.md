# Tropical Storm Melissa Tracker

A real-time tracking application for Tropical Storm Melissa in relation to Jamaica, built with Next.js 14, TypeScript, and Mantine UI.

## Features

- 🌪️ Live storm data from NHC (National Hurricane Center)
- 📍 Distance calculation from Jamaica using haversine formula
- ⏱️ ETA calculation based on storm movement
- 🚨 Emergency contact information for Jamaica
- 📱 Mobile-responsive design
- 🔄 Auto-refresh every 5 minutes
- 🌙 Dark/light mode support

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Library**: Mantine UI
- **Icons**: Tabler Icons
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd hurricane-melissa-update
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

- `GET /api/melissa` - Fetches current storm data and calculates distance/ETA to Jamaica

## Data Sources

- **Storm Data**: [NHC CurrentStorms.json](https://www.nhc.noaa.gov/CurrentStorms.json)
- **Emergency Contacts**: Local JSON file with Jamaica emergency services

## Deployment

This app is configured for zero-config deployment on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

## Important Disclaimer

⚠️ **This application is for informational purposes only and is NOT an official forecast.** Always follow guidance from ODPEM and the National Hurricane Center for official weather information and emergency instructions.

## License

MIT License

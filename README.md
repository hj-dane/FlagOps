# FlagOps

FlagOps is a cross-platform mobile app for managing flag football leagues in real time. It lets organizations track teams, players, matches, and tournaments across multiple leagues, with separate views for platform Admins and League Organizers.

## Tech Stack

- **React Native** (via **Expo** + **Expo Router**) — cross-platform mobile app framework and file-based navigation
- **JavaScript (JSX)** — application logic and UI components
- **Supabase** — backend-as-a-service for authentication and real-time data
- **Jotai** — lightweight state management (e.g., live match state)
- **React Native Paper / @rneui** — UI component libraries
- **Async Storage** — local persistence on-device

## Main Functions

**Authentication**
- Login, registration, and forgot-password flows (`app/(auth)/`)

**Admin role**
- Dashboard overview of league activity (`app/(admin)/home/dashboard.jsx`)
- Approve or reject new organizations/requests (`app/(admin)/approvals/`)
- Manage organizations, teams, and players platform-wide (`app/(admin)/organizations/`, `app/(admin)/teams/`, `app/(admin)/players/`)
- League-wide leaderboard (`app/(admin)/leaderboard/`)

**Organizer role**
- Dashboard for the organizer's own league (`app/(organizer)/home/dashboard.jsx`)
- Create and manage tournaments, teams, and players (`app/(organizer)/tournaments/`, `app/(organizer)/teams/`, `app/(organizer)/players/`)
- Schedule and manage matches, including a **live match tracking** view for real-time scores and stat logging (`app/(organizer)/matches/`, `app/(organizer)/matches/live/[id].jsx`)
- Player and team statistics and leaderboards (`app/(organizer)/stats/`, `app/(organizer)/leaderboard/`)

**Shared**
- Profile settings for any authenticated user (`app/profile-settings.jsx`)

## Project Structure

```
FlagOps/
├── app/
│   ├── (auth)/         # Login, register, forgot-password
│   ├── (admin)/        # Admin-only screens (approvals, orgs, teams, players, leaderboard)
│   ├── (organizer)/    # Organizer screens (tournaments, matches, live scoring, stats)
│   └── _layout.jsx     # Root navigation layout
├── components/         # Shared UI components (headers, sidebars, status pills)
├── store/              # Jotai atoms for global and live-match state
├── data/               # Mock data used during development
├── utils/supabase.js   # Supabase client configuration
└── config.js           # App-level configuration
```

## Setup

1. Install dependencies: `npm install`
2. Configure Supabase credentials in `utils/supabase.js` / `config.js`
3. Start the app: `npm start` (or `npm run android` / `npm run ios` / `npm run web`)

Note: For new files or changes, create a new branch — do not merge directly into main.

**Note:** For new files or changes, create a new branch — do not merge directly into `main`.

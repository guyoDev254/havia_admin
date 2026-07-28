# NBC Admin Panel

Next.js admin panel for managing the NorthernBox NBC community platform.

## Features

- 📊 **Dashboard** - System statistics and overview
- 👥 **User Management** - View, edit, delete users, change roles
- 🎯 **Clubs Management** - Manage community clubs
- 📅 **Events Management** - Manage events and workshops
- 🏆 **Badges Management** - Create and manage achievement badges

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your API URL
```

3. Run the development server:
```bash
npm run dev
```

The admin panel will be available at `http://localhost:3001`

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:3000)

## Authentication

Only users with `ADMIN` or `MODERATOR` roles can access the admin panel. Login with your admin credentials at `/login`.

## Pages

- `/dashboard` - Main dashboard with statistics
- `/users` - User management
- `/clubs` - Clubs management
- `/events` - Events management
- `/badges` - Badges management

## Development

- Start dev server: `npm run dev`
- Build for production: `npm run build`
- Start production server: `npm start`


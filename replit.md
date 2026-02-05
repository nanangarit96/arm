# Admin Dashboard Application

## Overview

A full-stack multi-role admin dashboard application built with React frontend and Express backend. The application supports multiple user roles (Master, Admin, Agent, Customer) with role-based access control and different panel interfaces.

## Tech Stack

- **Frontend**: React 18, TailwindCSS, shadcn/ui components
- **Backend**: Express.js 5
- **Database**: PostgreSQL with Drizzle ORM
- **Build Tool**: Vite
- **Language**: TypeScript

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions and context
│   │   └── pages/         # Page components by role
│   └── index.html
├── server/                 # Backend Express application
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   ├── db.ts              # Database connection
│   └── seed.ts            # Database seeding
├── shared/                 # Shared code between frontend/backend
│   └── schema.ts          # Drizzle schema definitions
└── package.json
```

## User Roles & Panel Paths

- **Master**: `/ms-panel-9921/` - Full system access
- **Admin**: `/ad-panel-4432/` - User and transaction management
- **Agent**: `/ag-panel-7781/` - Customer management
- **Customer**: `/wk-panel-2210/` - Customer portal

## Key Features

- Role-based authentication and authorization
- Member management with approval workflows
- Deposit and withdrawal tracking
- Product catalog management
- System bank account configuration
- Activity logging

## Development

The application runs on port 5000, serving both the API and the React frontend through the Vite dev server in development mode.

### Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Run production server
- `npm run db:push` - Push database schema changes

## Database

Uses PostgreSQL via Drizzle ORM. The schema includes tables for:
- users, members, agents, admins
- deposits, withdrawals
- products, system_banks
- notifications, activity_logs

## Recent Changes

- 2026-02-05: Initial setup in Replit environment
  - Created missing UI components for shadcn/ui
  - Set up database and seeding
  - Configured Vite dev server with host allowance
  - Added sidebar navigation components

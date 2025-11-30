# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-featured mosque and Islamic association management platform built with Next.js 16, TypeScript, Prisma, and Sanity CMS. The application serves both public users (mosque members and visitors) and administrators managing the mosque operations.

## Development Commands

```bash
# Development
npm run dev              # Start Next.js development server (port 3000)

# Building
npm run build           # Build for production
npm start               # Start production server

# Database
npx prisma generate     # Generate Prisma client
npx prisma migrate dev  # Run database migrations
npx prisma studio       # Open Prisma Studio GUI

# Admin setup
npm run create-admin    # Create initial admin user

# Data seeding
npm run seed:events     # Seed events from Sanity to database

# Linting
npm run lint            # Run ESLint
```

## Architecture Overview

### Dual Content Management System

The application uses **two separate data storage systems** working together:

1. **Sanity CMS** (`/studio` route) - For content managed by admins:
   - Events (with registration capacity management)
   - Activities (courses, classes)
   - Articles and news
   - Team members
   - Donation projects
   - Gallery images
   - Mosque settings (contact info, social links)
   - Prayer settings and overrides
   - Services (marriage, funeral, shahada, aqiqa)

2. **PostgreSQL via Prisma** - For transactional/user data:
   - User accounts and authentication (NextAuth)
   - User roles (ADMIN, IMAM, TEACHER, STAFF, MEMBER)
   - Memberships and subscriptions
   - Donations (linked to Sanity projects by ID reference)
   - Event registrations (linked to Sanity events by ID)
   - Contact messages
   - Service requests
   - Children (for activity enrollments)
   - Enrollments (linked to Sanity activities)

**Important**: Content like events and activities are created in Sanity, but registrations/enrollments are stored in PostgreSQL with foreign key references using string IDs.

### Authentication & Authorization

- **NextAuth v4** with JWT strategy
- Custom credentials provider using bcryptjs
- Protected admin routes via middleware (`middleware.ts`)
- Role-based access: Only ADMIN, IMAM, and STAFF can access `/admin/*` routes
- Admin login at `/admin/login`
- Session data includes user role and ID in JWT token

### Prayer Times Integration

The application integrates with **Mawaqit API** for prayer times:
- Base configuration in `lib/mawaqit.ts`
- API endpoint at `app/api/prayer-times/route.ts`
- Supports both fixed iqama times (e.g., "20:30") and relative times (e.g., "+15" means 15 minutes after adhan)
- Handles special prayers: Jumua, Eid, Tarawih
- Settings and overrides managed in Sanity CMS
- Environment variables: `MAWAQIT_API_URL` and `masjid_id`

### Admin Dashboard

Located at `/app/admin/*`, the admin panel provides:
- Event management (view registrations, track capacity)
- Donation tracking
- Membership management
- Service request handling
- Contact message inbox
- Activity enrollment management
- Prayer time imports and overrides
- User management
- Statistics dashboard (`/app/api/admin/stats/route.ts`)

### API Routes Structure

Public APIs (no auth required):
- `/api/prayer-times` - Get prayer times for the mosque
- `/api/donations` - Submit donations
- `/api/enrollments` - Submit activity enrollments
- `/api/event-registrations` - Register for events
- `/api/events/[id]/availability` - Check event capacity
- `/api/contact` - Submit contact messages
- `/api/service-requests` - Submit service requests

Admin APIs (require authentication):
- `/api/admin/*` - All administrative endpoints
- `/api/admin/stats` - Dashboard statistics
- `/api/admin/import-prayer-times` - Import prayer times from Mawaqit

Setup:
- `/api/setup/create-admin` - Initial admin creation endpoint

### Key Library Utilities

**`lib/auth.ts`**: NextAuth configuration with Prisma adapter and JWT callbacks
**`lib/prisma.ts`**: Singleton Prisma client instance
**`lib/sanity.ts`**: Sanity client configuration and helper functions for fetching content
**`lib/mawaqit.ts`**: Mawaqit API integration for prayer times with iqama calculation logic
**`lib/prayer-times.ts`**: Prayer time utilities and formatting
**`lib/utils.ts`**: General utility functions (cn for className merging)

### Component Architecture

**Public Components** (`/components`):
- Form components: `ContactForm`, `DonationForm`, `EnrollmentForm`, `EventRegistrationModal`, `ServiceRequestForm`
- Display components: `PrayerTimesCard`, `PrayerCountdown`, `SpecialPrayersSection`
- Layout: `Navbar`, `Footer`
- UI primitives in `/components/ui` (shadcn-style components)

**Admin Components**: Located within respective `/app/admin/*` page files (not in shared components directory)

### Page Structure

Public pages:
- `/` - Homepage with current day's prayer times
- `/horaires` - Monthly prayer times calendar
- `/about` - Mosque history, mission, team
- `/activites` - List of courses and activities
- `/evenements` - Event listings with filtering
- `/dons` - Donation information and form
- `/contact` - Contact form and map
- `/services` - Service request forms

Admin pages (all under `/app/admin/`):
- `/admin` - Dashboard with statistics
- `/admin/evenements` - Event management
- `/admin/dons` - Donation tracking
- `/admin/inscriptions` - Enrollment management
- `/admin/messages` - Contact messages inbox
- `/admin/services` - Service request management
- `/admin/membres` - User/member management
- `/admin/cotisations` - Membership subscriptions
- `/admin/horaires` - Prayer time management
- `/admin/parametres` - Mosque settings
- `/admin/studio` - Embedded Sanity Studio

Sanity Studio:
- `/studio` - Standalone Sanity Studio interface

### Environment Variables

Required in `.env`:

```bash
# Database (Prisma Accelerate)
DATABASE_URL=prisma+postgres://...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key

# Mawaqit API
MAWAQIT_API_URL=https://mawaqit.elghoudi.net/api/v1
masjid_id=mosque-madretsch-biel-bienne

# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_token
```

### Sanity Schemas

Located in `/sanity/schemas/`:
- `activity.ts` - Courses and classes (with schedule, teacher, capacity)
- `event.ts` - Events (with category, dates, location, capacity)
- `article.ts` - News articles
- `project.ts` - Donation projects
- `service.ts` - Service types and information
- `teamMember.ts` - Staff and team members
- `mosqueSettings.ts` - General mosque configuration
- `prayerSettings.ts` - Prayer calculation settings
- `prayerOverride.ts` - Manual prayer time adjustments
- `gallery.ts` - Image galleries

### TypeScript Configuration

- Path alias: `@/*` maps to project root
- Strict mode enabled
- Target: ES2017
- JSX: react-jsx (React 19)

### Styling

- **Tailwind CSS v4** (using new `@tailwindcss/postcss`)
- Theme toggle with next-themes (light/dark mode)
- Custom color scheme: Emerald green (#059669) and gold (#D4AF37)
- Arabic text support with RTL directionality
- Animations with Framer Motion
- Icons from Lucide React

## Common Development Patterns

### Creating a New Admin API Route

1. Create route at `app/api/admin/[feature]/route.ts`
2. Import and use Prisma client from `lib/prisma`
3. Protect with authentication check (see existing admin routes)
4. Handle CORS and method types (GET, POST, PATCH, DELETE)
5. Return proper error responses with status codes

### Linking Sanity Content to Prisma Records

When storing references to Sanity content in PostgreSQL:
- Store the Sanity document `_id` as a string field
- Also store denormalized data (e.g., event title) for quick access
- Query Sanity when full content is needed
- Example: `EventRegistration` stores both `eventId` and `eventTitle`

### Working with Prayer Times

Prayer times flow:
1. Fetched from Mawaqit API via `lib/mawaqit.ts`
2. Adjusted by overrides from Sanity CMS
3. Cached/served via `/api/prayer-times` endpoint
4. Displayed in `PrayerTimesCard` component
5. Countdown calculated in `PrayerCountdown` component

### Role-Based Access

Check user roles in API routes:
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const session = await getServerSession(authOptions)
if (!session || !['ADMIN', 'IMAM', 'STAFF'].includes(session.user.role)) {
  return new Response('Unauthorized', { status: 401 })
}
```

## Database Workflow

1. Modify schema in `prisma/schema.prisma`
2. Generate migration: `npx prisma migrate dev --name description`
3. Prisma client auto-updates
4. Update TypeScript types if needed
5. Restart dev server to pick up changes

## Deployment Notes

- Next.js 16 with App Router
- Database uses Prisma Accelerate (connection pooling)
- Sanity Studio embeddable at `/studio` and `/admin/studio`
- Environment variables must be set in production
- Build command: `npm run build`
- Requires PostgreSQL database
- Sanity project must be deployed separately

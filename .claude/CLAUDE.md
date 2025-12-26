# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A mosque and Islamic association management platform built with Next.js 16 (React 19), TypeScript, Prisma 6, and Directus CMS. Serves public visitors, mosque members, and administrators.

**Location**: Mosquée Madretsch, Biel/Bienne, Switzerland
**Currency**: CHF (Swiss Francs)
**CMS**: Directus (http://localhost:8055) - All content is managed here.

## Development Commands

```bash
# Development
npm run dev              # Start Next.js (port 3000)
npm run build            # Build for production
npm start                # Start production server

# Database
npx prisma generate      # Generate Prisma client (required after schema changes)
npx prisma migrate dev   # Run migrations
npm run prisma:studio    # Open Prisma Studio GUI

# Admin
npm run create-admin     # Create initial admin user

# Linting
npm run lint             # Run ESLint

# Scripts (run with npx tsx scripts/<name>.ts)
# - create-admin.ts: Create admin user
# - seed-directus-demo.ts: Seed demo data to Directus
# - test-email.ts: Test email sending
```

## Architecture

### Dual Data Storage

1. **Directus CMS** (`lib/directus.ts`) - Content managed by admins:
   - Events, Activities, Articles, Projects
   - Team members, Gallery, Settings
   - Prayer settings and overrides

2. **PostgreSQL via Prisma** (`lib/prisma.ts`) - Transactional data:
   - Users, Authentication (NextAuth v4)
   - Memberships, Donations, Payments
   - Event registrations, Enrollments
   - Children profiles, Notifications
   - Waiting lists, Refund requests

**Key Pattern**: Content (events/activities) lives in Directus; user interactions (registrations/enrollments) are stored in PostgreSQL with string ID references to Directus.

### Authentication

- **NextAuth v4** with JWT strategy and credentials provider
- Protected routes via `middleware.ts`
- Roles: ADMIN, IMAM, TEACHER, STAFF, MANAGER, MEMBER
- Admin access: ADMIN, IMAM, STAFF, MANAGER roles
- MANAGER can manage activities/events assigned via `manager_email` in Directus

```typescript
// Role check in API routes
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const session = await getServerSession(authOptions)
if (!session || !['ADMIN', 'IMAM', 'STAFF', 'MANAGER'].includes(session.user.role)) {
  return new Response('Unauthorized', { status: 401 })
}
```

### Key Libraries

| File | Purpose |
|------|---------|
| `lib/auth.ts` | NextAuth config with Prisma adapter |
| `lib/prisma.ts` | Singleton Prisma client |
| `lib/directus.ts` | Directus SDK client and helpers |
| `lib/stripe.ts` | Stripe client and payment utilities |
| `lib/email.ts` | Resend email (confirmations, notifications) |
| `lib/mawaqit.ts` | Prayer times from Mawaqit API |
| `lib/pricing.ts` | Price calculations for events/activities |
| `lib/permissions.ts` | Role-based permission checks |

### Type Definitions

Located in `/types/`:
- `next-auth.d.ts` - Extended NextAuth types (includes role, id in session)
- `mawaqit.ts` - Mawaqit API response types
- `restrictions.ts` - Event/activity restriction types

## API Routes

**Public** (no auth):
- `/api/prayer-times`, `/api/donations`, `/api/enrollments`
- `/api/event-registrations`, `/api/events/[id]/availability`
- `/api/contact`, `/api/service-requests`

**Member** (auth required):
- `/api/account/children` - CRUD for children profiles
- `/api/membre/profil`, `/api/membre/notifications`
- `/api/membre/dons/export` - PDF receipt generation

**Admin** (admin role required):
- `/api/admin/*` - All administrative endpoints
- `/api/admin/stats`, `/api/admin/users`
- `/api/admin/event-registrations`, `/api/admin/enrollments`

## Payment Flow (Stripe)

1. User registers → status `PENDING_PAYMENT`
2. Redirect to Stripe Checkout (`/api/events/[id]/checkout`)
3. Webhook (`/api/stripe/webhook`) updates status → `CONFIRMED`
4. Email confirmation sent via Resend

## Database Workflow

After schema changes:
```bash
npx prisma migrate dev --name description  # Create migration
npx prisma generate                         # Regenerate client
rm -rf .next && npm run dev                # Clear cache, restart
```

## Running the Full Stack

```bash
# Terminal 1: Directus CMS
cd ~/directus-mosquee && npx directus start  # Port 8055

# Terminal 2: Next.js
npm run dev  # Port 3000

# Terminal 3 (optional): Stripe webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Environment Variables

Required in `.env`:
```bash
DATABASE_URL=postgresql://...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
DIRECTUS_URL=http://localhost:8055
DIRECTUS_ADMIN_TOKEN=...
MAWAQIT_API_URL=https://mawaqit.elghoudi.net/api/v1
masjid_id=mosque-madretsch-biel-bienne
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
RESEND_API_KEY=re_...
```

## Troubleshooting

### Prisma Client Out of Sync
```bash
npx prisma generate && rm -rf .next && npm run dev
```

### Foreign Key Constraint Errors
User session has stale ID. Solution: Log out completely, clear cookies, log back in.

### Session Issues
Debug in browser console:
```javascript
fetch('/api/auth/session').then(r => r.json()).then(console.log)
```

## Page Structure

### Public Pages
- `/` - Homepage with prayer times
- `/horaires` - Monthly prayer calendar
- `/about` - History, mission, team
- `/activites` - Courses and activities list
- `/evenements` - Events with filtering
- `/dons` - Donation info and forms
- `/contact` - Contact form and map

### Member Dashboard (`/dashboard/*`)
- `/dashboard` - Member overview
- `/dashboard/enfants` - Children management (CRUD)
- `/dashboard/notifications` - Notification center
- `/dashboard/evenements` - Event registrations
- `/dashboard/inscriptions` - Activity enrollments
- `/dashboard/dons` - Donation history
- `/dashboard/organiser/*` - MANAGER role: manage own events/activities

### Admin Dashboard (`/dashboard/admin/*`)
- `/dashboard/admin` - Statistics dashboard
- `/dashboard/admin/gestion` - Unified events/activities management
- `/dashboard/admin/membres` - User management
- `/dashboard/admin/roles` - Role permissions configuration
- `/dashboard/admin/dons` - Donation tracking
- `/dashboard/admin/messages` - Contact inbox

## Permission System

Role-based access control via `lib/permissions.ts`:

| Role | Default Access |
|------|----------------|
| ADMIN | Full access to everything |
| IMAM | Events, prayer times, messages (read) |
| STAFF | Registrations, messages, members (read) |
| MANAGER | Own events/activities only |
| TEACHER | Activities enrollments (read) |
| MEMBER | No admin access |

Permissions are stored in `RolePermission` table and can be customized per role.

## Key Scripts

```bash
# Run any script with tsx
npx tsx scripts/<script-name>.ts

# Common scripts
npx tsx scripts/create-admin.ts          # Create admin user
npx tsx scripts/seed-directus-demo.ts    # Seed demo data
npx tsx scripts/test-email.ts            # Test email sending
npx tsx scripts/init-permissions.ts      # Initialize role permissions
```

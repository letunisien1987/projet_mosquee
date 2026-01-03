# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A mosque and Islamic association management platform built with Next.js 16 (React 19), TypeScript, and Prisma 6. Serves public visitors, mosque members, and administrators.

**Location**: Mosquée Madretsch, Biel/Bienne, Switzerland
**Currency**: CHF (Swiss Francs)

**Data Storage**: All data is stored in PostgreSQL via Prisma. Content operations use `lib/content.ts`.

Events and activities are created/edited via the **frontend dashboard** at `/dashboard/organiser`. The forms (`components/forms/EventForm.tsx` and `components/forms/ActivityForm.tsx`) submit to `/api/membre/organisateur/offerings`.

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
# - test-email.ts: Test email sending
# - init-permissions.ts: Initialize role permissions
```

## Architecture

### Data Storage (PostgreSQL via Prisma)

All data now lives in PostgreSQL via Prisma (`lib/prisma.ts`):

**Content Models** (migrated from Directus):
- Event, Activity, Article, Project
- TeamMember, Gallery, GalleryImage
- JumuaMessage (Friday prayer announcements)

**Transactional Models**:
- User, Child, UserProfile
- Membership, MembershipRequest
- Donation, Payment, RefundRequest
- EventRegistration, Enrollment, WaitingList
- Notification, ContactMessage, ServiceRequest
- RolePermission, MosqueSettings, Logo, LogoLocationConfig

**Key Pattern**: Use `lib/content.ts` for content CRUD operations. It provides a unified "Offering" abstraction over Events and Activities.

### Authentication

- **NextAuth v4** with JWT strategy and credentials provider
- Protected routes via `middleware.ts`
- Roles: `ADMIN`, `IMAM`, `TEACHER`, `STAFF`, `MANAGER`, `TRESORIER`, `MEMBER`
- Admin access: ADMIN, IMAM, STAFF, MANAGER, TEACHER roles
- MANAGER can manage activities/events assigned via `managerId`/`managerEmail`
- TRESORIER handles financial operations (donations, refunds)

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
| `lib/content.ts` | Content CRUD (events, activities, projects, articles, team, galleries) |
| `lib/stripe.ts` | Stripe client and payment utilities |
| `lib/email.ts` | Resend email (confirmations, notifications) |
| `lib/mawaqit.ts` | Prayer times from Mawaqit API |
| `lib/pricing.ts` | Price calculations for events/activities |
| `lib/permissions.ts` | Role-based permission checks |
| `lib/cloudinary.ts` | Image upload/storage via Cloudinary |
| `lib/logos.ts` | Logo management utilities |
| `lib/settings.ts` | Mosque settings retrieval |

### Custom Hooks

| Hook | Purpose |
|------|---------|
| `hooks/useFetch.ts` | Generic data fetching with caching |
| `hooks/useMutation.ts` | API mutations with loading states |
| `hooks/usePermissions.ts` | Check user permissions in components |
| `hooks/useChildren.ts` | CRUD for user's children profiles |

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
# Terminal 1: Next.js
npm run dev  # Port 3000

# Terminal 2 (optional): Stripe webhooks for local testing
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Environment Variables

Required in `.env`:
```bash
DATABASE_URL=postgresql://...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...

# Prayer times
MAWAQIT_API_URL=https://mawaqit.elghoudi.net/api/v1
masjid_id=mosque-madretsch-biel-bienne

# Payments
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# Email
RESEND_API_KEY=re_...

# Images
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
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
| TRESORIER | Donations, memberships, refunds |
| MEMBER | No admin access |

Permissions are stored in `RolePermission` table and can be customized per role.

## Key Scripts

```bash
# Run any script with tsx
npx tsx scripts/<script-name>.ts

# Common scripts
npx tsx scripts/create-admin.ts          # Create admin user
npx tsx scripts/test-email.ts            # Test email sending
npx tsx scripts/init-permissions.ts      # Initialize role permissions
```

## Prisma Schema Notes

**Event vs Activity field differences** (important for unified "Offering" handling):
- Event uses `maxCapacity`, Activity uses `maxParticipants`
- Event uses `published`, Activity uses `active`
- Event uses `imageUrl`, Activity uses `imageUrl`
- Both have `managerId`/`managerEmail` for assignment
- Both have `restrictions` and `pricing` as JSON fields

## Reusable UI Components

| Component | Purpose |
|-----------|---------|
| `components/RegistrationLayout.tsx` | Shared layout for event/activity registration pages |
| `components/RegistrationInfoCard.tsx` | Sidebar info card with icons (calendar, clock, price, etc.) |
| `components/forms/EventForm.tsx` | Complete event creation/edit form (30+ fields) |
| `components/forms/ActivityForm.tsx` | Activity creation/edit form |
| `components/dashboard/DashboardNav.tsx` | Dashboard navigation sidebar |
| `components/Logo.tsx` | Dynamic logo component with location-based configuration |
| `components/OrganizerContact.tsx` | Organizer contact display for events/activities |

## Content Management Pattern

When working with events/activities, use the unified "Offering" pattern from `lib/content.ts`:

```typescript
import {
  getAllOfferings,      // Get all events + activities
  getOfferingById,      // Get by ID (checks both tables)
  createOffering,       // Create (routes to correct table based on item_type)
  updateOffering,       // Update (finds correct table automatically)
  deleteOffering,       // Delete (finds correct table automatically)
  getOfferingsByManager // Get by manager ID/email
} from '@/lib/content'

// The Offering interface provides a unified view:
interface Offering {
  id: string
  item_type: 'EVENT' | 'ACTIVITY'
  title: string
  // ... common fields
}
```

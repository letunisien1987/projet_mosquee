# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-featured mosque and Islamic association management platform built with Next.js 16, TypeScript, Prisma, and Directus CMS. The application serves both public users (mosque members and visitors) and administrators managing the mosque operations.

**Note**: The project uses both Directus CMS (primary) and Sanity CMS (legacy). New content should be managed in Directus (http://localhost:8055).

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

1. **Directus CMS** (migrating from Sanity) - For content managed by admins:
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
   - Donations (linked to CMS projects by ID reference)
   - Event registrations (linked to CMS events by ID)
   - Contact messages
   - Service requests
   - **Children profiles** (managed by parents for multi-child families)
   - Enrollments (linked to CMS activities)
   - Payments (Stripe integration for event/activity fees)
   - Waiting lists (automatic management for full events/activities)
   - Notifications (email confirmations, reminders, status updates)

**Important**: Content like events and activities are created in CMS (Directus/Sanity), but registrations/enrollments are stored in PostgreSQL with foreign key references using string IDs.

### Directus Integration

**Connection**: Directus client in `lib/directus.ts` using `@directus/sdk`
**Endpoint**: Default `http://localhost:8055` (configurable via env)
**Authentication**: Uses admin token for server-side operations

**Key Collections**:
- `events` - Event listings with capacity, dates, categories
- `activities` - Courses and classes with instructor, schedule
- `team_members` - Staff profiles
- `projects` - Donation projects
- `articles` - News and announcements

**Data Flow**:
1. Content created/managed in Directus admin UI (port 8055)
2. Next.js fetches via Directus SDK REST API
3. User interactions (registrations) stored in PostgreSQL
4. References maintained via string IDs between systems

### Authentication & Authorization

- **NextAuth v4** with JWT strategy
- Custom credentials provider using bcryptjs
- Protected admin routes via middleware (`middleware.ts`)
- Role-based access: ADMIN, IMAM, STAFF, and MANAGER can access `/admin/*` routes
- MANAGER role: Can manage their own activities/events (assigned via manager_email in Directus)
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

Member APIs (require authentication):
- `/api/account/children` - GET list, POST create new child
- `/api/account/children/[id]` - GET details, PATCH update, DELETE child
- `/api/membre/profil` - GET/PATCH user profile
- `/api/membre/notifications` - GET user notifications
- `/api/membre/dons/export` - POST generate donation receipt PDF

Admin APIs (require authentication + admin role):
- `/api/admin/*` - All administrative endpoints
- `/api/admin/stats` - Dashboard statistics
- `/api/admin/import-prayer-times` - Import prayer times from Mawaqit
- `/api/admin/users` - User management
- `/api/admin/event-registrations` - Event registration management
- `/api/admin/enrollments/[id]` - Enrollment approval/rejection

Setup:
- `/api/setup/create-admin` - Initial admin creation endpoint

### Key Library Utilities

**`lib/auth.ts`**: NextAuth configuration with Prisma adapter and JWT callbacks
**`lib/prisma.ts`**: Singleton Prisma client instance
**`lib/directus.ts`**: Directus client configuration and helper functions for CMS operations
**`lib/stripe.ts`**: Stripe client and payment utilities
**`lib/email.ts`**: Email sending via Resend (registration confirmations, payment requests, notifications)
**`lib/pricing.ts`**: Price calculation utilities for events/activities
**`lib/mawaqit.ts`**: Mawaqit API integration for prayer times with iqama calculation logic
**`lib/sanity.ts`**: Legacy Sanity client (being phased out)
**`lib/utils.ts`**: General utility functions (cn for className merging)

### Component Architecture

**Public Components** (`/components`):
- Form components: `ContactForm`, `DonationForm`, `EnrollmentForm`, `EventRegistrationModal`, `ServiceRequestForm`
- Display components: `PrayerTimesCard`, `PrayerCountdown`, `SpecialPrayersSection`
- Layout: `Navbar`, `Footer`
- Member components: `AddEditChildModal`, `MemberNav`
- UI primitives in `/components/ui` (shadcn-style components)

**Admin Components**: Located within respective `/app/admin/*` page files (not in shared components directory)

**Member Components**: `AddEditChildModal` is a reusable modal for adding/editing child profiles with full form validation

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

Member pages (all under `/app/membre/`):
- `/membre/dashboard` - Member dashboard with personal overview
- `/membre/dashboard/enfants` - **Children management** (add, edit, delete child profiles)
- `/membre/profil` - Edit personal profile
- `/membre/inscriptions` - View activity enrollments
- `/membre/evenements` - View event registrations
- `/membre/dons` - Donation history
- `/membre/cotisation` - Membership subscription status
- `/membre/documents` - Personal documents
- `/membre/parametres` - Account settings

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
# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key

# Directus CMS (Primary)
DIRECTUS_URL=http://localhost:8055
DIRECTUS_ADMIN_TOKEN=your_admin_token

# Mawaqit API
MAWAQIT_API_URL=https://mawaqit.elghoudi.net/api/v1
masjid_id=mosque-madretsch-biel-bienne

# Stripe Payments
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# Email (Resend)
RESEND_API_KEY=re_...

# Sanity (Legacy)
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

### Children Management System

The application includes a complete multi-child management system for families:

**Database Model** (`prisma/schema.prisma`):
- `Child` model with fields: firstName, lastName, nickName, birthDate, gender, notes, avatarUrl
- Parent-child relationship via `parentId` foreign key with cascade deletion
- Children can be linked to event registrations and activity enrollments

**API Endpoints**:
- `GET /api/account/children` - List all children for authenticated user with enrollment/registration counts
- `POST /api/account/children` - Create new child (requires auth, validates with Zod)
- `GET /api/account/children/[id]` - Get single child details (owner verification)
- `PATCH /api/account/children/[id]` - Update child (owner verification)
- `DELETE /api/account/children/[id]` - Delete child (prevents deletion if has active registrations)

**Frontend** (`/app/membre/dashboard/enfants`):
- Children list page with statistics cards (total children, activities, events)
- Automatic age calculation from birthDate
- Visual indicators for gender, nicknames, notes/allergies
- Modal-based add/edit workflow using `AddEditChildModal` component
- Delete protection warning when child has active enrollments/registrations

**Key Features**:
- Full CRUD operations with authentication
- Validation on both client and server (Zod schemas)
- Security: Users can only manage their own children
- Data integrity: Prevents orphaned registrations through deletion protection
- French UI with proper date formatting and age calculations

**Common Issue**: If child operations fail with foreign key errors, regenerate Prisma client with `npx prisma generate` and restart dev server.

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
if (!session || !['ADMIN', 'IMAM', 'STAFF', 'MANAGER'].includes(session.user.role)) {
  return new Response('Unauthorized', { status: 401 })
}
```

### Stripe Payment Flow

Event/Activity payment flow:
1. User registers via `/api/events/[id]/register` or `/api/enrollments`
2. If paid event, status is set to `PENDING_PAYMENT`
3. User redirected to `/api/events/[id]/checkout` which creates Stripe Checkout Session
4. After payment, Stripe webhook (`/api/stripe/webhook`) updates status to `CONFIRMED`
5. Email confirmation sent via Resend

### Email System

Emails are sent via Resend (`lib/email.ts`). Key email functions:
- `sendEventRegistrationEmail` - Confirmation after successful registration
- `sendEventPaymentRequest` - Payment link for paid events
- `sendEventPendingApprovalEmail` - Registration awaiting approval
- `sendNewRegistrationToManager` - Notify event manager of new registration

## Database Workflow

1. Modify schema in `prisma/schema.prisma`
2. Generate migration: `npx prisma migrate dev --name description`
3. Prisma client auto-updates with `npx prisma generate`
4. Update TypeScript types if needed
5. Restart dev server to pick up changes

**Important**: After schema changes or when encountering `PrismaClientValidationError`:
```bash
npx prisma generate  # Regenerate client
rm -rf .next         # Clear Next.js cache
npm run dev          # Restart server
```

## Troubleshooting

### Foreign Key Constraint Errors on Child Operations

**Symptom**: Creating/updating children fails with "Foreign key constraint violated on children_parentId_fkey"

**Cause**: User session has stale user ID that doesn't match database

**Solution**:
1. User must completely log out
2. Close all browser windows
3. Clear browser cookies
4. Log back in with correct credentials
5. Session will now have correct user ID

### Session Authentication Issues

**Symptom**: API returns 401 Unauthorized or operations fail silently

**Debugging**:
```javascript
// In browser console:
fetch('/api/auth/session').then(r => r.json()).then(console.log)
```

If session is empty `{}`, user needs to re-authenticate.

### Prisma Client Out of Sync

**Symptom**: `PrismaClientValidationError` when accessing database

**Solution**:
```bash
npx prisma generate
pkill -f "next dev"
rm -rf .next
npm run dev
```

## Deployment Notes

- Next.js 16 with App Router
- Database: PostgreSQL (can use Prisma Accelerate for connection pooling)
- Directus CMS must be running separately (port 8055)
- Stripe webhooks must be configured for production URL
- Environment variables must be set in production
- Build command: `npm run build`

## Running the Full Stack Locally

```bash
# Terminal 1: Start Directus CMS
cd ~/directus-mosquee && npx directus start  # Port 8055

# Terminal 2: Start Next.js
npm run dev  # Port 3000

# Optional: Stripe webhook listener (for payment testing)
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

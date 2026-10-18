# LeadFlow

LeadFlow is a single-screen lead management tool built with Next.js, JavaScript, Prisma, and SQLite. Sales reps can browse and filter leads, see today's follow-ups, review a discussion timeline, log a new discussion, schedule a follow-up, update status, and add new leads.

## Requirements

- Node.js 20.9 or newer
- npm

## Local setup

```bash
npm install
copy .env.example .env
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The seed command creates five example leads with discussions, including today's and overdue follow-ups. The SQLite database is stored at `prisma/dev.db`.

## Useful scripts

```bash
npm run dev          # Start the development server
npm run build        # Create a production build
npm run start        # Start the production server
npm run lint         # Run ESLint
npm run db:generate  # Generate the Prisma client
npm run db:migrate   # Create/apply a development migration
npm run db:seed      # Reset and seed example data
```

## API routes

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/leads?status=QUALIFIED&search=maya` | List leads with optional filters |
| POST | `/api/leads` | Create a lead |
| GET | `/api/leads/:id` | Get a lead and all discussions |
| PATCH | `/api/leads/:id` | Update lead fields, including status |
| DELETE | `/api/leads/:id` | Delete a lead |
| GET | `/api/leads/:id/discussions` | List discussions newest first |
| POST | `/api/leads/:id/discussions` | Add a note and optionally update `followUpAt` |

All request bodies are validated with Zod. Validation errors return `422`, missing resources return `404`, successful creation returns `201`, and unexpected failures return `500`.

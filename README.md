# ClubRadar 📡

> **Next-Generation Event Pipeline, Awareness Radar, and Lead-Time Tracker for Alumni Clubs.**
> *Active Workspace: **NYU Bay Area Alumni Club** (San Francisco / Silicon Valley)*

[![Next.js](https://img.shields.io/badge/Next.js-16%20App%20Router-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase)](https://supabase.com/)

---

## 🌟 Overview

**ClubRadar** is built to streamline club operations, event incubation, lead-time tracking, and citywide calendar awareness for alumni chapters.

### Key Capabilities:
- **📡 Awareness & City Conflict Radar**: Overlay multi-day conferences (e.g., SF Tech Week, SOCAP, J.P. Morgan Healthcare Conference) and civic holidays against club events to prevent venue competition and attendance cannibalization.
- **⏱️ Automated Lead-Time Tracker**: Automatically computes and highlights the crucial **8-Week Kickoff** (venue outreach & budget) and **6-Week Marketing** (alumni newsletter submission) deadlines.
- **💡 Event Ideas Incubator**: Pitch lightweight event concepts with proposed vendor/partner names, website links, target time periods (e.g., *Fall 2026*, *Spring 2027*), and pricing notes. Includes committee upvoting and one-click **"Upgrade to Scheduled Event"**.
- **📊 Interactive Timeline & Table Views**: 8-column editable table with month indicators, rounded countdowns, column visibility customizer (toggable Cost column), and instant search/filtering.
- **⚡ Workflow Pipeline**: Stage-based progression (*Idea → Planning → Submitted → Confirmed → Completed*) with visual progress indicators and lead host assignments.

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/lategordon/clubradar.git
cd clubradar
npm install
```

### 2. Configure Environment Variables (Optional)
ClubRadar runs out-of-the-box with reactive local storage fallback and pre-seeded mock data. To connect your Supabase backend:

```bash
cp .env.example .env.local
```

Fill in your Supabase project credentials in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Database schema migrations are located at `supabase/migrations/20260812000000_init_schema.sql`.

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🏗️ Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack, Server & Client Components)
- **UI & Styling**: Tailwind CSS, Lucide React icons, date-fns
- **Backend / Database**: Supabase PostgreSQL + Row Level Security (RLS)
- **Data Layer**: Unified CRUD service with local storage synchronization and Supabase real-time client

---

## 📂 Project Structure

```text
├── app/
│   ├── calendar/          # Events & Timeline view (Month Radar / Table / Quarterly)
│   ├── events/            # Events pipeline overview
│   ├── hosts/             # Committee hosts directory & workload tracking
│   ├── ideas/             # Event Ideas Incubator & Brainstorming Backlog
│   ├── reports/           # Lead-time compliance & KPI metrics
│   ├── layout.tsx         # Root app layout & global fonts
│   └── page.tsx           # Main Dashboard
├── components/
│   ├── dashboard/         # WorkflowPipeline, ConflictRadarCalendar, QuickInsightsSidebar
│   ├── events/            # EventTableView, AddEventModal, EventDetailsModal, Stepper
│   ├── ideas/             # IdeaCard, IdeaBacklogView, PitchIdeaModal, UpgradeIdeaModal
│   ├── layout/            # Navbar & Notification Popover
│   └── ui/                # Toast, Dialog, Badge, Input, Select
├── lib/
│   ├── data-service.ts    # Unified CRUD & data persistence service
│   ├── mock-data.ts       # Seed alumni events, awareness dates, and ideas
│   └── utils/             # Deadline engine and date helpers
├── supabase/
│   └── migrations/        # SQL schema, views, and RLS policies
└── types/
    └── database.types.ts  # TypeScript database models and UI types
```

---

## 📝 License
MIT

# CA ProFlow — Simplifying Compliance

A complete, production-ready Chartered Accountant Practice Management System designed for CA firms, tax consultants, accounting firms, and their teams.

Built with high visual fidelity based on the **CA ProFlow** reference design, featuring complete Light and Dark theme implementations, responsive workflows, persistent MongoDB backend, role-based access control, analytics dashboards, and compliance management.

---

## 🌟 Key Features

- **Pixel-Accurate Visuals**:
  - Recreates the CA ProFlow reference design with custom typography, blue accents (`#1675FF`), card layouts, soft shadows, pill tabs, and badges.
  - Complete **Light Theme** (`#F5F8FF` background) and **Dark Theme** (`#0B1120` background) with instantaneous toggle and persistent preference.
- **Practice Dashboard**:
  - 4 Key KPI metric cards:
    - **Total Clients**: `248` (+18% trend)
    - **Pending Works**: `86` (+9% trend)
    - **Completed Filings**: `602` (+15% trend)
    - **Upcoming Deadlines**: `24` (-5% trend)
  - Interactive **Compliance Overview Donut Chart** showing exactly **92% On Track** (Completed: 92%, Pending: 6%, Overdue: 2%).
  - **Upcoming Deadlines Table** with dynamic status badges (Upcoming, Due Today, Overdue, Completed).
  - Blue gradient **Promotional Card** ("Stay Compliant, Grow Confident") with shortcut links.
  - **Quick Action Tiles** with 1-click navigation to core workflows.
  - Real-time **Recent Activities Stream** synced with backend database events.
- **Master Management**:
  - **Tax Master** (`/masters/tax`): GST, Income Tax, TDS, and other categories with frequency, due dates, statuses, and search/filtering.
  - **Work Master** (`/masters/work`): Pre-defined service packages with timeline SLAs and categories.
  - **Client Master** (`/masters/clients`): Two-column form with tabs for Basic Details, Business Details, and Contact Details with PAN/GSTIN validation.
  - **Work Assignment** (`/masters/work-assignment`): End-to-end task assignment connecting clients, work masters, employees, and deadlines.
  - **Employee Master** (`/masters/employees`): Team members, department, role, PAN, and assignments.
  - **Document Master** (`/masters/documents`): File repository with category filtering and upload metadata.
  - **Financial Year**, **Branch Master**, **Service Master**: Full master data management.
- **Operations & Billing**:
  - **Clients Directory** (`/operations/clients`): Paginated client roster with CSV export, search, and detailed drawer view.
  - **Works & Filings** (`/operations/works`): Kanban and list views for tracking assignment lifecycle from Pending to In Progress to Completed.
  - **Payments & Billing** (`/operations/payments`): Invoices, receipts, payment modes, and financial ledger.
  - **Reports & Analytics** (`/operations/reports`): Practice analytics with printable audit summaries.
- **Settings & RBAC**:
  - **General Settings**: Firm profile (`RIZ & Associates`), contact details, and compliance configurations.
  - **Users & Roles**: Role management supporting Super Admin, CA Admin, Manager, Employee, and Viewer.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with Vite and TypeScript
- **Styling**: Tailwind CSS + Custom CSS for pixel-accurate styling
- **Routing**: React Router DOM v7
- **Data Fetching**: Axios & TanStack React Query
- **Charts & Visuals**: Recharts (Donut, Sparklines, Area trends)
- **Icons**: Lucide React
- **Notifications**: Sonner toast system
- **Forms & Validation**: React Hook Form with Zod schemas

### Backend
- **Runtime**: Node.js with TypeScript (`tsx` execution)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM (supports both external Dockerized MongoDB and built-in embedded persistent MongoDB fallback)
- **Authentication**: JWT with secure HTTP-only cookies and Bcrypt password hashing
- **Security**: Helmet, CORS, Rate Limiting, Input Validation (Zod)
- **File Uploads**: Multer configured for document master

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ (tested on Node v20/v24)
- npm 9+
- *(Optional)* Docker Desktop for running containerized MongoDB

### 1. Installation
Clone or navigate to the repository root directory:

```bash
cd "CA Platform"
npm install
```

### 2. Environment Configuration
Both `server/.env` and `client/.env` come pre-configured with default settings:

- **Server (`server/.env`)**:
  ```env
  PORT=5000
  NODE_ENV=development
  MONGODB_URI=mongodb://127.0.0.1:27017/ca_proflow
  JWT_SECRET=super_secret_ca_proflow_jwt_key_2026_xyz
  JWT_EXPIRES_IN=1d
  CLIENT_URL=http://localhost:5173
  ```

- **Client (`client/.env`)**:
  ```env
  VITE_API_URL=http://localhost:5000/api/v1
  ```

### 3. Database Setup & Seeding
The backend is designed for zero friction:
- If MongoDB is running on `mongodb://127.0.0.1:27017`, it automatically connects to it.
- If no external MongoDB daemon is detected, the server automatically starts a persistent embedded MongoDB engine backed by `server/db_data/`, preserving all data across restarts!

To seed the database with the exact reference numbers (248 clients, 86 pending works, 602 completed filings, 24 upcoming deadlines, 92% compliance rate):

```bash
npm run seed
```

### 4. Running the Application

Run both frontend and backend concurrently:
```bash
npm run dev
```

Alternatively, run in separate terminals:
```bash
# Terminal 1 - Backend Server (Port 5000)
npm run dev --workspace=server

# Terminal 2 - Frontend Client (Port 5173)
npm run dev --workspace=client
```

Open your browser and navigate to:
👉 **`http://localhost:5173`**

---

## 🔑 Demo Credentials

A quick **1-Click Demo Login** button is available on the login page:

| Role | Email | Password |
|---|---|---|
| **CA Admin** | `tosif@rizassociates.com` | `Password123!` |
| **Manager** | `priya@rizassociates.com` | `Password123!` |
| **Employee** | `rahul@rizassociates.com` | `Password123!` |

---

## 🧪 Testing

Both backend and frontend are accompanied by comprehensive test suites:

```bash
# Run all tests (Server + Client)
npm test

# Run Server tests only (API endpoints, exact KPI counts, auth, tax filters, validation)
npm run test --workspace=server

# Run Client tests only (Components, KPI cards, Donut chart, deadlines table)
npm run test --workspace=client
```

---

## 📁 Project Architecture

```
CA Platform/
├── client/                     # Vite + React + TypeScript Frontend
│   ├── src/
│   │   ├── components/         # Reusable UI & Layout Components
│   │   │   ├── layout/         # Header, Sidebar, Layout Shell
│   │   │   └── ui/             # StatCard, ComplianceDonut, UpcomingDeadlines, etc.
│   │   ├── context/            # AuthContext, ThemeContext
│   │   ├── pages/              # Application Pages (Dashboard, Masters, Operations, Settings)
│   │   │   ├── auth/           # Login, Register
│   │   │   ├── masters/        # Tax, Work, Client, Employee, Document, FY, Branch, Service
│   │   │   ├── operations/     # Clients, Works, Payments, Reports
│   │   │   └── settings/       # General Settings, Users & Roles
│   │   ├── services/           # Axios API Client & Endpoints
│   │   ├── styles/             # Global CSS & Tailwind Custom Directives
│   │   └── tests/              # Vitest & React Testing Library Specs
│   ├── tailwind.config.js      # Color tokens matching reference screenshot
│   └── vite.config.ts          # Vite configuration with proxy to :5000
│
├── server/                     # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── config/             # DB Connection & Fallback Persistence
│   │   ├── controllers/        # REST Controller Functions
│   │   ├── middlewares/        # JWT Auth, Error Handler, Multer Upload
│   │   ├── models/             # Mongoose Schemas (Org, User, Client, Tax, Work, etc.)
│   │   ├── routes/             # Express API Endpoints (/api/v1/...)
│   │   ├── seeds/              # Seed Script with Exact KPI Numbers
│   │   ├── tests/              # Supertest & Vitest Integration Tests
│   │   └── validators/         # Zod Request Validation Schemas
│   └── db_data/                # Persistent Local Database Storage
│
├── docker-compose.yml          # Container configuration for local MongoDB 7.0
└── package.json                # Root npm workspaces configuration
```

---

## 📄 License
MIT License. Developed for Chartered Accountants & Practice Management.

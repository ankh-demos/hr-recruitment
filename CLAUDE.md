# CLAUDE.md

## Project Identity
Remax Sky HR Web Application is an internal HR and agent lifecycle management system.

Primary goals:
- Track applicant pipeline from application to employee.
- Manage active employees, ranks, and office distribution.
- Track resigned agents and resignation analytics.
- Provide operational dashboard metrics for HR/admin decisions.

## Scope
In scope:
- Candidate and application pipeline management.
- Employee lifecycle management (active, inactive, resigned, transfers).
- Agent rank tracking and expiry monitoring.
- Admin user management and notifications.
- Public apply form and internal protected backoffice pages.

Out of scope:
- Payroll processing.
- Advanced ATS integrations.
- External identity providers (custom auth currently used).

## Tech Stack
- Frontend: React + TypeScript + Tailwind CSS + Vite
- Backend: Node.js + Express + TypeScript
- Database: Supabase (PostgreSQL)
- Hosting: Vercel (client), Render (server)

## Monorepo Structure
- `client/` - React frontend
- `server/` - Express backend
- `scripts/` - helper data scripts
- `server/migrations/` - SQL migration files

## Frontend Sitemap (Current)
Public routes:
- `/apply` - external application form
- `/login` - login

Protected routes (require auth):
- `/` - Dashboard
- `/employees` - Employees
- `/applications` - Applications
- `/resigned-agents` - Resigned Agents
- `/ranks` - Agent Ranks
- `/admin` - Admin

Route source: `client/src/App.tsx`

## Backend API Surface
Base URL: `/api`

System:
- `GET /api/health`

Auth:
- `/api/auth/*` (login/auth operations)

Users:
- `GET /api/users`
- `GET /api/users/:id`

Candidates:
- `GET /api/candidates`
- `GET /api/candidates/:id`
- `POST /api/candidates`
- `PUT /api/candidates/:id`
- `DELETE /api/candidates/:id`

Jobs:
- `GET /api/jobs`
- `GET /api/jobs/:id`
- `POST /api/jobs`
- `PUT /api/jobs/:id`
- `DELETE /api/jobs/:id`

Interviews:
- `GET /api/interviews`
- `GET /api/interviews/upcoming`
- `GET /api/interviews/:id`
- `POST /api/interviews`
- `PUT /api/interviews/:id`
- `DELETE /api/interviews/:id`

Applications:
- `GET /api/applications`
- `GET /api/applications/:id`
- `GET /api/applications/statistics`
- `POST /api/applications`
- `POST /api/applications/bulk`
- `PUT /api/applications/:id`
- `DELETE /api/applications/:id`

Employees:
- `GET /api/employees`
- `GET /api/employees/:id`
- `POST /api/employees/bulk`
- `PUT /api/employees/:id`
- `DELETE /api/employees/:id`

Resigned Agents:
- `GET /api/resigned-agents`
- `GET /api/resigned-agents/:id`
- `POST /api/resigned-agents/from-employee/:employeeId`
- `POST /api/resigned-agents/to-employee/:resignedAgentId`
- `PUT /api/resigned-agents/:id`
- `DELETE /api/resigned-agents/:id`

Agent Ranks:
- `GET /api/agent-ranks`
- `GET /api/agent-ranks/:id`
- `GET /api/agent-ranks/by-agent/:agentId`
- `GET /api/agent-ranks/current/:agentId`
- `POST /api/agent-ranks`
- `PUT /api/agent-ranks/:id`
- `PUT /api/agent-ranks/:id/rank`
- `DELETE /api/agent-ranks/:id`

Notifications:
- `GET /api/notifications/status`
- `POST /api/notifications/test`
- `POST /api/notifications/birthdays`
- `POST /api/notifications/ranks`
- `POST /api/notifications/summary`

## Core Domain Rules (Important)
- Tenure buckets on dashboard must use `employmentStartDate`.
- `employmentStartDate` should be set/defaulted when moving records into Employees where missing.
- TOP is modeled as an explicit boolean tag (`hasTop` / `has_top`), not as employee status.
- Dashboard TOP-related counts use TOP tag plus rank constraints.
- Dashboard metric cards display percentage of total where applicable.
- Resigned Agents analytics include worked-duration and resignation-reason percentages.

## Key Frontend Modules
- `client/src/pages/Dashboard.tsx` - KPI and tenure/rank metrics
- `client/src/pages/Applications.tsx` - applicant workflow and status transitions
- `client/src/pages/Employees.tsx` - employee list/edit and status/tag management
- `client/src/pages/ResignedAgents.tsx` - resigned lifecycle and analytics
- `client/src/pages/Ranks.tsx` - rank lifecycle
- `client/src/services/api.ts` - frontend API contract

## Key Backend Modules
- `server/src/index.ts` - API wiring and middleware
- `server/src/models/employee.ts` - employee business logic
- `server/src/models/resignedAgent.ts` - employee/resigned transitions
- `server/src/database/supabaseDb.ts` - snake_case/camelCase mapping and persistence
- `server/src/routes/*.ts` - endpoint handlers

## Data and Migration Notes
- Migrations are in `server/migrations/`.
- `has_top` support exists in schema/migrations and DB mapping layer.
- Keep client and server types in sync when adding fields.

## Conventions For Future Changes
- Preserve Mongolian business labels/status terminology used by users.
- Prefer explicit type-safe payload normalization for optional date fields.
- After status-changing actions, refresh both list and selected detail state.
- Update all of these together when changing schema fields:
  - client types
  - server types
  - model logic
  - DB mapping layer
  - SQL migrations/schema docs

## Quick Start
- Install all: `npm run install:all`
- Dev mode: `npm run dev`
- Server only: `npm run server`
- Client only: `npm run client`

## Deployment Notes
- Frontend deployed on Vercel.
- Backend deployed on Render.
- Ensure Git committer email maps to GitHub account for deployment triggers.

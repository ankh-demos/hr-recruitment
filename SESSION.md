# Development Session State
**Last Updated:** March 23, 2026

## Project Overview
Remax Sky HR Web Application - Full-stack HR system for managing candidates, job postings, applicant tracking, interview scheduling, and employee management.

## Tech Stack
- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** Supabase (PostgreSQL)
- **Hosting:** Vercel (frontend), Render (backend)
- **Repository:** https://github.com/ankhbileg01/remaxskymn

---

## Recent Session Changes (March 23, 2026)

### Dashboard and Tenure Logic Alignment

#### Completed
- Updated tenure metrics on Dashboard to calculate from `employmentStartDate` (`Ажилд орсон огноо`) instead of application creation date.
- Ensured employee creation/move flows default `employmentStartDate` correctly when missing.
- Aligned dashboard employee status counting with Employees page status filters.
- Added percentage badges to dashboard metric cards.
- Removed the "Идэвхитэй" tile per latest dashboard requirement.

#### Files Updated
- `client/src/pages/Dashboard.tsx`
- `server/src/models/employee.ts`

---

### Resigned Agents Analytics Expansion

#### Completed
- Added dashboard-style metrics on Resigned Agents page.
- Included worked-duration bucket summaries and resignation-reason summaries.
- Displayed percentages alongside counts for easier comparison.

#### Files Updated
- `client/src/pages/ResignedAgents.tsx`

---

### TOP Tag (hasTop) End-to-End Support

#### Completed
- Added TOP Yes/No tag support in Employee and ResignedAgent types.
- Added TOP field in Employees edit flow and CSV import/export mappings.
- Updated dashboard TOP/No-TOP counting to use `hasTop` with rank-specific rules.
- Added DB mapping and schema/migration support for `has_top`.

#### Files Updated
- `client/src/pages/Employees.tsx`
- `client/src/types/index.ts`
- `server/src/types/index.ts`
- `server/src/models/employee.ts`
- `server/src/models/resignedAgent.ts`
- `server/src/database/supabaseDb.ts`
- `server/migrations/2026_03_23_add_has_top_tag.sql`
- `server/migrations/2026_03_11_full_sync.sql`
- `server/migrations/2026_03_17_make_employee_fields_optional.sql`
- `server/supabase-schema.sql`

---

### Applications Fire UP Save Fix + Status Tooltips

#### Completed
- Fixed Fire UP status save reliability by normalizing optional dates and improving refresh/error flow.
- Added status meaning tooltips in Applications and Employees:
  - Table status badges
  - Status action buttons in detail panels

#### Files Updated
- `client/src/pages/Applications.tsx`
- `client/src/pages/Employees.tsx`

---

### Git Sync and Merge Resolution

#### Completed
- Synced local with remote `main`, resolved merge conflicts, and pushed final changes successfully.

#### Conflict Resolution Files
- `client/src/pages/Dashboard.tsx`
- `server/src/models/employee.ts`

---

## Recent Session Changes (March 17, 2026)

### Fixed: Applications status filter duplication + status change UX

#### Problems
- Applications filter row showed duplicated status dropdown behavior in UI.
- In detail view, status changes felt delayed and users could not clearly recognize current selected status.

#### Solution
- Cleaned Applications filter row so only one status dropdown is rendered/used.
- Updated status-change flow to refresh from API after update and synchronize both list + selected detail item.
- Strengthened active status visual state in detail actions (selected status button now has clearly distinct active style).

#### Files Updated
- `client/src/pages/Applications.tsx`

---

### Fixed: Employees build failure on Vercel (TypeScript TS2345)

#### Problem
Build failed at `src/pages/Employees.tsx` because payload passed to `employeesApi.update` included date fields with `null`, while `Partial<Employee>` expects optional string (`string | undefined`).

#### Solution
- Changed `normalizeDateForApi` return type and behavior from `string | null` to `string | undefined`.
- Empty/invalid dates now return `undefined` (type-compatible with `Partial<Employee>`).

#### Files Updated
- `client/src/pages/Employees.tsx`

#### Verification
- `npm run build` completed successfully.

---

### DevOps: Vercel deployment unblock (GitHub committer mapping)

#### Problem
Vercel blocked deployment because commit author/committer email could not be associated with a GitHub user.

#### Actions Taken
- Updated repo git email to GitHub noreply address.
- Created and pushed an empty commit to trigger a fresh deployment event.

#### Result
- New commit pushed to `main` with GitHub-associated committer email.

---

## Recent Session Changes (March 10, 2026) - Part 2

### Fixed: Dropdown and Field Updates Not Reflecting in Statistics

#### Problem
Changes made in Employees page (like changing office, status) were not reflected in Dashboard numbers when navigating back. Each page loaded data once on mount and didn't refresh on subsequent visits.

#### Solution
Implemented automatic data refresh for all main pages:
- **Dashboard.tsx**: Added `useLocation` hook and visibility/focus event listeners
- **Employees.tsx**: Added `useLocation` hook and visibility/focus event listeners  
- **Applications.tsx**: Added `useLocation` hook and visibility/focus event listeners

#### Changes Made
1. Data reloads when navigating to a page (`location.pathname` dependency)
2. Data reloads when window/tab regains focus (`focus` event)
3. Data reloads when page becomes visible (`visibilitychange` event)
4. Converted `loadData` functions to `useCallback` for consistent references

#### Key Code Pattern
```tsx
// Load data function - reusable
const loadData = useCallback(async () => {
  // ... fetch data
}, []);

// Reload on navigation
useEffect(() => {
  loadData();
}, [location.pathname, loadData]);

// Reload on visibility/focus
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') loadData();
  };
  const handleFocus = () => loadData();
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleFocus);
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleFocus);
  };
}, [loadData]);
```

---

## Recent Session Changes (March 10, 2026) - Part 1

### Completed Features

#### 1. Fire UP Modal - Training Date Fields
- Added `trainingStartDate` and `trainingEndDate` fields to the Fire UP popup
- Updated Application type in both client and server to include these fields
- Edit form now includes training date fields for existing applications

#### 2. Statistics Period Selection (Monthly/Quarterly/Yearly)
- Added period selector (Сар/Улирал/Жил) to the statistics section on Applications page
- Frontend: Period toggle buttons with corresponding date selectors
- Backend: Updated statistics API to support `period` query parameter
- Quarterly format: YYYY-Q1, YYYY-Q2, etc.
- Yearly format: YYYY

#### 3. Ranks Page - Group by Rank with Counts
- Added "Цолоор бүлэглэсэн" section displaying count of each rank level
- Shows counts for: Стандарт, Силвер, Голд, Платиниум, Даймонд
- Uses color-coded badges matching the rank colors

### Database Schema Updates
```sql
-- No new columns required, but ensure these exist:
ALTER TABLE applications ADD COLUMN IF NOT EXISTS training_start_date DATE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS training_end_date DATE;
```

---

## Recent Session Changes (February 13, 2026)

### Architecture & Methods Used
- **Frontend**: React functional components with hooks (`useState`, `useEffect`, `useMemo`) for state and filtering.
- **Backend API**: Express listeners handling CRUD operations.
- **Email Service**: Hybrid approach merging environment variables (`SMTP_Config`) with Database records (`users` table) for dynamic admin recipients.
- **Printing**: Hidden `iframe` technique to avoid popups/new tabs.
- **Synchronization**: `fetch` reload pattern in `Applications.tsx` to ensure client state matches server state after mutations (handling joined fields).

### Completed Fixes & Features (Round 1 & 2)

#### 1. Apply Form Submission
- **Validation**: Added client-side checks for `gender`, `birthDate`, `email`.
- **Error Handling**: Server now returns specific error messages which are displayed to the user.
- **Data**: Added `referredAgentName` to payload (requires DB schema update).

#### 2. Print Functionality
- **UX Improvement**: Replaced `window.open` with a hidden `iframe` for seamless printing of applications.

#### 3. New Filters
- **Employees Page**: 
  - `iConnect` filter (Yes/No/All)
  - `SZH Training` filter (Yes/No/All) - checks `hasSzhTraining` boolean.
- **Applications Page**: 
  - **Office Filter**: Fixed logic to filter by `interestedOffice`.
  - **Status Filter**: Moved to a dropdown UI to prevent layout disruption.

#### 4. CSV Export
- **Ranks Page**: Grouped exports by expiration category (Expired, Expiring This Month, Expiring Next Month, Valid) with separator rows.

#### 5. Email Notifications
- **Dynamic Admins**: `emailService.getAdminEmails()` now fetches all users with `role='admin'` and `isActive=true` from DB, merging them with `ADMIN_EMAILS` env var.
- **Configuration**: Updated `/api/notifications/status` to return the merged list of recipients.
- **UI**: Admin page instructions updated to reflect this automation.

#### 6. Employee Detail View
- **Visibility**: Added missing fields to the Employee Detail modal/view:
  - SZH Training status, date, formatting.
  - Assistant status (`isAssistant`, `assistantOf`).

### Manual Actions Required
**Database Schema Updates (Supabase):**
```sql
-- For Fix 1
ALTER TABLE applications ADD COLUMN IF NOT EXISTS referred_agent_name text;

-- For Fix 3 & 6
ALTER TABLE employees ADD COLUMN IF NOT EXISTS has_szh_training boolean DEFAULT false;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS szh_training_date text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS szh_official_letter_number text;
```

---

## Recent Session Changes (February 11, 2026)

### Planned Features

#### 1. Monthly Statistics Graphic on Applications Page
- Add comprehensive statistics table displaying monthly HR metrics per office
- **Offices**: Sky (Гэгээнтэн), Downtown (Даун таун), River (Ривер)
- **Metrics to Display**:
  - Тухайн сард нийт уулзалсан агентын тоо (Total meetings this month)
  - Тухайн сард Iconnect нээгдсэн агентын тоо (IConnect openings this month)
  - Fire Up-д бүртгүүлсэн агентын тоо (Fire UP registrations)
  - In process (Interviewing + Fire UP)
  - Cancelled (Cancelled applications)
  - Шилжиж орж ирсэн агент (New hires/transfers this month)
  - Тухайн сарын өсөлт (Monthly growth)
  - Чөлөө авсан агент (Agents on leave)
  - ХАГ цуцалсан агент (Resigned agents)
  - Цэвэр өсөлт (Net growth = growth - leave - resigned)
  - НИЙТ ICONNECT (Total active IConnect agents)
- **Data Sources**:
  - Applications table: status counts, creation dates
  - Employees table: hire dates, status counts, office assignments
  - Resigned agents table: resignation counts by month
- **Display Format**: Responsive table with metrics as rows, offices as columns
- **Implementation**: Backend API endpoint `/api/statistics` + frontend table component

---

### Completed Features

#### 1. Office Names Fixed
- Changed from `Sky, Premier, Alliance, Express` to `Гэгээнтэн, Ривер, Даун таун`
- Updated across all pages: Dashboard, Employees, Applications, Ranks, ResignedAgents

#### 2. Office Filter Logic
- **Applications page:** Filters by `interestedOffice` field
- **All other pages:** Filters by `officeName` field

#### 3. Table Column Order
- Changed to show Нэр (firstName) first, then Овог (lastName)
- firstName displayed in bold

#### 4. Tab Renamed
- "Анкетууд" → "Сонгон шалгаруулалт"

#### 5. Application Status Labels Updated
| Status Value | Label |
|--------------|-------|
| `new` | Шинэ анкет |
| `interviewing` | Ярилцлага хийж байгаа |
| `fireup` | Fire UP товлосон |
| `iconnect` | iConnect нээлгэсэн |
| `cancelled` | Ажиллахаа больсон |

#### 6. fireupDate Field Added
- New field on Application type to track when Fire UP was scheduled
- Backend automatically sets date when status changes to 'fireup'
- Added to: `client/src/types/index.ts`, `server/src/types/index.ts`, `server/supabase-schema.sql`

#### 7. Dashboard Enhancements
- **Birthday Section:** Shows employees with birthdays this month
- **Monthly Statistics:** Fire UP товлосон & iConnect нээлгэсэн counts for current month
- **Rank Expiration:** Already had sections for expired, expiring this month, expiring next month (sorted by date)

#### 8. Default Employee Status
- New employees created from applications default to `new_0_3` (Шинэ 0-3 сар)

---

## Data Model Summary

### Application Statuses (Sequential Flow)
```
Шинэ анкет → Ярилцлага хийж байгаа → Fire UP товлосон → iConnect нээлгэсэн
                                                    ↓
                                           (moves to Employees table)
                                    
                        or → Ажиллахаа больсон (cancelled)
```

### Employee Statuses (8 actual statuses)
- `active_transaction` - Идэвхитэй гүйлгээтэй /тухайн сард гүйлгээтэй/
- `active_no_transaction` - Идэвхитэй, гүйлгээгүй
- `inactive_transaction` - Идэвхигүй, гүйлгээтэй
- `inactive` - Идэвхигүй
- `on_leave_iconnect` - Чөлөөтэй iconnect-тэй
- `on_leave_closed` - Чөлөөтэй Iconnect хаасан
- `hidden_iconnect` - Iconnect нуусан агент
- `left_team` - Багаас гарсан

### Employee Computed Tags (not statuses - derived from fields/data)
- **Нийт iconnect** - count of employees with `hasIConnect === true`
- **Анхны гүйлгээ хийсэн агент** - count of employees with `hasFirstTransaction === true`
- **KPI тооцохгүй** - count of employees with `excludeFromKpi === true`
- **Iconnect нээгдэхээр хүлээгдэж байгаа** - count of applications with status `fireup`

### Office Names
- Гэгээнтэн
- Ривер
- Даун таун

---

## Key Files Modified This Session

### Frontend (client/src/)
- `types/index.ts` - Added `fireupDate` to Application interface
- `pages/Dashboard.tsx` - Birthday section, monthly stats, updated labels
- `pages/Applications.tsx` - Updated status labels
- `pages/Employees.tsx` - Office filter uses officeName only
- `pages/ResignedAgents.tsx` - Office filter uses officeName only
- `pages/Ranks.tsx` - Office filter uses officeName only, sorted by expiration
- `components/Layout.tsx` - Renamed tab to "Сонгон шалгаруулалт"

### Backend (server/src/)
- `types/index.ts` - Added `fireupDate` to Application interface
- `routes/applications.ts` - Auto-sets fireupDate when status changes to 'fireup'
- `supabase-schema.sql` - Added `fireup_date` column

---

## Git Commits This Session
1. `03306d8` - fix: office names, table column order, ranks sorting by expiration
2. `2dd378a` - fix: dashboard rank sorting, office filter logic, rename tab
3. `ffe7334` - feat: birthday section, monthly stats, fireupDate tracking, updated status labels

---

## How to Continue

### Start Development
```bash
cd c:\hr1
npm run dev
```

### Check for Errors
```bash
cd client
npm run build
```

### Database Changes
If `fireup_date` column doesn't exist in Supabase:
```sql
ALTER TABLE applications ADD COLUMN fireup_date DATE;
```

### Next Priority: Monthly Statistics
1. Create backend statistics API endpoint
2. Add statistics table component to Applications page
3. Test data accuracy and display formatting

---

## Pending/Future Considerations
- Existing applications with 'fireup' status won't have `fireupDate` set (only new ones will)
- Consider migrating existing fireup applications to set a date if needed
- Implement monthly statistics graphic on Applications page (backend API + frontend table)
- Add date range selector for statistics (current month vs custom periods)
- Consider adding charts/visualizations for statistics data

# HR Recruiting Web Application

A full-stack HR recruiting web application for managing candidates, job postings, applicant tracking, and interview scheduling.

## Features

- **Dashboard**: Overview of candidates, jobs, and upcoming interviews
- **Jobs Management**: Create, edit, and manage job postings with status tracking
- **Candidates Management**: Track applicants through the hiring pipeline
- **Interview Scheduling**: Schedule and manage interviews with feedback tracking

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: JSON file-based storage (development)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install all dependencies:
```bash
npm run install:all
```

Or install each package separately:
```bash
npm install
cd server && npm install
cd ../client && npm install
```

### Running the Application

Start both frontend and backend in development mode:
```bash
npm run dev
```

Or run them separately:

**Backend only (port 3001):**
```bash
npm run server
```

**Frontend only (port 3000):**
```bash
npm run client
```

### Accessing the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api

## API Endpoints

### Jobs
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get job by ID
- `POST /api/jobs` - Create a new job
- `PUT /api/jobs/:id` - Update a job
- `DELETE /api/jobs/:id` - Delete a job

### Candidates
- `GET /api/candidates` - Get all candidates
- `GET /api/candidates/:id` - Get candidate by ID
- `GET /api/candidates/job/:jobId` - Get candidates by job
- `POST /api/candidates` - Create a new candidate
- `PUT /api/candidates/:id` - Update a candidate
- `DELETE /api/candidates/:id` - Delete a candidate

### Interviews
- `GET /api/interviews` - Get all interviews
- `GET /api/interviews/upcoming` - Get upcoming interviews
- `GET /api/interviews/:id` - Get interview by ID
- `GET /api/interviews/candidate/:candidateId` - Get interviews by candidate
- `GET /api/interviews/job/:jobId` - Get interviews by job
- `POST /api/interviews` - Schedule a new interview
- `PUT /api/interviews/:id` - Update an interview
- `DELETE /api/interviews/:id` - Delete an interview

## Project Structure

```
remaxskymn/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client services
│   │   └── types/          # TypeScript type definitions
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── database/       # Database configuration
│   │   ├── models/         # Data models
│   │   ├── routes/         # API route handlers
│   │   └── types/          # TypeScript type definitions
│   └── package.json
└── package.json            # Root package.json
```

## License

MIT

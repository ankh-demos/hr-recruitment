# Remax Sky HR Web Application

## Project Overview
A full-stack HR web application for managing candidates, job postings, applicant tracking, interview scheduling, and resume management.

## Tech Stack
- **Frontend**: React with TypeScript, Tailwind CSS
- **Backend**: Node.js with Express, TypeScript
- **Database**: SQLite (for development)
- **API**: RESTful API

## Project Structure
```
remaxskymn/
├── client/           # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   └── package.json
├── server/           # Express backend
│   ├── src/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── controllers/
│   │   └── middleware/
│   └── package.json
└── package.json      # Root package.json
```

## Development Guidelines
- Use TypeScript for type safety
- Follow RESTful API conventions
- Use async/await for asynchronous operations
- Implement proper error handling
- Keep components modular and reusable

## Available Scripts
- `npm install` - Install all dependencies
- `npm run dev` - Start both frontend and backend in development mode
- `npm run server` - Start backend only
- `npm run client` - Start frontend only

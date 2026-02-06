import fs from 'fs';
import path from 'path';
import { Candidate, Job, Interview, Application, User, Employee, ResignedAgent, AgentRank } from '../types';

interface Database {
  candidates: Candidate[];
  jobs: Job[];
  interviews: Interview[];
  applications: Application[];
  users: User[];
  employees: Employee[];
  resignedAgents: ResignedAgent[];
  agentRanks: AgentRank[];
}

const dataDir = path.join(__dirname, '../../data');
const dbPath = path.join(dataDir, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
function loadDatabase(): Database {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading database:', error);
  }
  return { 
    candidates: [], 
    jobs: [], 
    interviews: [], 
    applications: [],
    users: [
      {
        id: '1',
        username: 'admin',
        password: 'admin123', // In production, use hashed passwords
        fullName: 'System Admin',
        email: 'admin@hr.com',
        role: 'admin',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    employees: [],
    resignedAgents: [],
    agentRanks: []
  };
}

function saveDatabase(db: Database): void {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

// Database instance
let db = loadDatabase();

export const database = {
  // Candidates
  getCandidates: (): Candidate[] => db.candidates,
  
  getCandidateById: (id: string): Candidate | undefined => 
    db.candidates.find(c => c.id === id),
  
  getCandidatesByJobId: (jobId: string): Candidate[] => 
    db.candidates.filter(c => c.appliedJobId === jobId),
  
  createCandidate: (candidate: Candidate): Candidate => {
    db.candidates.push(candidate);
    saveDatabase(db);
    return candidate;
  },
  
  updateCandidate: (id: string, updates: Partial<Candidate>): Candidate | undefined => {
    const index = db.candidates.findIndex(c => c.id === id);
    if (index === -1) return undefined;
    db.candidates[index] = { ...db.candidates[index], ...updates };
    saveDatabase(db);
    return db.candidates[index];
  },
  
  deleteCandidate: (id: string): boolean => {
    const index = db.candidates.findIndex(c => c.id === id);
    if (index === -1) return false;
    db.candidates.splice(index, 1);
    saveDatabase(db);
    return true;
  },

  // Jobs
  getJobs: (): Job[] => db.jobs,
  
  getJobById: (id: string): Job | undefined => 
    db.jobs.find(j => j.id === id),
  
  createJob: (job: Job): Job => {
    db.jobs.push(job);
    saveDatabase(db);
    return job;
  },
  
  updateJob: (id: string, updates: Partial<Job>): Job | undefined => {
    const index = db.jobs.findIndex(j => j.id === id);
    if (index === -1) return undefined;
    db.jobs[index] = { ...db.jobs[index], ...updates };
    saveDatabase(db);
    return db.jobs[index];
  },
  
  deleteJob: (id: string): boolean => {
    const index = db.jobs.findIndex(j => j.id === id);
    if (index === -1) return false;
    db.jobs.splice(index, 1);
    saveDatabase(db);
    return true;
  },

  // Interviews
  getInterviews: (): Interview[] => db.interviews,
  
  getInterviewById: (id: string): Interview | undefined => 
    db.interviews.find(i => i.id === id),
  
  getInterviewsByCandidateId: (candidateId: string): Interview[] => 
    db.interviews.filter(i => i.candidateId === candidateId),
  
  getInterviewsByJobId: (jobId: string): Interview[] => 
    db.interviews.filter(i => i.jobId === jobId),
  
  getUpcomingInterviews: (): Interview[] => {
    const now = new Date().toISOString();
    return db.interviews.filter(i => i.scheduledAt > now && i.status === 'scheduled');
  },
  
  createInterview: (interview: Interview): Interview => {
    db.interviews.push(interview);
    saveDatabase(db);
    return interview;
  },
  
  updateInterview: (id: string, updates: Partial<Interview>): Interview | undefined => {
    const index = db.interviews.findIndex(i => i.id === id);
    if (index === -1) return undefined;
    db.interviews[index] = { ...db.interviews[index], ...updates };
    saveDatabase(db);
    return db.interviews[index];
  },
  
  deleteInterview: (id: string): boolean => {
    const index = db.interviews.findIndex(i => i.id === id);
    if (index === -1) return false;
    db.interviews.splice(index, 1);
    saveDatabase(db);
    return true;
  },

  // Check for duplicate email
  candidateEmailExists: (email: string, excludeId?: string): boolean => {
    return db.candidates.some(c => c.email === email && c.id !== excludeId);
  },

  // Applications
  getApplications: (): Application[] => db.applications,
  
  getApplicationById: (id: string): Application | undefined => 
    db.applications.find(a => a.id === id),
  
  createApplication: (application: Application): Application => {
    db.applications.push(application);
    saveDatabase(db);
    return application;
  },
  
  updateApplication: (id: string, updates: Partial<Application>): Application | undefined => {
    const index = db.applications.findIndex(a => a.id === id);
    if (index === -1) return undefined;
    db.applications[index] = { ...db.applications[index], ...updates };
    saveDatabase(db);
    return db.applications[index];
  },
  
  deleteApplication: (id: string): boolean => {
    const index = db.applications.findIndex(a => a.id === id);
    if (index === -1) return false;
    db.applications.splice(index, 1);
    saveDatabase(db);
    return true;
  },

  // Users
  getUsers: (): User[] => db.users || [],
  
  getUserById: (id: string): User | undefined => 
    (db.users || []).find(u => u.id === id),
  
  getUserByUsername: (username: string): User | undefined => 
    (db.users || []).find(u => u.username === username),
  
  createUser: (user: User): User => {
    if (!db.users) db.users = [];
    db.users.push(user);
    saveDatabase(db);
    return user;
  },
  
  updateUser: (id: string, updates: Partial<User>): User | undefined => {
    if (!db.users) return undefined;
    const index = db.users.findIndex(u => u.id === id);
    if (index === -1) return undefined;
    db.users[index] = { ...db.users[index], ...updates };
    saveDatabase(db);
    return db.users[index];
  },
  
  deleteUser: (id: string): boolean => {
    if (!db.users) return false;
    const index = db.users.findIndex(u => u.id === id);
    if (index === -1) return false;
    db.users.splice(index, 1);
    saveDatabase(db);
    return true;
  },

  // Employees
  getEmployees: (): Employee[] => db.employees || [],
  
  getEmployeeById: (id: string): Employee | undefined => 
    (db.employees || []).find(e => e.id === id),
  
  getEmployeeByApplicationId: (applicationId: string): Employee | undefined => 
    (db.employees || []).find(e => e.applicationId === applicationId),
  
  createEmployee: (employee: Employee): Employee => {
    if (!db.employees) db.employees = [];
    db.employees.push(employee);
    saveDatabase(db);
    return employee;
  },
  
  updateEmployee: (id: string, updates: Partial<Employee>): Employee | undefined => {
    if (!db.employees) return undefined;
    const index = db.employees.findIndex(e => e.id === id);
    if (index === -1) return undefined;
    db.employees[index] = { ...db.employees[index], ...updates };
    saveDatabase(db);
    return db.employees[index];
  },
  
  deleteEmployee: (id: string): boolean => {
    if (!db.employees) return false;
    const index = db.employees.findIndex(e => e.id === id);
    if (index === -1) return false;
    db.employees.splice(index, 1);
    saveDatabase(db);
    return true;
  },

  // Resigned Agents
  getResignedAgents: (): ResignedAgent[] => db.resignedAgents || [],
  
  getResignedAgentById: (id: string): ResignedAgent | undefined => 
    (db.resignedAgents || []).find(r => r.id === id),
  
  createResignedAgent: (resignedAgent: ResignedAgent): ResignedAgent => {
    if (!db.resignedAgents) db.resignedAgents = [];
    db.resignedAgents.push(resignedAgent);
    saveDatabase(db);
    return resignedAgent;
  },
  
  updateResignedAgent: (id: string, updates: Partial<ResignedAgent>): ResignedAgent | undefined => {
    if (!db.resignedAgents) return undefined;
    const index = db.resignedAgents.findIndex(r => r.id === id);
    if (index === -1) return undefined;
    db.resignedAgents[index] = { ...db.resignedAgents[index], ...updates };
    saveDatabase(db);
    return db.resignedAgents[index];
  },
  
  deleteResignedAgent: (id: string): boolean => {
    if (!db.resignedAgents) return false;
    const index = db.resignedAgents.findIndex(r => r.id === id);
    if (index === -1) return false;
    db.resignedAgents.splice(index, 1);
    saveDatabase(db);
    return true;
  },

  // Agent Ranks
  getAgentRanks: (): AgentRank[] => db.agentRanks || [],
  
  getAgentRankById: (id: string): AgentRank | undefined => 
    (db.agentRanks || []).find(r => r.id === id),
  
  getAgentRankByAgentId: (agentId: string): AgentRank | undefined => 
    (db.agentRanks || []).find(r => r.agentId === agentId),
  
  createAgentRank: (agentRank: AgentRank): AgentRank => {
    if (!db.agentRanks) db.agentRanks = [];
    db.agentRanks.push(agentRank);
    saveDatabase(db);
    return agentRank;
  },
  
  updateAgentRank: (id: string, updates: Partial<AgentRank>): AgentRank | undefined => {
    if (!db.agentRanks) return undefined;
    const index = db.agentRanks.findIndex(r => r.id === id);
    if (index === -1) return undefined;
    db.agentRanks[index] = { ...db.agentRanks[index], ...updates };
    saveDatabase(db);
    return db.agentRanks[index];
  },
  
  deleteAgentRank: (id: string): boolean => {
    if (!db.agentRanks) return false;
    const index = db.agentRanks.findIndex(r => r.id === id);
    if (index === -1) return false;
    db.agentRanks.splice(index, 1);
    saveDatabase(db);
    return true;
  }
};

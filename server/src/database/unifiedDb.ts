/**
 * Unified Database Layer
 * Routes to JSON or Supabase based on DATABASE_MODE config
 */
import { config } from '../config';
import { database as jsonDatabase } from './index';
import { supabaseDatabase } from './supabaseDb';
import { Candidate, Job, Interview, Application, User, Employee, ResignedAgent, AgentRank } from '../types';

const useSupabase = config.useSupabase;

// Log which database mode is active
console.log(`[Database] Using ${useSupabase ? 'Supabase' : 'JSON'} storage`);

/**
 * Unified database interface - all methods are async for consistency
 */
export const db = {
  // ============ CANDIDATES ============
  getCandidates: async (): Promise<Candidate[]> => {
    if (useSupabase) return supabaseDatabase.getCandidates();
    return jsonDatabase.getCandidates();
  },

  getCandidateById: async (id: string): Promise<Candidate | undefined> => {
    if (useSupabase) return supabaseDatabase.getCandidateById(id);
    return jsonDatabase.getCandidateById(id);
  },

  createCandidate: async (candidate: Candidate): Promise<Candidate> => {
    if (useSupabase) return supabaseDatabase.createCandidate(candidate);
    return jsonDatabase.createCandidate(candidate);
  },

  updateCandidate: async (id: string, updates: Partial<Candidate>): Promise<Candidate | undefined> => {
    if (useSupabase) return supabaseDatabase.updateCandidate(id, updates);
    return jsonDatabase.updateCandidate(id, updates);
  },

  deleteCandidate: async (id: string): Promise<boolean> => {
    if (useSupabase) return supabaseDatabase.deleteCandidate(id);
    return jsonDatabase.deleteCandidate(id);
  },

  // ============ JOBS ============
  getJobs: async (): Promise<Job[]> => {
    if (useSupabase) return supabaseDatabase.getJobs();
    return jsonDatabase.getJobs();
  },

  getJobById: async (id: string): Promise<Job | undefined> => {
    if (useSupabase) return supabaseDatabase.getJobById(id);
    return jsonDatabase.getJobById(id);
  },

  createJob: async (job: Job): Promise<Job> => {
    if (useSupabase) return supabaseDatabase.createJob(job);
    return jsonDatabase.createJob(job);
  },

  updateJob: async (id: string, updates: Partial<Job>): Promise<Job | undefined> => {
    if (useSupabase) return supabaseDatabase.updateJob(id, updates);
    return jsonDatabase.updateJob(id, updates);
  },

  deleteJob: async (id: string): Promise<boolean> => {
    if (useSupabase) return supabaseDatabase.deleteJob(id);
    return jsonDatabase.deleteJob(id);
  },

  // ============ INTERVIEWS ============
  getInterviews: async (): Promise<Interview[]> => {
    if (useSupabase) return supabaseDatabase.getInterviews();
    return jsonDatabase.getInterviews();
  },

  getInterviewById: async (id: string): Promise<Interview | undefined> => {
    if (useSupabase) return supabaseDatabase.getInterviewById(id);
    return jsonDatabase.getInterviewById(id);
  },

  createInterview: async (interview: Interview): Promise<Interview> => {
    if (useSupabase) return supabaseDatabase.createInterview(interview);
    return jsonDatabase.createInterview(interview);
  },

  updateInterview: async (id: string, updates: Partial<Interview>): Promise<Interview | undefined> => {
    if (useSupabase) return supabaseDatabase.updateInterview(id, updates);
    return jsonDatabase.updateInterview(id, updates);
  },

  deleteInterview: async (id: string): Promise<boolean> => {
    if (useSupabase) return supabaseDatabase.deleteInterview(id);
    return jsonDatabase.deleteInterview(id);
  },

  // ============ APPLICATIONS ============
  getApplications: async (): Promise<Application[]> => {
    if (useSupabase) return supabaseDatabase.getApplications();
    return jsonDatabase.getApplications();
  },

  getApplicationById: async (id: string): Promise<Application | undefined> => {
    if (useSupabase) return supabaseDatabase.getApplicationById(id);
    return jsonDatabase.getApplicationById(id);
  },

  createApplication: async (application: Application): Promise<Application> => {
    if (useSupabase) return supabaseDatabase.createApplication(application);
    return jsonDatabase.createApplication(application);
  },

  updateApplication: async (id: string, updates: Partial<Application>): Promise<Application | undefined> => {
    if (useSupabase) return supabaseDatabase.updateApplication(id, updates);
    return jsonDatabase.updateApplication(id, updates);
  },

  deleteApplication: async (id: string): Promise<boolean> => {
    if (useSupabase) return supabaseDatabase.deleteApplication(id);
    return jsonDatabase.deleteApplication(id);
  },

  bulkCreateApplications: async (applications: Application[]): Promise<Application[]> => {
    if (useSupabase) return supabaseDatabase.bulkCreateApplications(applications);
    return jsonDatabase.bulkCreateApplications(applications);
  },

  // ============ USERS ============
  getUsers: async (): Promise<User[]> => {
    if (useSupabase) return supabaseDatabase.getUsers();
    return jsonDatabase.getUsers();
  },

  getUserById: async (id: string): Promise<User | undefined> => {
    if (useSupabase) return supabaseDatabase.getUserById(id);
    return jsonDatabase.getUserById(id);
  },

  getUserByUsername: async (username: string): Promise<User | undefined> => {
    if (useSupabase) return supabaseDatabase.getUserByUsername(username);
    return jsonDatabase.getUserByUsername(username);
  },

  createUser: async (user: User): Promise<User> => {
    if (useSupabase) return supabaseDatabase.createUser(user);
    return jsonDatabase.createUser(user);
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<User | undefined> => {
    if (useSupabase) return supabaseDatabase.updateUser(id, updates);
    return jsonDatabase.updateUser(id, updates);
  },

  deleteUser: async (id: string): Promise<boolean> => {
    if (useSupabase) return supabaseDatabase.deleteUser(id);
    return jsonDatabase.deleteUser(id);
  },

  // ============ EMPLOYEES ============
  getEmployees: async (): Promise<Employee[]> => {
    if (useSupabase) return supabaseDatabase.getEmployees();
    return jsonDatabase.getEmployees();
  },

  getEmployeeById: async (id: string): Promise<Employee | undefined> => {
    if (useSupabase) return supabaseDatabase.getEmployeeById(id);
    return jsonDatabase.getEmployeeById(id);
  },

  getEmployeeByApplicationId: async (applicationId: string): Promise<Employee | undefined> => {
    if (useSupabase) return supabaseDatabase.getEmployeeByApplicationId(applicationId);
    return jsonDatabase.getEmployeeByApplicationId(applicationId);
  },

  createEmployee: async (employee: Employee): Promise<Employee> => {
    if (useSupabase) return supabaseDatabase.createEmployee(employee);
    return jsonDatabase.createEmployee(employee);
  },

  updateEmployee: async (id: string, updates: Partial<Employee>): Promise<Employee | undefined> => {
    if (useSupabase) return supabaseDatabase.updateEmployee(id, updates);
    return jsonDatabase.updateEmployee(id, updates);
  },

  deleteEmployee: async (id: string): Promise<boolean> => {
    if (useSupabase) return supabaseDatabase.deleteEmployee(id);
    return jsonDatabase.deleteEmployee(id);
  },

  // ============ RESIGNED AGENTS ============
  getResignedAgents: async (): Promise<ResignedAgent[]> => {
    if (useSupabase) return supabaseDatabase.getResignedAgents();
    return jsonDatabase.getResignedAgents();
  },

  getResignedAgentById: async (id: string): Promise<ResignedAgent | undefined> => {
    if (useSupabase) return supabaseDatabase.getResignedAgentById(id);
    return jsonDatabase.getResignedAgentById(id);
  },

  createResignedAgent: async (resignedAgent: ResignedAgent): Promise<ResignedAgent> => {
    if (useSupabase) return supabaseDatabase.createResignedAgent(resignedAgent);
    return jsonDatabase.createResignedAgent(resignedAgent);
  },

  updateResignedAgent: async (id: string, updates: Partial<ResignedAgent>): Promise<ResignedAgent | undefined> => {
    if (useSupabase) return supabaseDatabase.updateResignedAgent(id, updates);
    return jsonDatabase.updateResignedAgent(id, updates);
  },

  deleteResignedAgent: async (id: string): Promise<boolean> => {
    if (useSupabase) return supabaseDatabase.deleteResignedAgent(id);
    return jsonDatabase.deleteResignedAgent(id);
  },

  // ============ STATISTICS ============
  getStatistics: async (month?: string, period?: 'monthly' | 'quarterly' | 'yearly'): Promise<any> => {
    if (useSupabase) return supabaseDatabase.getStatistics(month, period);
    return {}; // JSON not implemented
  },

  // ============ AGENT RANKS ============
  getAgentRanks: async (): Promise<AgentRank[]> => {
    if (useSupabase) return supabaseDatabase.getAgentRanks();
    return jsonDatabase.getAgentRanks();
  },

  getAgentRankById: async (id: string): Promise<AgentRank | undefined> => {
    if (useSupabase) return supabaseDatabase.getAgentRankById(id);
    return jsonDatabase.getAgentRankById(id);
  },

  getAgentRankByAgentId: async (agentId: string): Promise<AgentRank | undefined> => {
    if (useSupabase) return supabaseDatabase.getAgentRankByAgentId(agentId);
    return jsonDatabase.getAgentRankByAgentId(agentId);
  },

  createAgentRank: async (agentRank: AgentRank): Promise<AgentRank> => {
    if (useSupabase) return supabaseDatabase.createAgentRank(agentRank);
    return jsonDatabase.createAgentRank(agentRank);
  },

  updateAgentRank: async (id: string, updates: Partial<AgentRank>): Promise<AgentRank | undefined> => {
    if (useSupabase) return supabaseDatabase.updateAgentRank(id, updates);
    return jsonDatabase.updateAgentRank(id, updates);
  },

  deleteAgentRank: async (id: string): Promise<boolean> => {
    if (useSupabase) return supabaseDatabase.deleteAgentRank(id);
    return jsonDatabase.deleteAgentRank(id);
  }
};

import { supabase, isSupabaseConfigured } from './supabase';
import { Candidate, Job, Interview, Application, User, Employee, ResignedAgent, AgentRank } from '../types';

// Helper to convert snake_case to camelCase
function toCamelCase(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  
  const converted: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    converted[camelKey] = toCamelCase(obj[key]);
  }
  return converted;
}

// Helper to convert camelCase to snake_case
function toSnakeCase(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  
  const converted: any = {};
  for (const key in obj) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    converted[snakeKey] = toSnakeCase(obj[key]);
  }
  return converted;
}

export const supabaseDatabase = {
  // ============ CANDIDATES ============
  getCandidates: async (): Promise<Candidate[]> => {
    const { data, error } = await supabase.from('candidates').select('*');
    if (error) throw error;
    return (data || []).map(toCamelCase);
  },

  getCandidateById: async (id: string): Promise<Candidate | undefined> => {
    const { data, error } = await supabase.from('candidates').select('*').eq('id', id).single();
    if (error) return undefined;
    return toCamelCase(data);
  },

  createCandidate: async (candidate: Candidate): Promise<Candidate> => {
    const { data, error } = await supabase.from('candidates').insert(toSnakeCase(candidate)).select().single();
    if (error) throw error;
    return toCamelCase(data);
  },

  updateCandidate: async (id: string, updates: Partial<Candidate>): Promise<Candidate | undefined> => {
    const { data, error } = await supabase.from('candidates').update(toSnakeCase(updates)).eq('id', id).select().single();
    if (error) return undefined;
    return toCamelCase(data);
  },

  deleteCandidate: async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('candidates').delete().eq('id', id);
    return !error;
  },

  // ============ JOBS ============
  getJobs: async (): Promise<Job[]> => {
    const { data, error } = await supabase.from('jobs').select('*');
    if (error) throw error;
    return (data || []).map(toCamelCase);
  },

  getJobById: async (id: string): Promise<Job | undefined> => {
    const { data, error } = await supabase.from('jobs').select('*').eq('id', id).single();
    if (error) return undefined;
    return toCamelCase(data);
  },

  createJob: async (job: Job): Promise<Job> => {
    const { data, error } = await supabase.from('jobs').insert(toSnakeCase(job)).select().single();
    if (error) throw error;
    return toCamelCase(data);
  },

  updateJob: async (id: string, updates: Partial<Job>): Promise<Job | undefined> => {
    const { data, error } = await supabase.from('jobs').update(toSnakeCase(updates)).eq('id', id).select().single();
    if (error) return undefined;
    return toCamelCase(data);
  },

  deleteJob: async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('jobs').delete().eq('id', id);
    return !error;
  },

  // ============ INTERVIEWS ============
  getInterviews: async (): Promise<Interview[]> => {
    const { data, error } = await supabase.from('interviews').select('*');
    if (error) throw error;
    return (data || []).map(toCamelCase);
  },

  getInterviewById: async (id: string): Promise<Interview | undefined> => {
    const { data, error } = await supabase.from('interviews').select('*').eq('id', id).single();
    if (error) return undefined;
    return toCamelCase(data);
  },

  createInterview: async (interview: Interview): Promise<Interview> => {
    const { data, error } = await supabase.from('interviews').insert(toSnakeCase(interview)).select().single();
    if (error) throw error;
    return toCamelCase(data);
  },

  updateInterview: async (id: string, updates: Partial<Interview>): Promise<Interview | undefined> => {
    const { data, error } = await supabase.from('interviews').update(toSnakeCase(updates)).eq('id', id).select().single();
    if (error) return undefined;
    return toCamelCase(data);
  },

  deleteInterview: async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('interviews').delete().eq('id', id);
    return !error;
  },

  // ============ APPLICATIONS ============
  getApplications: async (): Promise<Application[]> => {
    const { data, error } = await supabase.from('applications').select('*');
    if (error) throw error;
    return (data || []).map(toCamelCase);
  },

  getApplicationById: async (id: string): Promise<Application | undefined> => {
    const { data, error } = await supabase.from('applications').select('*').eq('id', id).single();
    if (error) return undefined;
    return toCamelCase(data);
  },

  createApplication: async (application: Application): Promise<Application> => {
    const { data, error } = await supabase.from('applications').insert(toSnakeCase(application)).select().single();
    if (error) throw error;
    return toCamelCase(data);
  },

  updateApplication: async (id: string, updates: Partial<Application>): Promise<Application | undefined> => {
    const { data, error } = await supabase.from('applications').update(toSnakeCase(updates)).eq('id', id).select().single();
    if (error) return undefined;
    return toCamelCase(data);
  },

  deleteApplication: async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('applications').delete().eq('id', id);
    return !error;
  },

  // ============ USERS ============
  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return (data || []).map(toCamelCase);
  },

  getUserById: async (id: string): Promise<User | undefined> => {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    if (error) return undefined;
    return toCamelCase(data);
  },

  getUserByUsername: async (username: string): Promise<User | undefined> => {
    const { data, error } = await supabase.from('users').select('*').eq('username', username).single();
    if (error) return undefined;
    return toCamelCase(data);
  },

  createUser: async (user: User): Promise<User> => {
    const { data, error } = await supabase.from('users').insert(toSnakeCase(user)).select().single();
    if (error) throw error;
    return toCamelCase(data);
  },

  updateUser: async (id: string, updates: Partial<User>): Promise<User | undefined> => {
    const { data, error } = await supabase.from('users').update(toSnakeCase(updates)).eq('id', id).select().single();
    if (error) return undefined;
    return toCamelCase(data);
  },

  deleteUser: async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('users').delete().eq('id', id);
    return !error;
  },

  // ============ EMPLOYEES ============
  getEmployees: async (): Promise<Employee[]> => {
    const { data, error } = await supabase.from('employees').select('*');
    if (error) throw error;
    return (data || []).map(toCamelCase);
  },

  getEmployeeById: async (id: string): Promise<Employee | undefined> => {
    const { data, error } = await supabase.from('employees').select('*').eq('id', id).single();
    if (error) return undefined;
    return toCamelCase(data);
  },

  getEmployeeByApplicationId: async (applicationId: string): Promise<Employee | undefined> => {
    const { data, error } = await supabase.from('employees').select('*').eq('application_id', applicationId).single();
    if (error) return undefined;
    return toCamelCase(data);
  },

  createEmployee: async (employee: Employee): Promise<Employee> => {
    const { data, error } = await supabase.from('employees').insert(toSnakeCase(employee)).select().single();
    if (error) throw error;
    return toCamelCase(data);
  },

  updateEmployee: async (id: string, updates: Partial<Employee>): Promise<Employee | undefined> => {
    const { data, error } = await supabase.from('employees').update(toSnakeCase(updates)).eq('id', id).select().single();
    if (error) return undefined;
    return toCamelCase(data);
  },

  deleteEmployee: async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    return !error;
  },

  // ============ RESIGNED AGENTS ============
  getResignedAgents: async (): Promise<ResignedAgent[]> => {
    const { data, error } = await supabase.from('resigned_agents').select('*');
    if (error) throw error;
    return (data || []).map(toCamelCase);
  },

  getResignedAgentById: async (id: string): Promise<ResignedAgent | undefined> => {
    const { data, error } = await supabase.from('resigned_agents').select('*').eq('id', id).single();
    if (error) return undefined;
    return toCamelCase(data);
  },

  createResignedAgent: async (resignedAgent: ResignedAgent): Promise<ResignedAgent> => {
    const { data, error } = await supabase.from('resigned_agents').insert(toSnakeCase(resignedAgent)).select().single();
    if (error) throw error;
    return toCamelCase(data);
  },

  updateResignedAgent: async (id: string, updates: Partial<ResignedAgent>): Promise<ResignedAgent | undefined> => {
    const { data, error } = await supabase.from('resigned_agents').update(toSnakeCase(updates)).eq('id', id).select().single();
    if (error) return undefined;
    return toCamelCase(data);
  },

  deleteResignedAgent: async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('resigned_agents').delete().eq('id', id);
    return !error;
  },

  // ============ AGENT RANKS ============
  getAgentRanks: async (): Promise<AgentRank[]> => {
    const { data, error } = await supabase.from('agent_ranks').select('*');
    if (error) throw error;
    return (data || []).map(toCamelCase);
  },

  getAgentRankById: async (id: string): Promise<AgentRank | undefined> => {
    const { data, error } = await supabase.from('agent_ranks').select('*').eq('id', id).single();
    if (error) return undefined;
    return toCamelCase(data);
  },

  getAgentRankByAgentId: async (agentId: string): Promise<AgentRank | undefined> => {
    const { data, error } = await supabase.from('agent_ranks').select('*').eq('agent_id', agentId).single();
    if (error) return undefined;
    return toCamelCase(data);
  },

  createAgentRank: async (agentRank: AgentRank): Promise<AgentRank> => {
    const { data, error } = await supabase.from('agent_ranks').insert(toSnakeCase(agentRank)).select().single();
    if (error) throw error;
    return toCamelCase(data);
  },

  updateAgentRank: async (id: string, updates: Partial<AgentRank>): Promise<AgentRank | undefined> => {
    const { data, error } = await supabase.from('agent_ranks').update(toSnakeCase(updates)).eq('id', id).select().single();
    if (error) return undefined;
    return toCamelCase(data);
  },

  deleteAgentRank: async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('agent_ranks').delete().eq('id', id);
    return !error;
  }
};

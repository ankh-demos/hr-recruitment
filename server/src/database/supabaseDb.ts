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

  bulkCreateApplications: async (applications: Application[]): Promise<Application[]> => {
    const { data, error } = await supabase.from('applications').insert(applications.map(toSnakeCase)).select();
    if (error) throw error;
    return (data || []).map(toCamelCase);
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
  },

  getStatistics: async (month?: string, period?: 'monthly' | 'quarterly' | 'yearly'): Promise<any> => {
    let startDate: string;
    let endDate: string;
    const periodType = period || 'monthly';
    
    if (periodType === 'yearly') {
      // Yearly statistics
      let year: number;
      if (month) {
        year = parseInt(month);
      } else {
        year = new Date().getFullYear();
      }
      startDate = `${year}-01-01`;
      endDate = `${year + 1}-01-01`;
    } else if (periodType === 'quarterly') {
      // Quarterly statistics (month format: YYYY-Q1, YYYY-Q2, etc.)
      let year: number;
      let quarter: number;
      if (month && month.includes('Q')) {
        const [yearStr, quarterStr] = month.split('-Q');
        year = parseInt(yearStr);
        quarter = parseInt(quarterStr);
      } else {
        const now = new Date();
        year = now.getFullYear();
        quarter = Math.floor(now.getMonth() / 3) + 1;
      }
      const startMonth = (quarter - 1) * 3 + 1;
      const endMonth = quarter * 3 + 1;
      startDate = `${year}-${startMonth.toString().padStart(2, '0')}-01`;
      if (endMonth > 12) {
        endDate = `${year + 1}-01-01`;
      } else {
        endDate = `${year}-${endMonth.toString().padStart(2, '0')}-01`;
      }
    } else {
      // Monthly statistics (default)
      if (month) {
        // Parse the provided month (format: YYYY-MM)
        const [yearStr, monthStr] = month.split('-');
        const year = parseInt(yearStr);
        const monthNum = parseInt(monthStr);
        startDate = `${year}-${monthStr.padStart(2, '0')}-01`;
        const nextMonth = monthNum === 12 ? 1 : monthNum + 1;
        const nextYear = monthNum === 12 ? year + 1 : year;
        endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
      } else {
        // Use current month
        const now = new Date();
        const year = now.getFullYear();
        const monthNum = now.getMonth() + 1; // 1-based
        startDate = `${year}-${monthNum.toString().padStart(2, '0')}-01`;
        const nextMonth = monthNum === 12 ? 1 : monthNum + 1;
        const nextYear = monthNum === 12 ? year + 1 : year;
        endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
      }
    }
    
    const offices = ['Гэгээнтэн', 'Ривер', 'Даун таун'];
    const stats: any = {};
    
    for (const office of offices) {
      // Get all applications for this office to calculate various metrics
      const { data: allApps, error: allAppsError } = await supabase
        .from('applications')
        .select('*')
        .eq('interested_office', office);
      if (allAppsError) throw allAppsError;
      
      // totalMeetings: Count applications created in this period (new applications submitted)
      const totalMeetings = allApps.filter(a => {
        if (!a.created_at) return false;
        return a.created_at >= startDate && a.created_at < endDate;
      }).length;
      
      // iconnectOpenings: Count employees hired in this period (use hired_date, not created_at)
      const { data: iconnectEmps, error: iconnectError } = await supabase
        .from('employees')
        .select('id, hired_date')
        .gte('hired_date', startDate)
        .lt('hired_date', endDate)
        .eq('office_name', office);
      if (iconnectError) throw iconnectError;
      const iconnectOpenings = iconnectEmps?.length || 0;
      
      // fireupRegistrations: Count from BOTH applications and employees with fireup_date in this period
      // (Applications are deleted when converted to iconnect, so we need to check both)
      const fireupFromApps = allApps.filter(a => {
        if (!a.fireup_date) return false;
        return a.fireup_date >= startDate && a.fireup_date < endDate;
      }).length;
      
      const { data: fireupFromEmps, error: fireupEmpError } = await supabase
        .from('employees')
        .select('id')
        .gte('fireup_date', startDate)
        .lt('fireup_date', endDate)
        .eq('office_name', office);
      if (fireupEmpError) throw fireupEmpError;
      const fireupRegistrations = fireupFromApps + (fireupFromEmps?.length || 0);
      
      // inProcess: Current applications in interviewing or fireup status
      const inProcess = allApps.filter(a => a.status === 'interviewing' || a.status === 'fireup').length;
      
      // cancelled: Applications cancelled in this period (check updated_at for cancelled status)
      const cancelled = allApps.filter(a => {
        if (a.status !== 'cancelled') return false;
        if (!a.updated_at) return false;
        return a.updated_at >= startDate && a.updated_at < endDate;
      }).length;
      
      // transfers: Count from BOTH applications and employees with is_transfer=true
      const transfersFromApps = allApps.filter(a => {
        if (!a.is_transfer) return false;
        if (!a.created_at) return false;
        return a.created_at >= startDate && a.created_at < endDate;
      }).length;
      
      const { data: transfersFromEmps, error: transferEmpError } = await supabase
        .from('employees')
        .select('id')
        .eq('is_transfer', true)
        .gte('hired_date', startDate)
        .lt('hired_date', endDate)
        .eq('office_name', office);
      if (transferEmpError) throw transferEmpError;
      const transfers = transfersFromApps + (transfersFromEmps?.length || 0);
      
      // Employees hired this period (same as iconnectOpenings)
      const newHires = iconnectOpenings;
      const monthlyGrowth = newHires;
      
      // Resigned this period
      const { data: res, error: resError } = await supabase
        .from('resigned_agents')
        .select('id')
        .gte('resignation_date', startDate)
        .lt('resignation_date', endDate)
        .eq('office_name', office);
      if (resError) throw resError;
      const resigned = res?.length || 0;
      
      // Current agents on leave (not filtered by period - this is current status)
      const { data: leaveEmps, error: leaveError } = await supabase
        .from('employees')
        .select('id')
        .in('status', ['on_leave', 'maternity_leave'])
        .eq('office_name', office);
      if (leaveError) throw leaveError;
      const agentsOnLeave = leaveEmps?.length || 0;
      
      // Net growth = new hires - resigned (leave is temporary, not subtracted)
      const netGrowth = monthlyGrowth - resigned;
      
      // Total active IConnect agents - all current employees
      const { data: totalEmps, error: totalError } = await supabase
        .from('employees')
        .select('id')
        .eq('office_name', office);
      if (totalError) throw totalError;
      const totalIConnect = totalEmps?.length || 0;
      
      stats[office] = {
        totalMeetings,
        iconnectOpenings,
        fireupRegistrations,
        inProcess,
        cancelled,
        transfers,
        newHires,
        monthlyGrowth,
        agentsOnLeave,
        resigned,
        netGrowth,
        totalIConnect
      };
    }
    return stats;
  }
};

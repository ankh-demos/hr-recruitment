import { supabase, isSupabaseConfigured } from './supabase';
import { Candidate, Job, Interview, Application, User, Employee, ResignedAgent, AgentRank } from '../types';

// Special field name mappings (camelCase -> snake_case)
const FIELD_MAPPINGS: Record<string, string> = {
  iConnectName: 'iconnect_name',
  hasIConnect: 'has_iconnect',
};

// Reverse mappings (snake_case -> camelCase)
const REVERSE_FIELD_MAPPINGS: Record<string, string> = {
  iconnect_name: 'iConnectName',
  has_iconnect: 'hasIConnect',
};

// Helper to convert snake_case to camelCase
function toCamelCase(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  
  const converted: any = {};
  for (const key in obj) {
    const camelKey = REVERSE_FIELD_MAPPINGS[key] || key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
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
    const snakeKey = FIELD_MAPPINGS[key] || key.replace(/([A-Z])/g, '_$1').toLowerCase();
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
    if (error) {
      console.error('Supabase getEmployees error:', error.message, error.code);
      throw error;
    }
    console.log('Supabase getEmployees - fetched', data?.length || 0, 'employees');
    return (data || []).map(toCamelCase);
  },

  getEmployeeById: async (id: string): Promise<Employee | undefined> => {
    console.log('Supabase getEmployeeById - looking for ID:', id);
    const { data, error } = await supabase.from('employees').select('*').eq('id', id).single();
    if (error) {
      console.log('Supabase getEmployeeById - not found or error:', error.code, error.message);
      return undefined;
    }
    console.log('Supabase getEmployeeById - found employee:', data?.first_name, data?.last_name);
    return toCamelCase(data);
  },

  getEmployeeByApplicationId: async (applicationId: string): Promise<Employee | undefined> => {
    const { data, error } = await supabase.from('employees').select('*').eq('application_id', applicationId).single();
    if (error) return undefined;
    return toCamelCase(data);
  },

  createEmployee: async (employee: Employee): Promise<Employee> => {
    const snakeCaseEmployee = toSnakeCase(employee);
    console.log('Supabase createEmployee - ID:', employee.id, 'Status:', employee.status);
    const { data, error } = await supabase.from('employees').insert(snakeCaseEmployee).select().single();
    if (error) {
      console.error('Supabase createEmployee error:', error.message, error.code, error.details);
      throw error;
    }
    console.log('Supabase createEmployee success - ID:', data?.id);
    return toCamelCase(data);
  },

  updateEmployee: async (id: string, updates: Partial<Employee>): Promise<Employee | undefined> => {
    const snakeCaseUpdates = toSnakeCase(updates);
    
    // Remove fields that Supabase auto-manages or that might not exist as columns
    delete snakeCaseUpdates.id;
    delete snakeCaseUpdates.created_at;
    
    console.log('Supabase updateEmployee - ID:', id, 'Updates:', JSON.stringify(snakeCaseUpdates).substring(0, 300));
    
    // First check if employee exists
    const { data: existing, error: checkError } = await supabase.from('employees').select('id').eq('id', id).single();
    if (checkError) {
      console.error('Supabase updateEmployee - Employee not found in DB:', id, checkError.code, checkError.message);
      if (checkError.code === 'PGRST116') {
        console.error('Employee ID does not exist in Supabase database. Please check if data was migrated properly.');
      }
      return undefined;
    }
    console.log('Employee exists, proceeding with update');
    
    const { data, error } = await supabase.from('employees').update(snakeCaseUpdates).eq('id', id).select().single();
    if (error) {
      console.error('Supabase updateEmployee error:', error.message, error.code, error.details, error.hint);
      // If it's a column error, try stripping unknown fields and retrying
      if (error.code === '42703' || error.message?.includes('column') || error.code === 'PGRST204') {
        console.log('Retrying with only known columns...');
        // Known employee columns in the DB
        const knownColumns = new Set([
          'application_id', 'iconnect_name', 'family_name', 'last_name', 'first_name',
          'interested_office', 'birth_place', 'ethnicity', 'gender', 'birth_date',
          'register_number', 'home_address', 'phone', 'emergency_phone', 'email',
          'facebook', 'family_members', 'education', 'languages', 'work_experience',
          'awards', 'other_skills', 'strengths_weaknesses', 'has_driver_license',
          'photo_url', 'referral_source', 'signature_url', 'training_number',
          'certificate_number', 'citizen_registration_number', 'szh_certificate_number',
          'certificate_date', 'remax_email', 'mls', 'bank', 'account_number',
          'district', 'detailed_address', 'children_count', 'employment_start_date',
          'office_name', 'status', 'hired_date', 'updated_at',
          // Newer columns that may or may not exist
          'has_iconnect', 'is_assistant', 'assistant_of',
          'has_szh_training', 'szh_training_date', 'szh_official_letter_number',
          'training_start_date', 'training_end_date', 'fireup_date', 'is_transfer'
        ]);
        const filteredUpdates: any = {};
        for (const key of Object.keys(snakeCaseUpdates)) {
          if (knownColumns.has(key)) {
            filteredUpdates[key] = snakeCaseUpdates[key];
          } else {
            console.log('Skipping unknown column:', key);
          }
        }
        const { data: retryData, error: retryError } = await supabase.from('employees').update(filteredUpdates).eq('id', id).select().single();
        if (retryError) {
          console.error('Supabase updateEmployee retry error:', retryError.message, retryError.code, retryError.details);
          return undefined;
        }
        console.log('Supabase updateEmployee retry success - ID:', retryData?.id);
        return toCamelCase(retryData);
      }
      return undefined;
    }
    console.log('Supabase updateEmployee success - ID:', data?.id);
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
      let year: number;
      if (month) {
        year = parseInt(month);
      } else {
        year = new Date().getFullYear();
      }
      startDate = `${year}-01-01`;
      endDate = `${year + 1}-01-01`;
    } else if (periodType === 'quarterly') {
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
      if (month) {
        const [yearStr, monthStr] = month.split('-');
        const year = parseInt(yearStr);
        const monthNum = parseInt(monthStr);
        startDate = `${year}-${monthStr.padStart(2, '0')}-01`;
        const nextMonth = monthNum === 12 ? 1 : monthNum + 1;
        const nextYear = monthNum === 12 ? year + 1 : year;
        endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
      } else {
        const now = new Date();
        const year = now.getFullYear();
        const monthNum = now.getMonth() + 1;
        startDate = `${year}-${monthNum.toString().padStart(2, '0')}-01`;
        const nextMonth = monthNum === 12 ? 1 : monthNum + 1;
        const nextYear = monthNum === 12 ? year + 1 : year;
        endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
      }
    }
    
    // Use ISO timestamps for created_at/updated_at comparisons (timestamptz columns)
    const startTimestamp = `${startDate}T00:00:00.000Z`;
    const endTimestamp = `${endDate}T00:00:00.000Z`;
    
    console.log('[Statistics] Period:', periodType, 'Range:', startDate, 'to', endDate);
    
    const offices = ['Гэгээнтэн', 'Ривер', 'Даун таун'];
    const stats: any = {};
    
    for (const office of offices) {
      // totalMeetings: Count applications created in this period using Supabase filters
      const { data: meetingApps, error: meetingError } = await supabase
        .from('applications')
        .select('id')
        .eq('interested_office', office)
        .gte('created_at', startTimestamp)
        .lt('created_at', endTimestamp);
      if (meetingError) console.error('[Statistics] meetingApps error:', meetingError);
      const totalMeetings = meetingApps?.length || 0;
      
      // iconnectOpenings: Count employees hired in this period
      let iconnectOpenings = 0;
      const { data: iconnectEmps, error: iconnectError } = await supabase
        .from('employees')
        .select('id')
        .eq('office_name', office)
        .gte('hired_date', startDate)
        .lt('hired_date', endDate);
      if (iconnectError) {
        console.error('[Statistics] iconnectEmps error:', iconnectError);
        // Fallback to created_at
        const { data: fallbackEmps } = await supabase
          .from('employees')
          .select('id')
          .eq('office_name', office)
          .gte('created_at', startTimestamp)
          .lt('created_at', endTimestamp);
        iconnectOpenings = fallbackEmps?.length || 0;
      } else {
        iconnectOpenings = iconnectEmps?.length || 0;
      }
      
      // fireupRegistrations: Count from applications with fireup_date in this period
      const { data: fireupApps, error: fireupAppsError } = await supabase
        .from('applications')
        .select('id')
        .eq('interested_office', office)
        .gte('fireup_date', startDate)
        .lt('fireup_date', endDate);
      if (fireupAppsError) console.error('[Statistics] fireupApps error:', fireupAppsError);
      const fireupFromApps = fireupApps?.length || 0;
      
      // Also check employees with fireup_date (applications deleted when converted)
      let fireupFromEmpsCount = 0;
      const { data: fireupFromEmps, error: fireupEmpError } = await supabase
        .from('employees')
        .select('id')
        .eq('office_name', office)
        .gte('fireup_date', startDate)
        .lt('fireup_date', endDate);
      if (!fireupEmpError) {
        fireupFromEmpsCount = fireupFromEmps?.length || 0;
      }
      const fireupRegistrations = fireupFromApps + fireupFromEmpsCount;
      
      // inProcess: Current applications in interviewing or fireup status (not period-filtered)
      const { data: processApps, error: processError } = await supabase
        .from('applications')
        .select('id')
        .eq('interested_office', office)
        .in('status', ['interviewing', 'fireup']);
      if (processError) console.error('[Statistics] processApps error:', processError);
      const inProcess = processApps?.length || 0;
      
      // cancelled: Applications cancelled in this period
      const { data: cancelledApps, error: cancelledError } = await supabase
        .from('applications')
        .select('id')
        .eq('interested_office', office)
        .eq('status', 'cancelled')
        .gte('updated_at', startTimestamp)
        .lt('updated_at', endTimestamp);
      if (cancelledError) console.error('[Statistics] cancelledApps error:', cancelledError);
      const cancelled = cancelledApps?.length || 0;
      
      // transfers from applications
      const { data: transferApps, error: transferAppsError } = await supabase
        .from('applications')
        .select('id')
        .eq('interested_office', office)
        .eq('is_transfer', true)
        .gte('created_at', startTimestamp)
        .lt('created_at', endTimestamp);
      if (transferAppsError) console.error('[Statistics] transferApps error:', transferAppsError);
      const transfersFromApps = transferApps?.length || 0;
      
      // transfers from employees
      let transfersFromEmpsCount = 0;
      const { data: transferEmps, error: transferEmpError } = await supabase
        .from('employees')
        .select('id')
        .eq('office_name', office)
        .eq('is_transfer', true)
        .gte('hired_date', startDate)
        .lt('hired_date', endDate);
      if (!transferEmpError) {
        transfersFromEmpsCount = transferEmps?.length || 0;
      }
      const transfers = transfersFromApps + transfersFromEmpsCount;
      
      // Growth
      const newHires = iconnectOpenings;
      const monthlyGrowth = newHires;
      
      // Resigned this period
      const { data: resignedData, error: resError } = await supabase
        .from('resigned_agents')
        .select('id')
        .eq('office_name', office)
        .gte('resignation_date', startDate)
        .lt('resignation_date', endDate);
      if (resError) console.error('[Statistics] resigned error:', resError);
      const resigned = resignedData?.length || 0;
      
      // Current agents on leave
      const { data: leaveEmps, error: leaveError } = await supabase
        .from('employees')
        .select('id')
        .eq('office_name', office)
        .in('status', ['on_leave', 'maternity_leave']);
      if (leaveError) console.error('[Statistics] leaveEmps error:', leaveError);
      const agentsOnLeave = leaveEmps?.length || 0;
      
      const netGrowth = monthlyGrowth - resigned;
      
      // Total active IConnect agents
      const { data: totalEmps, error: totalError } = await supabase
        .from('employees')
        .select('id')
        .eq('office_name', office);
      if (totalError) console.error('[Statistics] totalEmps error:', totalError);
      const totalIConnect = totalEmps?.length || 0;
      
      console.log(`[Statistics] ${office}: meetings=${totalMeetings}, iconnect=${iconnectOpenings}, fireup=${fireupRegistrations}, inProcess=${inProcess}, cancelled=${cancelled}, transfers=${transfers}, leave=${agentsOnLeave}, resigned=${resigned}, total=${totalIConnect}`);
      
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

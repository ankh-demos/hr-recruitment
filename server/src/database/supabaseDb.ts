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

const EMPLOYEE_DATE_FIELDS = new Set([
  'birthDate',
  'employmentStartDate',
  'certificateDate',
  'hiredDate',
  'szhTrainingDate',
  'trainingStartDate',
  'trainingEndDate',
  'fireupDate',
]);

function normalizeDateValue(value: any): string | null {
  if (typeof value !== 'string') return value;
  const raw = value.trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const a = Number(slashMatch[1]);
    const b = Number(slashMatch[2]);
    const year = Number(slashMatch[3]);

    let month = a;
    let day = b;
    if (a > 12 && b <= 12) {
      day = a;
      month = b;
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function sanitizeEmployeeUpdates(updates: Partial<Employee>): Partial<Employee> {
  const sanitized: Partial<Employee> = { ...updates };

  for (const key of Object.keys(sanitized) as (keyof Employee)[]) {
    const value = sanitized[key];
    if (typeof value === 'string' && value.trim() === '') {
      // Keep empty strings for text fields, but not for date fields.
      if (EMPLOYEE_DATE_FIELDS.has(String(key))) {
        (sanitized as any)[key] = null;
      }
      continue;
    }

    if (EMPLOYEE_DATE_FIELDS.has(String(key))) {
      (sanitized as any)[key] = normalizeDateValue(value);
    }
  }

  return sanitized;
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
    const sanitizedUpdates = sanitizeEmployeeUpdates(updates);
    const snakeCaseUpdates = toSnakeCase(sanitizedUpdates);
    
    // Remove fields that Supabase auto-manages
    delete snakeCaseUpdates.id;
    delete snakeCaseUpdates.created_at;
    delete snakeCaseUpdates.updated_at; // DB trigger handles this
    
    console.log('Supabase updateEmployee - ID:', id, 'Updates:', JSON.stringify(snakeCaseUpdates).substring(0, 300));
    
    // First check if employee exists
    const { data: existing, error: checkError } = await supabase.from('employees').select('id').eq('id', id).single();
    if (checkError) {
      console.error('Supabase updateEmployee - Employee not found in DB:', id, checkError.code, checkError.message);
      if (checkError.code === 'PGRST116') {
        console.error('Employee ID does not exist in Supabase database.');
      }
      return undefined;
    }
    console.log('Employee exists, proceeding with update');
    
    // Known base columns in the employees table (original schema)
    const knownBaseColumns = new Set([
      'application_id', 'iconnect_name', 'family_name', 'last_name', 'first_name',
      'interested_office', 'birth_place', 'ethnicity', 'gender', 'birth_date',
      'register_number', 'home_address', 'phone', 'emergency_phone', 'email',
      'facebook', 'family_members', 'education', 'languages', 'work_experience',
      'awards', 'other_skills', 'strengths_weaknesses', 'has_driver_license',
      'photo_url', 'referral_source', 'signature_url', 'training_number',
      'certificate_number', 'citizen_registration_number', 'szh_certificate_number',
      'certificate_date', 'remax_email', 'mls', 'bank', 'account_number',
      'district', 'detailed_address', 'children_count', 'employment_start_date',
      'office_name', 'status', 'hired_date'
    ]);
    
    // Extended columns (may or may not exist depending on migration status)
    const extendedColumns = new Set([
      'has_iconnect', 'is_assistant', 'assistant_of',
      'has_szh_training', 'szh_training_date', 'szh_official_letter_number',
      'training_start_date', 'training_end_date', 'fireup_date', 'is_transfer',
      'has_first_transaction', 'exclude_from_kpi'
    ]);
    
    const { data, error } = await supabase.from('employees').update(snakeCaseUpdates).eq('id', id).select().single();
    if (error) {
      console.error('Supabase updateEmployee error:', error.message, error.code, error.details, error.hint);
      
      // Retry with only base columns (strip extended columns that might not exist)
      console.log('Retrying with only base columns...');
      const baseOnlyUpdates: any = {};
      for (const key of Object.keys(snakeCaseUpdates)) {
        if (knownBaseColumns.has(key)) {
          baseOnlyUpdates[key] = snakeCaseUpdates[key];
        } else if (extendedColumns.has(key)) {
          console.log('Skipping extended column (may not exist):', key);
        } else {
          console.log('Skipping unknown column:', key);
        }
      }
      
      const { data: retryData, error: retryError } = await supabase.from('employees').update(baseOnlyUpdates).eq('id', id).select().single();
      if (retryError) {
        console.error('Supabase updateEmployee retry error:', retryError.message, retryError.code);
        
        // If still failing (likely status constraint), try without status field
        if (retryError.message?.includes('check constraint') || retryError.code === '23514') {
          console.log('Status constraint violation, retrying without status...');
          delete baseOnlyUpdates.status;
          const { data: retry2Data, error: retry2Error } = await supabase.from('employees').update(baseOnlyUpdates).eq('id', id).select().single();
          if (retry2Error) {
            console.error('Supabase updateEmployee final retry error:', retry2Error.message);
            throw new Error(`Employee update failed: ${retry2Error.message}`);
          }
          console.log('Supabase updateEmployee success (without status) - ID:', retry2Data?.id);
          return toCamelCase(retry2Data);
        }
        throw new Error(`Employee update failed: ${retryError.message}`);
      }
      console.log('Supabase updateEmployee retry success - ID:', retryData?.id);
      return toCamelCase(retryData);
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

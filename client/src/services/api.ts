import { Candidate, Job, Interview, Application, Employee, User, ResignedAgent, AgentRank, RankLevel } from '../types';

const API_BASE = '/api';
const TOKEN_STORAGE_KEY = 'hr_token';

// Helper to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Simple API wrapper for general API calls
export const api = {
  get: async (url: string) => {
    const response = await fetch(`${API_BASE}${url}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'An error occurred' }));
      throw { response: { data: error } };
    }
    return { data: await response.json() };
  },
  
  post: async (url: string, data: any) => {
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'An error occurred' }));
      throw { response: { data: error } };
    }
    return { data: await response.json() };
  },
  
  put: async (url: string, data: any) => {
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'An error occurred' }));
      throw { response: { data: error } };
    }
    return { data: await response.json() };
  },
  
  delete: async (url: string) => {
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'An error occurred' }));
      throw { response: { data: error } };
    }
    if (response.status === 204) {
      return { data: null };
    }
    return { data: await response.json() };
  }
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'An error occurred' }));
    const message = error.details ? `${error.error || 'An error occurred'}: ${error.details}` : (error.error || 'An error occurred');
    throw new Error(message);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

// Candidates API
export const candidatesApi = {
  getAll: (): Promise<Candidate[]> =>
    fetch(`${API_BASE}/candidates`).then(res => handleResponse<Candidate[]>(res)),

  getById: (id: string): Promise<Candidate> =>
    fetch(`${API_BASE}/candidates/${id}`).then(res => handleResponse<Candidate>(res)),

  create: (data: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>): Promise<Candidate> =>
    fetch(`${API_BASE}/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => handleResponse<Candidate>(res)),

  update: (id: string, data: Partial<Candidate>): Promise<Candidate> =>
    fetch(`${API_BASE}/candidates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => handleResponse<Candidate>(res)),

  delete: (id: string): Promise<void> =>
    fetch(`${API_BASE}/candidates/${id}`, { method: 'DELETE' }).then(res => handleResponse<void>(res))
};

// Jobs API
export const jobsApi = {
  getAll: (): Promise<Job[]> =>
    fetch(`${API_BASE}/jobs`).then(res => handleResponse<Job[]>(res)),

  getById: (id: string): Promise<Job> =>
    fetch(`${API_BASE}/jobs/${id}`).then(res => handleResponse<Job>(res)),

  create: (data: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job> =>
    fetch(`${API_BASE}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => handleResponse<Job>(res)),

  update: (id: string, data: Partial<Job>): Promise<Job> =>
    fetch(`${API_BASE}/jobs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => handleResponse<Job>(res)),

  delete: (id: string): Promise<void> =>
    fetch(`${API_BASE}/jobs/${id}`, { method: 'DELETE' }).then(res => handleResponse<void>(res))
};

// Interviews API
export const interviewsApi = {
  getAll: (): Promise<Interview[]> =>
    fetch(`${API_BASE}/interviews`).then(res => handleResponse<Interview[]>(res)),

  getUpcoming: (): Promise<Interview[]> =>
    fetch(`${API_BASE}/interviews/upcoming`).then(res => handleResponse<Interview[]>(res)),

  getById: (id: string): Promise<Interview> =>
    fetch(`${API_BASE}/interviews/${id}`).then(res => handleResponse<Interview>(res)),

  create: (data: Omit<Interview, 'id' | 'createdAt' | 'updatedAt'>): Promise<Interview> =>
    fetch(`${API_BASE}/interviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => handleResponse<Interview>(res)),

  update: (id: string, data: Partial<Interview>): Promise<Interview> =>
    fetch(`${API_BASE}/interviews/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => handleResponse<Interview>(res)),

  delete: (id: string): Promise<void> =>
    fetch(`${API_BASE}/interviews/${id}`, { method: 'DELETE' }).then(res => handleResponse<void>(res))
};

// Applications API
export const applicationsApi = {
  getAll: (): Promise<Application[]> =>
    fetch(`${API_BASE}/applications`).then(res => handleResponse<Application[]>(res)),

  getStatistics: (month?: string, period?: 'monthly' | 'quarterly' | 'yearly'): Promise<any> => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (period) params.append('period', period);
    const queryString = params.toString();
    const url = queryString ? `${API_BASE}/applications/statistics?${queryString}` : `${API_BASE}/applications/statistics`;
    return fetch(url).then(res => handleResponse<any>(res));
  },

  getById: (id: string): Promise<Application> =>
    fetch(`${API_BASE}/applications/${id}`).then(res => handleResponse<Application>(res)),

  create: (data: Omit<Application, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Application> =>
    fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => handleResponse<Application>(res)),

  update: (id: string, data: Partial<Application>): Promise<Application> =>
    fetch(`${API_BASE}/applications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => handleResponse<Application>(res)),

  delete: (id: string): Promise<void> =>
    fetch(`${API_BASE}/applications/${id}`, { method: 'DELETE' }).then(res => handleResponse<void>(res)),

  bulkCreate: (data: Omit<Application, 'id' | 'createdAt' | 'updatedAt' | 'status'>[]): Promise<{ success: boolean; count: number; applications: Application[] }> =>
    fetch(`${API_BASE}/applications/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => handleResponse<{ success: boolean; count: number; applications: Application[] }>(res))
};

// Employees API
export const employeesApi = {
  getAll: (): Promise<Employee[]> =>
    fetch(`${API_BASE}/employees`).then(res => handleResponse<Employee[]>(res)),

  getById: (id: string): Promise<Employee> =>
    fetch(`${API_BASE}/employees/${id}`).then(res => handleResponse<Employee>(res)),

  bulkCreate: (employees: Partial<Employee>[]): Promise<{ success: boolean; count: number; employees: Employee[] }> =>
    fetch(`${API_BASE}/employees/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employees)
    }).then(res => handleResponse<{ success: boolean; count: number; employees: Employee[] }>(res)),

  update: (id: string, data: Partial<Employee>): Promise<Employee> =>
    fetch(`${API_BASE}/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => handleResponse<Employee>(res)),

  delete: (id: string): Promise<void> =>
    fetch(`${API_BASE}/employees/${id}`, { method: 'DELETE' }).then(res => handleResponse<void>(res))
};

// Users API
export const usersApi = {
  getAll: (): Promise<User[]> =>
    fetch(`${API_BASE}/users`).then(res => handleResponse<User[]>(res)),

  getById: (id: string): Promise<User> =>
    fetch(`${API_BASE}/users/${id}`).then(res => handleResponse<User>(res))
};

// Resigned Agents API
export const resignedAgentsApi = {
  getAll: (): Promise<ResignedAgent[]> =>
    fetch(`${API_BASE}/resigned-agents`).then(res => handleResponse<ResignedAgent[]>(res)),

  getById: (id: string): Promise<ResignedAgent> =>
    fetch(`${API_BASE}/resigned-agents/${id}`).then(res => handleResponse<ResignedAgent>(res)),

  moveFromEmployee: (employeeId: string, data: {
    workedMonths: number;
    resignedDate: string;
    resignationReason: string;
    resignationNotes?: string;
  }): Promise<ResignedAgent> =>
    fetch(`${API_BASE}/resigned-agents/from-employee/${employeeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => handleResponse<ResignedAgent>(res)),

  moveToEmployee: (resignedAgentId: string): Promise<Employee> =>
    fetch(`${API_BASE}/resigned-agents/to-employee/${resignedAgentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }).then(res => handleResponse<Employee>(res)),

  update: (id: string, data: Partial<ResignedAgent>): Promise<ResignedAgent> =>
    fetch(`${API_BASE}/resigned-agents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => handleResponse<ResignedAgent>(res)),

  delete: (id: string): Promise<void> =>
    fetch(`${API_BASE}/resigned-agents/${id}`, { method: 'DELETE' }).then(res => handleResponse<void>(res))
};

// Agent Ranks API
export const agentRanksApi = {
  getAll: (): Promise<AgentRank[]> =>
    fetch(`${API_BASE}/agent-ranks`).then(res => handleResponse<AgentRank[]>(res)),

  getById: (id: string): Promise<AgentRank> =>
    fetch(`${API_BASE}/agent-ranks/${id}`).then(res => handleResponse<AgentRank>(res)),

  getByAgentId: (agentId: string): Promise<AgentRank> =>
    fetch(`${API_BASE}/agent-ranks/by-agent/${agentId}`).then(res => handleResponse<AgentRank>(res)),

  getCurrentRank: (agentId: string, date?: string): Promise<{ rank: RankLevel | null }> => {
    const url = date 
      ? `${API_BASE}/agent-ranks/current/${agentId}?date=${date}`
      : `${API_BASE}/agent-ranks/current/${agentId}`;
    return fetch(url).then(res => handleResponse<{ rank: RankLevel | null }>(res));
  },

  create: (data: {
    agentId: string;
    agentName: string;
    contractNumber?: string;
    rank: RankLevel;
    startDate: string;
  }): Promise<AgentRank> =>
    fetch(`${API_BASE}/agent-ranks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => handleResponse<AgentRank>(res)),

  updateRank: (id: string, data: {
    rank: RankLevel;
    startDate: string;
    agentName?: string;
  }): Promise<AgentRank> =>
    fetch(`${API_BASE}/agent-ranks/${id}/rank`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => handleResponse<AgentRank>(res)),

  update: (id: string, data: Partial<AgentRank>): Promise<AgentRank> =>
    fetch(`${API_BASE}/agent-ranks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => handleResponse<AgentRank>(res)),

  delete: (id: string): Promise<void> =>
    fetch(`${API_BASE}/agent-ranks/${id}`, { method: 'DELETE' }).then(res => handleResponse<void>(res))
};

// Notifications API
export const notificationsApi = {
  getStatus: (): Promise<{ configured: boolean; adminEmails: string[] }> =>
    fetch(`${API_BASE}/notifications/status`, {
      headers: getAuthHeaders()
    }).then(res => handleResponse<{ configured: boolean; adminEmails: string[] }>(res)),

  sendTest: (): Promise<{ success: boolean; message: string }> =>
    fetch(`${API_BASE}/notifications/test`, {
      method: 'POST',
      headers: getAuthHeaders()
    }).then(res => handleResponse<{ success: boolean; message: string }>(res)),

  triggerBirthdays: (): Promise<{ success: boolean; message: string }> =>
    fetch(`${API_BASE}/notifications/birthdays`, {
      method: 'POST',
      headers: getAuthHeaders()
    }).then(res => handleResponse<{ success: boolean; message: string }>(res)),

  triggerExpiringRanks: (): Promise<{ success: boolean; message: string }> =>
    fetch(`${API_BASE}/notifications/ranks`, {
      method: 'POST',
      headers: getAuthHeaders()
    }).then(res => handleResponse<{ success: boolean; message: string }>(res)),

  sendDailySummary: (): Promise<{ success: boolean; message: string }> =>
    fetch(`${API_BASE}/notifications/summary`, {
      method: 'POST',
      headers: getAuthHeaders()
    }).then(res => handleResponse<{ success: boolean; message: string }>(res))
};

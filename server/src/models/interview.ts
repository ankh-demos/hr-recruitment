import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/unifiedDb';
import { Interview } from '../types';

export const interviewModel = {
  async getAll(): Promise<Interview[]> {
    return db.getInterviews();
  },

  async getById(id: string): Promise<Interview | undefined> {
    return db.getInterviewById(id);
  },

  async getByCandidateId(candidateId: string): Promise<Interview[]> {
    const interviews = await db.getInterviews();
    return interviews.filter(i => i.candidateId === candidateId);
  },

  async getByJobId(jobId: string): Promise<Interview[]> {
    const interviews = await db.getInterviews();
    return interviews.filter(i => i.jobId === jobId);
  },

  async getUpcoming(): Promise<Interview[]> {
    const interviews = await db.getInterviews();
    const now = new Date().toISOString();
    return interviews.filter(i => i.scheduledAt > now && i.status === 'scheduled');
  },

  async create(data: Omit<Interview, 'id' | 'createdAt' | 'updatedAt'>): Promise<Interview> {
    const now = new Date().toISOString();
    const interview: Interview = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now
    };
    return db.createInterview(interview);
  },

  async update(id: string, data: Partial<Interview>): Promise<Interview | undefined> {
    const now = new Date().toISOString();
    return db.updateInterview(id, { ...data, updatedAt: now });
  },

  async delete(id: string): Promise<boolean> {
    return db.deleteInterview(id);
  }
};

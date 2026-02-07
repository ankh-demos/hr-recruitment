import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/unifiedDb';
import { Job } from '../types';

export const jobModel = {
  async getAll(): Promise<Job[]> {
    return db.getJobs();
  },

  async getById(id: string): Promise<Job | undefined> {
    return db.getJobById(id);
  },

  async create(data: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job> {
    const now = new Date().toISOString();
    const job: Job = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now
    };
    return db.createJob(job);
  },

  async update(id: string, data: Partial<Job>): Promise<Job | undefined> {
    const now = new Date().toISOString();
    return db.updateJob(id, { ...data, updatedAt: now });
  },

  async delete(id: string): Promise<boolean> {
    return db.deleteJob(id);
  }
};

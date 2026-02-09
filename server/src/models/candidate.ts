import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/unifiedDb';
import { Candidate } from '../types';

export const candidateModel = {
  async getAll(): Promise<Candidate[]> {
    return db.getCandidates();
  },

  async getById(id: string): Promise<Candidate | undefined> {
    return db.getCandidateById(id);
  },

  async getByJobId(jobId: string): Promise<Candidate[]> {
    const candidates = await db.getCandidates();
    return candidates.filter(c => c.appliedJobId === jobId);
  },

  async create(data: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>): Promise<Candidate> {
    const now = new Date().toISOString();
    const candidate: Candidate = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now
    };
    return db.createCandidate(candidate);
  },

  async update(id: string, data: Partial<Candidate>): Promise<Candidate | undefined> {
    const now = new Date().toISOString();
    return db.updateCandidate(id, { ...data, updatedAt: now });
  },

  async delete(id: string): Promise<boolean> {
    return db.deleteCandidate(id);
  },

  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    const candidates = await db.getCandidates();
    return candidates.some(c => c.email === email && c.id !== excludeId);
  }
};

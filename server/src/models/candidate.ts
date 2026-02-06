import { v4 as uuidv4 } from 'uuid';
import { database } from '../database';
import { Candidate } from '../types';

export const candidateModel = {
  getAll(): Candidate[] {
    return database.getCandidates();
  },

  getById(id: string): Candidate | undefined {
    return database.getCandidateById(id);
  },

  getByJobId(jobId: string): Candidate[] {
    return database.getCandidatesByJobId(jobId);
  },

  create(data: Omit<Candidate, 'id' | 'createdAt' | 'updatedAt'>): Candidate {
    const now = new Date().toISOString();
    const candidate: Candidate = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now
    };
    return database.createCandidate(candidate);
  },

  update(id: string, data: Partial<Candidate>): Candidate | undefined {
    const now = new Date().toISOString();
    return database.updateCandidate(id, { ...data, updatedAt: now });
  },

  delete(id: string): boolean {
    return database.deleteCandidate(id);
  },

  emailExists(email: string, excludeId?: string): boolean {
    return database.candidateEmailExists(email, excludeId);
  }
};

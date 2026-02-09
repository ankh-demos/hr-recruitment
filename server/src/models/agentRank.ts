import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/unifiedDb';
import { AgentRank, RankLevel, AgentRankHistory } from '../types';

// Calculate end date as exactly +1 year from start date
function calculateEndDate(startDate: string): string {
  const date = new Date(startDate);
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split('T')[0];
}

export const agentRankModel = {
  async getAll(): Promise<AgentRank[]> {
    return db.getAgentRanks();
  },

  async getById(id: string): Promise<AgentRank | undefined> {
    return db.getAgentRankById(id);
  },

  async getByAgentId(agentId: string): Promise<AgentRank | undefined> {
    return db.getAgentRankByAgentId(agentId);
  },

  async create(data: {
    agentId: string;
    agentName: string;
    contractNumber?: string;
    rank: RankLevel;
    startDate: string;
  }): Promise<AgentRank> {
    const now = new Date().toISOString();
    const endDate = calculateEndDate(data.startDate);
    
    const historyEntry: AgentRankHistory = {
      rank: data.rank,
      startDate: data.startDate,
      endDate: endDate,
      createdAt: now
    };

    const agentRank: AgentRank = {
      id: uuidv4(),
      agentId: data.agentId,
      agentName: data.agentName,
      contractNumber: data.contractNumber,
      currentRank: data.rank,
      currentStartDate: data.startDate,
      currentEndDate: endDate,
      rankHistory: [historyEntry],
      createdAt: now,
      updatedAt: now
    };
    
    return db.createAgentRank(agentRank);
  },

  // Update rank (promote/change) - adds to history
  async updateRank(id: string, data: {
    rank: RankLevel;
    startDate: string;
    agentName?: string;
  }): Promise<AgentRank | undefined> {
    const existing = await db.getAgentRankById(id);
    if (!existing) return undefined;

    const now = new Date().toISOString();
    const endDate = calculateEndDate(data.startDate);
    
    const historyEntry: AgentRankHistory = {
      rank: data.rank,
      startDate: data.startDate,
      endDate: endDate,
      createdAt: now
    };

    const updates: Partial<AgentRank> = {
      currentRank: data.rank,
      currentStartDate: data.startDate,
      currentEndDate: endDate,
      rankHistory: [...existing.rankHistory, historyEntry],
      updatedAt: now
    };

    if (data.agentName) {
      updates.agentName = data.agentName;
    }

    return db.updateAgentRank(id, updates);
  },

  async update(id: string, data: Partial<AgentRank>): Promise<AgentRank | undefined> {
    const now = new Date().toISOString();
    return db.updateAgentRank(id, { ...data, updatedAt: now });
  },

  async delete(id: string): Promise<boolean> {
    return db.deleteAgentRank(id);
  },

  // Get current valid rank for an agent by date
  async getCurrentRankByAgentId(agentId: string, checkDate?: string): Promise<RankLevel | null> {
    const agentRank = await db.getAgentRankByAgentId(agentId);
    if (!agentRank) return null;

    const today = checkDate || new Date().toISOString().split('T')[0];
    
    // Find the most recent valid rank from history
    const validRanks = agentRank.rankHistory.filter(h => {
      return h.startDate <= today && h.endDate >= today;
    });

    if (validRanks.length === 0) return null;

    // Return the most recent one (last in sorted by startDate)
    validRanks.sort((a, b) => b.startDate.localeCompare(a.startDate));
    return validRanks[0].rank;
  }
};

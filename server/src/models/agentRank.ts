import { v4 as uuidv4 } from 'uuid';
import { database } from '../database';
import { AgentRank, RankLevel, AgentRankHistory } from '../types';

// Calculate end date as exactly +1 year from start date
function calculateEndDate(startDate: string): string {
  const date = new Date(startDate);
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split('T')[0];
}

export const agentRankModel = {
  getAll(): AgentRank[] {
    return database.getAgentRanks();
  },

  getById(id: string): AgentRank | undefined {
    return database.getAgentRankById(id);
  },

  getByAgentId(agentId: string): AgentRank | undefined {
    return database.getAgentRankByAgentId(agentId);
  },

  create(data: {
    agentId: string;
    agentName: string;
    contractNumber?: string;
    rank: RankLevel;
    startDate: string;
  }): AgentRank {
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
    
    return database.createAgentRank(agentRank);
  },

  // Update rank (promote/change) - adds to history
  updateRank(id: string, data: {
    rank: RankLevel;
    startDate: string;
    agentName?: string;
  }): AgentRank | undefined {
    const existing = database.getAgentRankById(id);
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

    return database.updateAgentRank(id, updates);
  },

  update(id: string, data: Partial<AgentRank>): AgentRank | undefined {
    const now = new Date().toISOString();
    return database.updateAgentRank(id, { ...data, updatedAt: now });
  },

  delete(id: string): boolean {
    return database.deleteAgentRank(id);
  },

  // Get current valid rank for an agent by date
  getCurrentRankByAgentId(agentId: string, checkDate?: string): RankLevel | null {
    const agentRank = database.getAgentRankByAgentId(agentId);
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

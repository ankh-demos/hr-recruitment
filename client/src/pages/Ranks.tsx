import { useEffect, useState, useMemo } from 'react';
import { AgentRank, RankLevel, Employee } from '../types';
import { agentRanksApi, employeesApi } from '../services/api';
import { Pagination } from '../components/Pagination';

const RANK_LEVELS: RankLevel[] = ['Стандарт', 'Силвер', 'Голд', 'Платиниум', 'Даймонд'];

const RANK_COLORS: Record<RankLevel, string> = {
  'Стандарт': 'bg-gray-100 text-gray-800',
  'Силвер': 'bg-slate-200 text-slate-800',
  'Голд': 'bg-yellow-100 text-yellow-800',
  'Платиниум': 'bg-purple-100 text-purple-800',
  'Даймонд': 'bg-blue-100 text-blue-800'
};

// Office options
const OFFICES = ['Бүгд', 'Гэгээнтэн', 'Ривер', 'Даун таун'];

// Calculate end date as exactly +1 year from start date
function calculateEndDate(startDate: string): string {
  const date = new Date(startDate);
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split('T')[0];
}

// Check if rank is currently valid
function isRankValid(endDate: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return endDate >= today;
}

export function Ranks() {
  const [agentRanks, setAgentRanks] = useState<AgentRank[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRank, setSelectedRank] = useState<AgentRank | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOffice, setSelectedOffice] = useState<string>('Бүгд');
  const [viewMode, setViewMode] = useState<'list' | 'table'>('table');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Create/Add modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    agentId: '',
    agentName: '',
    contractNumber: '',
    rank: 'Стандарт' as RankLevel,
    startDate: ''
  });

  // Upgrade rank modal
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeForm, setUpgradeForm] = useState({
    rank: 'Стандарт' as RankLevel,
    startDate: ''
  });

  // Edit rank modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    agentName: '',
    contractNumber: '',
    currentRank: 'Стандарт' as RankLevel,
    currentStartDate: '',
    currentEndDate: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const filteredRanks = useMemo(() => {
    return agentRanks.filter(rank => {
      // Office filter - find employee by MLS (agentId) and check their officeName
      if (selectedOffice !== 'Бүгд') {
        const employee = employees.find(e => e.mls === rank.agentId);
        if (!employee || employee.officeName !== selectedOffice) {
          return false;
        }
      }

      const searchLower = searchTerm.toLowerCase();
      return searchTerm === '' ||
        rank.agentName.toLowerCase().includes(searchLower) ||
        rank.agentId.toLowerCase().includes(searchLower);
    });
  }, [agentRanks, searchTerm, selectedOffice, employees]);

  // Paginated ranks for table view
  const paginatedRanks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRanks.slice(start, start + pageSize);
  }, [filteredRanks, currentPage, pageSize]);

  // Categorize ranks by expiration status and sort by date
  const { expiredRanks, expiringThisMonth, expiringNextMonth } = useMemo(() => {
    const today = new Date();
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    const todayStr = today.toISOString().split('T')[0];
    const thisMonthEndStr = thisMonthEnd.toISOString().split('T')[0];
    const nextMonthEndStr = nextMonthEnd.toISOString().split('T')[0];

    const expired: AgentRank[] = [];
    const thisMonth: AgentRank[] = [];
    const nextMonth: AgentRank[] = [];

    filteredRanks.forEach(rank => {
      const endDate = rank.currentEndDate;
      if (endDate < todayStr) {
        expired.push(rank);
      } else if (endDate <= thisMonthEndStr) {
        thisMonth.push(rank);
      } else if (endDate <= nextMonthEndStr) {
        nextMonth.push(rank);
      }
    });

    // Sort by expiration date (ascending - soonest first)
    const sortByDate = (a: AgentRank, b: AgentRank) => a.currentEndDate.localeCompare(b.currentEndDate);
    expired.sort(sortByDate);
    thisMonth.sort(sortByDate);
    nextMonth.sort(sortByDate);

    return { expiredRanks: expired, expiringThisMonth: thisMonth, expiringNextMonth: nextMonth };
  }, [filteredRanks]);

  // Calculate rank counts by level
  const rankCounts = useMemo(() => {
    const counts: Record<RankLevel, number> = {
      'Стандарт': 0,
      'Силвер': 0,
      'Голд': 0,
      'Платиниум': 0,
      'Даймонд': 0
    };
    filteredRanks.forEach(rank => {
      if (rank.currentRank in counts) {
        counts[rank.currentRank]++;
      }
    });
    return counts;
  }, [filteredRanks]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  async function loadData(): Promise<AgentRank[]> {
    try {
      const [ranksData, employeesData] = await Promise.all([
        agentRanksApi.getAll(),
        employeesApi.getAll()
      ]);
      setAgentRanks(ranksData);
      setEmployees(employeesData);
      return ranksData;
    } catch (error) {
      console.error('Failed to load data:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }

  // Get employees with MLS that don't have rank records yet
  const availableEmployees = useMemo(() => {
    const existingAgentIds = agentRanks.map(r => r.agentId);
    return employees.filter(e => e.mls && !existingAgentIds.includes(e.mls));
  }, [employees, agentRanks]);

  async function handleCreate() {
    if (!createForm.agentId || !createForm.startDate) return;
    try {
      await agentRanksApi.create({
        agentId: createForm.agentId,
        agentName: createForm.agentName,
        contractNumber: createForm.contractNumber,
        rank: createForm.rank,
        startDate: createForm.startDate
      });
      setCreateModalOpen(false);
      setCreateForm({ agentId: '', agentName: '', contractNumber: '', rank: 'Стандарт', startDate: '' });
      loadData();
    } catch (error) {
      console.error('Failed to create agent rank:', error);
    }
  }

  async function handleUpgrade() {
    if (!selectedRank || !upgradeForm.startDate) return;
    try {
      await agentRanksApi.updateRank(selectedRank.id, {
        rank: upgradeForm.rank,
        startDate: upgradeForm.startDate
      });
      setUpgradeModalOpen(false);
      setUpgradeForm({ rank: 'Стандарт', startDate: '' });
      const freshRanks = await loadData();
      const updated = freshRanks.find(r => r.id === selectedRank.id);
      if (updated) setSelectedRank(updated);
    } catch (error) {
      console.error('Failed to upgrade rank:', error);
    }
  }

  function openUpgradeModal() {
    if (!selectedRank) return;
    // Suggest next rank level
    const currentIndex = RANK_LEVELS.indexOf(selectedRank.currentRank);
    const nextRank = currentIndex < RANK_LEVELS.length - 1
      ? RANK_LEVELS[currentIndex + 1]
      : selectedRank.currentRank;
    setUpgradeForm({
      rank: nextRank,
      startDate: new Date().toISOString().split('T')[0]
    });
    setUpgradeModalOpen(true);
  }

  function openEditModal() {
    if (!selectedRank) return;
    setEditForm({
      agentName: selectedRank.agentName || '',
      contractNumber: selectedRank.contractNumber || '',
      currentRank: selectedRank.currentRank,
      currentStartDate: selectedRank.currentStartDate || '',
      currentEndDate: selectedRank.currentEndDate || ''
    });
    setEditModalOpen(true);
  }

  async function handleEditSave() {
    if (!selectedRank) return;
    try {
      await agentRanksApi.update(selectedRank.id, editForm);
      setEditModalOpen(false);
      const freshRanks = await loadData();
      const updated = freshRanks.find(r => r.id === selectedRank.id);
      if (updated) setSelectedRank(updated);
    } catch (error) {
      console.error('Failed to update rank:', error);
    }
  }

  function handleEmployeeSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const mls = e.target.value;
    const employee = employees.find(emp => emp.mls === mls);
    if (employee) {
      setCreateForm({
        ...createForm,
        agentId: mls,
        agentName: `${employee.firstName} ${employee.lastName}`
      });
    }
  }

  // Export to CSV
  function exportToCSV() {
    const headers = [
      'Ангилал', 'Агентын нэр', 'ID (MLS)', 'Гэрээний дугаар', 'Одоогийн цол',
      'Гэрээ эхэлсэн', 'Гэрээ дуусах', 'Төлөв', 'Түүхийн тоо', 'Бүртгэсэн огноо'
    ];

    const rankToRow = (rank: AgentRank, category: string) => [
      category,
      rank.agentName || '',
      rank.agentId || '',
      rank.contractNumber || '',
      rank.currentRank || '',
      rank.currentStartDate || '',
      rank.currentEndDate || '',
      isRankValid(rank.currentEndDate) ? 'Хүчинтэй' : 'Дууссан',
      rank.rankHistory?.length.toString() || '0',
      rank.createdAt ? new Date(rank.createdAt).toLocaleDateString('mn-MN') : ''
    ];

    // Group by expiration category
    const today = new Date();
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    const todayStr = today.toISOString().split('T')[0];
    const thisMonthEndStr = thisMonthEnd.toISOString().split('T')[0];
    const nextMonthEndStr = nextMonthEnd.toISOString().split('T')[0];

    const expired: AgentRank[] = [];
    const thisMonth: AgentRank[] = [];
    const nextMonth: AgentRank[] = [];
    const valid: AgentRank[] = [];

    filteredRanks.forEach(rank => {
      const endDate = rank.currentEndDate;
      if (endDate < todayStr) {
        expired.push(rank);
      } else if (endDate <= thisMonthEndStr) {
        thisMonth.push(rank);
      } else if (endDate <= nextMonthEndStr) {
        nextMonth.push(rank);
      } else {
        valid.push(rank);
      }
    });

    const sortByDate = (a: AgentRank, b: AgentRank) => a.currentEndDate.localeCompare(b.currentEndDate);
    expired.sort(sortByDate);
    thisMonth.sort(sortByDate);
    nextMonth.sort(sortByDate);
    valid.sort(sortByDate);

    const rows: string[][] = [];

    if (expired.length > 0) {
      expired.forEach(r => rows.push(rankToRow(r, 'Дууссан')));
    }
    if (thisMonth.length > 0) {
      thisMonth.forEach(r => rows.push(rankToRow(r, 'Энэ сард дуусах')));
    }
    if (nextMonth.length > 0) {
      nextMonth.forEach(r => rows.push(rankToRow(r, 'Дараа сард дуусах')));
    }
    if (valid.length > 0) {
      valid.forEach(r => rows.push(rankToRow(r, 'Хүчинтэй')));
    }

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ranks_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Цолны мэдээлэл</h1>
            <p className="mt-1 text-purple-100">Агентуудын цол, зэрэглэлийн мэдээлэл</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-lg px-4 py-2">
              <span className="text-3xl font-bold">{agentRanks.length}</span>
              <span className="ml-2 text-purple-100">бүртгэл</span>
            </div>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CSV
            </button>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 font-medium"
            >
              + Шинэ цол нэмэх
            </button>
          </div>
        </div>
      </div>

      {/* Rank Summary by Level */}
      <div className="bg-white shadow rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Цолоор бүлэглэсэн
        </h3>
        <div className="grid grid-cols-5 gap-4">
          {RANK_LEVELS.map(rank => (
            <div key={rank} className={`${RANK_COLORS[rank]} rounded-lg p-4 text-center border-2 border-transparent hover:border-purple-400 transition-all`}>
              <p className="text-2xl font-bold">{rankCounts[rank]}</p>
              <p className="text-sm font-medium">{rank}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Search and View Toggle */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Агентын нэр эсвэл ID-р хайх..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="min-w-[150px]">
            <select
              value={selectedOffice}
              onChange={(e) => setSelectedOffice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-purple-500"
            >
              {OFFICES.map(office => (
                <option key={office} value={office}>{office === 'Бүгд' ? 'Бүх оффис' : office}</option>
              ))}
            </select>
          </div>
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm font-medium ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Жагсаалт
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm font-medium ${viewMode === 'table' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Хүснэгт
            </button>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          {filteredRanks.length} бүртгэл олдлоо
        </div>
      </div>

      {/* Expiration Status Sections */}
      {(expiredRanks.length > 0 || expiringThisMonth.length > 0 || expiringNextMonth.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Expired Ranks */}
          {expiredRanks.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="font-semibold text-red-800">Дууссан ({expiredRanks.length})</h3>
              </div>
              <ul className="space-y-2 max-h-40 overflow-y-auto">
                {expiredRanks.map(rank => (
                  <li key={rank.id} className="flex justify-between items-center text-sm bg-white rounded px-2 py-1">
                    <span className="text-red-900 font-medium">{rank.agentName}</span>
                    <span className="text-red-600">{new Date(rank.currentEndDate).toLocaleDateString('mn-MN')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Expiring This Month */}
          {expiringThisMonth.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="font-semibold text-orange-800">Энэ сард дуусах ({expiringThisMonth.length})</h3>
              </div>
              <ul className="space-y-2 max-h-40 overflow-y-auto">
                {expiringThisMonth.map(rank => (
                  <li key={rank.id} className="flex justify-between items-center text-sm bg-white rounded px-2 py-1">
                    <span className="text-orange-900 font-medium">{rank.agentName}</span>
                    <span className="text-orange-600">{new Date(rank.currentEndDate).toLocaleDateString('mn-MN')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Expiring Next Month */}
          {expiringNextMonth.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="font-semibold text-yellow-800">Дараа сард дуусах ({expiringNextMonth.length})</h3>
              </div>
              <ul className="space-y-2 max-h-40 overflow-y-auto">
                {expiringNextMonth.map(rank => (
                  <li key={rank.id} className="flex justify-between items-center text-sm bg-white rounded px-2 py-1">
                    <span className="text-yellow-900 font-medium">{rank.agentName}</span>
                    <span className="text-yellow-600">{new Date(rank.currentEndDate).toLocaleDateString('mn-MN')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ranks List */}
          <div className="lg:col-span-1 bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="font-medium text-gray-900">Цолны жагсаалт</h2>
            </div>
            <ul className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {filteredRanks.length === 0 ? (
                <li className="px-4 py-8 text-gray-500 text-center">
                  Цолны бүртгэл байхгүй
                </li>
              ) : (
                filteredRanks.map((rank) => (
                  <li
                    key={rank.id}
                    onClick={() => setSelectedRank(rank)}
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${selectedRank?.id === rank.id ? 'bg-purple-50' : ''
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{rank.agentName}</p>
                        <p className="text-sm text-gray-500">ID: {rank.agentId}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${RANK_COLORS[rank.currentRank]}`}>
                          {rank.currentRank}
                        </span>
                        <p className={`text-xs mt-1 ${isRankValid(rank.currentEndDate) ? 'text-green-600' : 'text-red-600'}`}>
                          {isRankValid(rank.currentEndDate) ? 'Хүчинтэй' : 'Дууссан'}
                        </p>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Rank Details */}
          <div className="lg:col-span-2 bg-white shadow rounded-lg overflow-hidden">
            {selectedRank ? (
              <div className="p-6 max-h-[700px] overflow-y-auto">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedRank.agentName}</h2>
                    <p className="text-gray-500">Агентын ID: {selectedRank.agentId}</p>
                    {selectedRank.contractNumber && (
                      <p className="text-gray-500">Гэрээний дугаар: {selectedRank.contractNumber}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={openEditModal}
                      className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
                    >
                      Засах
                    </button>
                    <button
                      onClick={openUpgradeModal}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      Цол өөрчлөх
                    </button>
                  </div>
                </div>

                {/* Current Rank */}
                <section className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border-2 ${RANK_BADGE_COLORS[selectedRank.currentRank]}">
                  <h3 className="font-semibold text-purple-800 mb-3">Одоогийн цол</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-purple-600">Цол:</span>
                      <p className="font-bold text-lg">{selectedRank.currentRank}</p>
                    </div>
                    <div>
                      <span className="text-sm text-purple-600">Гэрээ эхэлсэн:</span>
                      <p className="font-medium">{new Date(selectedRank.currentStartDate).toLocaleDateString('mn-MN')}</p>
                    </div>
                    <div>
                      <span className="text-sm text-purple-600">Гэрээ дуусах:</span>
                      <p className={`font-medium ${isRankValid(selectedRank.currentEndDate) ? 'text-green-600' : 'text-red-600'}`}>
                        {new Date(selectedRank.currentEndDate).toLocaleDateString('mn-MN')}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Rank History */}
                <section>
                  <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">Цолын түүх</h3>
                  <div className="space-y-3">
                    {[...selectedRank.rankHistory].reverse().map((history, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border-l-4 ${i === 0 ? 'bg-purple-50 border-purple-500' : 'bg-gray-50 border-gray-300'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${RANK_COLORS[history.rank]}`}>
                              {history.rank}
                            </span>
                            {i === 0 && (
                              <span className="text-xs text-purple-600 font-medium">Одоогийн</span>
                            )}
                          </div>
                          <span className={`text-xs ${isRankValid(history.endDate) ? 'text-green-600' : 'text-gray-500'}`}>
                            {isRankValid(history.endDate) ? 'Хүчинтэй' : 'Дууссан'}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-600 grid grid-cols-2 gap-2">
                          <div>Эхэлсэн: {new Date(history.startDate).toLocaleDateString('mn-MN')}</div>
                          <div>Дуусах: {new Date(history.endDate).toLocaleDateString('mn-MN')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                Агент сонгоно уу
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Table View */
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Агентын нэр</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID (MLS)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Гэрээний дугаар</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Цол</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Гэрээ эхэлсэн</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Гэрээ дуусах</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Төлөв</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedRanks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      Цолны бүртгэл байхгүй
                    </td>
                  </tr>
                ) : (
                  paginatedRanks.map((rank) => (
                    <tr
                      key={rank.id}
                      onClick={() => { setSelectedRank(rank); setViewMode('list'); }}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{rank.agentName}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">{rank.agentId}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">{rank.contractNumber || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${RANK_COLORS[rank.currentRank]}`}>
                          {rank.currentRank}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                        {new Date(rank.currentStartDate).toLocaleDateString('mn-MN')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                        {new Date(rank.currentEndDate).toLocaleDateString('mn-MN')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs font-medium ${isRankValid(rank.currentEndDate) ? 'text-green-600' : 'text-red-600'}`}>
                          {isRankValid(rank.currentEndDate) ? 'Хүчинтэй' : 'Дууссан'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            totalItems={filteredRanks.length}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      {/* Create Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Шинэ цол нэмэх</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Агент сонгох (МЛС-тэй)</label>
                <select
                  value={createForm.agentId}
                  onChange={handleEmployeeSelect}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Сонгоно уу...</option>
                  {availableEmployees.map(emp => (
                    <option key={emp.mls} value={emp.mls}>
                      {emp.firstName} {emp.lastName} (MLS: {emp.mls})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Агентын нэр</label>
                <input
                  type="text"
                  value={createForm.agentName}
                  onChange={(e) => setCreateForm({ ...createForm, agentName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Овог Нэр"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Гэрээний дугаар</label>
                <input
                  type="text"
                  value={createForm.contractNumber}
                  onChange={(e) => setCreateForm({ ...createForm, contractNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Гэрээний дугаар"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Цол</label>
                <select
                  value={createForm.rank}
                  onChange={(e) => setCreateForm({ ...createForm, rank: e.target.value as RankLevel })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  {RANK_LEVELS.map(rank => (
                    <option key={rank} value={rank}>{rank}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Гэрээ эхэлсэн огноо</label>
                <input
                  type="date"
                  value={createForm.startDate}
                  onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              {createForm.startDate && (
                <div className="text-sm text-gray-500">
                  Гэрээ дуусах огноо: {new Date(calculateEndDate(createForm.startDate)).toLocaleDateString('mn-MN')}
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Болих
              </button>
              <button
                onClick={handleCreate}
                disabled={!createForm.agentId || !createForm.startDate}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                Хадгалах
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {upgradeModalOpen && selectedRank && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Цол өөрчлөх</h3>
            <p className="text-gray-600 mb-4">
              {selectedRank.agentName} - одоогийн цол: <span className="font-medium">{selectedRank.currentRank}</span>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Шинэ цол</label>
                <select
                  value={upgradeForm.rank}
                  onChange={(e) => setUpgradeForm({ ...upgradeForm, rank: e.target.value as RankLevel })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  {RANK_LEVELS.map(rank => (
                    <option key={rank} value={rank}>{rank}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Гэрээ эхэлсэн огноо</label>
                <input
                  type="date"
                  value={upgradeForm.startDate}
                  onChange={(e) => setUpgradeForm({ ...upgradeForm, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              {upgradeForm.startDate && (
                <div className="text-sm text-gray-500">
                  Гэрээ дуусах огноо: {new Date(calculateEndDate(upgradeForm.startDate)).toLocaleDateString('mn-MN')}
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setUpgradeModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Болих
              </button>
              <button
                onClick={handleUpgrade}
                disabled={!upgradeForm.startDate}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                Хадгалах
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Цолын мэдээлэл засах</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Агентын нэр</label>
                <input
                  type="text"
                  value={editForm.agentName}
                  onChange={(e) => setEditForm({ ...editForm, agentName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Гэрээний дугаар</label>
                <input
                  type="text"
                  value={editForm.contractNumber}
                  onChange={(e) => setEditForm({ ...editForm, contractNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Одоогийн цол</label>
                <select
                  value={editForm.currentRank}
                  onChange={(e) => setEditForm({ ...editForm, currentRank: e.target.value as RankLevel })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  {RANK_LEVELS.map(rank => (
                    <option key={rank} value={rank}>{rank}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Гэрээ эхэлсэн огноо</label>
                <input
                  type="date"
                  value={editForm.currentStartDate}
                  onChange={(e) => setEditForm({ ...editForm, currentStartDate: e.target.value, currentEndDate: calculateEndDate(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Гэрээ дуусах огноо</label>
                <input
                  type="date"
                  value={editForm.currentEndDate}
                  onChange={(e) => setEditForm({ ...editForm, currentEndDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Болих
              </button>
              <button
                onClick={handleEditSave}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Хадгалах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

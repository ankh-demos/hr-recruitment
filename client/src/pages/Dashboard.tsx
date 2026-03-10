import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { applicationsApi, employeesApi, resignedAgentsApi, agentRanksApi } from '../services/api';
import { Application, Employee, ResignedAgent, AgentRank } from '../types';
import { useAuth } from '../context/AuthContext';

const OFFICES = ['Бүгд', 'Гэгээнтэн', 'Ривер', 'Даун таун'];

export function Dashboard() {
  const { user } = useAuth();
  const [selectedOffice, setSelectedOffice] = useState<string>('Бүгд');
  const [allApplications, setAllApplications] = useState<Application[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [allResignedAgents, setAllResignedAgents] = useState<ResignedAgent[]>([]);
  const [allAgentRanks, setAllAgentRanks] = useState<AgentRank[]>([]);
  const [stats, setStats] = useState({
    totalApplications: 0,
    newApplications: 0,
    interviewingApplications: 0,
    iconnectApplications: 0,
    totalEmployees: 0,
    newThisWeek: 0
  });
  const [employeeStats, setEmployeeStats] = useState({
    active: 0,           // Идэвхтэй
    new_0_6: 0,          // Шинэ 0-6 сар
    month_6_12: 0,       // 6-12 сар
    experienced_1_3: 0,  // 1-3 жил
    over_3_years: 0,     // 3+ жил
    inactive_transaction: 0, // Идэвхгүй, гүйлгээтэй
    inactive: 0,         // Идэвхгүй
    active_no_transaction: 0, // Идэвхтэй, гүйлгээгүй
    on_leave: 0,         // Чөлөөтэй
    maternity_leave: 0,  // Жирэмсний амралт
    team_member: 0,      // Багийн гишүүн
    top: 0,              // Топ
    resigned: 0,         // Гарсан
    totalIconnect: 0,    // Нийт iConnect
    totalAgents: 0,      // Нийт агент
    quality: 0           // Чанар
  });
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllBirthdays, setShowAllBirthdays] = useState(false);

  // Chart data
  const [statusDistribution, setStatusDistribution] = useState<{ status: string; count: number; color: string }[]>([]);

  // Load all data once
  useEffect(() => {
    async function loadData() {
      try {
        const [applications, employees, resignedAgents, agentRanks] = await Promise.all([
          applicationsApi.getAll(),
          employeesApi.getAll(),
          resignedAgentsApi.getAll(),
          agentRanksApi.getAll()
        ]);
        setAllApplications(applications);
        setAllEmployees(employees);
        setAllResignedAgents(resignedAgents);
        setAllAgentRanks(agentRanks);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Calculate stats based on selected office filter
  useEffect(() => {
    // Filter by office
    const filteredEmployees = selectedOffice === 'Бүгд'
      ? allEmployees
      : allEmployees.filter(e => e.officeName === selectedOffice);

    const filteredResignedAgents = selectedOffice === 'Бүгд'
      ? allResignedAgents
      : allResignedAgents.filter(r => r.officeName === selectedOffice);

    const filteredApplications = selectedOffice === 'Бүгд'
      ? allApplications
      : allApplications.filter(a => a.interestedOffice === selectedOffice);

    // Calculate new applications this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newThisWeek = filteredApplications.filter((a: Application) =>
      new Date(a.createdAt) >= oneWeekAgo
    ).length;

    // Calculate stats
    const newApps = filteredApplications.filter((a: Application) => a.status === 'new').length;
    const interviewingApps = filteredApplications.filter((a: Application) => a.status === 'interviewing').length;
    const iconnectApps = filteredApplications.filter((a: Application) => a.status === 'iconnect').length;
    const resignedCount = filteredResignedAgents.length;

    setStats({
      totalApplications: filteredApplications.length,
      newApplications: newApps,
      interviewingApplications: interviewingApps,
      iconnectApplications: iconnectApps,
      totalEmployees: filteredEmployees.length,
      newThisWeek: newThisWeek
    });

    // Calculate employee stats
    const activeCount = filteredEmployees.filter((e: Employee) => e.status === 'active').length;
    const new06Count = filteredEmployees.filter((e: Employee) => e.status === 'new_0_6').length;
    const month612Count = filteredEmployees.filter((e: Employee) => e.status === 'month_6_12').length;
    const experienced13Count = filteredEmployees.filter((e: Employee) => e.status === 'experienced_1_3').length;
    const over3YearsCount = filteredEmployees.filter((e: Employee) => e.status === 'over_3_years').length;
    const inactiveTransactionCount = filteredEmployees.filter((e: Employee) => e.status === 'inactive_transaction').length;
    const inactiveCount = filteredEmployees.filter((e: Employee) => e.status === 'inactive').length;
    const activeNoTransactionCount = filteredEmployees.filter((e: Employee) => e.status === 'active_no_transaction').length;
    const onLeaveCount = filteredEmployees.filter((e: Employee) => e.status === 'on_leave').length;
    const maternityLeaveCount = filteredEmployees.filter((e: Employee) => e.status === 'maternity_leave').length;
    const teamMemberCount = filteredEmployees.filter((e: Employee) => e.status === 'team_member').length;
    const topCount = filteredEmployees.filter((e: Employee) => e.status === 'top').length;
    const totalAgents = filteredEmployees.length;
    const qualitySum = activeCount + new06Count + month612Count + experienced13Count + over3YearsCount + inactiveTransactionCount + topCount;
    const quality = totalAgents > 0 ? (qualitySum / totalAgents) * 100 : 0;

    setEmployeeStats({
      active: activeCount,
      new_0_6: new06Count,
      month_6_12: month612Count,
      experienced_1_3: experienced13Count,
      over_3_years: over3YearsCount,
      inactive_transaction: inactiveTransactionCount,
      inactive: inactiveCount,
      active_no_transaction: activeNoTransactionCount,
      on_leave: onLeaveCount,
      maternity_leave: maternityLeaveCount,
      team_member: teamMemberCount,
      top: topCount,
      resigned: resignedCount,
      totalIconnect: iconnectApps,
      totalAgents: totalAgents,
      quality: quality
    });

    // Status distribution for chart
    const statusCounts = filteredApplications.reduce((acc: Record<string, number>, a: Application) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {});

    const statusColors: Record<string, string> = {
      'new': '#3B82F6',
      'interviewing': '#F59E0B',
      'iconnect': '#10B981',
      'fireup': '#8B5CF6',
      'cancelled': '#EF4444'
    };

    setStatusDistribution(Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count: count as number,
      color: statusColors[status] || '#6B7280'
    })));

    setRecentApplications(filteredApplications.slice(0, 5));
  }, [selectedOffice, allApplications, allEmployees, allResignedAgents]);

  const totalForChart = statusDistribution.reduce((sum, item) => sum + item.count, 0);

  // Categorize ranks by expiration status
  const { expiredRanks, expiringThisMonth, expiringNextMonth } = useMemo(() => {
    const today = new Date();
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    const todayStr = today.toISOString().split('T')[0];
    const thisMonthEndStr = thisMonthEnd.toISOString().split('T')[0];
    const nextMonthEndStr = nextMonthEnd.toISOString().split('T')[0];

    // Filter by office if needed
    const filteredRanks = selectedOffice === 'Бүгд'
      ? allAgentRanks
      : allAgentRanks.filter(rank => {
        const employee = allEmployees.find(e => e.mls === rank.agentId);
        return employee && employee.officeName === selectedOffice;
      });

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
  }, [allAgentRanks, allEmployees, selectedOffice]);

  // Birthday employees this month
  const birthdayEmployees = useMemo(() => {
    const currentMonth = new Date().getMonth(); // 0-indexed

    // Filter by office if needed
    const filteredEmployees = selectedOffice === 'Бүгд'
      ? allEmployees
      : allEmployees.filter(e => e.officeName === selectedOffice);

    const birthdays = filteredEmployees.filter(emp => {
      if (!emp.birthDate) return false;
      const birthMonth = new Date(emp.birthDate).getMonth();
      return birthMonth === currentMonth;
    });

    // Sort by day of month
    birthdays.sort((a, b) => {
      const dayA = new Date(a.birthDate).getDate();
      const dayB = new Date(b.birthDate).getDate();
      return dayA - dayB;
    });

    return birthdays;
  }, [allEmployees, selectedOffice]);

  // Monthly statistics for Fire UP and iConnect
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filter applications by office if needed
    const filteredApps = selectedOffice === 'Бүгд'
      ? allApplications
      : allApplications.filter(a => a.interestedOffice === selectedOffice);

    // Filter employees by office if needed
    const filteredEmps = selectedOffice === 'Бүгд'
      ? allEmployees
      : allEmployees.filter(e => e.officeName === selectedOffice);

    // Fire UP this month (applications with fireupDate in current month)
    const fireUpThisMonth = filteredApps.filter(app => {
      if (!app.fireupDate) return false;
      const fireupDate = new Date(app.fireupDate);
      return fireupDate.getMonth() === currentMonth && fireupDate.getFullYear() === currentYear;
    }).length;

    // iConnect this month (employees created this month - when app converts to iconnect, employee is created)
    const iConnectThisMonth = filteredEmps.filter(emp => {
      if (!emp.createdAt) return false;
      const createdDate = new Date(emp.createdAt);
      return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
    }).length;

    return { fireUpThisMonth, iConnectThisMonth };
  }, [allApplications, allEmployees, selectedOffice]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header with Office Filter */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Сайн байна у|у, {user?.fullName || 'Менежер'}! 👋</h1>
            <p className="mt-2 text-blue-100">Remax HR системийн хяналтын самбар</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-blue-100">Оффис:</label>
            <select
              value={selectedOffice}
              onChange={(e) => setSelectedOffice(e.target.value)}
              className="bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              {OFFICES.map(office => (
                <option key={office} value={office} className="text-gray-900">{office}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow-lg rounded-xl border-l-4 border-blue-500">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Нийт анкет</dt>
                  <dd className="text-2xl font-bold text-gray-900">{stats.totalApplications}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border-l-4 border-yellow-500">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Ярилцлага хийж байгаа</dt>
                  <dd className="text-2xl font-bold text-gray-900">{stats.interviewingApplications}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border-l-4 border-green-500">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Ажилтнууд</dt>
                  <dd className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-xl border-l-4 border-purple-500">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Энэ 7 хоногт шинэ</dt>
                  <dd className="text-2xl font-bold text-gray-900">{stats.newThisWeek}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="bg-white p-5 shadow rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Шинэ анкет</span>
            <span className="text-2xl font-bold text-gray-900">{stats.newApplications}</span>
          </div>
          <div className="mt-2">
            <span className="text-blue-600 text-sm font-medium">Шинээр ирсэн</span>
          </div>
        </div>
        <div className="bg-white p-5 shadow rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">iConnect хувь</span>
            <span className="text-2xl font-bold text-gray-900">
              {stats.totalApplications > 0
                ? Math.round((stats.iconnectApplications / stats.totalApplications) * 100)
                : 0}%
            </span>
          </div>
          <div className="mt-2">
            <span className="text-green-600 text-sm font-medium">Ажилтан болсон</span>
          </div>
        </div>
      </div>

      {/* Employee Status Stats */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Ажилтнуудын статистик</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">{employeeStats.active}</p>
                <p className="text-xs text-green-600">Идэвхтэй</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{employeeStats.new_0_6}</p>
                <p className="text-xs text-blue-600">Шинэ 0-6 сар</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-700">{employeeStats.inactive_transaction}</p>
                <p className="text-xs text-yellow-600">Идэвхгүй, гүйлгээтэй</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-100 border-l-4 border-gray-500 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-700">{employeeStats.inactive}</p>
                <p className="text-xs text-gray-600">Идэвхгүй</p>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-700">{employeeStats.active_no_transaction}</p>
                <p className="text-xs text-orange-600">Идэвхтэй, гүйлгээгүй</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700">{employeeStats.on_leave}</p>
                <p className="text-xs text-purple-600">Чөлөөтэй</p>
              </div>
            </div>
          </div>
          <div className="bg-pink-50 border-l-4 border-pink-500 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-pink-700">{employeeStats.maternity_leave}</p>
                <p className="text-xs text-pink-600">Жирэмсний амралт</p>
              </div>
            </div>
          </div>
          <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-indigo-700">{employeeStats.team_member}</p>
                <p className="text-xs text-indigo-600">Багийн гишүүн</p>
              </div>
            </div>
          </div>
          <div className="bg-cyan-50 border-l-4 border-cyan-500 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-cyan-700">{employeeStats.month_6_12}</p>
                <p className="text-xs text-cyan-600">6-12 сар</p>
              </div>
            </div>
          </div>
          <div className="bg-lime-50 border-l-4 border-lime-500 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-lime-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-lime-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-lime-700">{employeeStats.experienced_1_3}</p>
                <p className="text-xs text-lime-600">1-3 жил</p>
              </div>
            </div>
          </div>
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">{employeeStats.over_3_years}</p>
                <p className="text-xs text-amber-600">3+ жил</p>
              </div>
            </div>
          </div>
          <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-rose-700">{employeeStats.top}</p>
                <p className="text-xs text-rose-600">Топ</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-700">{employeeStats.resigned}</p>
                <p className="text-xs text-red-600">Гарсан</p>
              </div>
            </div>
          </div>
          <div className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-teal-700">{employeeStats.totalIconnect}</p>
                <p className="text-xs text-teal-600">Нийт iConnect</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-100 border-l-4 border-slate-500 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-700">{employeeStats.totalAgents}</p>
                <p className="text-xs text-slate-600">Нийт агент</p>
              </div>
            </div>
          </div>
          <div className="bg-emerald-100 border-l-4 border-emerald-500 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-200 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">{employeeStats.quality.toFixed(1)}%</p>
                <p className="text-xs text-emerald-600">Чанар</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expiring Ranks Section */}
      {(expiredRanks.length > 0 || expiringThisMonth.length > 0 || expiringNextMonth.length > 0) && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Цолны хугацаа
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Expired Ranks */}
            {expiredRanks.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="font-semibold text-red-800">Дууссан ({expiredRanks.length})</h4>
                </div>
                <ul className="space-y-2 max-h-32 overflow-y-auto">
                  {expiredRanks.slice(0, 5).map(rank => (
                    <li key={rank.id} className="flex justify-between items-center text-sm bg-white rounded px-2 py-1">
                      <span className="text-red-900 font-medium truncate">{rank.agentName}</span>
                      <span className="text-red-600 text-xs">{new Date(rank.currentEndDate).toLocaleDateString('mn-MN')}</span>
                    </li>
                  ))}
                  {expiredRanks.length > 5 && (
                    <li className="text-xs text-red-600 text-center">+{expiredRanks.length - 5} бусад</li>
                  )}
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
                  <h4 className="font-semibold text-orange-800">Энэ сард дуусах ({expiringThisMonth.length})</h4>
                </div>
                <ul className="space-y-2 max-h-32 overflow-y-auto">
                  {expiringThisMonth.slice(0, 5).map(rank => (
                    <li key={rank.id} className="flex justify-between items-center text-sm bg-white rounded px-2 py-1">
                      <span className="text-orange-900 font-medium truncate">{rank.agentName}</span>
                      <span className="text-orange-600 text-xs">{new Date(rank.currentEndDate).toLocaleDateString('mn-MN')}</span>
                    </li>
                  ))}
                  {expiringThisMonth.length > 5 && (
                    <li className="text-xs text-orange-600 text-center">+{expiringThisMonth.length - 5} бусад</li>
                  )}
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
                  <h4 className="font-semibold text-yellow-800">Дараа сард дуусах ({expiringNextMonth.length})</h4>
                </div>
                <ul className="space-y-2 max-h-32 overflow-y-auto">
                  {expiringNextMonth.slice(0, 5).map(rank => (
                    <li key={rank.id} className="flex justify-between items-center text-sm bg-white rounded px-2 py-1">
                      <span className="text-yellow-900 font-medium truncate">{rank.agentName}</span>
                      <span className="text-yellow-600 text-xs">{new Date(rank.currentEndDate).toLocaleDateString('mn-MN')}</span>
                    </li>
                  ))}
                  {expiringNextMonth.length > 5 && (
                    <li className="text-xs text-yellow-600 text-center">+{expiringNextMonth.length - 5} бусад</li>
                  )}
                </ul>
              </div>
            )}
          </div>
          <div className="mt-4 text-right">
            <Link to="/ranks" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
              Бүх цолыг харах →
            </Link>
          </div>
        </div>
      )}

      {/* Birthday Section */}
      {birthdayEmployees.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <span className="text-2xl">🎂</span>
              Энэ сарын төрсөн өдөр ({birthdayEmployees.length})
            </h3>
            {birthdayEmployees.length > 8 && (
              <button
                onClick={() => setShowAllBirthdays(!showAllBirthdays)}
                className="flex items-center gap-1 text-sm font-medium text-pink-600 hover:text-pink-800 transition-colors"
              >
                {showAllBirthdays ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                    Хураах
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    Бүгдийг харах ({birthdayEmployees.length - 8} бусад)
                  </>
                )}
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {(showAllBirthdays ? birthdayEmployees : birthdayEmployees.slice(0, 8)).map(emp => (
              <div key={emp.id} className="bg-pink-50 border border-pink-200 rounded-lg p-3 flex items-center gap-3">
                {emp.photoUrl ? (
                  <img src={emp.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 bg-pink-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-pink-600">
                      {emp.firstName?.charAt(0) || ''}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{emp.firstName} {emp.lastName}</p>
                  <p className="text-xs text-pink-600">
                    {new Date(emp.birthDate).toLocaleDateString('mn-MN', { month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Statistics */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Энэ сарын статистик
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                <span className="text-xl">🔥</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700">{monthlyStats.fireUpThisMonth}</p>
                <p className="text-sm text-purple-600">Fire UP товлосон</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                <span className="text-xl">✅</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">{monthlyStats.iConnectThisMonth}</p>
                <p className="text-sm text-green-600">iConnect нээлгэсэн</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Анкетын төлөв</h3>
          {totalForChart > 0 ? (
            <div className="space-y-4">
              {statusDistribution.map((item) => (
                <div key={item.status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-gray-600">
                      {item.status === 'new' ? 'Шинэ анкет' :
                        item.status === 'interviewing' ? 'Ярилцлага хийж байгаа' :
                          item.status === 'iconnect' ? 'iConnect нээлгэсэн' :
                            item.status === 'fireup' ? 'Fire UP товлосон' :
                              item.status === 'cancelled' ? 'Ажиллахаа больсон' : item.status}
                    </span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${(item.count / totalForChart) * 100}%`,
                        backgroundColor: item.color
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Мэдээлэл байхгүй</p>
          )}
        </div>

        {/* Recent Applications */}
        <div className="bg-white shadow rounded-lg lg:col-span-2">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Сүүлийн анкетууд</h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {recentApplications.length === 0 ? (
              <li className="px-4 py-8 text-gray-500 text-center">Анкет байхгүй</li>
            ) : (
              recentApplications.map((app) => (
                <li key={app.id} className="px-4 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-900">
                        <span className="font-bold">{app.firstName}</span> {app.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{app.email}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${app.status === 'new' ? 'bg-blue-100 text-blue-800' :
                      app.status === 'interviewing' ? 'bg-yellow-100 text-yellow-800' :
                        app.status === 'iconnect' ? 'bg-green-100 text-green-800' :
                          app.status === 'fireup' ? 'bg-purple-100 text-purple-800' :
                            'bg-red-100 text-red-800'
                      }`}>
                      {app.status === 'new' ? 'Шинэ анкет' :
                        app.status === 'interviewing' ? 'Ярилцлага хийж байгаа' :
                          app.status === 'iconnect' ? 'iConnect нээлгэсэн' :
                            app.status === 'fireup' ? 'Fire UP товлосон' : 'Ажиллахаа больсон'}
                    </span>
                  </div>
                </li>
              ))
            )}
          </ul>
          <div className="px-4 py-4 border-t border-gray-200">
            <Link to="/applications" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
              Бүх анкетыг харах →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Түргэн үйлдлүүд</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Link to="/employees" className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-8 h-8 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Агентууд</span>
          </Link>
          <Link to="/applications" className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-8 h-8 text-purple-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Анкетууд</span>
          </Link>
          <Link to="/admin" className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-8 h-8 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">Тохиргоо</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
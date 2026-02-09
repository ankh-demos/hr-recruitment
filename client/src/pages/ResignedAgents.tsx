import { useEffect, useState, useMemo } from 'react';
import { ResignedAgent } from '../types';
import { resignedAgentsApi } from '../services/api';
import { Pagination } from '../components/Pagination';

export function ResignedAgents() {
  const [resignedAgents, setResignedAgents] = useState<ResignedAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<ResignedAgent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [moveBackConfirmOpen, setMoveBackConfirmOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    loadData();
  }, []);

  const filteredAgents = useMemo(() => {
    return resignedAgents.filter(agent => {
      const searchLower = searchTerm.toLowerCase();
      return searchTerm === '' || 
        agent.firstName.toLowerCase().includes(searchLower) ||
        agent.lastName.toLowerCase().includes(searchLower) ||
        agent.email.toLowerCase().includes(searchLower) ||
        (agent.interestedOffice && agent.interestedOffice.toLowerCase().includes(searchLower));
    });
  }, [resignedAgents, searchTerm]);

  // Paginated agents for table view
  const paginatedAgents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAgents.slice(start, start + pageSize);
  }, [filteredAgents, currentPage, pageSize]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  async function loadData() {
    try {
      const data = await resignedAgentsApi.getAll();
      setResignedAgents(data);
    } catch (error) {
      console.error('Failed to load resigned agents:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleMoveBackToEmployees() {
    if (!selectedAgent) return;
    try {
      await resignedAgentsApi.moveToEmployee(selectedAgent.id);
      setMoveBackConfirmOpen(false);
      setSelectedAgent(null);
      loadData();
    } catch (error) {
      console.error('Failed to move back to employees:', error);
    }
  }

  // Export to CSV
  function exportToCSV() {
    const headers = [
      'Овог', 'Нэр', 'Ургийн овог', 'Оффис', 'Имэйл', 'Утас', 'Яаралтай утас',
      'Регистрийн дугаар', 'Төрсөн огноо', 'Хүйс', 'Төрсөн газар', 'Үндэс угсаа',
      'Гэрийн хаяг', 'Дүүрэг', 'Certificate дугаар', 'ИБД', 'СЗХ', 'MLS',
      'Банк', 'Дансны дугаар', 'Ажилд орсон', 'Ажилласан сар', 'Гарсан огноо',
      'Гарсан шалтгаан', 'Тэмдэглэл'
    ];
    
    const rows = filteredAgents.map(agent => [
      agent.lastName || '',
      agent.firstName || '',
      agent.familyName || '',
      agent.interestedOffice || '',
      agent.email || '',
      agent.phone || '',
      agent.emergencyPhone || '',
      agent.registerNumber || '',
      agent.birthDate || '',
      agent.gender === 'male' ? 'Эрэгтэй' : 'Эмэгтэй',
      agent.birthPlace || '',
      agent.ethnicity || '',
      agent.homeAddress || '',
      agent.district || '',
      agent.certificateNumber || '',
      agent.citizenRegistrationNumber || '',
      agent.szhCertificateNumber || '',
      agent.mls || '',
      agent.bank || '',
      agent.accountNumber || '',
      agent.employmentStartDate || '',
      agent.workedMonths?.toString() || '',
      agent.resignedDate || '',
      agent.resignationReason || '',
      agent.resignationNotes || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resigned_agents_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Гарсан агентууд</h1>
            <p className="mt-1 text-red-100">Ажлаас гарсан ажилтнууд</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-lg px-4 py-2">
              <span className="text-3xl font-bold">{resignedAgents.length}</span>
              <span className="ml-2 text-red-100">гарсан</span>
            </div>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CSV татах
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
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
              placeholder="Нэр, имэйл, оффисоор хайх..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm font-medium ${viewMode === 'list' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Жагсаалт
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm font-medium ${viewMode === 'table' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Хүснэгт
            </button>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          {filteredAgents.length} агент олдлоо
        </div>
      </div>

      {viewMode === 'list' ? (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agents List */}
        <div className="lg:col-span-1 bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="font-medium text-gray-900">Гарсан агентууд ({filteredAgents.length})</h2>
          </div>
          <ul className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {filteredAgents.length === 0 ? (
              <li className="px-4 py-8 text-gray-500 text-center">
                Гарсан агент байхгүй
              </li>
            ) : (
              filteredAgents.map((agent) => (
                <li
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${
                    selectedAgent?.id === agent.id ? 'bg-red-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {agent.photoUrl ? (
                      <img src={agent.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <span className="text-red-600 font-medium">
                          {agent.firstName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {agent.lastName} {agent.firstName}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{agent.interestedOffice}</p>
                      <p className="text-xs text-red-500">
                        Гарсан: {agent.resignedDate}
                      </p>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Agent Details */}
        <div className="lg:col-span-2 bg-white shadow rounded-lg overflow-hidden">
          {selectedAgent ? (
            <div className="p-6 max-h-[700px] overflow-y-auto">
              <div className="flex items-start gap-4 mb-6">
                {selectedAgent.photoUrl ? (
                  <img src={selectedAgent.photoUrl} alt="" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-red-600 text-2xl font-medium">
                      {selectedAgent.firstName.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedAgent.familyName} {selectedAgent.lastName} {selectedAgent.firstName}
                  </h2>
                  <p className="text-gray-500">{selectedAgent.email}</p>
                  <p className="text-gray-500">{selectedAgent.phone}</p>
                </div>
              </div>

              {/* Resignation Info */}
              <section className="mb-6 bg-red-50 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-red-800">Гарсан мэдээлэл</h3>
                  <button
                    onClick={() => setMoveBackConfirmOpen(true)}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Буцааж ажилтан болгох
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-red-600">Гарсан огноо:</span>
                    <p className="font-medium">{selectedAgent.resignedDate}</p>
                  </div>
                  <div>
                    <span className="text-red-600">Ажилласан хугацаа:</span>
                    <p className="font-medium">{selectedAgent.workedMonths} сар</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-red-600">Гарсан шалтгаан:</span>
                    <p className="font-medium whitespace-pre-wrap">{selectedAgent.resignationReason}</p>
                  </div>
                  {selectedAgent.resignationNotes && (
                    <div className="col-span-2">
                      <span className="text-red-600">Нэмэлт тэмдэглэл:</span>
                      <p className="font-medium whitespace-pre-wrap">{selectedAgent.resignationNotes}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Work Info */}
              <section className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">Ажлын мэдээлэл</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">Оффис:</span> {selectedAgent.interestedOffice}</div>
                  <div><span className="text-gray-500">Ажилд орсон:</span> {selectedAgent.hiredDate}</div>
                  {selectedAgent.trainingNumber && (
                    <div><span className="text-gray-500">Сургалтын дугаар:</span> {selectedAgent.trainingNumber}</div>
                  )}
                  {selectedAgent.certificateNumber && (
                    <div><span className="text-gray-500">Certificate дугаар:</span> {selectedAgent.certificateNumber}</div>
                  )}
                  {selectedAgent.remaxEmail && (
                    <div><span className="text-gray-500">Remax имэйл:</span> {selectedAgent.remaxEmail}</div>
                  )}
                  {selectedAgent.mls && (
                    <div><span className="text-gray-500">МЛС:</span> {selectedAgent.mls}</div>
                  )}
                </div>
              </section>

              {/* Personal Info */}
              <section className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">Хувийн мэдээлэл</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">Төрсөн огноо:</span> {selectedAgent.birthDate}</div>
                  <div><span className="text-gray-500">Хүйс:</span> {selectedAgent.gender === 'male' ? 'Эрэгтэй' : 'Эмэгтэй'}</div>
                  <div><span className="text-gray-500">Регистр:</span> {selectedAgent.registerNumber}</div>
                  <div><span className="text-gray-500">Жолооны эрх:</span> {selectedAgent.hasDriverLicense ? 'Тийм' : 'Үгүй'}</div>
                </div>
              </section>

              {/* Contact Info */}
              <section className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">Холбоо барих</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">Утас:</span> {selectedAgent.phone}</div>
                  <div><span className="text-gray-500">Яаралтай холбоо:</span> {selectedAgent.emergencyPhone}</div>
                  <div><span className="text-gray-500">Имэйл:</span> {selectedAgent.email}</div>
                  <div><span className="text-gray-500">Facebook:</span> {selectedAgent.facebook}</div>
                  <div className="col-span-2"><span className="text-gray-500">Хаяг:</span> {selectedAgent.homeAddress}</div>
                </div>
              </section>

              {/* Education */}
              {selectedAgent.education && selectedAgent.education.length > 0 && (
                <section className="mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">Боловсрол</h3>
                  <div className="space-y-2">
                    {selectedAgent.education.map((edu, i) => (
                      <div key={i} className="text-sm bg-gray-50 p-2 rounded">
                        <p className="font-medium">{edu.school}</p>
                        <p className="text-gray-500">{edu.major} ({edu.enrollmentDate} - {edu.graduationDate})</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
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
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Зураг</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Овог</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Нэр</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Оффис</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имэйл</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Утас</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Регистр</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MLS</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certificate</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Банк</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Данс</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ажилд орсон</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ажилласан</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Гарсан огноо</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Гарсан шалтгаан</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedAgents.length === 0 ? (
                <tr>
                  <td colSpan={15} className="px-4 py-8 text-center text-gray-500">
                    Гарсан агент байхгүй
                  </td>
                </tr>
              ) : (
                paginatedAgents.map((agent) => (
                  <tr 
                    key={agent.id} 
                    onClick={() => { setSelectedAgent(agent); setViewMode('list'); }}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-3 py-2 whitespace-nowrap">
                      {agent.photoUrl ? (
                        <img src={agent.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-red-600">
                            {agent.firstName?.charAt(0) || ''}{agent.lastName?.charAt(0) || ''}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">{agent.lastName || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-900">{agent.firstName || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">{agent.interestedOffice || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">{agent.email || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">{agent.phone || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">{agent.registerNumber || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">{agent.mls || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">{agent.certificateNumber || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">{agent.bank || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">{agent.accountNumber || '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">{agent.employmentStartDate ? new Date(agent.employmentStartDate).toLocaleDateString('mn-MN') : '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">{agent.workedMonths ? `${agent.workedMonths} сар` : '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">{agent.resignedDate ? new Date(agent.resignedDate).toLocaleDateString('mn-MN') : '-'}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500 max-w-[150px] truncate" title={agent.resignationReason}>{agent.resignationReason || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          totalItems={filteredAgents.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>
      )}

      {/* Move Back Confirmation Modal */}
      {moveBackConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Ажилтан болгох уу?</h3>
            <p className="text-gray-600 mb-6">
              {selectedAgent?.lastName} {selectedAgent?.firstName}-г буцааж ажилтан болгохдоо итгэлтэй байна уу?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setMoveBackConfirmOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Болих
              </button>
              <button
                onClick={handleMoveBackToEmployees}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Тийм
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

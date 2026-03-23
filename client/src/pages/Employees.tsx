import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Employee, RankLevel, AgentRank } from '../types';
import { resignedAgentsApi, agentRanksApi, employeesApi } from '../services/api';
import { Pagination } from '../components/Pagination';

// Rank color mapping
const RANK_COLORS: Record<RankLevel, string> = {
  'Стандарт': 'bg-gray-100 text-gray-800',
  'Силвер': 'bg-slate-200 text-slate-800',
  'Голд': 'bg-yellow-100 text-yellow-800',
  'Платиниум': 'bg-purple-100 text-purple-800',
  'Даймонд': 'bg-blue-100 text-blue-800'
};

// Employee status options (without 'resigned' - that's a separate table now)
const EMPLOYEE_STATUSES = [
  { value: 'active', label: 'Идэвхитэй', color: 'bg-green-100 text-green-800' },
  { value: 'active_transaction', label: 'Идэвхитэй гүйлгээтэй', color: 'bg-teal-100 text-teal-800' },
  { value: 'active_no_transaction', label: 'Идэвхитэй, гүйлгээгүй', color: 'bg-orange-100 text-orange-800' },
  { value: 'inactive_transaction', label: 'Идэвхигүй, гүйлгээтэй', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'inactive', label: 'Идэвхигүй', color: 'bg-gray-100 text-gray-800' },
  { value: 'on_leave_iconnect', label: 'Чөлөөтэй iconnect-тэй', color: 'bg-purple-100 text-purple-800' },
  { value: 'on_leave_closed', label: 'Чөлөөтэй Iconnect хаасан', color: 'bg-pink-100 text-pink-800' },
  { value: 'hidden_iconnect', label: 'Iconnect нуусан агент', color: 'bg-red-100 text-red-800' },
  { value: 'left_team', label: 'Багаас гарсан', color: 'bg-rose-100 text-rose-800' }
];

// Resignation reason options
const RESIGNATION_REASONS = [
  'Шилжсэн',
  'Ажиллах чадваргүй',
  'Зайлшгүй шалтгаан',
  'Байгууллагын соёл таалагдаагүй',
  'Давхар ажилтай',
  'Оффисын зүгээс гэрээ цуцалсан',
  'Урт хугацааны чөлөө авсан'
] as const;

// Office options
const OFFICES = ['Бүгд', 'Гэгээнтэн', 'Ривер', 'Даун таун'];

const EMPLOYEE_STATUS_TOOLTIPS: Record<string, string> = {
  'Идэвхитэй гүйлгээтэй': 'Тухайн сард 1-2 гүйлгээтэй агентуудыг бүртгэнэ',
  'Идэвхитэй, гүйлгээгүй': 'Тухайн сард оффис дээр ирдэг хэрнээ гүйлгээ гаргаагүй агентыг бүртгэнэ',
  'Идэвхигүй, гүйлгээтэй': 'Тухайн сард оффис дээр ирдэггүй хэрнээ гүйлгээ гаргадаг агентыг бүртгэнэ',
  'Идэвхигүй': 'Оффис дээр огт ирдэггүй агентыг бүртгэнэ',
  'Чөлөөтэй iconnect-тэй': 'Тухайн сард чөлөө авч байгаа агентын чөлөөний хүсэлтийг үндэслэн бүртгэнэ',
  'Чөлөөтэй Iconnect хаасан': 'Тухайн сард чөлөө авч байгаа агентын чөлөөний хүсэлтийг үндэслэн, брокер эзэмшигчийн шийдвэрээр бүртгэнэ',
  'Iconnect нуусан агент': 'Тухайн сард оффис фий-ний өр төлбөртэй байснаас албан бичиг авсан iconnect-оо нуух болсон агентыг бүртгэнэ'
};

function getStatusInfo(status: string) {
  return EMPLOYEE_STATUSES.find(s => s.value === status) || { value: status, label: status, color: 'bg-gray-100 text-gray-800' };
}

function getEmployeeStatusTooltip(status: string) {
  const label = getStatusInfo(status).label;
  return EMPLOYEE_STATUS_TOOLTIPS[label] || '';
}

// Calculate months between two dates
function calculateMonthsDiff(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return Math.max(0, months);
}

function normalizeDateForApi(value: string): string | undefined {
  const raw = (value || '').trim();
  if (!raw) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const a = Number(slashMatch[1]);
    const b = Number(slashMatch[2]);
    const year = Number(slashMatch[3]);

    let month = a;
    let day = b;
    if (a > 12 && b <= 12) {
      day = a;
      month = b;
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString().slice(0, 10);
}

export function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [agentRanks, setAgentRanks] = useState<AgentRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedOffice, setSelectedOffice] = useState<string>('Бүгд');
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'table'>('table');

  // New filters
  const [iConnectFilter, setIConnectFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [szhFilter, setSzhFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [mlsFilter, setMlsFilter] = useState<'all' | 'filled' | 'empty'>('all');

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Resignation modal state
  const [resignConfirmOpen, setResignConfirmOpen] = useState(false);
  const [resignFormOpen, setResignFormOpen] = useState(false);
  const [resignForm, setResignForm] = useState({
    workedMonths: 0,
    resignedDate: '',
    resignationReason: '' as typeof RESIGNATION_REASONS[number] | '',
    resignationNotes: ''
  });

  // Edit modal for all fields
  const [editFieldsOpen, setEditFieldsOpen] = useState(false);
  const [editFieldsError, setEditFieldsError] = useState<string | null>(null);
  const [editFields, setEditFields] = useState({
    iConnectName: '',
    familyName: '',
    lastName: '',
    firstName: '',
    interestedOffice: '',
    birthPlace: '',
    ethnicity: '',
    gender: 'male' as 'male' | 'female',
    birthDate: '',
    registerNumber: '',
    homeAddress: '',
    phone: '',
    emergencyPhone: '',
    email: '',
    facebook: '',
    hasDriverLicense: false,
    employmentStartDate: '',
    certificateNumber: '',
    citizenRegistrationNumber: '',
    szhCertificateNumber: '',
    certificateDate: '',
    remaxEmail: '',
    mls: '',
    bank: '',
    accountNumber: '',
    district: '',
    detailedAddress: '',
    childrenCount: 0,
    officeName: '',
    status: 'active' as Employee['status'],
    hasIConnect: false,
    hasTop: false,
    isAssistant: false,
    assistantOf: '',
    hasSzhTraining: false,
    szhTrainingDate: '',
    szhOfficialLetterNumber: '',
    hasFirstTransaction: false,
    excludeFromKpi: false
  });

  // CSV Import state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importData, setImportData] = useState<Partial<Employee>[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const lastLoadRef = useRef<number>(0);
  const location = useLocation();

  // Load data function - with built-in debounce
  const loadData = useCallback(async (force = false) => {
    const now = Date.now();
    const MIN_INTERVAL = 2000; // Minimum 2 seconds between loads
    
    if (!force && now - lastLoadRef.current < MIN_INTERVAL) {
      return;
    }
    
    try {
      setLoading(true);
      lastLoadRef.current = now;
      const [data, ranksData] = await Promise.all([
        employeesApi.getAll(),
        agentRanksApi.getAll()
      ]);
      setEmployees(data);
      setAgentRanks(ranksData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on mount and when navigating to this page
  useEffect(() => {
    loadData(true);
  }, [location.key, loadData]);

  function toggleStatusFilter(status: string) {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  }

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    const filtered = employees.filter(employee => {
      // Office filter - use officeName only
      if (selectedOffice !== 'Бүгд' && employee.officeName !== selectedOffice) {
        return false;
      }

      // Status filter (multi-select)
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(employee.status)) {
        return false;
      }

      // iConnect filter
      if (iConnectFilter === 'yes' && !employee.hasIConnect) return false;
      if (iConnectFilter === 'no' && employee.hasIConnect) return false;

      // SZH training filter
      if (szhFilter === 'yes' && !employee.hasSzhTraining) return false;
      if (szhFilter === 'no' && employee.hasSzhTraining) return false;

      // MLS filter
      const hasMls = !!employee.mls?.trim();
      if (mlsFilter === 'filled' && !hasMls) return false;
      if (mlsFilter === 'empty' && hasMls) return false;

      // Search filter
      if (searchTerm !== '') {
        const searchLower = searchTerm.toLowerCase();
        const matchFields = [
          employee.firstName,
          employee.mls,
          employee.iConnectName,
          employee.remaxEmail,
          employee.lastName,
          employee.familyName,
          employee.email,
          employee.phone,
          employee.interestedOffice,
          employee.officeName,
          employee.registerNumber
        ];
        const matchesSearch = matchFields.some(field =>
          field && field.toLowerCase().includes(searchLower)
        );
        if (!matchesSearch) return false;
      }

      return true;
    });

    // Sort by MLS (ascending), keep empty MLS at the end
    return filtered.sort((a, b) => {
      const aMls = (a.mls || '').trim();
      const bMls = (b.mls || '').trim();

      if (!aMls && !bMls) return 0;
      if (!aMls) return 1;
      if (!bMls) return -1;

      return aMls.localeCompare(bMls, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [employees, searchTerm, selectedStatuses, selectedOffice, iConnectFilter, szhFilter, mlsFilter]);

  // Paginated employees for table view
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEmployees.slice(start, start + pageSize);
  }, [filteredEmployees, currentPage, pageSize]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatuses, selectedOffice, iConnectFilter, szhFilter, mlsFilter]);

  // Get current valid rank for an employee by MLS
  function getCurrentRankForEmployee(mls: string | undefined): AgentRank | null {
    if (!mls) return null;
    const rank = agentRanks.find(r => r.agentId === mls);
    if (!rank) return null;
    const today = new Date().toISOString().split('T')[0];
    if (rank.currentEndDate >= today) {
      return rank;
    }
    return null;
  }

  // Export to CSV
  function exportToCSV() {
    const headers = [
      'iConnect нэр', 'Овог', 'Нэр', 'Ургийн овог', 'Оффис', 'Имэйл', 'Утас', 'Яаралтай утас',
      'Регистрийн дугаар', 'Төрсөн огноо', 'Хүйс', 'Төрсөн газар', 'Үндэс угсаа',
      'Гэрийн хаяг', 'Дүүрэг', 'Facebook', 'Жолооны эрх',
      'Certificate дугаар', 'Иргэний бүртгэлийн дугаар', 'СЗХ сертификатын дугаар',
      'Сертификат авсан огноо', 'Remax имэйл', 'MLS', 'Банк', 'Дансны дугаар',
      'Хүүхдийн тоо', 'Ажилд орсон огноо', 'Төлөв', 'Цол',
      'iConnect', 'TOP', 'Туслах эсэх', 'Хэний туслах',
      'СЗХ сургалт', 'СЗХ сургалт огноо', 'СЗХ албан бичгийн дугаар'
    ];

    const rows = filteredEmployees.map(emp => {
      const rank = getCurrentRankForEmployee(emp.mls);
      return [
        emp.iConnectName || '',
        emp.lastName || '',
        emp.firstName || '',
        emp.familyName || '',
        emp.interestedOffice || '',
        emp.email || '',
        emp.phone || '',
        emp.emergencyPhone || '',
        emp.registerNumber || '',
        emp.birthDate || '',
        emp.gender === 'male' ? 'Эрэгтэй' : 'Эмэгтэй',
        emp.birthPlace || '',
        emp.ethnicity || '',
        emp.homeAddress || '',
        emp.district || '',
        emp.facebook || '',
        emp.hasDriverLicense ? 'Тийм' : 'Үгүй',
        emp.certificateNumber || '',
        emp.citizenRegistrationNumber || '',
        emp.szhCertificateNumber || '',
        emp.certificateDate || '',
        emp.remaxEmail || '',
        emp.mls || '',
        emp.bank || '',
        emp.accountNumber || '',
        emp.childrenCount?.toString() || '',
        emp.employmentStartDate || '',
        getStatusInfo(emp.status).label,
        rank?.currentRank || '',
        emp.hasIConnect ? 'Тийм' : 'Үгүй',
        emp.hasTop ? 'Тийм' : 'Үгүй',
        emp.isAssistant ? 'Тийм' : 'Үгүй',
        emp.assistantOf || '',
        emp.hasSzhTraining ? 'Тийм' : 'Үгүй',
        emp.szhTrainingDate || '',
        emp.szhOfficialLetterNumber || ''
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // CSV Template columns for bulk import
  const CSV_TEMPLATE_HEADERS = [
    'iConnectName', 'familyName', 'lastName', 'firstName', 'interestedOffice', 'email', 'phone', 'emergencyPhone',
    'registerNumber', 'birthDate', 'gender', 'birthPlace', 'ethnicity',
    'homeAddress', 'district', 'facebook', 'hasDriverLicense',
    'certificateNumber', 'citizenRegistrationNumber', 'szhCertificateNumber',
    'certificateDate', 'remaxEmail', 'mls', 'bank', 'accountNumber',
    'childrenCount', 'employmentStartDate', 'status',
    'hasIConnect', 'hasTop', 'isAssistant', 'assistantOf',
    'hasSzhTraining', 'szhTrainingDate', 'szhOfficialLetterNumber'
  ];

  // Download CSV template
  function downloadCSVTemplate() {
    const headerRow = CSV_TEMPLATE_HEADERS.join(',');
    const exampleRow = [
      'iConnect нэр', 'Ургийн овог', 'Овог', 'Нэр', 'Оффис', 'email@example.com', '99001122', '99003344',
      'АА00112233', '1990-01-15', 'male', 'Улаанбаатар', 'Халх',
      'Хаяг', 'БЗД', 'facebook_id', 'true',
      'CERT001', 'REG001', 'SZH001',
      '2024-01-01', 'remax@email.com', 'MLS001', 'Хаан банк', '5000123456',
      '2', '2024-01-01', 'active',
      'true', 'false', 'false', '',
      'true', '2024-06-01', 'SZH-001'
    ].join(',');

    const csvContent = headerRow + '\n' + exampleRow;
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'employees_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  // Parse CSV file
  function parseCSV(text: string): Partial<Employee>[] {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const employees: Partial<Employee>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const employee: Partial<Employee> = {
        applicationId: '', // Will be auto-generated
        hiredDate: new Date().toISOString(),
        familyMembers: [],
        education: [],
        languages: [],
        workExperience: [],
        awards: [],
        otherSkills: '',
        strengthsWeaknesses: '',
        photoUrl: '',
        referralSource: '',
        signatureUrl: ''
      };

      headers.forEach((header, index) => {
        const value = values[index] || '';
        if (header === 'hasDriverLicense' || header === 'hasIConnect' || header === 'hasTop' || header === 'isAssistant' || header === 'hasSzhTraining') {
          (employee as any)[header] = value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'тийм';
        } else if (header === 'childrenCount') {
          (employee as any)[header] = parseInt(value) || 0;
        } else if (header === 'gender') {
          (employee as any)[header] = value.toLowerCase() === 'female' || value.toLowerCase() === 'эмэгтэй' ? 'female' : 'male';
        } else if (header === 'status') {
          const validStatuses = EMPLOYEE_STATUSES.map(s => s.value);
          (employee as any)[header] = validStatuses.includes(value) ? value : 'active_no_transaction';
        } else {
          (employee as any)[header] = value;
        }
      });

      employees.push(employee);
    }

    return employees;
  }

  // Handle file upload
  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          setImportError('CSV файл хоосон эсвэл буруу форматтай байна');
          return;
        }
        setImportData(parsed);
        setImportModalOpen(true);
      } catch (error) {
        setImportError('CSV файлыг унших чадсангүй');
      }
    };
    reader.readAsText(file, 'UTF-8');
    // Reset input
    event.target.value = '';
  }

  // Confirm import
  async function confirmImport() {
    setImportLoading(true);
    setImportError(null);
    try {
      await employeesApi.bulkCreate(importData);
      setImportModalOpen(false);
      setImportData([]);
      loadData();
    } catch (error) {
      setImportError('Ажилтнуудыг импортлоход алдаа гарлаа');
    } finally {
      setImportLoading(false);
    }
  }

  async function updateEmployeeStatus(id: string, status: Employee['status']) {
    try {
      await employeesApi.update(id, { status });
      loadData();
      if (selectedEmployee?.id === id) {
        setSelectedEmployee({ ...selectedEmployee, status });
      }
    } catch (error) {
      console.error('Failed to update employee:', error);
    }
  }

  // Print employee profile
  function printEmployee() {
    if (!selectedEmployee) return;

    const emp = selectedEmployee;
    const statusInfo = getStatusInfo(emp.status);

    // Build family members table
    let familyTable = '';
    if (emp.familyMembers && emp.familyMembers.length > 0) {
      const rows = emp.familyMembers.map(m =>
        '<tr><td>' + (m.relationship || '-') + '</td><td>' + (m.fullName || '-') + '</td><td>' + (m.birthPlace || '-') + '</td><td>' + (m.profession || '-') + '</td><td>' + (m.phone || '-') + '</td></tr>'
      ).join('');
      familyTable = '<div class="section"><h2>Гэр бүлийн байдал</h2><table><tr><th>Хэн болох</th><th>Овог нэр</th><th>Төрсөн газар</th><th>Мэргэжил</th><th>Утас</th></tr>' + rows + '</table></div>';
    }

    // Build education table
    let eduTable = '';
    if (emp.education && emp.education.length > 0) {
      const rows = emp.education.map(e =>
        '<tr><td>' + (e.school || '-') + '</td><td>' + (e.enrollmentDate || '-') + '</td><td>' + (e.graduationDate || '-') + '</td><td>' + (e.major || '-') + '</td><td>' + (e.gpa || '-') + '</td></tr>'
      ).join('');
      eduTable = '<div class="section"><h2>Боловсрол</h2><table><tr><th>Сургууль</th><th>Элссэн</th><th>Төгссөн</th><th>Мэргэжил</th><th>Голч</th></tr>' + rows + '</table></div>';
    }

    // Build work experience table
    let workTable = '';
    if (emp.workExperience && emp.workExperience.length > 0) {
      const rows = emp.workExperience.map(w =>
        '<tr><td>' + (w.companyName || '-') + '</td><td>' + (w.businessType || '-') + '</td><td>' + (w.position || '-') + '</td><td>' + (w.startDate || '-') + '</td><td>' + (w.endDate || '-') + '</td></tr>'
      ).join('');
      workTable = '<div class="section"><h2>Ажлын туршлага</h2><table><tr><th>Байгууллага</th><th>Төрөл</th><th>Албан тушаал</th><th>Орсон</th><th>Гарсан</th></tr>' + rows + '</table></div>';
    }

    const photoHtml = emp.photoUrl ? '<img src="' + emp.photoUrl + '" class="photo" />' : '';
    const iconnectHtml = emp.iConnectName ? '<span style="margin-left: 10px; color: #6b7280;">(' + emp.iConnectName + ')</span>' : '';

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ажилтан - ${emp.firstName} ${emp.lastName}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; line-height: 1.4; }
          h1 { color: #1f2937; border-bottom: 2px solid #10b981; padding-bottom: 10px; margin-bottom: 15px; }
          h2 { color: #374151; margin-top: 25px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; page-break-after: avoid; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          .info-item { padding: 4px 0; page-break-inside: avoid; }
          .label { color: #6b7280; font-size: 11px; display: block; }
          .value { color: #1f2937; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; font-size: 11px; }
          th { background: #f9fafb; }
          .status { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; }
          .photo { width: 70px; height: 70px; border-radius: 50%; object-fit: cover; }
          .header { display: flex; align-items: center; gap: 15px; page-break-inside: avoid; }
          .section { page-break-inside: avoid; margin-bottom: 15px; }
          @media print {
            body { padding: 10px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .section { page-break-inside: avoid; }
            h2 { page-break-after: avoid; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; }
          }
          @page { margin: 1cm; }
        </style>
      </head>
      <body>
        <div class="header section">
          ${photoHtml}
          <div>
            <h1 style="margin-top: 0;">${emp.familyName || ''} ${emp.firstName} ${emp.lastName}</h1>
            <p style="color: #6b7280; margin: 5px 0;">${emp.email} | ${emp.phone}</p>
            <span class="status" style="background: #d1fae5; color: #065f46;">${statusInfo.label}</span>
            ${iconnectHtml}
          </div>
        </div>
        
        <div class="section">
          <h2>Хувийн мэдээлэл</h2>
          <div class="info-grid">
            <div class="info-item"><span class="label">Оффис:</span> <span class="value">${emp.officeName || emp.interestedOffice || '-'}</span></div>
            <div class="info-item"><span class="label">МЛС:</span> <span class="value">${emp.mls || '-'}</span></div>
            <div class="info-item"><span class="label">Төрсөн огноо:</span> <span class="value">${emp.birthDate || '-'}</span></div>
            <div class="info-item"><span class="label">Хүйс:</span> <span class="value">${emp.gender === 'male' ? 'Эрэгтэй' : 'Эмэгтэй'}</span></div>
            <div class="info-item"><span class="label">Регистр:</span> <span class="value">${emp.registerNumber || '-'}</span></div>
            <div class="info-item"><span class="label">Гэрийн хаяг:</span> <span class="value">${emp.homeAddress || '-'}</span></div>
            <div class="info-item"><span class="label">Утас:</span> <span class="value">${emp.phone || '-'}</span></div>
            <div class="info-item"><span class="label">Яаралтай холбоо:</span> <span class="value">${emp.emergencyPhone || '-'}</span></div>
            <div class="info-item"><span class="label">Ажилд орсон огноо:</span> <span class="value">${emp.employmentStartDate || '-'}</span></div>
            <div class="info-item"><span class="label">Жолооны эрх:</span> <span class="value">${emp.hasDriverLicense ? 'Тийм' : 'Үгүй'}</span></div>
          </div>
        </div>
        
        <div class="section">
          <h2>Нэмэлт мэдээлэл</h2>
          <div class="info-grid">
            <div class="info-item"><span class="label">Certificate дугаар:</span> <span class="value">${emp.certificateNumber || '-'}</span></div>
            <div class="info-item"><span class="label">Иргэний бүртгэлийн дугаар:</span> <span class="value">${emp.citizenRegistrationNumber || '-'}</span></div>
            <div class="info-item"><span class="label">СЗХ-ы сертификатын дугаар:</span> <span class="value">${emp.szhCertificateNumber || '-'}</span></div>
            <div class="info-item"><span class="label">Сертификат авсан огноо:</span> <span class="value">${emp.certificateDate || '-'}</span></div>
            <div class="info-item"><span class="label">Remax имэйл:</span> <span class="value">${emp.remaxEmail || '-'}</span></div>
            <div class="info-item"><span class="label">Банк:</span> <span class="value">${emp.bank || '-'}</span></div>
            <div class="info-item"><span class="label">Дансны дугаар:</span> <span class="value">${emp.accountNumber || '-'}</span></div>
            <div class="info-item"><span class="label">Хүүхдийн тоо:</span> <span class="value">${emp.childrenCount || 0}</span></div>
            <div class="info-item"><span class="label">iConnect эрх:</span> <span class="value">${emp.hasIConnect ? 'Тийм' : 'Үгүй'}</span></div>
            <div class="info-item"><span class="label">Туслах эсэх:</span> <span class="value">${emp.isAssistant ? 'Тийм' : 'Үгүй'}</span></div>
            ${emp.isAssistant ? `<div class="info-item"><span class="label">Хэний туслах:</span> <span class="value">${emp.assistantOf || '-'}</span></div>` : ''}
            <div class="info-item"><span class="label">СЗХ сургалт:</span> <span class="value">${emp.hasSzhTraining ? 'Тийм' : 'Үгүй'}</span></div>
            ${emp.hasSzhTraining ? `<div class="info-item"><span class="label">СЗХ сургалт огноо:</span> <span class="value">${emp.szhTrainingDate || '-'}</span></div>` : ''}
            ${emp.hasSzhTraining ? `<div class="info-item"><span class="label">СЗХ албан бичгийн дугаар:</span> <span class="value">${emp.szhOfficialLetterNumber || '-'}</span></div>` : ''}
          </div>
        </div>
        
        ${familyTable}
        ${eduTable}
        ${workTable}
      </body>
      </html>
    `;

    // Use hidden iframe instead of window.open to avoid new tab
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(printContent);
      iframeDoc.close();

      iframe.onload = () => {
        iframe.contentWindow?.print();
        // Clean up iframe after print dialog closes
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      };
    }
  }

  function handleResignClick() {
    setResignConfirmOpen(true);
  }

  function handleResignConfirm() {
    setResignConfirmOpen(false);
    const today = new Date().toISOString().split('T')[0];
    const workedMonths = selectedEmployee?.employmentStartDate
      ? calculateMonthsDiff(selectedEmployee.employmentStartDate, today)
      : 0;
    setResignForm({
      workedMonths,
      resignedDate: today,
      resignationReason: '',
      resignationNotes: ''
    });
    setResignFormOpen(true);
  }

  async function handleResignSubmit() {
    if (!selectedEmployee || !resignForm.resignationReason) return;
    try {
      await resignedAgentsApi.moveFromEmployee(selectedEmployee.id, {
        workedMonths: resignForm.workedMonths,
        resignedDate: resignForm.resignedDate,
        resignationReason: resignForm.resignationReason,
        resignationNotes: resignForm.resignationNotes
      });
      setResignFormOpen(false);
      setSelectedEmployee(null);
      loadData();
    } catch (error) {
      console.error('Failed to resign employee:', error);
    }
  }

  async function updateEmployeeFields() {
    if (!selectedEmployee) return;
    setEditFieldsError(null);

    try {
      const payload = {
        ...editFields,
        birthDate: normalizeDateForApi(editFields.birthDate),
        employmentStartDate: normalizeDateForApi(editFields.employmentStartDate),
        certificateDate: normalizeDateForApi(editFields.certificateDate),
        szhTrainingDate: normalizeDateForApi(editFields.szhTrainingDate),
        assistantOf: editFields.isAssistant ? editFields.assistantOf : '',
        szhOfficialLetterNumber: editFields.hasSzhTraining ? editFields.szhOfficialLetterNumber : '',
      };

      const updatedEmployee = await employeesApi.update(selectedEmployee.id, payload);
      setEditFieldsOpen(false);
      setEditFieldsError(null);
      // Update the employee in the list immediately
      setEmployees(prev => prev.map(e => e.id === selectedEmployee.id ? { ...e, ...updatedEmployee } : e));
      setSelectedEmployee({ ...selectedEmployee, ...updatedEmployee });
    } catch (error: any) {
      console.error('Failed to update employee fields:', error);
      alert('Ажилтны мэдээлэл хадгалахад алдаа гарлаа: ' + (error?.message || 'Unknown error'));
    }
  }

  function openEditFields() {
    if (!selectedEmployee) return;
    setEditFields({
      iConnectName: selectedEmployee.iConnectName || '',
      familyName: selectedEmployee.familyName || '',
      lastName: selectedEmployee.lastName || '',
      firstName: selectedEmployee.firstName || '',
      interestedOffice: selectedEmployee.interestedOffice || '',
      birthPlace: selectedEmployee.birthPlace || '',
      ethnicity: selectedEmployee.ethnicity || '',
      gender: selectedEmployee.gender || 'male',
      birthDate: selectedEmployee.birthDate || '',
      registerNumber: selectedEmployee.registerNumber || '',
      homeAddress: selectedEmployee.homeAddress || '',
      phone: selectedEmployee.phone || '',
      emergencyPhone: selectedEmployee.emergencyPhone || '',
      email: selectedEmployee.email || '',
      facebook: selectedEmployee.facebook || '',
      hasDriverLicense: selectedEmployee.hasDriverLicense || false,
      employmentStartDate: selectedEmployee.employmentStartDate || '',
      certificateNumber: selectedEmployee.certificateNumber || '',
      citizenRegistrationNumber: selectedEmployee.citizenRegistrationNumber || '',
      szhCertificateNumber: selectedEmployee.szhCertificateNumber || '',
      certificateDate: selectedEmployee.certificateDate || '',
      remaxEmail: selectedEmployee.remaxEmail || '',
      mls: selectedEmployee.mls || '',
      bank: selectedEmployee.bank || '',
      accountNumber: selectedEmployee.accountNumber || '',
      district: selectedEmployee.district || '',
      detailedAddress: selectedEmployee.detailedAddress || '',
      childrenCount: selectedEmployee.childrenCount || 0,
      officeName: selectedEmployee.officeName || '',
      status: selectedEmployee.status,
      hasIConnect: selectedEmployee.hasIConnect || false,
      hasTop: selectedEmployee.hasTop || false,
      isAssistant: selectedEmployee.isAssistant || false,
      assistantOf: selectedEmployee.assistantOf || '',
      hasSzhTraining: selectedEmployee.hasSzhTraining || false,
      szhTrainingDate: selectedEmployee.szhTrainingDate || '',
      szhOfficialLetterNumber: selectedEmployee.szhOfficialLetterNumber || '',
      hasFirstTransaction: selectedEmployee.hasFirstTransaction || false,
      excludeFromKpi: selectedEmployee.excludeFromKpi || false
    });
    setEditFieldsError(null);
    setEditFieldsOpen(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Агентууд</h1>
            <p className="mt-1 text-green-100">iConnect-д зөвшөөрөгдсөн</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-lg px-4 py-2">
              <span className="text-3xl font-bold">{employees.length}</span>
              <span className="ml-2 text-green-100">ажилтан</span>
            </div>
            <button
              onClick={downloadCSVTemplate}
              className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CSV загвар
            </button>
            <label className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium flex items-center gap-2 cursor-pointer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              CSV оруулах
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50 font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CSV татах
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Нэр, MLS, iConnect нэр, Remax имэйлээр хайх..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter Multi-select */}
          <div className="relative min-w-[200px]">
            <button
              onClick={() => setStatusFilterOpen(!statusFilterOpen)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center justify-between gap-2"
            >
              <span>{selectedStatuses.length === 0 ? 'Бүх төлөв' : `${selectedStatuses.length} сонгосон`}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {statusFilterOpen && (
              <div className="absolute z-10 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg">
                <div className="p-2 max-h-64 overflow-y-auto">
                  {EMPLOYEE_STATUSES.map(status => (
                    <label
                      key={status.value}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(status.value)}
                        onChange={() => toggleStatusFilter(status.value)}
                        className="rounded text-green-600"
                      />
                      <span className={`px-2 py-1 text-xs rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="border-t p-2">
                  <button
                    onClick={() => { setSelectedStatuses([]); setStatusFilterOpen(false); }}
                    className="w-full text-sm text-gray-600 hover:text-gray-900"
                  >
                    Цэвэрлэх
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Office Filter */}
          <div className="min-w-[150px]">
            <select
              value={selectedOffice}
              onChange={(e) => setSelectedOffice(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-green-500"
            >
              {OFFICES.map(office => (
                <option key={office} value={office}>{office === 'Бүгд' ? 'Бүх оффис' : office}</option>
              ))}
            </select>
          </div>

          {/* iConnect Filter */}
          <div className="min-w-[130px]">
            <select
              value={iConnectFilter}
              onChange={(e) => setIConnectFilter(e.target.value as 'all' | 'yes' | 'no')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-green-500"
            >
              <option value="all">iConnect бүгд</option>
              <option value="yes">iConnect тийм</option>
              <option value="no">iConnect үгүй</option>
            </select>
          </div>

          {/* SZH Training Filter */}
          <div className="min-w-[130px]">
            <select
              value={szhFilter}
              onChange={(e) => setSzhFilter(e.target.value as 'all' | 'yes' | 'no')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-green-500"
            >
              <option value="all">СЗХ бүгд</option>
              <option value="yes">СЗХ тийм</option>
              <option value="no">СЗХ үгүй</option>
            </select>
          </div>

          {/* MLS Filter */}
          <div className="min-w-[140px]">
            <select
              value={mlsFilter}
              onChange={(e) => setMlsFilter(e.target.value as 'all' | 'filled' | 'empty')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-green-500"
            >
              <option value="all">MLS бүгд</option>
              <option value="filled">MLS-тэй</option>
              <option value="empty">MLS хоосон</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex rounded-lg overflow-hidden border border-gray-300">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm font-medium ${viewMode === 'list' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Жагсаалт
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm font-medium ${viewMode === 'table' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Хүснэгт
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-sm text-gray-500">{filteredEmployees.length} ажилтан олдлоо</span>
          {selectedStatuses.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedStatuses.map(s => {
                const status = EMPLOYEE_STATUSES.find(st => st.value === s);
                return status ? (
                  <span key={s} className={`px-2 py-1 text-xs rounded-full ${status.color}`}>
                    {status.label}
                  </span>
                ) : null;
              })}
            </div>
          )}
          {(searchTerm || selectedStatuses.length > 0 || selectedOffice !== 'Бүгд' || iConnectFilter !== 'all' || szhFilter !== 'all' || mlsFilter !== 'all') && (
            <button onClick={() => { setSearchTerm(''); setSelectedStatuses([]); setSelectedOffice('Бүгд'); setIConnectFilter('all'); setSzhFilter('all'); setMlsFilter('all'); }} className="text-sm text-green-600 hover:text-green-800">
              Цэвэрлэх
            </button>
          )}
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Employees List */}
          <div className="lg:col-span-1 bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h2 className="font-medium text-gray-900">Ажилтнууд ({filteredEmployees.length})</h2>
            </div>
            <ul className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {filteredEmployees.length === 0 ? (
                <li className="px-4 py-8 text-gray-500 text-center">
                  {employees.length === 0 ? 'Ажилтан байхгүй' : 'Хайлтын илэрц олдсонгүй'}
                </li>
              ) : (
                filteredEmployees.map((emp) => (
                  <li
                    key={emp.id}
                    onClick={() => setSelectedEmployee(emp)}
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${selectedEmployee?.id === emp.id ? 'bg-green-50 border-l-4 border-green-500' : ''
                      }`}
                  >
                    <div className="flex items-center">
                      {emp.photoUrl ? (
                        <img src={emp.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-green-600">
                            {emp.firstName?.charAt(0) || ''}{emp.lastName?.charAt(0) || ''}
                          </span>
                        </div>
                      )}
                      <div className="ml-3 flex-1">
                        <p className="text-gray-900"><span className="font-bold">{emp.firstName}</span> {emp.lastName}</p>
                        <p className="text-sm text-gray-500">{emp.interestedOffice || emp.email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusInfo(emp.status).color}`}>
                          {getStatusInfo(emp.status).label}
                        </span>
                        {(() => {
                          const rank = getCurrentRankForEmployee(emp.mls);
                          if (rank) {
                            return <span className={`px-2 py-0.5 text-xs rounded-full ${RANK_COLORS[rank.currentRank]}`}>{rank.currentRank}</span>;
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Employee Details */}
          <div className="lg:col-span-2 bg-white shadow rounded-lg overflow-hidden">
            {selectedEmployee ? (
              <div className="max-h-[700px] overflow-y-auto">
                {/* Header with photo */}
                <div className="bg-gradient-to-r from-green-500 to-teal-500 p-6">
                  <div className="flex items-center">
                    {selectedEmployee.photoUrl ? (
                      <img src={selectedEmployee.photoUrl} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg" />
                    ) : (
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-2xl font-bold text-green-600">
                          {selectedEmployee.firstName?.charAt(0) || ''}{selectedEmployee.lastName?.charAt(0) || ''}
                        </span>
                      </div>
                    )}
                    <div className="ml-5 text-white flex-1">
                      <h2 className="text-2xl"><span className="font-bold">{selectedEmployee.firstName}</span> {selectedEmployee.lastName}</h2>
                      <p className="text-green-100">{selectedEmployee.interestedOffice}</p>
                      <span className={`inline-flex items-center mt-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusInfo(selectedEmployee.status).color}`}>
                        {getStatusInfo(selectedEmployee.status).label}
                      </span>
                    </div>
                    <button
                      onClick={printEmployee}
                      className="self-start px-3 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Хэвлэх
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Status Change */}
                  <section>
                    <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Төлөв өөрчлөх
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {EMPLOYEE_STATUSES.map(s => (
                        <button
                          key={s.value}
                          onClick={() => updateEmployeeStatus(selectedEmployee.id, s.value as Employee['status'])}
                          className={`px-3 py-1 text-sm rounded-full transition-colors ${selectedEmployee.status === s.value
                            ? s.color + ' ring-2 ring-offset-1 ring-gray-400'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                          {s.label}
                        </button>
                      ))}
                      {/* Resigned button - separate action */}
                      <button
                        onClick={handleResignClick}
                        className="px-3 py-1 text-sm rounded-full transition-colors bg-red-100 text-red-800 hover:bg-red-200"
                      >
                        Гарсан
                      </button>
                    </div>
                  </section>

                  {/* Personal Information */}
                  <section>
                    <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Хувийн мэдээлэл
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-gray-500">iConnect нэр:</span> <span className="font-medium">{selectedEmployee.iConnectName || '-'}</span></div>
                      <div><span className="text-gray-500">Ургийн овог:</span> <span className="font-medium">{selectedEmployee.familyName}</span></div>
                      <div><span className="text-gray-500">Овог:</span> <span className="font-medium">{selectedEmployee.lastName}</span></div>
                      <div><span className="text-gray-500">Нэр:</span> <span className="font-medium">{selectedEmployee.firstName}</span></div>
                      <div><span className="text-gray-500">Хүйс:</span> <span className="font-medium">{selectedEmployee.gender === 'male' ? 'Эрэгтэй' : 'Эмэгтэй'}</span></div>
                      <div><span className="text-gray-500">Төрсөн огноо:</span> <span className="font-medium">{selectedEmployee.birthDate ? new Date(selectedEmployee.birthDate).toLocaleDateString('mn-MN') : '-'}</span></div>
                      <div><span className="text-gray-500">Төрсөн газар:</span> <span className="font-medium">{selectedEmployee.birthPlace}</span></div>
                      <div><span className="text-gray-500">Үндэс угсаа:</span> <span className="font-medium">{selectedEmployee.ethnicity}</span></div>
                      <div><span className="text-gray-500">Регистрийн дугаар:</span> <span className="font-medium">{selectedEmployee.registerNumber}</span></div>
                    </div>
                  </section>

                  {/* Contact Information */}
                  <section>
                    <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Холбоо барих
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-gray-500">Утас:</span> <span className="font-medium">{selectedEmployee.phone}</span></div>
                      <div><span className="text-gray-500">Яаралтай холбоо:</span> <span className="font-medium">{selectedEmployee.emergencyPhone}</span></div>
                      <div><span className="text-gray-500">Имэйл:</span> <span className="font-medium">{selectedEmployee.email}</span></div>
                      <div><span className="text-gray-500">Facebook:</span> <span className="font-medium">{selectedEmployee.facebook || '-'}</span></div>
                      <div className="col-span-2"><span className="text-gray-500">Гэрийн хаяг:</span> <span className="font-medium">{selectedEmployee.homeAddress}</span></div>
                    </div>
                  </section>

                  {/* Work Info */}
                  <section>
                    <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Ажлын мэдээлэл
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-gray-500">Сонирхож буй оффис:</span> <span className="font-medium">{selectedEmployee.interestedOffice}</span></div>
                      <div><span className="text-gray-500">iConnect болсон огноо:</span> <span className="font-medium">{selectedEmployee.hiredDate ? new Date(selectedEmployee.hiredDate).toLocaleDateString('mn-MN') : '-'}</span></div>
                      <div><span className="text-gray-500">Жолооны эрх:</span> <span className="font-medium">{selectedEmployee.hasDriverLicense ? 'Тийм' : 'Үгүй'}</span></div>
                      <div><span className="text-gray-500">Мэдээлэл авсан:</span> <span className="font-medium">{selectedEmployee.referralSource}</span></div>
                    </div>
                  </section>

                  {/* Additional Info */}
                  <section>
                    <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2 flex items-center justify-between">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Нэмэлт мэдээлэл
                      </div>
                      <button
                        onClick={openEditFields}
                        className="text-xs px-2 py-1 bg-teal-100 text-teal-700 rounded hover:bg-teal-200"
                      >
                        Засах
                      </button>
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="col-span-2 border-b pb-2 mb-2"><span className="text-gray-500">Ажилд орсон огноо:</span> <span className="font-medium">{selectedEmployee.employmentStartDate ? new Date(selectedEmployee.employmentStartDate).toLocaleDateString('mn-MN') : '-'}</span></div>
                      <div><span className="text-gray-500">Certificate дугаар:</span> <span className="font-medium">{selectedEmployee.certificateNumber || '-'}</span></div>
                      <div><span className="text-gray-500">Иргэний бүртгэлийн дугаар:</span> <span className="font-medium">{selectedEmployee.citizenRegistrationNumber || '-'}</span></div>
                      <div><span className="text-gray-500">СЗХ-ы сертификатын дугаар:</span> <span className="font-medium">{selectedEmployee.szhCertificateNumber || '-'}</span></div>
                      <div><span className="text-gray-500">Сертификат авсан огноо:</span> <span className="font-medium">{selectedEmployee.certificateDate ? new Date(selectedEmployee.certificateDate).toLocaleDateString('mn-MN') : '-'}</span></div>
                      <div><span className="text-gray-500">Remax имэйл:</span> <span className="font-medium">{selectedEmployee.remaxEmail || '-'}</span></div>
                      <div><span className="text-gray-500">МЛС:</span> <span className="font-medium">{selectedEmployee.mls || '-'}</span></div>
                      <div><span className="text-gray-500">Цол:</span> {(() => {
                        const rank = getCurrentRankForEmployee(selectedEmployee.mls);
                        if (rank) {
                          return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RANK_COLORS[rank.currentRank]}`}>{rank.currentRank}</span>;
                        }
                        return <span className="text-gray-400">-</span>;
                      })()}</div>
                      <div><span className="text-gray-500">Банк:</span> <span className="font-medium">{selectedEmployee.bank || '-'}</span></div>
                      <div><span className="text-gray-500">Дансны дугаар:</span> <span className="font-medium">{selectedEmployee.accountNumber || '-'}</span></div>
                      <div><span className="text-gray-500">Дүүрэг:</span> <span className="font-medium">{selectedEmployee.district || '-'}</span></div>
                      <div><span className="text-gray-500">Гэрийн хаяг:</span> <span className="font-medium">{selectedEmployee.detailedAddress || '-'}</span></div>
                      <div><span className="text-gray-500">Хүүхдийн тоо:</span> <span className="font-medium">{selectedEmployee.childrenCount ?? '-'}</span></div>
                      <div><span className="text-gray-500">iConnect:</span> <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${selectedEmployee.hasIConnect ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{selectedEmployee.hasIConnect ? 'Тийм' : 'Үгүй'}</span></div>
                      <div><span className="text-gray-500">Туслах эсэх:</span> <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${selectedEmployee.isAssistant ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>{selectedEmployee.isAssistant ? 'Тийм' : 'Үгүй'}</span></div>
                      {selectedEmployee.isAssistant && <div><span className="text-gray-500">Хэний туслах:</span> <span className="font-medium">{selectedEmployee.assistantOf || '-'}</span></div>}
                      <div><span className="text-gray-500">СЗХ сургалт:</span> <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${selectedEmployee.hasSzhTraining ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{selectedEmployee.hasSzhTraining ? 'Тийм' : 'Үгүй'}</span></div>
                      {selectedEmployee.hasSzhTraining && <div><span className="text-gray-500">СЗХ сургалт огноо:</span> <span className="font-medium">{selectedEmployee.szhTrainingDate ? new Date(selectedEmployee.szhTrainingDate).toLocaleDateString('mn-MN') : '-'}</span></div>}
                      {selectedEmployee.hasSzhTraining && <div><span className="text-gray-500">СЗХ албан бичгийн дугаар:</span> <span className="font-medium">{selectedEmployee.szhOfficialLetterNumber || '-'}</span></div>}
                      <div><span className="text-gray-500">Анхны гүйлгээ хийсэн:</span> <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${selectedEmployee.hasFirstTransaction ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{selectedEmployee.hasFirstTransaction ? 'Тийм' : 'Үгүй'}</span></div>
                      <div><span className="text-gray-500">KPI тооцохгүй:</span> <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${selectedEmployee.excludeFromKpi ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{selectedEmployee.excludeFromKpi ? 'Тийм' : 'Үгүй'}</span></div>
                    </div>
                  </section>

                  {/* Family Members */}
                  {selectedEmployee.familyMembers && selectedEmployee.familyMembers.length > 0 && (
                    <section>
                      <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Гэр бүлийн гишүүд ({selectedEmployee.familyMembers.length})
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Хамаарал</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Овог нэр</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Мэргэжил</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Утас</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {selectedEmployee.familyMembers.map((member, i) => (
                              <tr key={i}>
                                <td className="px-3 py-2">{member.relationship}</td>
                                <td className="px-3 py-2 font-medium">{member.fullName}</td>
                                <td className="px-3 py-2">{member.profession}</td>
                                <td className="px-3 py-2">{member.phone}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}

                  {/* Education */}
                  {selectedEmployee.education && selectedEmployee.education.length > 0 && (
                    <section>
                      <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path d="M12 14l9-5-9-5-9 5 9 5z" />
                          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                        </svg>
                        Боловсролын байдал ({selectedEmployee.education.length})
                      </h3>
                      <div className="space-y-3">
                        {selectedEmployee.education.map((edu, i) => (
                          <div key={i} className="bg-gray-50 rounded-lg p-3">
                            <p className="font-medium text-gray-900">{edu.school}</p>
                            <p className="text-sm text-gray-600">{edu.major}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {edu.enrollmentDate} - {edu.graduationDate} | GPA: {edu.gpa}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Languages */}
                  {selectedEmployee.languages && selectedEmployee.languages.length > 0 && (
                    <section>
                      <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                        </svg>
                        Хэлний мэдлэг ({selectedEmployee.languages.length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedEmployee.languages.map((lang, i) => (
                          <span key={i} className="px-3 py-1 bg-cyan-50 text-cyan-700 rounded-full text-sm">
                            {lang.language}: {lang.level}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Work Experience */}
                  {selectedEmployee.workExperience && selectedEmployee.workExperience.length > 0 && (
                    <section>
                      <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Ажлын туршлага ({selectedEmployee.workExperience.length})
                      </h3>
                      <div className="space-y-3">
                        {selectedEmployee.workExperience.map((work, i) => (
                          <div key={i} className="bg-gray-50 rounded-lg p-3">
                            <p className="font-medium text-gray-900">{work.position}</p>
                            <p className="text-sm text-gray-600">{work.companyName} ({work.businessType})</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {work.startDate} - {work.endDate} | Цалин: {work.salary}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Awards */}
                  {selectedEmployee.awards && selectedEmployee.awards.length > 0 && (
                    <section>
                      <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        Шагнал урамшуулал ({selectedEmployee.awards.length})
                      </h3>
                      <div className="space-y-2">
                        {selectedEmployee.awards.map((award, i) => (
                          <div key={i} className="flex items-center bg-yellow-50 rounded-lg p-3">
                            <span className="text-yellow-500 mr-2">🏆</span>
                            <div>
                              <p className="font-medium text-gray-900">{award.awardName}</p>
                              <p className="text-xs text-gray-500">{award.organization} - {award.year}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Skills and Strengths */}
                  <section>
                    <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Ур чадвар, давуу тал
                    </h3>
                    {selectedEmployee.otherSkills && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-500 mb-1">Бусад ур чадвар:</p>
                        <p className="text-sm bg-gray-50 rounded-lg p-3">{selectedEmployee.otherSkills}</p>
                      </div>
                    )}
                    {selectedEmployee.strengthsWeaknesses && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Давуу болон сул тал:</p>
                        <p className="text-sm bg-gray-50 rounded-lg p-3">{selectedEmployee.strengthsWeaknesses}</p>
                      </div>
                    )}
                  </section>

                  {/* Signature */}
                  {selectedEmployee.signatureUrl && (
                    <section>
                      <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">Гарын үсэг</h3>
                      <img src={selectedEmployee.signatureUrl} alt="Signature" className="max-h-16" />
                    </section>
                  )}

                  {/* Metadata */}
                  <div className="text-xs text-gray-400 pt-4 border-t mt-6">
                    <p>Анкет илгээсэн: {new Date(selectedEmployee.createdAt).toLocaleString('mn-MN')}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p>Ажилтан сонгоно уу</p>
                </div>
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
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MLS</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">iConnect нэр</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Зураг</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Нэр</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Овог</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ургийн овог</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Оффис</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имэйл</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Утас</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Яаралтай утас</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Регистр</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Төрсөн огноо</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Хүйс</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Certificate</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ИБД</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">СЗХ</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remax имэйл</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Банк</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Данс</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дүүрэг</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ажилд орсон</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Цол</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Төлөв</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={23} className="px-4 py-8 text-center text-gray-500">
                      {employees.length === 0 ? 'Ажилтан байхгүй' : 'Хайлтын илэрц олдсонгүй'}
                    </td>
                  </tr>
                ) : (
                  paginatedEmployees.map((emp) => {
                    const rank = getCurrentRankForEmployee(emp.mls);
                    return (
                      <tr
                        key={emp.id}
                        onClick={() => { setSelectedEmployee(emp); setViewMode('list'); }}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500">{emp.mls || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500">{emp.iConnectName || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {emp.photoUrl ? (
                            <img src={emp.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-green-600">
                                {emp.firstName?.charAt(0) || ''}{emp.lastName?.charAt(0) || ''}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">{emp.firstName || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-900">{emp.lastName || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500">{emp.familyName || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500">{emp.interestedOffice || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500">{emp.email || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500">{emp.phone || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500">{emp.emergencyPhone || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500">{emp.registerNumber || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500">{emp.birthDate ? new Date(emp.birthDate).toLocaleDateString('mn-MN') : '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500">{emp.gender === 'male' ? 'Эр' : 'Эм'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500">{emp.certificateNumber || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500">{emp.citizenRegistrationNumber || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500">{emp.szhCertificateNumber || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500">{emp.remaxEmail || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500">{emp.bank || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500">{emp.accountNumber || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500">{emp.district || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-gray-500">{emp.employmentStartDate ? new Date(emp.employmentStartDate).toLocaleDateString('mn-MN') : '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {rank ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${RANK_COLORS[rank.currentRank]}`}>
                              {rank.currentRank}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span title={getEmployeeStatusTooltip(emp.status)} className={`px-2 py-0.5 text-xs rounded-full ${getStatusInfo(emp.status).color}`}>
                            {getStatusInfo(emp.status).label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            totalItems={filteredEmployees.length}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      {/* Resign Confirmation Modal */}
      {resignConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Гарсан гэж бүртгэх үү?</h3>
            <p className="text-gray-600 mb-6">
              <span className="font-bold">{selectedEmployee?.firstName}</span> {selectedEmployee?.lastName}-г гарсан гэж бүртгэхдээ итгэлтэй байна уу?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setResignConfirmOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Болих
              </button>
              <button
                onClick={handleResignConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Тийм
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resign Form Modal */}
      {resignFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Гарсан мэдээлэл оруулах</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Гарсан он сар</label>
                <input
                  type="date"
                  value={resignForm.resignedDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    const newWorkedMonths = selectedEmployee?.employmentStartDate
                      ? calculateMonthsDiff(selectedEmployee.employmentStartDate, newDate)
                      : resignForm.workedMonths;
                    setResignForm({ ...resignForm, resignedDate: newDate, workedMonths: newWorkedMonths });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ажилласан хугацаа (сар)</label>
                <input
                  type="number"
                  min="0"
                  value={resignForm.workedMonths}
                  readOnly={!!selectedEmployee?.employmentStartDate}
                  onChange={(e) => setResignForm({ ...resignForm, workedMonths: parseInt(e.target.value) || 0 })}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 ${selectedEmployee?.employmentStartDate ? 'bg-gray-100' : ''}`}
                />
                {selectedEmployee?.employmentStartDate && (
                  <p className="text-xs text-gray-500 mt-1">Автоматаар тооцоолсон</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Гарсан шалтгаан</label>
                <select
                  value={resignForm.resignationReason}
                  onChange={(e) => setResignForm({ ...resignForm, resignationReason: e.target.value as typeof RESIGNATION_REASONS[number] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Сонгоно уу...</option>
                  {RESIGNATION_REASONS.map(reason => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Нэмэлт тэмдэглэл</label>
                <textarea
                  value={resignForm.resignationNotes}
                  onChange={(e) => setResignForm({ ...resignForm, resignationNotes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Нэмэлт тэмдэглэл оруулна уу..."
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setResignFormOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Болих
              </button>
              <button
                onClick={handleResignSubmit}
                disabled={!resignForm.resignationReason}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Хадгалах
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Fields Modal */}
      {editFieldsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Ажилтны мэдээлэл засах</h3>
            {editFieldsError && (
              <div className="mb-4 bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded text-sm">
                {editFieldsError}
              </div>
            )}
            <div className="grid grid-cols-3 gap-4">
              {/* Personal Info Section */}
              <div className="col-span-3 border-b pb-2 mb-2">
                <h4 className="font-medium text-gray-700">Хувийн мэдээлэл</h4>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ургийн овог</label>
                <input type="text" value={editFields.familyName} onChange={(e) => setEditFields({ ...editFields, familyName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Овог</label>
                <input type="text" value={editFields.lastName} onChange={(e) => setEditFields({ ...editFields, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Нэр</label>
                <input type="text" value={editFields.firstName} onChange={(e) => setEditFields({ ...editFields, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">iConnect нэр</label>
                <input type="text" value={editFields.iConnectName} onChange={(e) => setEditFields({ ...editFields, iConnectName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="iConnect дээрх нэр" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Сонирхсон оффис</label>
                <select value={editFields.interestedOffice} onChange={(e) => setEditFields({ ...editFields, interestedOffice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500">
                  <option value="">Сонгох</option>
                  <option value="Гэгээнтэн">Гэгээнтэн</option>
                  <option value="Ривер">Ривер</option>
                  <option value="Даун таун">Даун таун</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ажилладаг оффис</label>
                <select value={editFields.officeName || ''} onChange={(e) => setEditFields({ ...editFields, officeName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500">
                  <option value="">Сонгох</option>
                  <option value="Гэгээнтэн">Гэгээнтэн</option>
                  <option value="Ривер">Ривер</option>
                  <option value="Даун таун">Даун таун</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Төлөв</label>
                <select value={editFields.status} onChange={(e) => setEditFields({ ...editFields, status: e.target.value as Employee['status'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500">
                  {EMPLOYEE_STATUSES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Хүйс</label>
                <select value={editFields.gender} onChange={(e) => setEditFields({ ...editFields, gender: e.target.value as 'male' | 'female' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500">
                  <option value="male">Эрэгтэй</option>
                  <option value="female">Эмэгтэй</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Төрсөн огноо</label>
                <input type="date" value={editFields.birthDate} onChange={(e) => setEditFields({ ...editFields, birthDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Төрсөн газар</label>
                <input type="text" value={editFields.birthPlace} onChange={(e) => setEditFields({ ...editFields, birthPlace: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Үндэс угсаа</label>
                <input type="text" value={editFields.ethnicity} onChange={(e) => setEditFields({ ...editFields, ethnicity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Регистрийн дугаар</label>
                <input type="text" value={editFields.registerNumber} onChange={(e) => setEditFields({ ...editFields, registerNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
              </div>

              {/* Contact Info Section */}
              <div className="col-span-3 border-b pb-2 mb-2 mt-4">
                <h4 className="font-medium text-gray-700">Холбоо барих</h4>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Имэйл</label>
                <input type="email" value={editFields.email} onChange={(e) => setEditFields({ ...editFields, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Утас</label>
                <input type="text" value={editFields.phone} onChange={(e) => setEditFields({ ...editFields, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Яаралтай холбоо</label>
                <input type="text" value={editFields.emergencyPhone} onChange={(e) => setEditFields({ ...editFields, emergencyPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                <input type="text" value={editFields.facebook} onChange={(e) => setEditFields({ ...editFields, facebook: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Гэрийн хаяг</label>
                <input type="text" value={editFields.homeAddress} onChange={(e) => setEditFields({ ...editFields, homeAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дүүрэг</label>
                <input type="text" value={editFields.district} onChange={(e) => setEditFields({ ...editFields, district: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Гэрийн хаяг (дэлгэрэнгүй)</label>
                <input type="text" value={editFields.detailedAddress} onChange={(e) => setEditFields({ ...editFields, detailedAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
              </div>

              {/* Employment Info Section */}
              <div className="col-span-3 border-b pb-2 mb-2 mt-4">
                <h4 className="font-medium text-gray-700">Ажлын мэдээлэл</h4>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ажилд орсон огноо</label>
                <input type="date" value={editFields.employmentStartDate} onChange={(e) => setEditFields({ ...editFields, employmentStartDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Certificate дугаар</label>
                <input type="text" value={editFields.certificateNumber} onChange={(e) => setEditFields({ ...editFields, certificateNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Сертификат авсан огноо</label>
                <input type="date" value={editFields.certificateDate} onChange={(e) => setEditFields({ ...editFields, certificateDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Иргэний бүртгэлийн дугаар</label>
                <input type="text" value={editFields.citizenRegistrationNumber} onChange={(e) => setEditFields({ ...editFields, citizenRegistrationNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">СЗХ-ы сертификатын дугаар</label>
                <input type="text" value={editFields.szhCertificateNumber} onChange={(e) => setEditFields({ ...editFields, szhCertificateNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remax имэйл</label>
                <input type="email" value={editFields.remaxEmail} onChange={(e) => setEditFields({ ...editFields, remaxEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">МЛС</label>
                <input type="text" value={editFields.mls} onChange={(e) => setEditFields({ ...editFields, mls: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Банк</label>
                <input type="text" value={editFields.bank} onChange={(e) => setEditFields({ ...editFields, bank: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дансны дугаар</label>
                <input type="text" value={editFields.accountNumber} onChange={(e) => setEditFields({ ...editFields, accountNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
              </div>

              {/* Other Info Section */}
              <div className="col-span-3 border-b pb-2 mb-2 mt-4">
                <h4 className="font-medium text-gray-700">Бусад мэдээлэл</h4>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Хүүхдийн тоо</label>
                <input type="number" min="0" value={editFields.childrenCount} onChange={(e) => setEditFields({ ...editFields, childrenCount: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Жолооны эрх</label>
                <select value={editFields.hasDriverLicense ? 'yes' : 'no'} onChange={(e) => setEditFields({ ...editFields, hasDriverLicense: e.target.value === 'yes' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500">
                  <option value="yes">Тийм</option>
                  <option value="no">Үгүй</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">iConnect</label>
                <select value={editFields.hasIConnect ? 'yes' : 'no'} onChange={(e) => setEditFields({ ...editFields, hasIConnect: e.target.value === 'yes' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500">
                  <option value="yes">Тийм</option>
                  <option value="no">Үгүй</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TOP</label>
                <select value={editFields.hasTop ? 'yes' : 'no'} onChange={(e) => setEditFields({ ...editFields, hasTop: e.target.value === 'yes' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500">
                  <option value="yes">Тийм</option>
                  <option value="no">Үгүй</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Туслах эсэх</label>
                <select value={editFields.isAssistant ? 'yes' : 'no'} onChange={(e) => setEditFields({ ...editFields, isAssistant: e.target.value === 'yes' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500">
                  <option value="yes">Тийм</option>
                  <option value="no">Үгүй</option>
                </select>
              </div>
              {editFields.isAssistant && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Хэний туслах</label>
                  <input type="text" value={editFields.assistantOf || ''} onChange={(e) => setEditFields({ ...editFields, assistantOf: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="Нэр оруулах" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">СЗХ бүртгүүлсэн эсэх</label>
                <select value={editFields.hasSzhTraining ? 'yes' : 'no'} onChange={(e) => setEditFields({ ...editFields, hasSzhTraining: e.target.value === 'yes' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500">
                  <option value="yes">Тийм</option>
                  <option value="no">Үгүй</option>
                </select>
              </div>
              {editFields.hasSzhTraining && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">СЗХ сургалт суусан огноо</label>
                  <input type="date" value={editFields.szhTrainingDate || ''} onChange={(e) => setEditFields({ ...editFields, szhTrainingDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
              )}
              {editFields.hasSzhTraining && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">СЗХ албан бичгийн дугаар</label>
                  <input type="text" value={editFields.szhOfficialLetterNumber || ''} onChange={(e) => setEditFields({ ...editFields, szhOfficialLetterNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="Дугаар оруулах" />
                </div>
              )}

              {/* Dashboard Tags Section */}
              <div className="col-span-3 border-b pb-2 mb-2 mt-4">
                <h4 className="font-medium text-gray-700">Дашбоард тооцоо</h4>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Анхны гүйлгээ хийсэн</label>
                <select value={editFields.hasFirstTransaction ? 'yes' : 'no'} onChange={(e) => setEditFields({ ...editFields, hasFirstTransaction: e.target.value === 'yes' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500">
                  <option value="yes">Тийм</option>
                  <option value="no">Үгүй</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">KPI тооцохгүй</label>
                <select value={editFields.excludeFromKpi ? 'yes' : 'no'} onChange={(e) => setEditFields({ ...editFields, excludeFromKpi: e.target.value === 'yes' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500">
                  <option value="yes">Тийм</option>
                  <option value="no">Үгүй</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setEditFieldsOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Болих
              </button>
              <button
                onClick={updateEmployeeFields}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                Хадгалах
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">CSV-ээс ажилтнуудыг оруулах</h2>
              <p className="text-sm text-gray-600 mt-1">
                {importData.length} ажилтан оруулахад бэлэн байна
              </p>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {importError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                  {importError}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">№</th>
                      <th className="px-3 py-2 text-left">Овог</th>
                      <th className="px-3 py-2 text-left">Нэр</th>
                      <th className="px-3 py-2 text-left">Оффис</th>
                      <th className="px-3 py-2 text-left">Имэйл</th>
                      <th className="px-3 py-2 text-left">Утас</th>
                      <th className="px-3 py-2 text-left">Төлөв</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importData.map((emp, index) => (
                      <tr key={index} className="border-t hover:bg-gray-50">
                        <td className="px-3 py-2">{index + 1}</td>
                        <td className="px-3 py-2">{emp.lastName}</td>
                        <td className="px-3 py-2">{emp.firstName}</td>
                        <td className="px-3 py-2">{emp.interestedOffice}</td>
                        <td className="px-3 py-2">{emp.email}</td>
                        <td className="px-3 py-2">{emp.phone}</td>
                        <td className="px-3 py-2">
                          <span title={getEmployeeStatusTooltip(emp.status || 'active')} className={`px-2 py-1 text-xs rounded-full ${getStatusInfo(emp.status || 'active').color}`}>
                            {getStatusInfo(emp.status || 'active').label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 border-t flex gap-3 justify-end">
              <button
                onClick={() => { setImportModalOpen(false); setImportData([]); setImportError(null); }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={importLoading}
              >
                Болих
              </button>
              <button
                onClick={confirmImport}
                disabled={importLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {importLoading && (
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                Оруулах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

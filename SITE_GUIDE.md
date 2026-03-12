# Remax Sky HR - Системийн Бүтэц Гарын Авлага

## Ерөнхий Тойм

Энэ нь Remax Sky HR веб програм бөгөөд ажилтнууд, ажил горилогчид, ярилцлага, ажлын байрны зар зэргийг удирдах зориулалттай.

```
remaxHR/
├── client/     ← Хэрэглэгчийн харагдах хэсэг (Frontend)
├── server/     ← Сервер талын логик (Backend)  
└── scripts/    ← Туслах скриптүүд
```

---

## 📁 ХАВТАСНЫ БҮТЭЦ

### Client (Frontend) - Хэрэглэгчийн харах хэсэг
```
client/src/
├── pages/           ← Хуудсууд (Dashboard, Employees, Jobs г.м.)
├── components/      ← Дахин ашиглагдах бүрэлдэхүүн хэсгүүд
├── services/api.ts  ← API дуудлагууд
├── types/index.ts   ← Өгөгдлийн төрлүүд
└── context/         ← Нэвтрэлтийн төлөв
```

### Server (Backend) - Серверийн хэсэг
```
server/src/
├── routes/     ← API endpoint-үүд
├── models/     ← Өгөгдлийн сангийн асуултууд
├── database/   ← Supabase холболт
└── middleware/ ← Нэвтрэлт шалгах
```

---

## 📄 ХУУДСУУД (Pages)

### 1. Dashboard (Хянах самбар)
**📍 Файл:** `client/src/pages/Dashboard.tsx`

**Юу харуулдаг:**
- Нийт ажилтан, гүйлгээтэй, гүйлгээгүй агентын тоо
- Нийт агент, Чанарын хувь
- Дундаж ажилласан сар, ТОП цол, Баг гишүүн (туслагч биш)
- Цол дуусах гэж буй агентууд
- Төрсөн өдөр ойртож буй ажилтнууд

**Засварлах үед:**
- Статистик картуудын загвар өөрчлөх: `Dashboard.tsx` доторх `<div className="grid grid-cols-6">` хэсэг
- Өнгө солих: `bg-blue-50`, `bg-green-50` г.м. Tailwind CSS өнгөнүүд

---

### 2. Employees (Ажилтнууд)
**📍 Файл:** `client/src/pages/Employees.tsx`

**Үндсэн функц:**
- Бүх ажилтны жагсаалт харах
- Шүүлтүүр: Оффисоор, статусаар, нэрээр хайх
- Ажилтны мэдээлэл засах
- Ажлаас гарсанд шилжүүлэх

**Статусын тохиргоо:** (мөр ~22-32)
```javascript
const EMPLOYEE_STATUSES = [
  { value: 'active', label: 'Идэвхтэй', color: 'bg-green-100 text-green-800' },
  { value: 'active_transaction', label: 'Идэвхитэй гүйлгээтэй', color: 'bg-teal-100 text-teal-800' },
  { value: 'active_no_transaction', label: 'Идэвхитэй, гүйлгээгүй', color: 'bg-orange-100 text-orange-800' },
  // ... бусад статусууд
];
```

**Засварлах үед:**
- Статус нэмэх/өөрчлөх: `EMPLOYEE_STATUSES` массивт нэмэх
- Өнгө солих: `color:` талбарт Tailwind CSS классууд
- Оффис нэмэх: `OFFICES` массивт нэмэх (мөр ~47)

---

### 3. Ranks (Цолнууд)
**📍 Файл:** `client/src/pages/Ranks.tsx`

**Үндсэн функц:**
- Агентуудын цолны жагсаалт
- Цол бүртгэх, засах, устгах
- Цолны түүх харах

**Цолны түвшингүүд:** (types/index.ts дотор)
```javascript
type RankLevel = 'Стандарт' | 'Силвер' | 'Голд' | 'Платиниум' | 'Даймонд';
```

**Цолны өнгө:** (Employees.tsx мөр ~14-20)
```javascript
const RANK_COLORS = {
  'Стандарт': 'bg-gray-100 text-gray-800',
  'Силвер': 'bg-slate-200 text-slate-800',
  'Голд': 'bg-yellow-100 text-yellow-800',
  'Платиниум': 'bg-purple-100 text-purple-800',
  'Даймонд': 'bg-blue-100 text-blue-800'
};
```

---

### 4. ResignedAgents (Гарсан агентууд)
**📍 Файл:** `client/src/pages/ResignedAgents.tsx`

**Үндсэн функц:**
- Ажлаас гарсан агентуудын жагсаалт
- Гарсан шалтгаан, огноо, ажилласан хугацаа

**Гарсан шалтгаанууд:** (Employees.tsx мөр ~35-43)
```javascript
const RESIGNATION_REASONS = [
  'Шилжсэн',
  'Ажиллах чадваргүй',
  'Зайлшгүй шалтгаан',
  'Байгууллагын соёл таалагдаагүй',
  'Давхар ажилтай',
  'Оффисын зүгээс гэрээ цуцалсан',
  'Урт хугацааны чөлөө авсан'
];
```

---

### 5. Jobs (Ажлын байрны зар)
**📍 Файл:** `client/src/pages/Jobs.tsx`

**Үндсэн функц:**
- Ажлын байрны зар үүсгэх, засах, устгах
- Нээлттэй/хаалттай төлөв

---

### 6. Candidates (Ажил горилогчид)
**📍 Файл:** `client/src/pages/Candidates.tsx`

**Үндсэн функц:**
- Ажил горилогчдын жагсаалт
- CV харах, тэмдэглэл нэмэх

---

### 7. Applications (Өргөдлүүд)
**📍 Файл:** `client/src/pages/Applications.tsx`

**Үндсэн функц:**
- Ирсэн өргөдлүүдийн жагсаалт
- Өргөдлийн төлөв шинэчлэх

---

### 8. Interviews (Ярилцлага)
**📍 Файл:** `client/src/pages/Interviews.tsx`

**Үндсэн функц:**
- Ярилцлагын хуваарь
- Ярилцлагын үр дүн бичих

---

### 9. Apply (Өргөдөл өгөх)
**📍 Файл:** `client/src/pages/Apply.tsx`

**Үндсэн функц:**
- Гаднаас өргөдөл өгөх форм
- Олон нийтэд нээлттэй хуудас

---

### 10. Admin (Админ)
**📍 Файл:** `client/src/pages/Admin.tsx`

**Үндсэн функц:**
- Хэрэглэгч нэмэх/устгах
- Эрх зүйн тохиргоо

---

### 11. Login (Нэвтрэх)
**📍 Файл:** `client/src/pages/Login.tsx`

**Үндсэн функц:**
- Системд нэвтрэх

---

## 🔌 API ENDPOINT-УУД

### Frontend API үйлчилгээ
**📍 Файл:** `client/src/services/api.ts`

| API Service | Endpoint | Тайлбар |
|-------------|----------|---------|
| `employeesApi` | `/api/employees` | Ажилтнуудын CRUD |
| `candidatesApi` | `/api/candidates` | Ажил горилогчдын CRUD |
| `jobsApi` | `/api/jobs` | Ажлын байрны зарын CRUD |
| `interviewsApi` | `/api/interviews` | Ярилцлагын CRUD |
| `applicationsApi` | `/api/applications` | Өргөдлийн CRUD |
| `resignedAgentsApi` | `/api/resigned-agents` | Гарсан агентын CRUD |
| `agentRanksApi` | `/api/agent-ranks` | Цолны CRUD |
| `usersApi` | `/api/users` | Хэрэглэгчийн CRUD |
| `notificationsApi` | `/api/notifications` | Мэдэгдлийн API |

### Backend Routes (Серверийн endpoint-үүд)
**📍 Хавтас:** `server/src/routes/`

| Файл | Функц |
|------|-------|
| `employees.ts` | GET, POST, PUT, DELETE /api/employees |
| `candidates.ts` | GET, POST, PUT, DELETE /api/candidates |
| `jobs.ts` | GET, POST, PUT, DELETE /api/jobs |
| `interviews.ts` | GET, POST, PUT, DELETE /api/interviews |
| `applications.ts` | GET, POST, PUT, DELETE /api/applications |
| `resignedAgents.ts` | GET, POST, PUT, DELETE /api/resigned-agents |
| `agentRanks.ts` | GET, POST, PUT, DELETE /api/agent-ranks |
| `users.ts` | GET, POST, PUT, DELETE /api/users |
| `auth.ts` | POST /api/auth/login, logout |
| `notifications.ts` | POST /api/notifications/send |

---

## 📊 ӨГӨГДЛИЙН БҮТЭЦ (Types)

**📍 Файл:** `client/src/types/index.ts`

### Employee (Ажилтан)
```typescript
{
  id: string;
  iConnectName?: string;      // iConnect нэр
  familyName: string;         // Ургийн овог
  lastName: string;           // Эцэг/эхийн нэр
  firstName: string;          // Нэр
  phone: string;              // Утас
  email: string;              // Имэйл
  officeName?: string;        // Оффис нэр
  status: string;             // Статус
  mls?: string;               // MLS код (цолтой холбоно)
  hiredDate: string;          // Ажилд орсон огноо
  birthDate: string;          // Төрсөн огноо
  // ... бусад талбарууд
}
```

### AgentRank (Цол)
```typescript
{
  id: string;
  agentId: string;            // MLS код
  agentName: string;          // Агентын нэр
  currentRank: RankLevel;     // Одоогийн цол
  currentStartDate: string;   // Эхлэх огноо
  currentEndDate: string;     // Дуусах огноо
  rankHistory: [];            // Цолны түүх
}
```

### ResignedAgent (Гарсан агент)
```typescript
{
  id: string;
  employeeId: string;         // Анхны employee ID
  workedMonths: number;       // Ажилласан сар
  resignedDate: string;       // Гарсан огноо
  resignationReason: string;  // Гарсан шалтгаан
  // ... ажилтны бүх талбарууд дээр нэмэгдэнэ
}
```

---

## 🎨 ӨНГӨ СОЛИХ

### Tailwind CSS Өнгөнүүд
Өнгө солиход доорх загварыг ашиглана:

| Өнгө | Арын өнгө (bg) | Текст өнгө (text) |
|------|----------------|-------------------|
| Ногоон | `bg-green-100` | `text-green-800` |
| Цэнхэр | `bg-blue-100` | `text-blue-800` |
| Шар | `bg-yellow-100` | `text-yellow-800` |
| Улаан | `bg-red-100` | `text-red-800` |
| Саарал | `bg-gray-100` | `text-gray-800` |
| Ягаан | `bg-purple-100` | `text-purple-800` |
| Ягаан (pink) | `bg-pink-100` | `text-pink-800` |
| Оранж | `bg-orange-100` | `text-orange-800` |
| Цайвар ногоон | `bg-teal-100` | `text-teal-800` |

### Жишээ: Статусын өнгө солих
`client/src/pages/Employees.tsx` файлд:
```javascript
// Хуучин:
{ value: 'active', label: 'Идэвхтэй', color: 'bg-green-100 text-green-800' }

// Шинэ (цэнхэр болгох):
{ value: 'active', label: 'Идэвхтэй', color: 'bg-blue-100 text-blue-800' }
```

---

## 🔧 ТҮГЭЭМЭЛ ЗАСВАРУУД

### 1. Шинэ статус нэмэх

**Файл:** `client/src/pages/Employees.tsx`

`EMPLOYEE_STATUSES` массивт нэмэх (мөр ~22):
```javascript
const EMPLOYEE_STATUSES = [
  // ... одоо байгаа статусууд
  { value: 'шинэ_статус', label: 'Шинэ Статусын Нэр', color: 'bg-blue-100 text-blue-800' },
];
```

**Файл:** `client/src/types/index.ts`

Employee интерфэйс дэх status төрөлд нэмэх (мөр ~98):
```typescript
status: 'active_transaction' | 'active_no_transaction' | '...' | 'шинэ_статус';
```

---

### 2. Шинэ оффис нэмэх

**Файл:** `client/src/pages/Employees.tsx`

`OFFICES` массивт нэмэх (мөр ~47):
```javascript
const OFFICES = ['Бүгд', 'Гэгээнтэн', 'Ривер', 'Даун таун', 'Шинэ Оффис'];
```

---

### 3. Шинэ цол нэмэх

**Файл:** `client/src/types/index.ts`

`RankLevel` төрөлд нэмэх:
```typescript
export type RankLevel = 'Стандарт' | 'Силвер' | 'Голд' | 'Платиниум' | 'Даймонд' | 'Шинэ Цол';
```

**Файл:** `client/src/pages/Employees.tsx`

`RANK_COLORS` объектод нэмэх:
```javascript
const RANK_COLORS = {
  // ... одоо байгаа
  'Шинэ Цол': 'bg-emerald-100 text-emerald-800',
};
```

---

### 4. Гарсан шалтгаан нэмэх

**Файл:** `client/src/pages/Employees.tsx`

`RESIGNATION_REASONS` массивт нэмэх:
```javascript
const RESIGNATION_REASONS = [
  // ... одоо байгаа
  'Шинэ шалтгаан',
];
```

**Файл:** `client/src/types/index.ts`

ResignedAgent интерфэйс дэх resignationReason-д нэмэх.

---

### 5. Dashboard карт нэмэх

**Файл:** `client/src/pages/Dashboard.tsx`

Grid дотор шинэ карт нэмэх:
```jsx
<div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
  <div className="text-2xl font-bold text-green-600">123</div>
  <div className="text-xs text-gray-500 mt-1">Шинэ статистик</div>
</div>
```

---

## 🗄️ ӨГӨГДЛИЙН САНГИЙН ХҮСНЭГТҮҮД (Supabase)

| Хүснэгт | Тайлбар |
|---------|---------|
| `employees` | Ажилтнуудын мэдээлэл |
| `candidates` | Ажил горилогчид |
| `jobs` | Ажлын байрны зар |
| `interviews` | Ярилцлага |
| `applications` | Өргөдлүүд |
| `resigned_agents` | Гарсан агентууд |
| `agent_ranks` | Цолны мэдээлэл |
| `users` | Системийн хэрэглэгчид |

**Schema файл:** `server/supabase-schema.sql`

---

## 🚀 АЖИЛЛУУЛАХ КОМАНДУУД

```bash
# Бүх dependency суулгах
npm install

# Хөгжүүлэлтийн горимд ажиллуулах (client + server)
npm run dev

# Зөвхөн client ажиллуулах
npm run client

# Зөвхөн server ажиллуулах
npm run server
```

---

## 📝 ЧУХАЛ АНХААРУУЛГА

1. **Файл засахдаа** хадгалахаас өмнө backup хий
2. **TypeScript төрөл** өөрчлөхөд types/index.ts болон холбоотой бүх хуудсуудад шинэчлэх
3. **API endpoint** нэмэхэд server/src/routes дотор route үүсгэж, server/src/index.ts дотор бүртгэх
4. **Өгөгдлийн сангийн** бүтэц өөрчлөхөд migration файл үүсгэх (server/migrations/)

---

## 📞 ТЕХНИКИЙН ТУСЛАМЖ

Асуудал гарвал:
1. Console дээр алдаа шалгах (F12 → Console tab)
2. Server log шалгах (terminal дээр харагдана)
3. Supabase dashboard дээр өгөгдөл шалгах

---

*Сүүлд шинэчилсэн: 2025*

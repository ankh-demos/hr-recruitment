/**
 * Import Employees from Excel to Supabase
 * 
 * Usage: node import-employees.js
 */

const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

// ============================================
// CONFIGURATION
// ============================================
const SUPABASE_URL = 'https://zxdekkgathokikydzrsb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZGVra2dhdGhva2lreWR6cnNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTE3MzcsImV4cCI6MjA4NTk2NzczN30.PnPr8f3amMNjKs0zqLmeUSbMZwexAL1BodqlAFzRzHo';
const EXCEL_FILE = 'C:\\Users\\Ankhaa\\Downloads\\to import.xlsx';

// ============================================
// Helper Functions
// ============================================
function parseDate(year, month, day) {
  if (!year || !month || !day) return null;
  const y = parseInt(year);
  const m = parseInt(month);
  const d = parseInt(day);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function parseGender(value) {
  if (!value) return null;
  const v = String(value).toLowerCase().trim();
  if (v === 'эр' || v === 'male' || v === 'м' || v === 'm') return 'male';
  if (v === 'эм' || v === 'female' || v === 'э' || v === 'f') return 'female';
  return null;
}

function parseDriverLicense(value) {
  if (!value) return false;
  const v = String(value).toLowerCase().trim();
  return v === 'тийм' || v === 'yes' || v === 'true' || v === '1';
}

function cleanString(value) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s === '' ? null : s;
}

function mapRowToEmployee(row) {
  // Skip empty rows - must have last_name (col 2) and first_name (col 3)
  if (!row || !row[2] || !row[3]) {
    return null;
  }

  const employee = {
    iconnect_name: cleanString(row[1]),
    last_name: cleanString(row[2]),
    first_name: cleanString(row[3]),
    referral_source: cleanString(row[4]),
    family_name: cleanString(row[5]),
    birth_place: cleanString(row[7]),
    ethnicity: cleanString(row[8]),
    remax_email: cleanString(row[9])?.replace(/\s+/g, ''),
    register_number: cleanString(row[14]),
    birth_date: parseDate(row[15], row[16], row[17]),
    gender: parseGender(row[19]),
    phone: row[20] ? String(row[20]).trim() : null,
    emergency_phone: row[21] ? String(row[21]).trim() : null,
    email: cleanString(row[22])?.replace(/\s+/g, ''),
    training_number: row[23] ? String(row[23]) : null,
    certificate_number: cleanString(row[24]),
    citizen_registration_number: row[25] ? String(row[25]) : null,
    szh_certificate_number: cleanString(row[26]),
    certificate_date: parseDate(row[27], row[28], row[29]),
    mls: row[31] ? String(row[31]) : null,
    bank: cleanString(row[32]),
    account_number: row[33] ? String(row[33]) : null,
    district: cleanString(row[54]),
    detailed_address: cleanString(row[55]),
    home_address: cleanString(row[55]),
    children_count: row[62] ? parseInt(row[62]) || 0 : 0,
    has_driver_license: parseDriverLicense(row[13]),
    status: 'active',
    
    // JSONB fields
    work_experience: row[11] ? [{ description: cleanString(row[11]) }] : [],
    languages: row[63] ? [{ name: cleanString(row[63]) }] : [],
    education: [],
    family_members: [],
    awards: [],
    other_skills: cleanString(row[64]),
  };

  // Parse employment_start_date from "2022.01.03" format
  if (row[6]) {
    const dateStr = String(row[6]).trim();
    const match = dateStr.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
    if (match) {
      employee.employment_start_date = parseDate(match[1], match[2], match[3]);
      employee.hired_date = employee.employment_start_date;
    }
  }

  // Parse education columns (56-61)
  const eduCols = [row[56], row[57], row[58], row[59], row[60], row[61]].filter(x => x);
  if (eduCols.length > 0) {
    employee.education = [{ description: eduCols.join(', ') }];
  }

  return employee;
}

async function importEmployees() {
  console.log('='.repeat(50));
  console.log('Employee Import Script');
  console.log('='.repeat(50));
  
  // Validate configuration
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL_HERE' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY_HERE') {
    console.error('\n❌ ERROR: Please set your Supabase credentials!');
    console.log('\nEdit import-employees.js and update lines 13-14:');
    console.log('  - SUPABASE_URL');
    console.log('  - SUPABASE_ANON_KEY');
    process.exit(1);
  }

  // Initialize Supabase client
  console.log('\n📡 Connecting to Supabase...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Read Excel file
  console.log(`📄 Reading Excel file: ${EXCEL_FILE}`);
  const workbook = XLSX.readFile(EXCEL_FILE);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  console.log(`📊 Found ${rawData.length - 1} rows (excluding header)`);

  // Map rows to employee objects
  const employees = [];
  const skipped = [];

  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    const employee = mapRowToEmployee(row);
    if (employee) {
      employees.push(employee);
    } else {
      skipped.push(i + 1);
    }
  }

  console.log(`✅ Mapped ${employees.length} employees`);
  if (skipped.length > 0) {
    console.log(`⚠️  Skipped ${skipped.length} rows (missing required fields)`);
  }

  // Check for existing MLS numbers to avoid duplicates
  console.log('\n🔍 Checking for existing records...');
  const mlsNumbers = employees.filter(e => e.mls).map(e => e.mls);
  const { data: existingEmployees, error: fetchError } = await supabase
    .from('employees')
    .select('mls')
    .in('mls', mlsNumbers);

  if (fetchError) {
    console.error('❌ Error checking existing records:', fetchError.message);
  }

  const existingMls = new Set((existingEmployees || []).map(e => e.mls));
  const newEmployees = employees.filter(e => !e.mls || !existingMls.has(e.mls));
  const duplicates = employees.length - newEmployees.length;

  if (duplicates > 0) {
    console.log(`⚠️  Found ${duplicates} employees already in database (by MLS)`);
  }

  if (newEmployees.length === 0) {
    console.log('\n✨ No new employees to import!');
    return;
  }

  console.log(`\n📤 Importing ${newEmployees.length} new employees...`);

  // Insert in batches of 50
  const batchSize = 50;
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (let i = 0; i < newEmployees.length; i += batchSize) {
    const batch = newEmployees.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('employees')
      .insert(batch)
      .select();

    if (error) {
      console.error(`\n❌ Batch ${Math.floor(i / batchSize) + 1} error:`, error.message);
      errors.push({ batch: Math.floor(i / batchSize) + 1, error: error.message, details: error });
      errorCount += batch.length;
    } else {
      successCount += batch.length;
      process.stdout.write(`\r  Progress: ${successCount}/${newEmployees.length}`);
    }
  }

  console.log('\n');
  console.log('='.repeat(50));
  console.log('Import Complete!');
  console.log('='.repeat(50));
  console.log(`✅ Successfully imported: ${successCount}`);
  if (errorCount > 0) {
    console.log(`❌ Failed: ${errorCount}`);
    console.log('\nErrors:');
    errors.forEach(e => console.log(`  Batch ${e.batch}: ${e.error}`));
  }
  if (duplicates > 0) {
    console.log(`⏭️  Skipped (duplicates): ${duplicates}`);
  }
}

// Run the import
importEmployees().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

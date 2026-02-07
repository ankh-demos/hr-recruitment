const xlsx = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Supabase configuration
const SUPABASE_URL = 'https://zxdekkgathokikydzrsb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZGVra2dhdGhva2lreWR6cnNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTE3MzcsImV4cCI6MjA4NTk2NzczN30.PnPr8f3amMNjKs0zqLmeUSbMZwexAL1BodqlAFzRzHo';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function generateUUID() {
  return crypto.randomUUID();
}

// Rank levels in order (lowest to highest)
const RANK_ORDER = ['Стандарт', 'Силвер', 'Голд', 'Платиниум', 'Даймонд'];

// Column indices for each rank
const RANK_COLUMNS = {
  'Стандарт': { contract: 2, year: 3, month: 4, day: 5 },
  'Силвер': { contract: 7, year: 8, month: 9, day: 10 },
  'Голд': { contract: 12, year: 13, month: 14, day: 15 },
  'Платиниум': { contract: 17, year: 18, month: 19, day: 20 },
  'Даймонд': { contract: 22, year: 23, month: 24, day: 25 }
};

function formatDate(year, month, day) {
  if (!year || !month || !day) return null;
  const y = parseInt(year);
  const m = parseInt(month);
  const d = parseInt(day);
  
  // Validate year is reasonable (2020-2030)
  if (y < 2000 || y > 2030) return null;
  if (m < 1 || m > 12) return null;
  if (d < 1 || d > 31) return null;
  
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function addOneYear(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split('T')[0];
}

function parseRow(row) {
  const agentName = row[0];
  const mls = row[1];
  
  if (!agentName || !mls) return null;
  
  const rankHistory = [];
  let highestRank = null;
  let highestRankData = null;
  
  for (const [rankName, cols] of Object.entries(RANK_COLUMNS)) {
    const contract = row[cols.contract];
    const year = row[cols.year];
    const month = row[cols.month];
    const day = row[cols.day];
    
    if (contract && year && month && day) {
      const startDate = formatDate(year, month, day);
      const endDate = addOneYear(startDate);
      
      const rankEntry = {
        rank: rankName,
        startDate,
        endDate,
        createdAt: new Date().toISOString()
      };
      
      rankHistory.push(rankEntry);
      
      // Track highest rank
      if (!highestRank || RANK_ORDER.indexOf(rankName) > RANK_ORDER.indexOf(highestRank)) {
        highestRank = rankName;
        highestRankData = { contract, startDate, endDate };
      }
    }
  }
  
  if (rankHistory.length === 0) {
    console.log(`  Skipping ${agentName} - no rank data`);
    return null;
  }
  
  return {
    id: generateUUID(),
    agent_id: String(mls),
    agent_name: agentName.trim(),
    contract_number: highestRankData.contract,
    current_rank: highestRank,
    current_start_date: highestRankData.startDate,
    current_end_date: highestRankData.endDate,
    rank_history: rankHistory,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

async function importAgentRanks() {
  console.log('Reading Excel file...');
  const workbook = xlsx.readFile('c:\\Users\\Ankhaa\\Downloads\\agentRanks.xlsx');
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log(`Found ${data.length - 1} rows (excluding header)`);
  
  const agentRanks = [];
  const skipped = [];
  
  // Skip header row (index 0)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const parsed = parseRow(row);
    
    if (parsed) {
      agentRanks.push(parsed);
    } else if (row[0]) {
      skipped.push({ row: i + 1, name: row[0], mls: row[1] });
    }
  }
  
  console.log(`\nParsed ${agentRanks.length} agent ranks`);
  console.log(`Skipped ${skipped.length} rows`);
  
  if (skipped.length > 0) {
    console.log('\nSkipped rows:');
    skipped.forEach(s => console.log(`  Row ${s.row}: ${s.name} (MLS: ${s.mls || 'missing'})`));
  }
  
  // Insert into Supabase
  console.log('\nInserting into Supabase...');
  
  let inserted = 0;
  let errors = 0;
  
  for (const agentRank of agentRanks) {
    try {
      // Check if exists
      const { data: existing } = await supabase
        .from('agent_ranks')
        .select('id')
        .eq('agent_id', agentRank.agent_id)
        .single();
      
      if (existing) {
        // Update
        const { error } = await supabase
          .from('agent_ranks')
          .update({
            agent_name: agentRank.agent_name,
            contract_number: agentRank.contract_number,
            current_rank: agentRank.current_rank,
            current_start_date: agentRank.current_start_date,
            current_end_date: agentRank.current_end_date,
            rank_history: agentRank.rank_history,
            updated_at: agentRank.updated_at
          })
          .eq('agent_id', agentRank.agent_id);
        
        if (error) throw error;
        console.log(`  Updated: ${agentRank.agent_name}`);
      } else {
        // Insert
        const { error } = await supabase
          .from('agent_ranks')
          .insert(agentRank);
        
        if (error) throw error;
        console.log(`  Inserted: ${agentRank.agent_name}`);
      }
      inserted++;
    } catch (err) {
      console.error(`  Error for ${agentRank.agent_name}:`, err.message);
      errors++;
    }
  }
  
  console.log(`\n=== Import Complete ===`);
  console.log(`Successfully processed: ${inserted}`);
  console.log(`Errors: ${errors}`);
}

importAgentRanks().catch(console.error);

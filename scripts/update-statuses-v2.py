"""
Script to update employee statuses from Excel file.
Matches Excel names with agentName from ranks table, then updates employees via MLS.
"""

import pandas as pd
import requests

# Configuration
API_BASE = 'https://remaxskymn-api.onrender.com/api'
EXCEL_FILE = r'c:\Users\Ankhaa\Downloads\agent status.xlsx'

# Status mapping from Mongolian to system values
STATUS_MAP = {
    'Идэвхтэй': 'active',
    'Идэвхтэй, гүйлгээгүй': 'active_no_transaction',
    'Идэвхгүй, гүйлгээтэй': 'inactive_transaction',
    'Идэвхгүй': 'inactive',
    'Чөлөөтэй': 'on_leave',
    'Шинэ 0-3 сар': 'new_0_3',
    'Жирэмсний амралт': 'maternity_leave',
    'Багийн гишүүн': 'team_member',
    'Гарсан агент': 'resigned'
}

def normalize_name(name):
    """Normalize name for matching"""
    if pd.isna(name):
        return ''
    return ' '.join(str(name).strip().lower().split())

def main():
    # Read Excel file
    print(f"Reading Excel file: {EXCEL_FILE}")
    df = pd.read_excel(EXCEL_FILE)
    print(f"Found {len(df)} records in Excel")
    
    # Get agent ranks from API (contains romanized names)
    print(f"\nFetching agent ranks from API...")
    try:
        response = requests.get(f"{API_BASE}/agent-ranks", timeout=30)
        response.raise_for_status()
        ranks = response.json()
        print(f"Found {len(ranks)} agent ranks")
    except Exception as e:
        print(f"Error fetching ranks: {e}")
        return
    
    # Get all employees from API
    print(f"Fetching employees from API...")
    try:
        response = requests.get(f"{API_BASE}/employees", timeout=30)
        response.raise_for_status()
        employees = response.json()
        print(f"Found {len(employees)} employees")
    except Exception as e:
        print(f"Error fetching employees: {e}")
        return
    
    # Build name -> agentId lookup from ranks
    name_to_mls = {}
    for rank in ranks:
        agent_name = normalize_name(rank.get('agentName', ''))
        agent_id = rank.get('agentId', '')
        if agent_name and agent_id:
            name_to_mls[agent_name] = agent_id
    
    # Build MLS -> employee lookup
    mls_to_emp = {}
    for emp in employees:
        mls = emp.get('mls', '')
        if mls:
            mls_to_emp[str(mls)] = emp
    
    # Match and prepare updates
    updates = []
    not_found = []
    resigned_agents = []
    
    for idx, row in df.iterrows():
        excel_name = row['Нийт агентын нэрс']
        status_mn = str(row['Агентын статус']).strip()
        status_code = STATUS_MAP.get(status_mn)
        
        if not status_code:
            print(f"Warning: Unknown status '{status_mn}' for {excel_name}")
            continue
        
        excel_normalized = normalize_name(excel_name)
        
        # Find MLS via ranks table
        mls = name_to_mls.get(excel_normalized)
        
        if not mls:
            # Try to find similar name
            found = False
            for rank_name, rank_mls in name_to_mls.items():
                excel_parts = set(excel_normalized.split())
                rank_parts = set(rank_name.split())
                # Both parts should match
                if len(excel_parts) >= 2 and len(rank_parts) >= 2:
                    if excel_parts == rank_parts:
                        mls = rank_mls
                        found = True
                        break
            if not found:
                not_found.append({'excel_name': excel_name, 'status': status_mn})
                continue
        
        # Find employee by MLS
        emp = mls_to_emp.get(str(mls))
        
        if not emp:
            not_found.append({'excel_name': excel_name, 'status': status_mn, 'mls': mls})
            continue
        
        if status_code == 'resigned':
            resigned_agents.append({
                'id': emp['id'],
                'name': f"{emp.get('lastName', '')} {emp.get('firstName', '')}",
                'excel_name': excel_name
            })
        else:
            if emp.get('status') != status_code:
                updates.append({
                    'id': emp['id'],
                    'current_status': emp.get('status'),
                    'new_status': status_code,
                    'name': f"{emp.get('lastName', '')} {emp.get('firstName', '')}",
                    'excel_name': excel_name
                })
    
    # Print summary
    print(f"\n=== Summary ===")
    print(f"Updates needed: {len(updates)}")
    print(f"Resigned agents: {len(resigned_agents)}")
    print(f"Not found in DB: {len(not_found)}")
    
    if updates:
        print(f"\n=== Status Updates ===")
        for u in updates:
            print(f"  {u['name']} ({u['excel_name']}): {u['current_status']} -> {u['new_status']}")
    
    if resigned_agents:
        print(f"\n=== Resigned Agents (need manual handling) ===")
        for r in resigned_agents:
            print(f"  {r['name']} ({r['excel_name']})")
    
    if not_found:
        print(f"\n=== Not Found ===")
        for nf in not_found[:20]:
            if 'mls' in nf:
                print(f"  {nf['excel_name']} ({nf['status']}) - MLS {nf['mls']} not in employees")
            else:
                print(f"  {nf['excel_name']} ({nf['status']}) - name not in ranks")
        if len(not_found) > 20:
            print(f"  ... and {len(not_found) - 20} more")
    
    # Apply updates
    if updates:
        confirm = input(f"\nApply {len(updates)} status updates? (y/n): ")
        if confirm.lower() == 'y':
            success = 0
            failed = 0
            for u in updates:
                try:
                    # Use PUT /:id endpoint with status in body
                    resp = requests.put(
                        f"{API_BASE}/employees/{u['id']}",
                        json={'status': u['new_status']},
                        timeout=10
                    )
                    if resp.status_code == 200:
                        success += 1
                        print(f"  ✓ Updated {u['name']}")
                    else:
                        failed += 1
                        print(f"  ✗ Failed {u['name']}: {resp.status_code} - {resp.text}")
                except Exception as e:
                    failed += 1
                    print(f"  ✗ Error updating {u['name']}: {e}")
            
            print(f"\nDone: {success} success, {failed} failed")
        else:
            print("Cancelled.")

if __name__ == '__main__':
    main()

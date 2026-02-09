"""
Script to update employee statuses from Excel file.
Matches Excel names with agentName from ranks table, then updates employees via MLS.
"""

import pandas as pd
import requests
import json

# Configuration
API_BASE = 'https://remaxskymn-api.onrender.com/api'  # Production API
EXCEL_FILE = r'c:\Users\Ankhaa\Downloads\agent status.xlsx'

# Mongolian Cyrillic to Latin transliteration
TRANSLIT_MAP = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
    'ж': 'j', 'з': 'z', 'и': 'i', 'й': 'i', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'ө': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
    'у': 'u', 'ү': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh',
    'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
    'Ж': 'J', 'З': 'Z', 'И': 'I', 'Й': 'I', 'К': 'K', 'Л': 'L', 'М': 'M',
    'Н': 'N', 'О': 'O', 'Ө': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T',
    'У': 'U', 'Ү': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh',
    'Щ': 'Shch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
    '-': '-', ' ': ' '
}

def transliterate(text):
    """Convert Cyrillic text to Latin"""
    if not text:
        return ''
    result = []
    for char in text:
        result.append(TRANSLIT_MAP.get(char, char))
    return ''.join(result)

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
    'Гарсан агент': 'resigned'  # Special case - may need to move to resigned table
}

def normalize_name(name):
    """Normalize name for matching - strip whitespace, lowercase"""
    if pd.isna(name):
        return ''
    return ' '.join(str(name).strip().lower().split())

def match_names(excel_name, db_first, db_last):
    """Try to match Excel name (romanized) with DB names (Cyrillic via transliteration)"""
    excel_normalized = normalize_name(excel_name)
    
    # Transliterate DB names to Latin
    db_first_latin = transliterate(db_first).lower() if db_first else ''
    db_last_latin = transliterate(db_last).lower() if db_last else ''
    
    # Try FirstName LastName format
    db_full1 = f"{db_first_latin} {db_last_latin}".strip()
    db_full2 = f"{db_last_latin} {db_first_latin}".strip()
    
    if excel_normalized == db_full1 or excel_normalized == db_full2:
        return True
    
    # Try partial matches - split both and check if parts match
    excel_parts = set(excel_normalized.split())
    db_parts = set([db_first_latin, db_last_latin])
    
    # Check if at least both name parts from DB appear in Excel name
    if db_first_latin and db_last_latin:
        if db_first_latin in excel_parts and db_last_latin in excel_parts:
            return True
        # Also try if Excel parts appear in DB parts
        if len(excel_parts) >= 2:
            matches = sum(1 for p in excel_parts if p in db_full1 or p in db_full2)
            if matches >= 2:
                return True
    
    return False

def main():
    # Read Excel file
    print(f"Reading Excel file: {EXCEL_FILE}")
    df = pd.read_excel(EXCEL_FILE)
    print(f"Found {len(df)} records in Excel")
    
    # Get all employees from API
    print(f"\nFetching employees from API: {API_BASE}/employees")
    try:
        response = requests.get(f"{API_BASE}/employees", timeout=30)
        response.raise_for_status()
        employees = response.json()
        print(f"Found {len(employees)} employees in database")
    except Exception as e:
        print(f"Error fetching employees: {e}")
        return
    
    # Match and prepare updates
    updates = []
    not_found = []
    resigned_agents = []
    
    for idx, row in df.iterrows():
        excel_name = row['Нийт агентын нэрс']
        status_mn = row['Агентын статус'].strip()
        status_code = STATUS_MAP.get(status_mn)
        
        if not status_code:
            print(f"Warning: Unknown status '{status_mn}' for {excel_name}")
            continue
        
        # Find matching employee
        matched_emp = None
        for emp in employees:
            if match_names(excel_name, emp.get('firstName', ''), emp.get('lastName', '')):
                matched_emp = emp
                break
        
        if matched_emp:
            if status_code == 'resigned':
                resigned_agents.append({
                    'id': matched_emp['id'],
                    'name': f"{matched_emp.get('lastName', '')} {matched_emp.get('firstName', '')}",
                    'excel_name': excel_name
                })
            else:
                if matched_emp.get('status') != status_code:
                    updates.append({
                        'id': matched_emp['id'],
                        'current_status': matched_emp.get('status'),
                        'new_status': status_code,
                        'name': f"{matched_emp.get('lastName', '')} {matched_emp.get('firstName', '')}",
                        'excel_name': excel_name
                    })
        else:
            not_found.append({'excel_name': excel_name, 'status': status_mn})
    
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
        print(f"\n=== Not Found in Database ===")
        for nf in not_found:
            print(f"  {nf['excel_name']} ({nf['status']})")
    
    # Apply updates
    if updates:
        confirm = input(f"\nApply {len(updates)} status updates? (y/n): ")
        if confirm.lower() == 'y':
            success = 0
            failed = 0
            for u in updates:
                try:
                    resp = requests.put(
                        f"{API_BASE}/employees/{u['id']}/status",
                        json={'status': u['new_status']},
                        timeout=10
                    )
                    if resp.status_code == 200:
                        success += 1
                        print(f"  ✓ Updated {u['name']}")
                    else:
                        failed += 1
                        print(f"  ✗ Failed {u['name']}: {resp.status_code}")
                except Exception as e:
                    failed += 1
                    print(f"  ✗ Error updating {u['name']}: {e}")
            
            print(f"\nDone: {success} success, {failed} failed")
        else:
            print("Cancelled.")

if __name__ == '__main__':
    main()

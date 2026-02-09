import requests
r = requests.get('https://remaxskymn-api.onrender.com/api/employees')
emps = r.json()
print('Sample employees (iConnectName | firstName lastName):')
for e in emps[:20]:
    print(f"  {e.get('iConnectName', '-'):<40} | {e.get('firstName', '')} {e.get('lastName', '')}")

import requests

r = requests.get('https://remaxskymn-api.onrender.com/api/agent-ranks')
ranks = r.json()
print(f'Total ranks: {len(ranks)}')
print('Sample ranks (agentName | agentId):')
for rank in ranks[:20]:
    print(f"  {rank.get('agentName', ''):<40} | {rank.get('agentId', '')}")

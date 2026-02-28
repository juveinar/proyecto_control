import requests
import json

# Test the API endpoint
try:
    response = requests.get('http://localhost:8088/api/projects')
    print(f"Status Code: {response.status_code}")
    print(f"Content-Type: {response.headers.get('Content-Type')}")
    
    if response.status_code == 200:
        if 'application/json' in response.headers.get('Content-Type', ''):
            data = response.json()
            print(f"Success! Got {len(data)} projects")
            if data:
                print(f"First project: {data[0].get('Project', 'N/A')}")
        else:
            print("Response is not JSON. Got HTML instead (probably login page)")
            print(f"Response length: {len(response.text)}")
    else:
        print(f"Error: {response.status_code}")
        print(response.text[:500])
        
except Exception as e:
    print(f'Error: {e}')
    import traceback
    traceback.print_exc()

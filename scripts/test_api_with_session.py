import requests
import json

# Create a session to maintain login
session = requests.Session()

# First, login to get authentication
login_data = {
    'username': 'admin',  # You may need to change this
    'password': 'admin'   # You may need to change this
}

try:
    # Try to login first
    login_response = session.post('http://localhost:8088/login/', data=login_data)
    print(f"Login Status: {login_response.status_code}")
    
    # Now try to access the API
    response = session.get('http://localhost:8088/api/projects')
    print(f"API Status Code: {response.status_code}")
    print(f"Content-Type: {response.headers.get('Content-Type')}")
    
    if response.status_code == 200:
        if 'application/json' in response.headers.get('Content-Type', ''):
            data = response.json()
            print(f"Success! Got {len(data)} projects")
            if data:
                print(f"First project: {data[0].get('Project', 'N/A')}")
        else:
            print("Response is not JSON. Got HTML instead")
            print(f"Response length: {len(response.text)}")
    else:
        print(f"Error: {response.status_code}")
        print(response.text[:500])
        
except Exception as e:
    print(f'Error: {e}')
    import traceback
    traceback.print_exc()

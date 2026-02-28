import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proyecto_control.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth.models import User
from control_proyectos.views import api_projects

# Create a request factory
factory = RequestFactory()

# Create a user for testing
user = User.objects.first()
if not user:
    user = User.objects.create_user(username='testuser', password='testpass')

# Create a GET request
request = factory.get('/api/projects')
request.user = user

try:
    response = api_projects(request)
    print(f"Response Status: {response.status_code}")
    print(f"Response Content-Type: {response.get('Content-Type')}")
    
    if response.status_code == 200:
        import json
        data = json.loads(response.content.decode('utf-8'))
        print(f"Success! Got {len(data)} projects")
        if data:
            print(f"First project: {data[0].get('Project', 'N/A')}")
    else:
        print(f"Error: {response.status_code}")
        print(response.content.decode('utf-8')[:500])
        
except Exception as e:
    print(f'Error: {e}')
    import traceback
    traceback.print_exc()

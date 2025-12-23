"""
Script para probar las consultas de la API
Ejecutar: python probar_api.py
"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proyecto_control.settings')
django.setup()

from control_proyectos.models import Proyecto, Evento
from control_proyectos.views import api_projects, api_projects_stats, api_events
from django.test import RequestFactory
from django.contrib.auth.models import User

print("=" * 80)
print("PRUEBA DE CONSULTAS DE LA API")
print("=" * 80)

# Crear un usuario de prueba para autenticación
try:
    test_user = User.objects.first()
    if not test_user:
        print("⚠️  No hay usuarios en la base de datos.")
        print("   Crea un usuario con: python manage.py createsuperuser")
        exit(1)
except Exception as e:
    print(f"Error obteniendo usuario: {e}")
    exit(1)

factory = RequestFactory()

# Probar GET /api/projects
print("\n📊 Probando GET /api/projects:")
print("-" * 80)
try:
    request = factory.get('/api/projects')
    request.user = test_user
    response = api_projects(request)

    if response.status_code == 200:
        data = json.loads(response.content)
        print(f"✓ Respuesta exitosa: {len(data)} proyectos")
        if len(data) > 0:
            print(f"\nPrimer proyecto:")
            primer_proyecto = data[0]
            print(f"  - ID: {primer_proyecto.get('Id Project', 'N/A')}")
            print(f"  - Nombre: {primer_proyecto.get('Project Name', 'N/A')}")
            print(f"  - Estado: {primer_proyecto.get('FINALIZADO', 'N/A')}")
            print(f"  - Fecha Inicio: {primer_proyecto.get('Start', 'N/A')}")
            print(f"  - Campos disponibles: {len(primer_proyecto)} campos")
            print(f"  - Lista de campos: {', '.join(list(primer_proyecto.keys())[:10])}...")
        else:
            print("⚠️  La API devuelve 0 proyectos")
    else:
        print(f"❌ Error: Código {response.status_code}")
        print(f"   Contenido: {response.content.decode()}")
except Exception as e:
    print(f"❌ Error al probar API: {e}")
    import traceback
    traceback.print_exc()

# Probar GET /api/projects/stats
print("\n\n📈 Probando GET /api/projects/stats:")
print("-" * 80)
try:
    request = factory.get('/api/projects/stats?year=2024')
    request.user = test_user
    response = api_projects_stats(request)

    if response.status_code == 200:
        data = json.loads(response.content)
        print(f"✓ Respuesta exitosa")
        print(f"  - Labels: {data.get('labels', [])}")
        print(f"  - Datos: {data.get('data', [])}")
        total_2024 = sum(data.get('data', []))
        print(f"  - Total proyectos 2024: {total_2024}")
    else:
        print(f"❌ Error: Código {response.status_code}")
except Exception as e:
    print(f"❌ Error: {e}")

# Probar GET /api/events
print("\n\n📅 Probando GET /api/events:")
print("-" * 80)
try:
    request = factory.get('/api/events')
    request.user = test_user
    response = api_events(request)

    if response.status_code == 200:
        data = json.loads(response.content)
        print(f"✓ Respuesta exitosa: {len(data)} eventos")
    else:
        print(f"❌ Error: Código {response.status_code}")
except Exception as e:
    print(f"❌ Error: {e}")

# Comparar datos directos vs API
print("\n\n🔍 COMPARACIÓN: Base de Datos vs API")
print("-" * 80)
proyectos_db = Proyecto.objects.count()
print(f"Proyectos en BD (directo): {proyectos_db}")

try:
    request = factory.get('/api/projects')
    request.user = test_user
    response = api_projects(request)
    if response.status_code == 200:
        data = json.loads(response.content)
        proyectos_api = len(data)
        print(f"Proyectos en API: {proyectos_api}")

        if proyectos_db != proyectos_api:
            print(f"⚠️  DIFERENCIA: BD tiene {proyectos_db} pero API devuelve {proyectos_api}")
        else:
            print("✓ Los números coinciden")
except Exception as e:
    print(f"❌ Error en comparación: {e}")

print("\n" + "=" * 80)
print("PRUEBA COMPLETADA")
print("=" * 80)




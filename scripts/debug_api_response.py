import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proyecto_control.settings')
django.setup()

import json
from control_proyectos.models import Contacto

# Simulate the API response for contacts
print("=== API RESPONSE SIMULATION ===")
contactos = Contacto.objects.select_related('proyecto').all().order_by('nombre')
contactos_list = []

for c in contactos:
    contact_data = {
        'id': c.id,
        'nombre': c.nombre,
        'telefono': c.telefono,
        'correo': c.correo,
        'cargo': c.cargo,
        'area': c.area,
        'notas': c.notas,
        'proyecto_id': c.proyecto.id_project if c.proyecto else None,
        'proyecto_nombre': c.proyecto.project if c.proyecto else '',
    }
    contactos_list.append(contact_data)

# Show first few contacts with full data
print("First 3 contacts from API:")
for i, contact in enumerate(contactos_list[:3]):
    print(f"\nContact {i+1}:")
    print(json.dumps(contact, indent=2, default=str))

# Check specifically Carlos Hernandez (ID 33)
carlos = next((c for c in contactos_list if c['id'] == 33), None)
if carlos:
    print(f"\n=== CARLOS HERNANDEZ (ID 33) ===")
    print(json.dumps(carlos, indent=2, default=str))

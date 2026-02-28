import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proyecto_control.settings')
django.setup()

from control_proyectos.models import Contacto

# Check the actual data in the database
print("=== CHECKING CONTACT DATA IN DATABASE ===")
contact_id = 33
try:
    contacto = Contacto.objects.get(id=contact_id)
    print(f"Contact ID {contact_id}:")
    print(f"  Nombre: '{contacto.nombre}'")
    print(f"  Teléfono: '{contacto.telefono}'")
    print(f"  Correo: '{contacto.correo}'")
    print(f"  Cargo: '{contacto.cargo}'")
    print(f"  Área: '{contacto.area}'")
    print(f"  Notas: '{contacto.notas}'")
    print(f"  Proyecto ID: {contacto.proyecto.id_project if contacto.proyecto else None}")
    
    print(f"\nRaw object: {contacto.__dict__}")
    
except Contacto.DoesNotExist:
    print(f"Contact with ID {contact_id} not found")

# Check a few more contacts
print("\n=== CHECKING FIRST 5 CONTACTS ===")
for contacto in Contacto.objects.all()[:5]:
    print(f"ID {contacto.id}: {contacto.nombre} - Tel: {contacto.telefono} - Email: {contacto.correo}")

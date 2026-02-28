import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proyecto_control.settings')
django.setup()

from control_proyectos.models import Proyecto

try:
    p = Proyecto.objects.first()
    print(f'First project: {p.id_project} - {p.project}')
    print(f'Has contacto_info: {hasattr(p, "contacto_info")}')
    print(f'contacto_info value: {getattr(p, "contacto_info", "NOT_FOUND")}')
    
    # Test querying all projects
    proyectos = Proyecto.objects.all()[:3]
    for proj in proyectos:
        print(f'Project {proj.id_project}: contacto_info = {getattr(proj, "contacto_info", "NOT_FOUND")}')
        
except Exception as e:
    print(f'Error: {e}')
    import traceback
    traceback.print_exc()

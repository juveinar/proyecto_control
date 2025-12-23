"""
Script para verificar usuarios en la base de datos
Ejecutar: python verificar_usuario.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proyecto_control.settings')
django.setup()

from django.contrib.auth.models import User

print("=" * 60)
print("USUARIOS EN LA BASE DE DATOS")
print("=" * 60)

usuarios = User.objects.all()
if usuarios.exists():
    for usuario in usuarios:
        print(f"Username: {usuario.username}")
        print(f"Email: {usuario.email}")
        print(f"Es superusuario: {usuario.is_superuser}")
        print(f"Es staff: {usuario.is_staff}")
        print(f"Activo: {usuario.is_active}")
        print(f"Último login: {usuario.last_login}")
        print("-" * 60)
else:
    print("No hay usuarios en la base de datos.")
    print("\nPara crear un superusuario, ejecuta:")
    print("python manage.py createsuperuser")

print("=" * 60)




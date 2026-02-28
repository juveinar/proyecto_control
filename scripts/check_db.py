import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proyecto_control.settings')
django.setup()

from django.db import connection

try:
    with connection.cursor() as cursor:
        cursor.execute("DESCRIBE control_proyectos_proyecto")
        columns = cursor.fetchall()
        print("Current columns in control_proyectos_proyecto table:")
        for col in columns:
            print(f"  {col[0]} - {col[1]}")
            
        # Check if contacto_info exists
        cursor.execute("SHOW COLUMNS FROM control_proyectos_proyecto LIKE 'contacto_info'")
        contacto_info_col = cursor.fetchone()
        if contacto_info_col:
            print(f"\ncontacto_info column exists: {contacto_info_col}")
        else:
            print("\ncontacto_info column does NOT exist")
            
except Exception as e:
    print(f'Error: {e}')
    import traceback
    traceback.print_exc()

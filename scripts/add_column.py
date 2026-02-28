import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proyecto_control.settings')
django.setup()

from django.db import connection

try:
    with connection.cursor() as cursor:
        # Add the missing contacto_info column
        sql = """
        ALTER TABLE control_proyectos_proyecto 
        ADD COLUMN contacto_info VARCHAR(255) NULL 
        COMMENT 'Información de Contacto (Texto)';
        """
        cursor.execute(sql)
        print("Successfully added contacto_info column to control_proyectos_proyecto table")
        
        # Verify the column was added
        cursor.execute("SHOW COLUMNS FROM control_proyectos_proyecto LIKE 'contacto_info'")
        contacto_info_col = cursor.fetchone()
        if contacto_info_col:
            print(f"Verified contacto_info column: {contacto_info_col}")
        else:
            print("ERROR: contacto_info column was not added")
            
except Exception as e:
    print(f'Error: {e}')
    import traceback
    traceback.print_exc()

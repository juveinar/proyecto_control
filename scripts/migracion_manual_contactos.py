import os
import django
import sys

# Agrega la ruta del proyecto al sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configura el entorno de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proyecto_control.settings')
django.setup()

from control_proyectos.models import Proyecto, Contacto
from django.db import connection

def migrar_y_actualizar_contactos():
    """
    Paso 1: Migra datos de contacto de la tabla Proyecto a la tabla Contacto.
    Intenta leer de varias columnas posibles ('contacto', 'contacto_id', 'contacto_info')
    y utiliza la primera que encuentra.
    """
    print("--- PASO 1: Migrando datos de texto a la tabla Contacto ---")

    # Obtener el nombre real de la tabla Proyecto
    proyecto_table_name = Proyecto._meta.db_table

    with connection.cursor() as cursor:
        cursor.execute(f"SHOW COLUMNS FROM {proyecto_table_name}")
        columns = [row[0] for row in cursor.fetchall()]

        possible_columns = ['contacto', 'contacto_id', 'contacto_info']
        source_column = next((col for col in possible_columns if col in columns), None)
        
        if not source_column:
            print("Error: No se encontró ninguna de las columnas de origen esperadas.")
            return

        print(f"Columna de origen encontrada: '{source_column}'")
        cursor.execute(f"SELECT id, {source_column} FROM {proyecto_table_name}")
        proyectos_data = cursor.fetchall()

    contactos_creados = 0
    # Crear nuevos contactos
    for proyecto_id, nombre_contacto in proyectos_data:
        if nombre_contacto and str(nombre_contacto).strip():
            _, created = Contacto.objects.get_or_create(
                nombre=str(nombre_contacto).strip(),
                defaults={'proyecto_id': proyecto_id}
            )
            if created:
                contactos_creados += 1

    print(f"Nuevos contactos creados: {contactos_creados}")
    print("Paso 1 completado.")

    # Iniciar el segundo paso
    actualizar_ids_de_contacto_en_proyectos(proyecto_table_name, source_column)

def actualizar_ids_de_contacto_en_proyectos(proyecto_table_name, source_column):
    """
    Paso 2: Actualiza la columna `contacto_id` en la tabla de proyectos
    con el ID real del contacto correspondiente.
    """
    print("\n--- PASO 2: Actualizando la columna de ID de contacto en Proyectos ---")
    
    contactos_actualizados = 0
    with connection.cursor() as cursor:
        # Iteramos sobre todos los contactos para obtener su ID y nombre
        for contacto in Contacto.objects.all():
            # El nombre del contacto es el valor antiguo que estaba en la columna de origen
            valor_antiguo = contacto.nombre
            id_nuevo = contacto.id
            
            # Ejecutamos el UPDATE
            # Se actualiza la columna de origen (ej: 'contacto_id') con el nuevo id numérico del contacto
            # Se busca el proyecto que tenía ese valor de texto antiguo
            sql = f"UPDATE {proyecto_table_name} SET {source_column} = %s WHERE {source_column} = %s"
            
            # Usamos `execute` y dejamos que el conector de la BD maneje el saneamiento
            cursor.execute(sql, [id_nuevo, valor_antiguo])
            
            if cursor.rowcount > 0:
                contactos_actualizados += cursor.rowcount

    print(f"Filas de proyectos actualizadas con el nuevo ID de contacto: {contactos_actualizados}")
    print("Paso 2 completado.")


if __name__ == "__main__":
    migrar_y_actualizar_contactos()

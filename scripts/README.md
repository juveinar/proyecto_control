# Scripts de Utilidad

Esta carpeta contiene scripts de utilidad, pruebas y migraciones para el proyecto de control de proyectos.

## Archivos

### Scripts de Migración
- **migrate_excel_to_mysql.py**: Script para migrar datos desde Excel a MySQL
- **migracion_manual_contactos.py**: Script para migración manual de contactos

### Scripts de Verificación y Debug
- **check_contact_data.py**: Verifica la integridad de los datos de contactos
- **check_db.py**: Verifica el estado de la base de datos
- **debug_api_response.py**: Debug de respuestas de la API
- **verificar_datos.py**: Verificación general de datos
- **verificar_usuario.py**: Verificación de usuarios

### Scripts de Pruebas
- **test_api.py**: Pruebas básicas de la API
- **test_api_direct.py**: Pruebas directas de la API
- **test_api_with_session.py**: Pruebas de API con sesión
- **test_contacts_api.py**: Pruebas específicas de la API de contactos
- **test_db.py**: Pruebas de base de datos
- **probar_api.py**: Script general para probar la API

### Scripts de Mantenimiento
- **add_column.py**: Script para agregar columnas a la base de datos

### Archivos de Debug
- **debug_contacts.js**: Script JavaScript para debug de contactos

## Uso

Para ejecutar cualquier script:

```bash
python scripts/nombre_del_script.py
```

O desde la raíz del proyecto:

```bash
python scripts/nombre_del_script.py
```

## Notas

- Estos scripts son para desarrollo y mantenimiento
- No forman parte del núcleo de la aplicación Django
- Algunos scripts pueden requerir configuración previa
- Ejecutar con cuidado los scripts de migración

"""
Script para migrar datos desde archivos Excel a MySQL
Ejecutar: python manage.py shell < migrate_excel_to_mysql.py
O mejor: python migrate_excel_to_mysql.py
"""
import os
import sys
import django
import pandas as pd
import numpy as np
from datetime import datetime

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proyecto_control.settings')
django.setup()

from control_proyectos.models import Proyecto, Evento

def migrate_projects(excel_path=None):
    """Migrar proyectos desde Excel a MySQL"""
    if excel_path is None:
        # Intentar diferentes rutas posibles
        possible_paths = [
            '../Control de Proyectos/Control Proyectos.xlsx',
            'Control Proyectos.xlsx',
            os.path.join(os.path.dirname(os.path.dirname(__file__)), 'Control de Proyectos', 'Control Proyectos.xlsx'),
        ]
        for path in possible_paths:
            if os.path.exists(path):
                excel_path = path
                break
        if excel_path is None:
            print("ERROR: No se encontró el archivo Excel de proyectos.")
            print("Rutas intentadas:")
            for path in possible_paths:
                print(f"  - {path}")
            return
    """Migrar proyectos desde Excel a MySQL"""
    print("Iniciando migración de proyectos...")

    try:
        df = pd.read_excel(excel_path, sheet_name='Proyectos', keep_default_na=False, na_values=[''])
        df.columns = df.columns.str.replace(r'\s+', ' ', regex=True).str.strip()
        df.dropna(subset=['Id Project'], inplace=True)
        df = df.replace({np.nan: None})

        print(f"Total de proyectos encontrados: {len(df)}")

        proyectos_creados = 0
        proyectos_actualizados = 0

        for index, row in df.iterrows():
            try:
                id_project = int(row['Id Project'])

                # Verificar si el proyecto ya existe
                proyecto, created = Proyecto.objects.get_or_create(id_project=id_project)

                # Actualizar campos
                proyecto.project_name = row.get('Project Name', '') or None
                proyecto.rf = row.get('RF', '') or None
                proyecto.project = row.get('Project', '') or None
                proyecto.project_leader = row.get('Project Leader', '') or None
                proyecto.finalizado = row.get('FINALIZADO', 'En Curso') or 'En Curso'

                # Progreso
                try:
                    proyecto.percent_complete = float(row.get('% Complete', 0) or 0)
                except (ValueError, TypeError):
                    proyecto.percent_complete = 0.0

                # Fechas
                date_columns = {
                    'Baseline Start': 'baseline_start',
                    'Baseline Finish': 'baseline_finish',
                    'Start': 'start',
                    'Finish': 'finish',
                }

                for excel_col, model_field in date_columns.items():
                    if excel_col in row and pd.notna(row[excel_col]) and row[excel_col]:
                        try:
                            if isinstance(row[excel_col], str):
                                date_value = pd.to_datetime(row[excel_col], errors='coerce')
                            else:
                                date_value = row[excel_col]

                            if pd.notna(date_value):
                                if hasattr(date_value, 'date'):
                                    setattr(proyecto, model_field, date_value.date())
                                else:
                                    setattr(proyecto, model_field, date_value)
                        except Exception as e:
                            print(f"Error procesando fecha {excel_col} para proyecto {id_project}: {e}")

                # Costos
                cost_columns = {
                    'Cost': 'cost',
                    'Baseline Cost': 'baseline_cost',
                    'Budget': 'budget',
                }

                for excel_col, model_field in cost_columns.items():
                    if excel_col in row and pd.notna(row[excel_col]) and row[excel_col]:
                        try:
                            setattr(proyecto, model_field, float(row[excel_col]))
                        except (ValueError, TypeError):
                            pass

                # Cómputo
                proyecto.computo = row.get('Computo', '') or None

                # Campos pendientes
                pendiente_fields = {
                    'NTP': 'ntp',
                    'SCAN': 'scan',
                    'RESUELVE POR NOMBRE': 'resuelve_por_nombre',
                    'ANTIVIRUS': 'antivirus',
                    'CONFIG BACKUP': 'config_backup',
                    'MONITOREO NAGIOS': 'monitoreo_nagios',
                    'MONITOREO ELASTIC': 'monitoreo_elastic',
                    'UCMDB': 'ucmdb',
                    'CONECTIVIDAD AWX 172.18.90.250 (SOLO UNIX)': 'conectividad_awx',
                    'CAMBIO PASO OPERACIÓN (OLA)': 'cambio_paso_operacion_ola',
                }

                for excel_field, model_field in pendiente_fields.items():
                    value = row.get(excel_field, 'Pendiente')
                    if not value or (isinstance(value, str) and value.strip() == ''):
                        value = 'Pendiente'
                    setattr(proyecto, model_field, value)

                # Otros campos
                if 'Base de Datos' in row:
                    proyecto.base_de_datos = row['Base de Datos'] or None
                if 'Balanceo' in row:
                    proyecto.balanceo = row['Balanceo'] or None
                if 'Backup' in row:
                    proyecto.backup = row['Backup'] or None
                if 'CHECK AV' in row:
                    proyecto.check_av = row['CHECK AV'] or None

                # Campos adicionales del Excel
                campos_adicionales = {
                    'CONTACTO': 'contacto',
                    'CANTIDAD MAQUINAS': 'cantidad_maquinas',
                    'COD SERV_HOSTNAME': 'cod_serv_hostname',
                    'PLATAFORMA': 'plataforma',
                    'SO': 'so',
                    'WINDOWS LICENCIA ACTIVADA': 'windows_licencia_activada',
                    'DOMINIO': 'dominio',
                    'PLATAFORMA BACKUP': 'plataforma_backup',
                    'PROVEEDOR': 'proveedor',
                    'COMUNIDAD SNMP': 'comunidad_snmp',
                    'FGN 172.22.16.93': 'fgn_172_22_16_93',
                    'RT': 'rt',
                    'SERVICIO': 'servicio',
                    'OBSERVACIONES': 'observaciones',
                }

                for excel_field, model_field in campos_adicionales.items():
                    if excel_field in row:
                        value = row[excel_field]
                        if pd.notna(value) and value:
                            setattr(proyecto, model_field, str(value))
                        else:
                            setattr(proyecto, model_field, None)

                proyecto.save()

                if created:
                    proyectos_creados += 1
                else:
                    proyectos_actualizados += 1

                if (index + 1) % 10 == 0:
                    print(f"Procesados {index + 1}/{len(df)} proyectos...")

            except Exception as e:
                print(f"Error procesando proyecto en fila {index + 1}: {e}")
                continue

        print(f"\nMigración de proyectos completada:")
        print(f"  - Proyectos creados: {proyectos_creados}")
        print(f"  - Proyectos actualizados: {proyectos_actualizados}")

    except Exception as e:
        print(f"Error al leer el archivo Excel: {e}")
        import traceback
        traceback.print_exc()


def migrate_events(excel_path=None):
    """Migrar eventos desde Excel a MySQL"""
    if excel_path is None:
        # Intentar diferentes rutas posibles
        possible_paths = [
            '../Control de Proyectos/Eventos.xlsx',
            'Eventos.xlsx',
            os.path.join(os.path.dirname(os.path.dirname(__file__)), 'Control de Proyectos', 'Eventos.xlsx'),
        ]
        for path in possible_paths:
            if os.path.exists(path):
                excel_path = path
                break
        if excel_path is None:
            print("ERROR: No se encontró el archivo Excel de eventos.")
            print("Rutas intentadas:")
            for path in possible_paths:
                print(f"  - {path}")
            return
    """Migrar eventos desde Excel a MySQL"""
    print("\nIniciando migración de eventos...")

    try:
        df = pd.read_excel(excel_path, sheet_name='Eventos').replace({np.nan: None})

        print(f"Total de eventos encontrados: {len(df)}")

        eventos_creados = 0

        for index, row in df.iterrows():
            try:
                evento = Evento()

                # Mapear columnas del Excel a campos del modelo
                # Ajustar según las columnas reales de tu Excel
                if 'Titulo' in row:
                    evento.titulo = row['Titulo'] or None
                elif 'Título' in row:
                    evento.titulo = row['Título'] or None
                else:
                    evento.titulo = f"Evento {index + 1}"

                if 'Descripcion' in row:
                    evento.descripcion = row['Descripcion'] or None
                elif 'Descripción' in row:
                    evento.descripcion = row['Descripción'] or None

                if 'Ubicacion' in row:
                    evento.ubicacion = row['Ubicacion'] or None
                elif 'Ubicación' in row:
                    evento.ubicacion = row['Ubicación'] or None

                if 'Responsable' in row:
                    evento.responsable = row['Responsable'] or None

                # Fechas
                if 'Fecha de Inicio' in row and pd.notna(row['Fecha de Inicio']) and row['Fecha de Inicio']:
                    try:
                        fecha_inicio = pd.to_datetime(row['Fecha de Inicio'], errors='coerce')
                        if pd.notna(fecha_inicio):
                            evento.fecha_inicio = fecha_inicio.to_pydatetime()
                    except Exception as e:
                        print(f"Error procesando fecha de inicio para evento {index + 1}: {e}")

                if 'Fecha de Fin' in row and pd.notna(row['Fecha de Fin']) and row['Fecha de Fin']:
                    try:
                        fecha_fin = pd.to_datetime(row['Fecha de Fin'], errors='coerce')
                        if pd.notna(fecha_fin):
                            evento.fecha_fin = fecha_fin.to_pydatetime()
                    except Exception as e:
                        print(f"Error procesando fecha de fin para evento {index + 1}: {e}")

                evento.save()
                eventos_creados += 1

            except Exception as e:
                print(f"Error procesando evento en fila {index + 1}: {e}")
                continue

        print(f"\nMigración de eventos completada:")
        print(f"  - Eventos creados: {eventos_creados}")

    except Exception as e:
        print(f"Error al leer el archivo Excel de eventos: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    print("=" * 60)
    print("MIGRACIÓN DE DATOS DESDE EXCEL A MYSQL")
    print("=" * 60)

    # Buscar archivos Excel automáticamente
    base_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(base_dir)

    posibles_rutas_proyectos = [
        os.path.join(parent_dir, 'Control de Proyectos', 'Control Proyectos.xlsx'),
        os.path.join(base_dir, 'Control Proyectos.xlsx'),
        '../Control de Proyectos/Control Proyectos.xlsx',
    ]

    posibles_rutas_eventos = [
        os.path.join(parent_dir, 'Control de Proyectos', 'Eventos.xlsx'),
        os.path.join(base_dir, 'Eventos.xlsx'),
        '../Control de Proyectos/Eventos.xlsx',
    ]

    proyectos_path = None
    eventos_path = None

    for path in posibles_rutas_proyectos:
        if os.path.exists(path):
            proyectos_path = path
            print(f"✓ Archivo de proyectos encontrado: {path}")
            break

    for path in posibles_rutas_eventos:
        if os.path.exists(path):
            eventos_path = path
            print(f"✓ Archivo de eventos encontrado: {path}")
            break

    if proyectos_path:
        migrate_projects(proyectos_path)
    else:
        print("\n❌ ERROR: No se encontró el archivo Excel de proyectos.")
        print("Rutas buscadas:")
        for path in posibles_rutas_proyectos:
            print(f"  - {path}")

    if eventos_path:
        migrate_events(eventos_path)
    else:
        print("\n⚠️  ADVERTENCIA: No se encontró el archivo Excel de eventos.")
        print("Rutas buscadas:")
        for path in posibles_rutas_eventos:
            print(f"  - {path}")

    print("\n" + "=" * 60)
    print("MIGRACIÓN COMPLETADA")
    print("=" * 60)


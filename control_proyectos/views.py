from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib import messages
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods
from django.core.paginator import Paginator
from django.db.models import Q, Count
from django.utils import timezone
from datetime import datetime
import json
import time
import os
from django.conf import settings

from .models import Proyecto, Evento, ProyectoFase


def login_view(request):
    """Vista de login"""
    if request.user.is_authenticated:
        return redirect('index')

    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        if not username or not password:
            messages.error(request, 'Por favor, ingresa usuario y contraseña.')
        else:
            user = authenticate(request, username=username, password=password)
            if user is not None:
                if user.is_active:
                    login(request, user)
                    return redirect('index')
                else:
                    messages.error(request, 'Tu cuenta está desactivada.')
            else:
                messages.error(request, 'Usuario o contraseña incorrectos.')

    return render(request, 'login.html')


@login_required
def logout_view(request):
    """Vista de logout"""
    logout(request)
    return redirect('login')


@ensure_csrf_cookie
@login_required
def index(request):
    """Vista principal"""
    return render(request, 'index.html', {'current_user': request.user})


# ==================== API DE PROYECTOS ====================

@login_required
def api_projects(request):
    """Obtener todos los proyectos o crear uno nuevo"""
    if request.method == 'GET':
        proyectos = Proyecto.objects.all().order_by('-start', 'project')

        # Convertir a lista de diccionarios
        proyectos_list = []
        for p in proyectos:
            # Obtener la fase más reciente
            fase_actual = p.fases.order_by('-fecha', '-created_at').first()
            if fase_actual:
                fase_str = f"{fase_actual.get_fase_display()} ({fase_actual.fecha.strftime('%Y-%m-%d')})"
            elif p.estado == 'En Curso':
                fase_str = "Despliegue (No registrado)"
            else:
                fase_str = "Sin Fase"

            proyecto_dict = {
                'Id Project': p.id_project,
                'RF': p.rf or '',
                'Project': p.project or '',
                'Project Leader': p.project_leader or '',
                'Estado': p.estado or '',
                'Fase': fase_str,  # Nuevo campo para la tabla
                '% Complete': p.percent_complete or 0.0,
                'Start': p.start.strftime('%Y-%m-%d') if p.start else None,
                'Finish': p.finish.strftime('%Y-%m-%d') if p.finish else None,
                'Computo': p.computo or '',
                'NTP': p.ntp or '',
                'SCAN': p.scan or '',
                'RESUELVE POR NOMBRE': p.resuelve_por_nombre or '',
                'Antivirus': p.antivirus or '',
                'CONFIG BACKUP': p.config_backup or '',
                'MONITOREO NAGIOS': p.monitoreo_nagios or '',
                'MONITOREO ELASTIC': p.monitoreo_elastic or '',
                'UCMDB': p.ucmdb or '',
                'CONECTIVIDAD AWX 172.18.90.250 (SOLO UNIX)': p.conectividad_awx or '',
                'CAMBIO PASO OPERACIÓN (OLA)': p.cambio_paso_operacion_ola or '',
                'Base de Datos': p.base_de_datos or '',
                'Balanceo': p.balanceo or '',
                'Backup': p.backup or '',
                'CHECK AV': p.check_av or '',
                'CONTACTO': p.contacto or '',
                'CANTIDAD MAQUINAS': p.cantidad_maquinas or '',
                'COD SERV_HOSTNAME': p.cod_serv_hostname or '',
                'PLATAFORMA': p.plataforma or '',
                'SO': p.so or '',
                'WINDOWS LICENCIA ACTIVADA': p.windows_licencia_activada or '',
                'DOMINIO': p.dominio or '',
                'PLATAFORMA BACKUP': p.plataforma_backup or '',
                'PROVEEDOR': p.proveedor or '',
                'COMUNIDAD SNMP': p.comunidad_snmp or '',
                'FGN 172.22.16.93': p.fgn_172_22_16_93 or '',
                'RT': p.rt or '',
                'SERVICIO': p.servicio or '',
                'OBSERVACIONES': p.observaciones or '',
            }
            proyectos_list.append(proyecto_dict)

        return JsonResponse(proyectos_list, safe=False)

    elif request.method == 'POST':
        # Llamar a la función api_projects_add para crear un proyecto
        return api_projects_add(request)

    else:
        return JsonResponse({'error': 'Método no permitido'}, status=405)


@login_required
def api_projects_stats(request):
    """Obtener estadísticas de proyectos por mes"""
    year_str = request.GET.get('year')
    year = None
    if year_str:
        try:
            year = int(year_str)
        except (ValueError, TypeError):
            year = None

    proyectos = Proyecto.objects.exclude(start__isnull=True)

    if year:
        proyectos = proyectos.filter(start__year=year)

    # Agrupar por mes
    monthly_counts = [0] * 12
    for proyecto in proyectos:
        if proyecto.start:
            month = proyecto.start.month
            monthly_counts[month - 1] += 1

    labels = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
    full_labels = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

    return JsonResponse({
        'labels': labels,
        'data': monthly_counts,
        'full_labels': full_labels
    })


@login_required
def api_projects_add(request):
    """Agregar un nuevo proyecto"""
    try:
        data = json.loads(request.body)

        # Campos que deben inicializarse con 'Pendiente'
        pendiente_fields = {
            'NTP': 'ntp',
            'SCAN': 'scan',
            'RESUELVE POR NOMBRE': 'resuelve_por_nombre',
            'Antivirus': 'antivirus',  # clave alineada con el frontend
            'CONFIG BACKUP': 'config_backup',
            'MONITOREO NAGIOS': 'monitoreo_nagios',
            'MONITOREO ELASTIC': 'monitoreo_elastic',
            'UCMDB': 'ucmdb',
            'CONECTIVIDAD AWX 172.18.90.250 (SOLO UNIX)': 'conectividad_awx',
            'CAMBIO PASO OPERACIÓN (OLA)': 'cambio_paso_operacion_ola',
        }

        # Crear el proyecto
        proyecto = Proyecto()

        # Mapear campos principales
        if 'Id Project' in data:
            proyecto.id_project = data['Id Project']
        if 'RF' in data:
            proyecto.rf = data['RF']
        if 'Project' in data:
            proyecto.project = data['Project']
        if 'Project Leader' in data:
            proyecto.project_leader = data['Project Leader']
        if 'Estado' in data:
            proyecto.estado = data['Estado']
        if '% Complete' in data:
            try:
                proyecto.percent_complete = float(data['% Complete'])
            except (ValueError, TypeError):
                proyecto.percent_complete = 0.0

        # Fechas
        for field_name, model_field in [
            ('Start', 'start'),
            ('Finish', 'finish'),
        ]:
            if field_name in data and data[field_name]:
                try:
                    date_value = datetime.strptime(data[field_name], '%Y-%m-%d').date()
                    setattr(proyecto, model_field, date_value)
                except (ValueError, TypeError):
                    pass

        # Cómputo
        if 'Computo' in data:
            proyecto.computo = data['Computo']

        # Campos pendientes
        for excel_field, model_field in pendiente_fields.items():
            value = data.get(excel_field, 'Pendiente')
            if not value or (isinstance(value, str) and value.strip() == ''):
                value = 'Pendiente'
            setattr(proyecto, model_field, value)

        # Otros campos
        if 'Base de Datos' in data:
            proyecto.base_de_datos = data['Base de Datos']
        if 'Balanceo' in data:
            proyecto.balanceo = data['Balanceo']
        if 'Backup' in data:
            proyecto.backup = data['Backup']
        if 'CHECK AV' in data:
            proyecto.check_av = data['CHECK AV']

        # Campos adicionales
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
            if excel_field in data:
                setattr(proyecto, model_field, data[excel_field] or None)

        proyecto.save()

        # 1. Requerimiento: Crear automáticamente fase Despliegue al crear proyecto
        try:
            ProyectoFase.objects.create(
                proyecto=proyecto,
                fase='DESPLIEGUE',
                fecha=timezone.now().date()
            )
        except Exception as e:
            print(f"Error creando fase inicial: {e}")

        # Retornar el proyecto creado en formato JSON
        proyecto_dict = {
            'Id Project': proyecto.id_project,
            'RF': proyecto.rf or '',
            'Project': proyecto.project or '',
            'Project Leader': proyecto.project_leader or '',
            'Estado': proyecto.estado or '',
            'Fase': f"Despliegue ({timezone.now().strftime('%Y-%m-%d')})",
            '% Complete': proyecto.percent_complete or 0.0,
            'Start': proyecto.start.strftime('%Y-%m-%d') if proyecto.start else None,
            'Finish': proyecto.finish.strftime('%Y-%m-%d') if proyecto.finish else None,
            'Computo': proyecto.computo or '',
            'CONTACTO': proyecto.contacto or '',
            'CANTIDAD MAQUINAS': proyecto.cantidad_maquinas or '',
            'COD SERV_HOSTNAME': proyecto.cod_serv_hostname or '',
            'PLATAFORMA': proyecto.plataforma or '',
            'SO': proyecto.so or '',
            'WINDOWS LICENCIA ACTIVADA': proyecto.windows_licencia_activada or '',
            'DOMINIO': proyecto.dominio or '',
            'PLATAFORMA BACKUP': proyecto.plataforma_backup or '',
            'PROVEEDOR': proyecto.proveedor or '',
            'COMUNIDAD SNMP': proyecto.comunidad_snmp or '',
            'FGN 172.22.16.93': proyecto.fgn_172_22_16_93 or '',
            'RT': proyecto.rt or '',
            'SERVICIO': proyecto.servicio or '',
            'OBSERVACIONES': proyecto.observaciones or '',
        }

        return JsonResponse(proyecto_dict, status=201)

    except Exception as e:
        return JsonResponse({'error': f'No se pudo guardar el nuevo proyecto: {str(e)}'}, status=500)


@login_required
def api_projects_update(request, project_id):
    """Actualizar un proyecto existente"""
    if request.method != 'PUT':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        proyecto = Proyecto.objects.get(id_project=project_id)
        data = json.loads(request.body)

        # Actualizar campos principales
        if 'RF' in data:
            proyecto.rf = data['RF']
        if 'Project' in data:
            proyecto.project = data['Project']
        if 'Project Leader' in data:
            proyecto.project_leader = data['Project Leader']
        if 'Estado' in data:
            proyecto.estado = data['Estado']
        if '% Complete' in data:
            try:
                proyecto.percent_complete = float(data['% Complete'])
            except (ValueError, TypeError):
                pass

        # Fechas
        for field_name, model_field in [
            ('Start', 'start'),
            ('Finish', 'finish'),
        ]:
            if field_name in data:
                if data[field_name]:
                    try:
                        date_value = datetime.strptime(data[field_name], '%Y-%m-%d').date()
                        setattr(proyecto, model_field, date_value)
                    except (ValueError, TypeError):
                        pass
                else:
                    setattr(proyecto, model_field, None)

        # Cómputo
        if 'Computo' in data:
            proyecto.computo = data['Computo']

        # Campos pendientes
        pendiente_fields = {
            'NTP': 'ntp',
            'SCAN': 'scan',
            'RESUELVE POR NOMBRE': 'resuelve_por_nombre',
            'Antivirus': 'antivirus',  # clave alineada con el frontend
            'CONFIG BACKUP': 'config_backup',
            'MONITOREO NAGIOS': 'monitoreo_nagios',
            'MONITOREO ELASTIC': 'monitoreo_elastic',
            'UCMDB': 'ucmdb',
            'CONECTIVIDAD AWX 172.18.90.250 (SOLO UNIX)': 'conectividad_awx',
            'CAMBIO PASO OPERACIÓN (OLA)': 'cambio_paso_operacion_ola',
        }

        for excel_field, model_field in pendiente_fields.items():
            if excel_field in data:
                value = data[excel_field]
                if not value or (isinstance(value, str) and value.strip() == ''):
                    value = 'Pendiente'
                setattr(proyecto, model_field, value)

        # Otros campos
        if 'Base de Datos' in data:
            proyecto.base_de_datos = data['Base de Datos']
        if 'Balanceo' in data:
            proyecto.balanceo = data['Balanceo']
        if 'Backup' in data:
            proyecto.backup = data['Backup']
        if 'CHECK AV' in data:
            proyecto.check_av = data['CHECK AV']

        # Campos adicionales
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
            if excel_field in data:
                setattr(proyecto, model_field, data[excel_field] or None)

        proyecto.save()

        # 2. Requerimiento: Actualizar Fase si se envía en el JSON
        nueva_fase = data.get('Nueva Fase')
        fecha_fase_str = data.get('Fecha Fase')

        if nueva_fase and fecha_fase_str:
            try:
                fecha_fase = datetime.strptime(fecha_fase_str, '%Y-%m-%d').date()

                # Buscar si ya existe un registro para esta fase (tomar el más reciente si hay varios)
                existente = ProyectoFase.objects.filter(
                    proyecto=proyecto,
                    fase=nueva_fase
                ).order_by('-fecha', '-created_at').first()

                if existente:
                    # Si la fecha es distinta, actualizar la fecha de ese registro existente
                    if existente.fecha != fecha_fase:
                        try:
                            existente.fecha = fecha_fase
                            existente.save()
                        except Exception:
                            # Si hay conflicto de unicidad u otro error, crear una nueva fila como fallback
                            try:
                                ProyectoFase.objects.create(
                                    proyecto=proyecto,
                                    fase=nueva_fase,
                                    fecha=fecha_fase
                                )
                            except Exception as e:
                                print(f"Error actualizando/creando fase existente: {e}")
                    # si la fecha es la misma, no hacer nada (evitar duplicados)
                else:
                    # No existía la fase: crear nueva fila en el historial
                    try:
                        ProyectoFase.objects.create(
                            proyecto=proyecto,
                            fase=nueva_fase,
                            fecha=fecha_fase
                        )
                    except Exception as e:
                        print(f"Error creando nueva fase en historial: {e}")
            except Exception as e:
                print(f"Error actualizando fase: {e}")

        # Obtener la fase más reciente para la respuesta
        fase_actual = proyecto.fases.order_by('-fecha', '-created_at').first()
        if fase_actual:
            fase_str = f"{fase_actual.get_fase_display()} ({fase_actual.fecha.strftime('%Y-%m-%d')})"
        elif proyecto.estado == 'En Curso':
            fase_str = "Despliegue (No registrado)"
        else:
            fase_str = "Sin Fase"

        # Retornar el proyecto actualizado
        proyecto_dict = {
            'Id Project': proyecto.id_project,
            'RF': proyecto.rf or '',
            'Project': proyecto.project or '',
            'Project Leader': proyecto.project_leader or '',
            'Estado': proyecto.estado or '',
            'Fase': fase_str,
            '% Complete': proyecto.percent_complete or 0.0,
            'Start': proyecto.start.strftime('%Y-%m-%d') if proyecto.start else None,
            'Finish': proyecto.finish.strftime('%Y-%m-%d') if proyecto.finish else None,
            'Computo': proyecto.computo or '',
            'NTP': proyecto.ntp or '',
            'SCAN': proyecto.scan or '',
            'RESUELVE POR NOMBRE': proyecto.resuelve_por_nombre or '',
            'Antivirus': proyecto.antivirus or '',
            'CONFIG BACKUP': proyecto.config_backup or '',
            'MONITOREO NAGIOS': proyecto.monitoreo_nagios or '',
            'MONITOREO ELASTIC': proyecto.monitoreo_elastic or '',
            'UCMDB': proyecto.ucmdb or '',
            'CONECTIVIDAD AWX 172.18.90.250 (SOLO UNIX)': proyecto.conectividad_awx or '',
            'CAMBIO PASO OPERACIÓN (OLA)': proyecto.cambio_paso_operacion_ola or '',
            'Base de Datos': proyecto.base_de_datos or '',
            'Balanceo': proyecto.balanceo or '',
            'Backup': proyecto.backup or '',
            'CHECK AV': proyecto.check_av or '',
            'CONTACTO': proyecto.contacto or '',
            'CANTIDAD MAQUINAS': proyecto.cantidad_maquinas or '',
            'COD SERV_HOSTNAME': proyecto.cod_serv_hostname or '',
            'PLATAFORMA': proyecto.plataforma or '',
            'SO': proyecto.so or '',
            'WINDOWS LICENCIA ACTIVADA': proyecto.windows_licencia_activada or '',
            'DOMINIO': proyecto.dominio or '',
            'PLATAFORMA BACKUP': proyecto.plataforma_backup or '',
            'PROVEEDOR': proyecto.proveedor or '',
            'COMUNIDAD SNMP': proyecto.comunidad_snmp or '',
            'FGN 172.22.16.93': proyecto.fgn_172_22_16_93 or '',
            'RT': proyecto.rt or '',
            'SERVICIO': proyecto.servicio or '',
            'OBSERVACIONES': proyecto.observaciones or '',
        }

        return JsonResponse(proyecto_dict)

    except Proyecto.DoesNotExist:
        return JsonResponse({'error': 'Proyecto no encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'error': f'No se pudo actualizar el proyecto: {str(e)}'}, status=500)


@login_required
def api_projects_update_status(request, project_id):
    """Actualizar el estado de un campo específico de un proyecto"""
    if request.method != 'PUT':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        proyecto = Proyecto.objects.get(id_project=project_id)
        data = json.loads(request.body)

        field_name = data.get('field_name')
        new_status = data.get('new_status')

        if not field_name or not new_status:
            return JsonResponse({'error': 'Faltan field_name o new_status'}, status=400)

        # Mapear nombres de campos de Excel a campos del modelo
        field_mapping = {
            'NTP': 'ntp',
            'SCAN': 'scan',
            'RESUELVE POR NOMBRE': 'resuelve_por_nombre',
            'Antivirus': 'antivirus',
            'CONFIG BACKUP': 'config_backup',
            'MONITOREO NAGIOS': 'monitoreo_nagios',
            'MONITOREO ELASTIC': 'monitoreo_elastic',
            'UCMDB': 'ucmdb',
            'CONECTIVIDAD AWX 172.18.90.250 (SOLO UNIX)': 'conectividad_awx',
            'CAMBIO PASO OPERACIÓN (OLA)': 'cambio_paso_operacion_ola',
        }

        # Buscar el campo en el mapeo (case-insensitive)
        model_field = None
        for excel_field, model_field_name in field_mapping.items():
            if excel_field.lower() == field_name.lower():
                model_field = model_field_name
                break

        if not model_field or not hasattr(proyecto, model_field):
            return JsonResponse({'error': f'Campo "{field_name}" no encontrado en el proyecto'}, status=404)

        setattr(proyecto, model_field, new_status)
        proyecto.save()

        return JsonResponse({'success': True, 'message': 'Estado del proyecto actualizado correctamente'})

    except Proyecto.DoesNotExist:
        return JsonResponse({'error': 'Proyecto no encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'error': f'No se pudo actualizar el estado del proyecto: {str(e)}'}, status=500)


# ==================== API DE EVENTOS ====================

@login_required
def api_events(request):
    """Obtener todos los eventos o crear uno nuevo"""
    if request.method == 'GET':
        eventos = Evento.objects.all().order_by('fecha_inicio')

        eventos_list = []
        for e in eventos:
            evento_dict = {
                'id': e.id,
                'Titulo': e.titulo or '',
                'Descripcion': e.descripcion or '',
                'Fecha de Inicio': e.fecha_inicio.isoformat() if e.fecha_inicio else None,
                'Fecha de Fin': e.fecha_fin.isoformat() if e.fecha_fin else None,
                'Ubicacion': e.ubicacion or '',
                'Responsable': e.responsable or '',
            }
            eventos_list.append(evento_dict)

        return JsonResponse(eventos_list, safe=False)

    elif request.method == 'POST':
        """Agregar un nuevo evento"""
        try:
            data = json.loads(request.body)

            evento = Evento()
            evento.titulo = data.get('Titulo', '')
            evento.descripcion = data.get('Descripcion', '')
            evento.ubicacion = data.get('Ubicacion', '')
            evento.responsable = data.get('Responsable', '')

            # Fechas
            if 'Fecha de Inicio' in data and data['Fecha de Inicio']:
                try:
                    evento.fecha_inicio = datetime.fromisoformat(data['Fecha de Inicio'].replace('Z', '+00:00'))
                except (ValueError, TypeError):
                    pass

            if 'Fecha de Fin' in data and data['Fecha de Fin']:
                try:
                    evento.fecha_fin = datetime.fromisoformat(data['Fecha de Fin'].replace('Z', '+00:00'))
                except (ValueError, TypeError):
                    pass

            evento.save()

            evento_dict = {
                'id': evento.id,
                'Titulo': evento.titulo or '',
                'Descripcion': evento.descripcion or '',
                'Fecha de Inicio': evento.fecha_inicio.isoformat() if evento.fecha_inicio else None,
                'Fecha de Fin': evento.fecha_fin.isoformat() if evento.fecha_fin else None,
                'Ubicacion': evento.ubicacion or '',
                'Responsable': evento.responsable or '',
            }

            return JsonResponse(evento_dict, status=201)

        except Exception as e:
            return JsonResponse({'error': f'No se pudo guardar el nuevo evento: {str(e)}'}, status=500)

    else:
        return JsonResponse({'error': 'Método no permitido'}, status=405)


@login_required
def api_events_next(request):
    """Obtener el próximo evento"""
    now = timezone.now()
    next_event = Evento.objects.filter(fecha_inicio__gt=now).order_by('fecha_inicio').first()

    if not next_event:
        return JsonResponse({'message': 'No hay eventos próximos'}, status=404)

    evento_dict = {
        'id': next_event.id,
        'Titulo': next_event.titulo or '',
        'Descripcion': next_event.descripcion or '',
        'Fecha de Inicio': next_event.fecha_inicio.isoformat() if next_event.fecha_inicio else None,
        'Fecha de Fin': next_event.fecha_fin.isoformat() if next_event.fecha_fin else None,
        'Ubicacion': next_event.ubicacion or '',
        'Responsable': next_event.responsable or '',
    }

    return JsonResponse(evento_dict)


@login_required
def api_events_add(request):
    """Agregar un nuevo evento"""
    try:
        data = json.loads(request.body)

        evento = Evento()
        evento.titulo = data.get('Titulo', '')
        evento.descripcion = data.get('Descripcion', '')
        evento.ubicacion = data.get('Ubicacion', '')
        evento.responsable = data.get('Responsable', '')

        # Fechas
        if 'Fecha de Inicio' in data and data['Fecha de Inicio']:
            try:
                evento.fecha_inicio = datetime.fromisoformat(data['Fecha de Inicio'].replace('Z', '+00:00'))
            except (ValueError, TypeError):
                pass

        if 'Fecha de Fin' in data and data['Fecha de Fin']:
            try:
                evento.fecha_fin = datetime.fromisoformat(data['Fecha de Fin'].replace('Z', '+00:00'))
            except (ValueError, TypeError):
                pass

        evento.save()

        evento_dict = {
            'id': evento.id,
            'Titulo': evento.titulo or '',
            'Descripcion': evento.descripcion or '',
            'Fecha de Inicio': evento.fecha_inicio.isoformat() if evento.fecha_inicio else None,
            'Fecha de Fin': evento.fecha_fin.isoformat() if evento.fecha_fin else None,
            'Ubicacion': evento.ubicacion or '',
            'Responsable': evento.responsable or '',
        }

        return JsonResponse(evento_dict, status=201)

    except Exception as e:
        return JsonResponse({'error': f'No se pudo guardar el nuevo evento: {str(e)}'}, status=500)


@login_required
def api_events_update(request, event_id):
    """Actualizar o eliminar un evento existente"""
    if request.method == 'DELETE':
        """Eliminar un evento"""
        try:
            evento = Evento.objects.get(id=event_id)
            evento.delete()
            return JsonResponse({'success': True})

        except Evento.DoesNotExist:
            return JsonResponse({'error': 'Evento no encontrado'}, status=404)
        except Exception as e:
            return JsonResponse({'error': f'No se pudo eliminar el evento: {str(e)}'}, status=500)

    elif request.method == 'PUT':
        """Actualizar un evento existente"""
        try:
            evento = Evento.objects.get(id=event_id)
            data = json.loads(request.body)

            if 'Titulo' in data:
                evento.titulo = data['Titulo']
            if 'Descripcion' in data:
                evento.descripcion = data['Descripcion']
            if 'Ubicacion' in data:
                evento.ubicacion = data['Ubicacion']
            if 'Responsable' in data:
                evento.responsable = data['Responsable']

            # Fechas
            if 'Fecha de Inicio' in data and data['Fecha de Inicio']:
                try:
                    evento.fecha_inicio = datetime.fromisoformat(data['Fecha de Inicio'].replace('Z', '+00:00'))
                except (ValueError, TypeError):
                    pass

            if 'Fecha de Fin' in data and data['Fecha de Fin']:
                try:
                    evento.fecha_fin = datetime.fromisoformat(data['Fecha de Fin'].replace('Z', '+00:00'))
                except (ValueError, TypeError):
                    pass

            evento.save()

            evento_dict = {
                'id': evento.id,
                'Titulo': evento.titulo or '',
                'Descripcion': evento.descripcion or '',
                'Fecha de Inicio': evento.fecha_inicio.isoformat() if evento.fecha_inicio else None,
                'Fecha de Fin': evento.fecha_fin.isoformat() if evento.fecha_fin else None,
                'Ubicacion': evento.ubicacion or '',
                'Responsable': evento.responsable or '',
            }

            return JsonResponse(evento_dict)

        except Evento.DoesNotExist:
            return JsonResponse({'error': 'Evento no encontrado'}, status=404)
        except Exception as e:
            return JsonResponse({'error': f'No se pudo actualizar el evento: {str(e)}'}, status=500)

    else:
        return JsonResponse({'error': 'Método no permitido'}, status=405)


# ==================== GENERACIÓN DE INFORMES CON IA ====================

@login_required
def generar_informe_ia(request):
    """Generar informe con IA usando Google Gemini"""
    is_xhr = request.GET.get('xhr') == '1' or request.headers.get('X-Requested-With') == 'XMLHttpRequest'

    api_key = settings.GEMINI_API_KEY
    if not api_key:
        if is_xhr:
            return JsonResponse({'success': False, 'message': 'La clave de API de Gemini no está configurada.'})
        messages.error(request, "La clave de API de Gemini no está configurada.")
        return redirect('index')

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash-lite-001')
    except Exception as e:
        if is_xhr:
            return JsonResponse({'success': False, 'message': f'Error al configurar la API de Gemini: {str(e)}'})
        messages.error(request, f"Error al configurar la API de Gemini: {e}")
        return redirect('index')

    # Obtener proyectos en curso
    proyectos_en_curso = Proyecto.objects.filter(estado='En Curso')

    if not proyectos_en_curso.exists():
        if is_xhr:
            return JsonResponse({'success': False, 'message': "No hay proyectos 'En Curso' para generar un informe."})
        messages.info(request, "No hay proyectos 'En Curso' para generar un informe.")
        return redirect('index')

    # Procesar cada proyecto con IA
    informe_parts = []
    for proyecto in proyectos_en_curso:
        # Preparar datos para el prompt
        computo_list = [line.strip() for line in (proyecto.computo or '').split('\n') if line.strip()]

        prompt_data = {
            "ID": proyecto.id_project or 'N/A',
            "RF": proyecto.rf or 'N/A',
            "Nombre del Proyecto": proyecto.project or 'N/A',
            "Progreso": f"{proyecto.percent_complete * 100:.2f}%",
            "Estado": proyecto.estado or 'N/A',
            "Líder de Proyecto": proyecto.project_leader or 'N/A',
            "Inicio Real": proyecto.start.strftime('%Y-%m-%d') if proyecto.start else 'N/A',
            "Fin Real": proyecto.finish.strftime('%Y-%m-%d') if proyecto.finish else 'N/A',
            "Cómputo": "; ".join(computo_list),
        }

        prompt = (
            "Eres un asistente experto en gestión de proyectos. "
            "Basado en los siguientes datos de un proyecto, genera un 'Análisis de Estado' breve, profesional y accionable (2-3 frases). "
            "El análisis debe interpretar los datos clave (progreso, fechas) y describir la situación actual del proyecto, sugiriendo un siguiente paso o punto de atención. "
            "No incluyas un título, solo el párrafo del análisis.\n\n"
            "Datos del Proyecto:\n"
            f"- ID del Proyecto: {prompt_data['ID']}\n"
            f"- RF: {prompt_data['RF']}\n"
            f"- Nombre: {prompt_data['Nombre del Proyecto']}\n"
            f"- Progreso: {prompt_data['Progreso']}\n"
            f"- Estado: {prompt_data['Estado']}\n"
            f"- Fechas Reales (Inicio/Fin): {prompt_data['Inicio Real']} / {prompt_data['Fin Real']}\n"
            f"- Detalles de Cómputo: {prompt_data['Cómputo']}\n\n"
            "Análisis de Estado:"
        )

        # Generar análisis con reintentos
        max_attempts = 3
        base_backoff = 1.0
        attempt = 0
        success = False
        analisis = "No se pudo generar el análisis debido a un error."

        while attempt < max_attempts and not success:
            try:
                time.sleep(1)  # Rate limiting básico
                response = model.generate_content(prompt)
                analisis = response.text.strip().replace('*', '')
                success = True
            except Exception as e:
                msg = str(e)
                if 'Resource exhausted' in msg or '429' in msg or 'rate limit' in msg.lower() or 'quota' in msg.lower():
                    attempt += 1
                    sleep_time = base_backoff * (2 ** (attempt - 1))
                    time.sleep(sleep_time)
                    continue
                else:
                    break

        if not success:
            if 'Resource exhausted' in str(e) or '429' in str(e):
                analisis = "No se pudo generar el análisis: límite de recursos alcanzado. Intenta más tarde."

        title = proyecto.project or f"Proyecto {proyecto.id_project}"
        informe_parts.append(f"<section class='mb-3'><h3>{title}</h3><p>{analisis}</p></section>")

    informe_html = '\n'.join(informe_parts) if informe_parts else '<p>No hay contenido en el informe.</p>'

    if is_xhr:
        try:
            rendered = render(request, 'informe.html', {'informe': informe_html})
            return JsonResponse({'success': True, 'html': rendered.content.decode('utf-8')})
        except Exception as e:
            return JsonResponse({'success': False, 'message': f'Error al renderizar el informe: {str(e)}'}, status=500)

    return render(request, 'informe.html', {'informe': informe_html})

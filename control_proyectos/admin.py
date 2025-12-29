from django.contrib import admin
from .models import Proyecto, Evento, ProyectoFase


@admin.register(Proyecto)
class ProyectoAdmin(admin.ModelAdmin):
    list_display = ['id_project', 'project', 'estado', 'percent_complete', 'start', 'finish']
    list_filter = ['estado', 'start']
    search_fields = ['id_project', 'rf', 'project']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Información Principal', {
            'fields': ('id_project', 'rf', 'project', 'project_leader')
        }),
        ('Estado y Progreso', {
            'fields': ('estado', 'percent_complete')
        }),
        ('Fechas', {
            'fields': ('start', 'finish')
        }),
        ('Cómputo', {
            'fields': ('computo',)
        }),
        ('Tareas Pendientes', {
            'fields': (
                'ntp', 'scan', 'resuelve_por_nombre', 'antivirus',
                'config_backup', 'monitoreo_nagios', 'monitoreo_elastic',
                'ucmdb', 'conectividad_awx', 'cambio_paso_operacion_ola'
            )
        }),
        ('Otros Campos', {
            'fields': ('base_de_datos', 'balanceo', 'backup', 'check_av')
        }),
        ('Información Adicional', {
            'fields': (
                'contacto', 'cantidad_maquinas', 'cod_serv_hostname', 'plataforma', 'so',
                'windows_licencia_activada', 'dominio', 'plataforma_backup', 'proveedor',
                'comunidad_snmp', 'fgn_172_22_16_93', 'rt', 'servicio', 'observaciones'
            )
        }),
        ('Metadatos', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Evento)
class EventoAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'fecha_inicio', 'fecha_fin', 'responsable']
    list_filter = ['fecha_inicio']
    search_fields = ['titulo', 'descripcion', 'responsable']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'fecha_inicio'


@admin.register(ProyectoFase)
class ProyectoFaseAdmin(admin.ModelAdmin):
    """
    Configuración para el modelo ProyectoFase en el panel de administración.
    """
    list_display = ('proyecto', 'fase', 'fecha', 'created_at')
    list_filter = ('fase', 'proyecto__project')
    search_fields = ('proyecto__project', 'proyecto__id_project')
    date_hierarchy = 'fecha'

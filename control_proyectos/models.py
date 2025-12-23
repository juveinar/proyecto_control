from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


class Proyecto(models.Model):
    """Modelo para almacenar información de proyectos"""

    # Campos principales
    id_project = models.IntegerField(unique=True, verbose_name="ID Proyecto", db_index=True)
    rf = models.CharField(max_length=100, verbose_name="RF", blank=True, null=True)
    project = models.CharField(max_length=255, verbose_name="Proyecto", blank=True, null=True)
    project_leader = models.CharField(max_length=255, verbose_name="Líder de Proyecto", blank=True, null=True)

    # Estado y progreso
    finalizado = models.CharField(max_length=50, verbose_name="Finalizado", default="En Curso", blank=True, null=True)
    percent_complete = models.FloatField(
        verbose_name="% Complete",
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)],
        blank=True,
        null=True
    )

    # Fechas
    start = models.DateField(verbose_name="Start", blank=True, null=True)
    finish = models.DateField(verbose_name="Finish", blank=True, null=True)

    # Cómputo
    computo = models.TextField(verbose_name="Cómputo", blank=True, null=True)

    # Campos de estado/tareas pendientes
    ntp = models.CharField(max_length=100, verbose_name="NTP", default="Pendiente", blank=True, null=True)
    scan = models.CharField(max_length=100, verbose_name="SCAN", default="Pendiente", blank=True, null=True)
    resuelve_por_nombre = models.CharField(max_length=100, verbose_name="Resuelve por Nombre", default="Pendiente", blank=True, null=True)
    antivirus = models.CharField(max_length=100, verbose_name="Antivirus", default="Pendiente", blank=True, null=True)
    config_backup = models.CharField(max_length=100, verbose_name="Config Backup", default="Pendiente", blank=True, null=True)
    monitoreo_nagios = models.CharField(max_length=100, verbose_name="Monitoreo Nagios", default="Pendiente", blank=True, null=True)
    monitoreo_elastic = models.CharField(max_length=100, verbose_name="Monitoreo Elastic", default="Pendiente", blank=True, null=True)
    ucmdb = models.CharField(max_length=100, verbose_name="UCMDB", default="Pendiente", blank=True, null=True)
    conectividad_awx = models.CharField(max_length=100, verbose_name="Conectividad AWX 172.18.90.250 (SOLO UNIX)", default="Pendiente", blank=True, null=True)
    cambio_paso_operacion_ola = models.CharField(max_length=100, verbose_name="Cambio Paso Operación (OLA)", default="Pendiente", blank=True, null=True)

    # Campos adicionales comunes (pueden agregarse más según necesidad)
    base_de_datos = models.CharField(max_length=100, verbose_name="Base de Datos", blank=True, null=True)
    balanceo = models.CharField(max_length=100, verbose_name="Balanceo", blank=True, null=True)
    backup = models.CharField(max_length=100, verbose_name="Backup", blank=True, null=True)
    check_av = models.CharField(max_length=100, verbose_name="Check AV", blank=True, null=True)

    # Campos adicionales del Excel
    contacto = models.CharField(max_length=255, verbose_name="CONTACTO", blank=True, null=True)
    cantidad_maquinas = models.CharField(max_length=255, verbose_name="CANTIDAD MAQUINAS", blank=True, null=True)
    cod_serv_hostname = models.TextField(verbose_name="COD SERV_HOSTNAME", blank=True, null=True)
    plataforma = models.CharField(max_length=255, verbose_name="PLATAFORMA", blank=True, null=True)
    so = models.CharField(max_length=255, verbose_name="SO", blank=True, null=True)
    windows_licencia_activada = models.CharField(max_length=100, verbose_name="WINDOWS LICENCIA ACTIVADA", blank=True, null=True)
    dominio = models.CharField(max_length=255, verbose_name="DOMINIO", blank=True, null=True)
    plataforma_backup = models.CharField(max_length=255, verbose_name="PLATAFORMA BACKUP", blank=True, null=True)
    proveedor = models.CharField(max_length=255, verbose_name="PROVEEDOR", blank=True, null=True)
    comunidad_snmp = models.CharField(max_length=255, verbose_name="COMUNIDAD SNMP", blank=True, null=True)
    fgn_172_22_16_93 = models.CharField(max_length=100, verbose_name="FGN 172.22.16.93", blank=True, null=True)
    rt = models.CharField(max_length=255, verbose_name="RT", blank=True, null=True)
    servicio = models.CharField(max_length=255, verbose_name="SERVICIO", blank=True, null=True)
    observaciones = models.TextField(verbose_name="OBSERVACIONES", blank=True, null=True)

    # Metadatos
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Fecha de Actualización")

    class Meta:
        verbose_name = "Proyecto"
        verbose_name_plural = "Proyectos"
        ordering = ['-start', 'project']
        indexes = [
            models.Index(fields=['id_project']),
            models.Index(fields=['finalizado']),
            models.Index(fields=['start']),
        ]

    def __str__(self):
        return f"{self.id_project} - {self.project or 'Sin nombre'}"


class Evento(models.Model):
    """Modelo para almacenar información de eventos"""

    titulo = models.CharField(max_length=255, verbose_name="Título", blank=True, null=True)
    descripcion = models.TextField(verbose_name="Descripción", blank=True, null=True)
    fecha_inicio = models.DateTimeField(verbose_name="Fecha de Inicio", blank=True, null=True)
    fecha_fin = models.DateTimeField(verbose_name="Fecha de Fin", blank=True, null=True)
    ubicacion = models.CharField(max_length=255, verbose_name="Ubicación", blank=True, null=True)
    responsable = models.CharField(max_length=255, verbose_name="Responsable", blank=True, null=True)

    # Metadatos
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Fecha de Actualización")

    class Meta:
        verbose_name = "Evento"
        verbose_name_plural = "Eventos"
        ordering = ['fecha_inicio']
        indexes = [
            models.Index(fields=['fecha_inicio']),
        ]

    def __str__(self):
        return f"{self.titulo or 'Sin título'} - {self.fecha_inicio}"


class ProyectoFase(models.Model):
    """
    Almacena el historial de fases por las que pasa un proyecto,
    creando un registro por cada cambio de fase.
    """
    FASE_CHOICES = [
        ('DESPLIEGUE', 'Despliegue'),
        ('ENTREGADO', 'Entregado a Usuario'),
        ('OPERACION', 'Paso a Operación'),
    ]

    proyecto = models.ForeignKey(
        Proyecto,
        on_delete=models.CASCADE,
        related_name='fases'
    )
    fase = models.CharField(
        max_length=20,
        choices=FASE_CHOICES,
        help_text="La fase en la que entró el proyecto en la fecha indicada."
    )
    fecha = models.DateField(help_text="Fecha en la que el proyecto entró en esta fase.")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'control_proyectos_proyecto_fase'
        ordering = ['fecha']
        unique_together = ('proyecto', 'fecha', 'fase')

    def __str__(self):
        return f'{self.proyecto} - {self.get_fase_display()}'

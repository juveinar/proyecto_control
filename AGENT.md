# AGENT.MD - Guía Técnica del Proyecto
## Sistema de Control de Proyectos - Portal Web Django

---

## 🚀 **EJECUCIÓN DEL PROYECTO**

### **Requisitos del Sistema**
```bash
# Python 3.8+ requerido
python --version

# Django y dependencias principales
pip install django djangorestframework
pip install mysqlclient python-decouple
pip install openpyxl xlsxwriter  # Para exportación Excel
pip install django-cors-headers  # Para API CORS
```

### **Configuración Inicial**
```bash
# 1. Clonar/entrar al directorio
cd d:\Share\app-web2\proyecto_control

# 2. Activar entorno virtual (opcional pero recomendado)
python -m venv venv
venv\Scripts\activate

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Configurar base de datos MySQL
# Crear base de datos: CREATE DATABASE proyecto_control;

# 5. Migraciones de Django
python manage.py makemigrations
python manage.py migrate

# 6. Crear superusuario (opcional)
python manage.py createsuperuser

# 7. Ejecutar aplicación
python manage.py runserver

# 8. Acceder al navegador
http://localhost:8000
```

### **Variables de Entorno (.env)**
```bash
# Configuración en settings.py con python-decouple
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_URL=mysql://user:password@localhost:3306/proyecto_control
ALLOWED_HOSTS=localhost,127.0.0.1
```

### **Configuración MySQL**
```python
# settings.py - Configuración de base de datos
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'proyecto_control',
        'USER': config('DB_USER', default='root'),
        'PASSWORD': config('DB_PASSWORD', default=''),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='3306'),
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        }
    }
}
```

---

## 🏗️ **ESTRUCTURA COMPLETA DEL PROYECTO**

```
proyecto_control/
├── manage.py                       # Script de gestión Django
├── requirements.txt                # Dependencias Python
├── .env                           # Variables de entorno
├── proyecto_control/              # Directorio principal Django
│   ├── __init__.py
│   ├── settings.py                # Configuración Django
│   ├── urls.py                    # URLs principales
│   ├── wsgi.py                    # WSGI para deployment
│   └── asgi.py                    # ASGI para async
├── apps/                          # Aplicaciones Django
│   ├── projects/
│   │   ├── __init__.py
│   │   ├── models.py              # Modelos de proyectos
│   │   ├── views.py               # Vistas lógica
│   │   ├── urls.py                # URLs de projects
│   │   ├── serializers.py         # DRF serializers
│   │   └── admin.py               # Admin Django
│   ├── inventory/
│   │   ├── __init__.py
│   │   ├── models.py              # Modelos de inventario
│   │   ├── views.py               # Vistas de inventario
│   │   ├── urls.py                # URLs de inventory
│   │   └── serializers.py         # DRF serializers
│   ├── contacts/
│   │   ├── __init__.py
│   │   ├── models.py              # Modelos de contactos
│   │   ├── views.py               # Vistas de contactos
│   │   └── serializers.py         # DRF serializers
│   └── events/
│       ├── __init__.py
│       ├── models.py              # Modelos de eventos
│       ├── views.py               # Vistas de eventos
│       └── serializers.py         # DRF serializers
├── templates/
│   ├── base.html                  # Template base Django
│   ├── index.html                 # Template principal con dashboard
│   └── inventory/
│       ├── projects_in_progress.html    # Proyectos en curso
│       ├── projects_finished.html       # Proyectos finalizados
│       └── general.html                 # Inventario general
├── static/
│   ├── js/
│   │   └── main.js                 # JavaScript principal (3400+ líneas)
│   ├── css/
│   │   └── inventory.css          # Estilos específicos
│   └── img/                       # Imágenes y assets
├── media/                         # Archivos subidos por usuarios
└── locale/                        # Archivos de internacionalización
```

---

## 🎨 **SISTEMA DE ESTILOS ACTUAL**

### **Framework CSS Principal**
- **Bootstrap 5.3.2**: Grid system, componentes, utilities
- **Bootstrap Icons 1.11**: Iconos del sistema (bi-*)
- **CSS Personalizado**: Estilos inline en templates

### **Paleta de Colores Implementada**
```css
/* Azules principales - Estilo IA Dashboard */
--blue-primary: #3498db;
--blue-secondary: #2980b9;
--blue-light: rgba(52, 152, 219, 0.1-0.3);
--blue-border: rgba(52, 152, 219, 0.3-0.4);
--blue-shadow: rgba(52, 152, 219, 0.3-0.4);
```

### **Gradientes y Efectos**
```css
/* Gradientes estándar */
background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
background: linear-gradient(135deg, rgba(52, 152, 219, 0.1) 0%, rgba(41, 128, 185, 0.05) 100%);

/* Glassmorphism */
backdrop-filter: blur(10px);
border-radius: 12px;
box-shadow: 0 4px 20px rgba(52, 152, 219, 0.3);
```

### **Transiciones y Animaciones**
```css
transition: all 0.3s ease;
transform: translateY(-2px) to translateY(-5px);
box-shadow: 0 8px 30px rgba(52, 152, 219, 0.4);
```

---

## 💻 **ESTÁNDARES DE CÓDIGO IMPLEMENTADOS**

### **JavaScript (main.js - 3400+ líneas)**
```javascript
// ES6+ Features utilizados
const arrowFunction = () => {};           // Arrow functions
const templateLiteral = `${variable}`;    // Template literals
const [destructuring] = array;            // Destructuring
const asyncFunction = async () => {       // Async/await
    try {
        const response = await fetch('/api/endpoint');
        const data = await response.json();
    } catch (error) {
        showNotification('Error', 'error');
    }
};

// Nomenclatura estándar
const camelCaseVariable = 'value';
class PascalCaseClass {}
function snake_case_function() {}

// Event Listeners (preferencia sobre onclick)
document.addEventListener('DOMContentLoaded', () => {});
element.addEventListener('click', handler);
```

### **HTML Templates**
```html
<!-- Bootstrap 5 Structure -->
<div class="container-fluid">
    <div class="row">
        <div class="col-lg-6 col-xl-4 mb-4">
            <div class="card h-100">
                <div class="card-header bg-primary text-white">
                    <h5 class="card-title mb-0">
                        <i class="bi bi-server-fill me-2"></i>Title
                    </h5>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Iconos Bootstrap Icons -->
<i class="bi bi-funnel"></i>
<i class="bi bi-clock-history"></i>
<i class="bi bi-grid-3x3-gap"></i>
```

### **CSS en Templates**
```html
<style>
/* Estilos específicos de página */
.inventory-container {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    border-radius: 12px;
}

.btn-group .btn {
    background: linear-gradient(135deg, rgba(52, 152, 219, 0.1) 0%, rgba(41, 128, 185, 0.05) 100%);
    border: 1px solid rgba(52, 152, 219, 0.3);
    color: #3498db;
    transition: all 0.3s ease;
}
</style>
```

---

## 🗄️ **ESTRUCTURA DE DATOS Y API**

### **Modelos Django ORM**
```python
# apps/projects/models.py
from django.db import models

class Project(models.Model):
    ESTADO_CHOICES = [
        ('En Curso', 'En Curso'),
        ('Despliegue', 'Despliegue'),
        ('Finalizado', 'Finalizado'),
        ('Cerrado', 'Cerrado'),
    ]
    
    id = models.AutoField(primary_key=True)
    project = models.CharField(max_length=200, verbose_name="Nombre del Proyecto")
    rf = models.CharField(max_length=50, verbose_name="RF/Request For", blank=True)
    start = models.DateTimeField(verbose_name="Fecha Inicio")
    finish = models.DateTimeField(verbose_name="Fecha Finalización", null=True, blank=True)
    estado = models.CharField(max_length=50, choices=ESTADO_CHOICES, verbose_name="Estado")
    fase = models.CharField(max_length=100, verbose_name="Fase Actual", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'projects'
        verbose_name = 'Proyecto'
        verbose_name_plural = 'Proyectos'
        ordering = ['-created_at']

# apps/inventory/models.py
class Inventory(models.Model):
    TIPO_EQUIPO_CHOICES = [
        ('Servidor', 'Servidor'),
        ('Workstation', 'Workstation'),
        ('Laptop', 'Laptop'),
        ('Switch', 'Switch'),
        ('Router', 'Router'),
        ('Firewall', 'Firewall'),
        ('Storage', 'Storage'),
        ('Appliance', 'Appliance'),
    ]
    
    id = models.AutoField(primary_key=True)
    proyecto = models.ForeignKey(Project, on_delete=models.CASCADE, verbose_name="Proyecto")
    ubicacion = models.CharField(max_length=200, verbose_name="Ubicación")
    ot = models.CharField(max_length=100, verbose_name="OT", blank=True)
    codigo = models.CharField(max_length=100, verbose_name="Código")
    hostname = models.CharField(max_length=200, verbose_name="Hostname")
    tipo_equipo = models.CharField(max_length=100, choices=TIPO_EQUIPO_CHOICES, verbose_name="Tipo de Equipo")
    cpu = models.CharField(max_length=100, verbose_name="CPU", blank=True)
    ram = models.CharField(max_length=50, verbose_name="RAM", blank=True)
    disco_so = models.CharField(max_length=100, verbose_name="Disco SO", blank=True)
    disco_pag = models.CharField(max_length=100, verbose_name="Disco Paginación", blank=True)
    disco_data = models.CharField(max_length=100, verbose_name="Disco Datos", blank=True)
    ip_gestion = models.GenericIPAddressField(verbose_name="IP Gestión", blank=True, null=True)
    ip_servicios = models.GenericIPAddressField(verbose_name="IP Servicios", blank=True, null=True)
    ip_produccion = models.GenericIPAddressField(verbose_name="IP Producción", blank=True, null=True)
    ip_adicional_1 = models.GenericIPAddressField(verbose_name="IP Adicional 1", blank=True, null=True)
    ip_adicional_2 = models.GenericIPAddressField(verbose_name="IP Adicional 2", blank=True, null=True)
    sistema_operativo = models.CharField(max_length=100, verbose_name="Sistema Operativo", blank=True)
    referencia = models.TextField(verbose_name="Referencia", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'inventory'
        verbose_name = 'Equipo'
        verbose_name_plural = 'Equipos'
        ordering = ['hostname']
```

### **Serializers Django REST Framework**
```python
# apps/projects/serializers.py
from rest_framework import serializers
from .models import Project

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'project', 'rf', 'start', 'finish', 'estado', 'fase', 'created_at', 'updated_at']

# apps/inventory/serializers.py
from rest_framework import serializers
from .models import Inventory

class InventorySerializer(serializers.ModelSerializer):
    proyecto_id = serializers.IntegerField(source='proyecto.id')
    
    class Meta:
        model = Inventory
        fields = ['id', 'proyecto_id', 'ubicacion', 'ot', 'codigo', 'hostname', 'tipo_equipo',
                 'cpu', 'ram', 'disco_so', 'disco_pag', 'disco_data', 'ip_gestion', 'ip_servicios',
                 'ip_produccion', 'ip_adicional_1', 'ip_adicional_2', 'sistema_operativo', 'referencia']
```

### **API Views Django REST Framework**
```python
# apps/projects/views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import Project
from .serializers import ProjectSerializer

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    
    def get_queryset(self):
        queryset = Project.objects.all()
        estado = self.request.query_params.get('estado', None)
        if estado:
            queryset = queryset.filter(estado=estado)
        return queryset

# apps/inventory/views.py
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Inventory
from .serializers import InventorySerializer

class InventoryViewSet(viewsets.ModelViewSet):
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    
    def get_queryset(self):
        queryset = Inventory.objects.select_related('proyecto')
        proyecto_id = self.request.query_params.get('proyecto_id', None)
        if proyecto_id:
            queryset = queryset.filter(proyecto_id=proyecto_id)
        return queryset
    
    @action(detail=False, methods=['get'])
    def all(self, request):
        """Endpoint para obtener todo el inventario"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
```

### **URL Configuration Django**
```python
# proyecto_control/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/projects/', include('apps.projects.urls')),
    path('api/inventario/', include('apps.inventory.urls')),
    path('api/contacts/', include('apps.contacts.urls')),
    path('api/events/', include('apps.events.urls')),
    path('', include('apps.core.urls')),  # URLs principales
]

# apps/projects/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet

router = DefaultRouter()
router.register(r'', ProjectViewSet, basename='project')

urlpatterns = [
    path('', include(router.urls)),
]
```

### **Formato de Respuesta JSON**
```json
// Proyectos - GET /api/projects/
{
    "id": 123,
    "project": "Nombre Proyecto",
    "rf": "RF-2024-001",
    "start": "2024-01-15T00:00:00Z",
    "finish": "2024-06-30T00:00:00Z",
    "estado": "Finalizado",
    "fase": "Despliegue",
    "created_at": "2024-01-10T10:00:00Z",
    "updated_at": "2024-06-30T15:30:00Z"
}

// Inventario - GET /api/inventario/
{
    "id": 456,
    "proyecto_id": 123,
    "ubicacion": "Datacenter A",
    "ot": "OT-2024-045",
    "codigo": "SRV-001",
    "hostname": "srv-prod-01",
    "tipo_equipo": "Servidor",
    "cpu": "Intel Xeon E5-2670",
    "ram": "32GB DDR4",
    "disco_so": "100GB SSD",
    "disco_pag": "16GB SSD",
    "disco_data": "500GB SSD",
    "ip_gestion": "192.168.1.10",
    "ip_servicios": "192.168.2.10",
    "ip_produccion": "10.0.1.10",
    "ip_adicional_1": "192.168.3.10",
    "ip_adicional_2": null,
    "sistema_operativo": "Ubuntu 20.04 LTS",
    "referencia": "Dell PowerEdge R740"
}
```

---

## 🔧 **FUNCIONALIDADES TÉCNICAS CLAVE**

### **Sistema de Notificaciones**
```javascript
// Implementación en main.js líneas 3347-3388
window.showNotification = (message, type = 'info', duration = 4000) => {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: 'bi-check-circle-fill',
        error: 'bi-x-circle-fill',
        warning: 'bi-exclamation-triangle-fill',
        info: 'bi-info-circle-fill'
    };
    
    notification.innerHTML = `
        <i class="bi ${icons[type]} notification-icon"></i>
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="bi bi-times"></i>
        </button>
    `;
    
    container.appendChild(notification);
    // Animación y auto-eliminación...
};
```

### **Manejo de Modales Bootstrap**
```javascript
// Inicialización en main.js línea 108
const projectModal = new bootstrap.Modal(document.getElementById('projectModal'));
const detailsModal = new bootstrap.Modal(document.getElementById('detailsModal'));

// Funciones globales para onclick en HTML dinámico
window.openEditModal = (projectId) => {
    const project = allProjects.find(p => p['Id Project'] === projectId);
    if (project) {
        setupModalForm(project);
        projectModal.show();
    }
};
```

### **Exportación Excel**
```javascript
// Implementación con XLSX.js CDN
window.exportProjectInventory = async (projectId) => {
    const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
    
    const data = inventory.map(item => ({
        'Ubicación': item.ubicacion || '',
        'OT': item.ot || '',
        'Código': item.codigo || '',
        // ... mapeo de todos los campos
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    XLSX.writeFile(wb, `inventario_proyecto_${projectId}.xlsx`);
};
```

---

## 🚨 **PATRONES Y ANTI-PATRONES**

### **Patrones Correctos**
```javascript
// ✅ Manejo de errores con try/catch
async function loadData() {
    try {
        const response = await fetch('/api/projects');
        if (!response.ok) throw new Error('Error en la respuesta');
        const data = await response.json();
        return data;
    } catch (error) {
        showNotification('Error al cargar datos: ' + error.message, 'error');
        console.error('Error:', error);
    }
}

// ✅ Nombres de campos con corchetes (API response)
const projectId = project['Id Project'];  // NO usar project.id_project
const projectName = project['Project'];    // NO usar project.project

// ✅ Funciones globales para onclick dinámico
window.globalFunction = (param) => { /* lógica */ };
```

### **Anti-Patrones a Evitar**
```javascript
// ❌ Nunca usar alert()
alert('Mensaje');  // Usar showNotification() en su lugar

// ❌ Nombres de campo incorrectos
const id = project.id_project;     // INCORRECTO
const name = project.project;     // INCORRECTO

// ❌ Sintaxis malformada
window.function = window.function || async () => {};  // EVITAR

// ❌ Manejo síncrono de operaciones async
const data = fetch('/api/data');  // INCORRECTO - usar await
```

---

## 📊 **ESTRUCTURA DE COMPONENTES UI**

### **Dashboard Principal (index.html)**
```html
<!-- Estadísticas -->
<div class="inventory-stats">
    <div class="stat-card">
        <div class="stat-number" id="activeProjects">-</div>
        <div class="stat-label">Proyectos Activos</div>
    </div>
</div>

<!-- Contenedor de notificaciones -->
<div id="notificationContainer" class="notification-container"></div>
```

### **Vistas de Inventario**
```html
<!-- projects_in_progress.html -->
<div class="timeline">
    <div class="timeline-line"></div>
    <!-- Timeline items con renderTimelineItem() -->
</div>

<!-- projects_finished.html -->
<select id="yearFilter" class="form-select">
    <option value="all">Todos</option>
    <!-- Años dinámicos con populateYearFilter() -->
</select>
```

### **Tablas de Datos**
```html
<table class="table table-dark table-hover">
    <thead>
        <tr>
            <th>Proyecto</th>
            <th>Ubicación</th>
            <th>OT</th>
            <th>Código</th>
            <!-- 18 campos totales en inventario -->
        </tr>
    </thead>
    <tbody id="tableBody">
        <!-- Filas dinámicas con renderTableRow() -->
    </tbody>
</table>
```

---

## 🔍 **DEBUGGING Y TROUBLESHOOTING**

### **Errores Comunes y Soluciones**
```javascript
// 1. ReferenceError: openEditModal is not defined
// Solución: Definir como función global
window.openEditModal = (projectId) => { /* implementación */ };

// 2. SyntaxError: Missing catch or finally after try
// Solución: Estructura try/catch completa
try {
    // código async
} catch (error) {
    showNotification('Error: ' + error.message, 'error');
}

// 3. Cannot read properties of undefined (reading 'backdrop')
// Solución: Verificar inicialización de modales Bootstrap
const modal = new bootstrap.Modal(document.getElementById('modalId'));

// 4. Datos no cargan (0 en estadísticas)
// Solución: Verificar nombres de campos con corchetes
const projects = data.map(p => p['Id Project']);  // Correcto
```

### **Herramientas de Debugging**
```bash
# Chrome DevTools
F12 → Console (ver errores JavaScript)
F12 → Network (ver llamadas API)
F12 → Elements (inspeccionar DOM/estilos)

# Logs específicos del proyecto
console.log('Proyectos encontrados:', this.projects.length);
console.log('Estados:', this.projects.map(p => p['Estado']));
```

---

## 📋 **CHECKLIST TÉCNICO DE DESARROLLO**

### **Antes de Implementar Nueva Funcionalidad**
- [ ] **Revisar AGENT.md** para estándares actuales
- [ ] **Verificar nombres de campos** en respuestas API
- [ ] **Usar showNotification()** nunca alert()
- [ ] **Implementar try/catch** en operaciones async
- [ ] **Seguir nomenclatura** camelCase/PascalCase
- [ ] **Agregar estilos IA dashboard** para nuevos componentes

### **Testing y Validación**
- [ ] **Console limpia** (sin errores JavaScript)
- [ ] **API responses correctas** (verificar campos)
- [ ] **Responsive design** (mobile, tablet, desktop)
- [ ] **Funcionalidad completa** en diferentes navegadores
- [ ] **Notificaciones funcionando** para todas las acciones

### **Code Review Checklist**
- [ ] **Sin alerts()** - solo showNotification()
- [ ] **Nombres de campo correctos** con ['Id Project']
- [ ] **Manejo de errores** implementado
- [ ] **Estilos consistentes** con diseño IA
- [ ] **Código comentado** donde sea necesario

---

## 🚀 **NOTAS ESPECÍFICAS PARA EL AGENTE**

### **Contexto del Proyecto Actual**
- **Estado**: Activo y en desarrollo continuo
- **Versión**: 1.3.0 (diciembre 2024)
- **Tamaño**: 3400+ líneas JavaScript, múltiples templates HTML
- **Complejidad**: Sistema completo con CRUD, dashboard, exportación

### **Prioridades de Mantenimiento**
1. **Nunca usar alert()** - siempre showNotification()
2. **Verificar nombres de campos** - usar ['Id Project'], ['Project']
3. **Mantener consistencia visual** - estilo IA dashboard
4. **Manejo robusto de errores** - try/catch en todo async
5. **Testing cross-browser** - Chrome, Firefox, Edge

### **Decisiones de Arquitectura**
- **SQLite** para simplicidad y portabilidad
- **Bootstrap 5** para desarrollo rápido
- **JavaScript vanilla** para evitar dependencias complejas
- **CDN para XLSX.js** para exportación Excel
- **Templates Jinja2** para renderizado server-side

### **Consideraciones de Performance**
- **Lazy loading** para datos grandes
- **Debouncing** para búsquedas
- **Virtual scrolling** si es necesario
- **Caching** de respuestas API
- **Optimización de imágenes** si se agregan

---

**Este documento es la fuente de verdad técnica para el proyecto. Siempre referirse a AGENT.md antes de hacer cambios significativos.**

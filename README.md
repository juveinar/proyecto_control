# Proyecto Control - App Web

Esta es una aplicación web para la gestión y visualización de proyectos, migrada desde una versión inicial en Flask a una arquitectura más robusta y escalable con Django y MySQL.

## 1. Descripción General

La aplicación `Proyecto Control` ofrece un dashboard interactivo para monitorear el estado de múltiples proyectos. Permite visualizar estadísticas, filtrar y buscar proyectos, así como gestionar detalles específicos de cada uno y programar eventos.

La migración a Django se realizó para mejorar la integridad de los datos (pasando de archivos Excel a una base de datos MySQL), la escalabilidad y la mantenibilidad del código.

## 2. Características Principales

-   **Dashboard Interactivo:** Gráfico de proyectos iniciados por mes y contadores de estado.
-   **Tabla de Proyectos:** Paginación, búsqueda en tiempo real y filtros por año, mes y fase (Finalizado/No Finalizado).
-   **Gestión de Proyectos (CRUD):**
    -   Crear nuevos proyectos.
    -   Ver detalles completos de cada proyecto en un modal.
    -   Editar toda la información de un proyecto.
-   **Seguimiento de Fases:** Registro histórico de las fases de cada proyecto (Despliegue, Entregado, Operación) con sus fechas correspondientes.
-   **Gestión de Eventos (CRUD):**
    -   Widget flotante para visualizar, crear, editar y eliminar eventos del calendario.
-   **Resumen de Pendientes:** Una tabla que extrae y resume todas las tareas con estado "Pendiente" o "En curso" de los proyectos no finalizados.
-   **Generación de Informes con IA:** Funcionalidad para generar un análisis del estado de los proyectos en curso utilizando la API de Google Gemini.
-   **Autenticación de Usuarios:** Sistema de login para proteger el acceso a la aplicación.

## 3. Stack Tecnológico

-   **Backend:** Python 3, Django 4.x
-   **Base de Datos:** MySQL
-   **Frontend:** HTML5, CSS3, JavaScript (ES6+), Bootstrap 5, Chart.js
-   **Librerías Python Clave:**
    -   `django`: Framework principal.
    -   `mysqlclient`: Conector para la base de datos MySQL.
    -   `google-generativeai`: Para la integración con la IA de Gemini.
    -   `python-dotenv`: Para la gestión de variables de entorno.

## 4. Estructura del Proyecto

La estructura del proyecto sigue las convenciones estándar de Django:

```
proyecto_control/
├── control_proyectos/      # La aplicación principal de Django, lógica específica y las funcionalidades de negocio
│   ├── migrations/         #  Historial de cambios, Migraciones de la base de datos
│   ├── __init__.py
│   ├── admin.py            # Configuración del panel de admin para ver tus modelos de datos
│   ├── apps.py             
│   ├── models.py           # Modelos de la base de datos (Proyecto, Evento, ProyectoFase)
│   ├── tests.py
│   └── views.py            # Lógica de las vistas y APIs, procesa las solicitudes del usuario y decide qué plantilla mostrar
├── proyecto_control/       # Carpeta de configuración del proyecto, configuración global de todo el sitio web
│   ├── __init__.py
│   ├── asgi.py             # Punto de entrada para ASGI
│   ├── settings.py         # Configuración principal (BD, apps, etc.)
│   ├── urls.py             # Rutas URL principales que dirige el tráfico a las distintas partes del sitio.
│   └── wsgi.py             # Puntos de entrada para que el servidor web ejecute el proyecto.
├── static/                 # Archivos estáticos (CSS, JS, imágenes)
│   ├── css/
│   ├── img/
│   └── js/
│       └── main.js
├── templates/              # Plantillas HTML
│   ├── index.html
│   └── login.html
├── venv_proyecto/          # Entorno virtual de Python
├── .env                    # Variables de entorno (BD, API Keys, etc.)
├── manage.py               # Utilidad de línea de comandos de Django
└── requirements.txt        # Dependencias del proyecto
```

## 5. Instalación y Ejecución

Sigue estos pasos para configurar y ejecutar el proyecto en un entorno de desarrollo local.

### Prerrequisitos

-   Python 3.8 o superior.
-   Un servidor de base de datos MySQL en funcionamiento.

### Pasos

1.  **Clonar el Repositorio** (si aplica)
    ```bash
    git clone <url-del-repositorio>
    cd proyecto_control
    ```

2.  **Activar el Entorno Virtual**
    El proyecto ya incluye una carpeta `venv_proyecto`. Para activarla:
    ```bash
    # En Windows
    .\venv_proyecto\Scripts\activate
    ```

3.  **Instalar Dependencias**
    Asegúrate de que todas las librerías necesarias estén instaladas.
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configurar Variables de Entorno**
    Crea un archivo llamado `.env` en la raíz del proyecto (`proyecto_control/`) y añade las siguientes variables:

    ```env
    # Clave secreta de Django (puedes generar una nueva)
    SECRET_KEY='tu-clave-secreta-aqui'

    # Configuración de la base de datos
    DB_NAME='nombre_de_tu_bd'
    DB_USER='tu_usuario_mysql'
    DB_PASSWORD='tu_contraseña_mysql'
    DB_HOST='localhost'
    DB_PORT='3306'

    # Clave de API para Google Gemini
    GEMINI_API_KEY='tu-api-key-de-gemini'

    # Modo Debug (True para desarrollo, False para producción)
    DEBUG=True
    ```

5.  **Aplicar Migraciones**
    Este comando creará las tablas (`Proyecto`, `Evento`, etc.) en tu base de datos MySQL.
    ```bash
    python manage.py migrate
    ```

6.  **Crear un Superusuario**
    Para poder acceder al panel de administración de Django (`/admin`).
    ```bash
    python manage.py createsuperuser
    ```
    Sigue las instrucciones para crear tu usuario administrador.

7.  **Ejecutar el Servidor de Desarrollo**
    ```bash
    python manage.py runserver
    ```

8.  **Acceder a la Aplicación**
    Abre tu navegador y visita `http://127.0.0.1:8000/`. Serás redirigido a la página de login.
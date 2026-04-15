# Flujo Lógico del Proyecto - Control de Proyectos

> **Arquitectura**: Monolítica con JavaScript centralizado en `main.js` (~3,600 líneas).

## Arquitectura General del Sistema (Estado Actual)

```mermaid
flowchart TB
    subgraph Usuario["👤 Usuario"]
        U[Interacción con UI]
    end

    subgraph Frontend["🌐 Frontend (Django Templates + JS Monolítico)"]
        T[index.html]
        JS["main.js<br/>~2,800 líneas"]
    end

    subgraph Backend["⚙️ Backend (Django)"]
        URLS["urls.py<br/>Ruteo de URLs"]
        subgraph Vistas["👁️ Vistas (views.py)"]
            V_INDEX[index]
            V_API[API Endpoints]
            V_INFORME[generar_informe_ia]
            V_INVENTORY[Vistas Inventario]
        end
        subgraph Modelos["💾 Modelos (models.py)"]
            M_PROY[Proyecto]
            M_EVE[Evento]
            M_FASE[ProyectoFase]
            M_CONT[Contacto]
            M_INV[ControlProyectosInventario]
        end
    end

    subgraph DB["🗄️ Base de Datos (SQLite/MySQL)"]
        DB_PROY[(Proyectos)]
        DB_EVE[(Eventos)]
        DB_CONT[(Contactos)]
        DB_INV[(Inventario)]
    end

    U --> T
    T --> JS
    JS -->|AJAX/Fetch| URLS
    URLS --> Vistas
    Vistas --> Modelos
    Modelos --> DB
```

---

## Flujo de Autenticación

```mermaid
flowchart LR
    A[Usuario] -->|Accede a /| B{¿Autenticado?}
    B -->|No| C[login.html]
    B -->|Sí| D[index.html]
    C -->|POST credentials| E[login_view]
    E -->|Success| D
    E -->|Fail| C
    D -->|Logout| F[logout_view]
    F --> C
```

---

## Flujo de Gestión de Proyectos (CRUD)

```mermaid
flowchart TB
    subgraph Cliente["🌐 Cliente"]
        C1[projects.js]
        C2[Modal Proyecto]
        C3[Tabla de Proyectos]
    end

    subgraph API["⚙️ API Django"]
        A1["GET /api/projects<br/>api_projects()"]
        A2["POST /api/projects<br/>api_projects_add()"]
        A3["PUT /api/projects/{id}<br/>api_projects_update()"]
        A4["PUT /api/projects/{id}/status<br/>api_projects_update_status()"]
        A5["GET /api/projects/stats<br/>api_projects_stats()"]
    end

    subgraph Modelo["💾 Modelo Proyecto"]
        M1[id_project, rf, project]
        M2[estado, start, finish]
        M3[Campos Técnicos NTP/SCAN/AV/etc]
        M4[contacto → ForeignKey Contacto]
    end

    C1 -->|fetchAllProjects| A1
    C1 -->|saveProject| A2
    C1 -->|updateProject| A3
    C1 -->|updateStatus| A4
    C1 -->|loadStats| A5
    
    A1 --> M1
    A2 --> M1
    A3 --> M1
    A4 --> M2
    A5 -->|Agregación| M2
```

---

## Flujo de Gestión de Contactos

```mermaid
flowchart LR
    subgraph Frontend["📱 Frontend"]
        F1[contacts.js]
        F2[Modal Contacto]
        F3[Tabla Contactos]
        F4[Dropdown Proyectos]
    end

    subgraph Backend["🔧 Backend API"]
        B1["GET /api/contacts"]
        B2["GET /api/contacts/simple"]
        B3["POST /api/contacts"]
        B4["PUT /api/contacts/{id}"]
        B5["DELETE /api/contacts/{id}"]
    end

    subgraph Data["🗃️ Modelo Contacto"]
        D1[nombre, correo, telefono]
        D2[cargo, area, notas]
        D3[proyecto → ForeignKey]
    end

    F1 -->|fetchAllContacts| B1
    F1 -->|loadContactsDropdown| B2
    F1 -->|saveContact| B3
    F1 -->|saveContact| B4
    F1 -->|deleteContact| B5
    
    B1 --> D1
    B3 --> D1
    B4 --> D1
```

---

## Flujo de Gestión de Eventos (Calendario)

```mermaid
flowchart TB
    subgraph UI["📅 Widget Calendario"]
        W1[events.js]
        W2[Event List]
        W3[Event Navigation]
        W4[Modal Evento]
    end

    subgraph EventAPI["⚡ API Eventos"]
        E1["GET /api/events<br/>api_events()"]
        E2["POST /api/events<br/>saveEvent()"]
        E3["PUT /api/events/{id}<br/>updateEvent()"]
        E4["DELETE /api/events/{id}<br/>deleteEvent()"]
        E5["GET /api/events/next<br/>api_events_next()"]
    end

    subgraph EventModel["📆 Modelo Evento"]
        EM1[titulo, descripcion]
        EM2[fecha_inicio, fecha_fin]
        EM3[ubicacion, responsable]
    end

    W1 -->|fetchAllEvents| E1
    W1 -->|saveEvent| E2
    W1 -->|editEvent| E3
    W1 -->|deleteEvent| E4
    W1 -->|displayNextEvent| E5
    
    E1 --> EM1
    E2 --> EM1
    E3 --> EM1
```

---

## Flujo del Dashboard y Estadísticas

```mermaid
flowchart LR
    subgraph Dashboard["📊 Dashboard"]
        D1[charts.js]
        D2[Tarjetas de Estado]
        D3[Gráfico de Barras Mensual]
        D4[Botón Generar Informe IA]
    end

    subgraph StatsAPI["📈 APIs"]
        S1["GET /api/projects/stats"]
        S2["POST /generar_informe"]
    end

    subgraph Gemini["🤖 Google Gemini AI"]
        G1[Generación de Informe]
    end

    D1 -->|renderChart| S1
    D1 -->|generateAIReport| S2
    S2 --> G1
    G1 -->|Markdown HTML| D4
```

---

## Flujo de Gestión de Inventario

```mermaid
flowchart TB
    subgraph InventarioUI["📦 Vistas de Inventario"]
        I1[inventory_general.html]
        I2[inventory_projects_in_progress.html]
        I3[inventory_projects_finished.html]
    end

    subgraph InvAPI["🔌 API Inventario"]
        IA1["GET /api/inventario"]
        IA2["GET /api/inventario/all"]
        IA3["POST /api/inventario"]
        IA4["PUT /api/inventario/{pk}"]
    end

    subgraph InvModel["🖥️ Modelo Inventario"]
        IM1[hostname, codigo, tipo_equipo]
        IM2[cpu, ram, disco_*]
        IM3[ip_gestion, ip_servicios, ip_produccion]
        IM4[proyecto → ForeignKey]
    end

    I1 -->|Cargar equipos| IA2
    I2 -->|Filtrar por estado| IA1
    I3 -->|Filtrar finalizados| IA1
    
    IA1 --> IM1
    IA2 --> IM1
    IA3 --> IM1
```

---

## Flujo de Fases de Proyecto (Histórico)

```mermaid
flowchart LR
    subgraph FaseFlow["🔄 Gestión de Fases"]
        F1[Proyecto Cambia Estado]
        F2[Crear ProyectoFase]
        F3[Histórico Completo]
    end

    subgraph Fases["📋 Fases Disponibles"]
        D1[DESPLIEGUE]
        D2[ENTREGADO]
        D3[OPERACION]
        D4[CIERRE]
    end

    F1 -->|Guardar cambio| F2
    F2 -->|FK a Proyecto| F3
    D1 --> F1
    D2 --> F1
    D3 --> F1
    D4 --> F1
```

---

## Estructura de main.js (Monolítico)

El archivo `@d:\Share\app-web2\proyecto_control\static\js\main.js` contiene toda la lógica JavaScript en una sola pieza:

```mermaid
flowchart TD
    subgraph MainJS["📄 main.js - Secciones Lógicas"]
        INIT["🚀 Inicialización<br/>setupMainEventListeners()"]
        PROY["📁 Gestión de Proyectos<br/>fetchProjects(), saveProject()"]
        CONT["👥 Gestión de Contactos<br/>fetchAllContacts(), saveContact()"]
        EVE["📅 Gestión de Eventos<br/>fetchAllEvents(), saveEvent()"]
        OBS["📝 Observaciones<br/>openObservacionesModal()"]
        GRA["📊 Gráficos<br/>renderChart(), updateActiveCard()"]
        UTIL["🛠️ Utilidades<br/>getCookie(), showToast(), formatDate()"]
    end

    INIT --> PROY
    INIT --> CONT
    INIT --> EVE
    INIT --> OBS
    INIT --> GRA
    PROY --> UTIL
    CONT --> UTIL
    EVE --> UTIL
    OBS --> UTIL
    GRA --> UTIL
```

---

## Endpoints API RESTful

| Método | Endpoint | Función | Descripción |
|--------|----------|---------|-------------|
| GET | `/api/projects` | `api_projects()` | Listar todos los proyectos |
| POST | `/api/projects` | `api_projects_add()` | Crear nuevo proyecto |
| PUT | `/api/projects/{id}` | `api_projects_update()` | Actualizar proyecto |
| PUT | `/api/projects/{id}/status` | `api_projects_update_status()` | Actualizar estado/fase |
| GET | `/api/projects/stats` | `api_projects_stats()` | Estadísticas mensuales |
| GET | `/api/events` | `api_events()` | Listar eventos |
| POST | `/api/events` | `api_events()` | Crear evento |
| PUT | `/api/events/{id}` | `api_events_update()` | Actualizar evento |
| DELETE | `/api/events/{id}` | `api_events_update()` | Eliminar evento |
| GET | `/api/contacts` | `api_contacts()` | Listar contactos |
| POST | `/api/contacts` | `api_contacts()` | Crear contacto |
| GET | `/api/inventario` | `api_inventario()` | Listar inventario |
| POST | `/api/inventario` | `api_inventario()` | Crear equipo |
| POST | `/generar_informe` | `generar_informe_ia()` | Informe con Gemini AI |

---

## Relaciones entre Modelos (ERD Simplificado)

```mermaid
erDiagram
    PROYECTO ||--o{ PROYECTOFASE : "tiene historial"
    PROYECTO ||--o{ CONTACTO : "asociado"
    PROYECTO ||--o{ INVENTARIO : "contiene equipos"
    
    PROYECTO {
        int id_project PK
        string rf
        string project
        string estado
        date start
        date finish
        string computo
        string ntp, scan, antivirus
        int contacto_id FK
    }
    
    PROYECTOFASE {
        int id PK
        int proyecto_id FK
        string fase
        date fecha
    }
    
    CONTACTO {
        int id PK
        string nombre
        string correo
        string telefono
        string cargo
        int proyecto_id FK
    }
    
    INVENTARIO {
        int id PK
        string hostname
        string codigo
        string tipo_equipo
        string cpu, ram
        string ip_gestion
        int proyecto_id FK
    }
    
    EVENTO {
        int id PK
        string titulo
        text descripcion
        datetime fecha_inicio
        datetime fecha_fin
        string ubicacion
    }
```

---

## Secuencia de Carga de Página Principal

```mermaid
sequenceDiagram
    participant U as Usuario
    participant D as Django
    participant T as Template
    participant JS as JavaScript
    participant API as API Django
    participant DB as Base de Datos

    U->>D: GET /
    D->>D: @login_required check
    alt No autenticado
        D->>U: Redirect /login/
    else Autenticado
        D->>T: render index.html
        T->>U: HTML + CSRF Token
        U->>JS: Cargar módulos JS
        JS->>API: GET /api/projects
        API->>DB: Query Proyectos
        DB->>API: Results
        API->>JS: JSON Proyectos
        JS->>U: Renderizar tabla
        
        JS->>API: GET /api/events
        API->>DB: Query Eventos
        DB->>API: Results
        API->>JS: JSON Eventos
        JS->>U: Mostrar widget calendario
        
        JS->>API: GET /api/projects/stats
        API->>DB: Aggregate
        DB->>API: Counts por mes
        API->>JS: JSON Stats
        JS->>U: Renderizar gráfico
    end
```

---

## Flujo de Datos - Guardar Proyecto

```mermaid
sequenceDiagram
    participant U as Usuario
    participant P as projects.js
    participant API as api_projects_add
    participant M as Modelo Proyecto
    participant DB as Base de Datos

    U->>P: Click Guardar
    P->>P: Validar formulario
    P->>P: Construir JSON
    P->>API: POST /api/projects
    API->>API: json.loads(request.body)
    API->>M: Crear instancia
    M->>M: Validar campos
    M->>DB: INSERT
    DB->>M: Confirmación
    M->>API: return
    API->>P: JsonResponse success
    P->>P: showToast éxito
    P->>U: Actualizar tabla
```

---

## Estructura de Directorios del Proyecto

```
proyecto_control/
├── 📁 proyecto_control/          # Configuración Django
│   ├── __init__.py
│   ├── settings.py               # Configuración principal
│   ├── urls.py                   # URLs raíz
│   ├── wsgi.py
│   └── asgi.py
│
├── 📁 control_proyectos/          # App principal
│   ├── models.py                 # 5 modelos
│   ├── views.py                  # ~1250 líneas
│   ├── urls.py                   # 18 endpoints
│   ├── admin.py                  # Config admin
│   ├── apps.py
│   └── migrations/
│
├── 📁 templates/                  # Templates HTML
│   ├── index.html                # App principal (~58KB)
│   ├── index_modular.html        # Versión modular
│   ├── login.html
│   ├── informe.html
│   └── inventory/                # Templates inventario
│
├── 📁 static/                     # Archivos estáticos
│   └── js/
│       └── modules/              # JS Modular
│           ├── utils.js          # Helpers (7.8KB)
│           ├── projects.js       # Gestión proyectos (30KB)
│           ├── contacts.js       # Gestión contactos (29KB)
│           ├── events.js         # Calendario (11KB)
│           ├── observaciones.js # Notas (9KB)
│           └── charts.js         # Gráficos (15KB)
│
├── 📁 config/                     # Configuración
├── 📁 scripts/                    # Scripts utilitarios
├── manage.py                      # CLI Django
├── requirements.txt               # Dependencias
└── .env                          # Variables entorno
```

---

## Resumen de Arquitectura

| Capa | Tecnología | Responsabilidad |
|------|------------|-----------------|
| **Presentación** | HTML5 + Bootstrap 5 + CSS3 | Interfaz de usuario responsive |
| **Lógica Cliente** | Vanilla JavaScript ES5/ES6 | **Monolítico**: main.js (~2,800 líneas) |
| **API** | Django 5.x + Django REST-style | Endpoints JSON para CRUD |
| **Lógica Negocio** | Django Views | Autenticación, validación, procesamiento |
| **Datos** | Django ORM | Modelos, relaciones, queries |
| **Persistencia** | SQLite (dev) / MySQL (prod) | Almacenamiento transaccional |
| **AI** | Google Gemini API | Generación de informes |

---

## Características Clave del Flujo (Realidad Actual)

1. **Arquitectura Monolítica**: Todo el JavaScript en un solo archivo `main.js`
2. **API RESTful**: Toda comunicación cliente-servidor vía JSON
3. **Carga Síncrona**: `main.js` se carga al final de `index.html` con versión cache-buster (`?v=1.6`)
4. **Stateless**: No hay estado de sesión en el servidor más allá de auth
5. **Integración AI**: Gemini para generación automática de informes
6. **Histórico de Fases**: Registro completo de cambios de estado por proyecto

## Deuda Técnica Identificada

| Issue | Descripción | Impacto |
|-------|-------------|---------|
| Código monolítico | `main.js` muy grande (~3,600 líneas) | Difícil mantenimiento, conflictos en merges |
| Cache busting manual | `?v=1.6` hardcodeado | Riesgo de caché obsoleta en clientes |
| Sin tests | No hay cobertura de tests unitarios | Riesgo de regresiones |

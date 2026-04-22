from django.urls import path
from . import views

urlpatterns = [
    # Vistas principales
    path('', views.index, name='index'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),

    # API de Proyectos
    path('api/projects', views.api_projects, name='api_projects'),  # GET y POST
    path('api/projects/stats', views.api_projects_stats, name='api_projects_stats'),
    path('api/projects/<int:project_id>', views.api_projects_update, name='api_projects_update'),  # PUT
    path('api/projects/<int:project_id>/status', views.api_projects_update_status, name='api_projects_update_status'),

    # API de Eventos
    path('api/events', views.api_events, name='api_events'),  # GET y POST
    path('api/events/next', views.api_events_next, name='api_events_next'),
    path('api/events/<int:event_id>', views.api_events_update, name='api_events_update'),  # PUT y DELETE

    # Generación de informes
    path('generar_informe', views.generar_informe_ia, name='generar_informe_ia'),
    path('informe_tradicional', views.generar_informe_tradicional, name='generar_informe_tradicional'),
    path('exportar_informe_word', views.exportar_informe_word, name='exportar_informe_word'),

    # API de Contactos
    path('api/contacts', views.api_contacts, name='api_contacts'),
    path('api/contacts/simple', views.api_contacts_simple, name='api_contacts_simple'),
    path('api/contacts/<int:contact_id>', views.api_contact_detail, name='api_contact_detail'),

    # API de Inventario
    path('api/inventario', views.api_inventario, name='api_inventario'),
    path('api/inventario/all', views.api_inventario_all, name='api_inventario_all'),
    path('api/inventario/<int:pk>', views.api_inventario_detail, name='api_inventario_detail'),

    # Páginas de Inventario
    path('inventory/general/', views.inventory_general, name='inventory_general'),
    path('inventory/projects-in-progress/', views.inventory_projects_in_progress, name='inventory_projects_in_progress'),
    path('inventory/projects-finished/', views.inventory_projects_finished, name='inventory_projects_finished'),
]

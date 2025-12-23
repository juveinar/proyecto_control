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
]


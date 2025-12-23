"""
Script para verificar datos en la base de datos
Ejecutar: python verificar_datos.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'proyecto_control.settings')
django.setup()

from control_proyectos.models import Proyecto, Evento
from django.db.models import Q

print("=" * 80)
print("VERIFICACIÓN DE DATOS EN LA BASE DE DATOS")
print("=" * 80)

# Verificar proyectos
print("\n📊 PROYECTOS:")
print("-" * 80)
total_proyectos = Proyecto.objects.count()
print(f"Total de proyectos en la base de datos: {total_proyectos}")

if total_proyectos > 0:
    # Proyectos por año
    proyectos_2024 = Proyecto.objects.filter(start__year=2024).count()
    proyectos_2023 = Proyecto.objects.filter(start__year=2023).count()
    proyectos_2025 = Proyecto.objects.filter(start__year=2025).count()
    proyectos_sin_fecha = Proyecto.objects.filter(start__isnull=True).count()

    print(f"\nProyectos por año:")
    print(f"  - 2024: {proyectos_2024}")
    print(f"  - 2023: {proyectos_2023}")
    print(f"  - 2025: {proyectos_2025}")
    print(f"  - Sin fecha de inicio: {proyectos_sin_fecha}")

    # Proyectos por estado
    print(f"\nProyectos por estado:")
    estados = Proyecto.objects.values_list('finalizado', flat=True).distinct()
    for estado in estados:
        if estado:
            count = Proyecto.objects.filter(finalizado=estado).count()
            print(f"  - {estado}: {count}")

    # Mostrar algunos ejemplos
    print(f"\nPrimeros 5 proyectos:")
    proyectos = Proyecto.objects.all()[:5]
    for p in proyectos:
        print(f"  - ID: {p.id_project}, Nombre: {p.project_name or 'N/A'}, "
              f"Fecha: {p.start or 'N/A'}, Estado: {p.finalizado or 'N/A'}")

    # Verificar campos con datos
    print(f"\nCampos con datos (primer proyecto como ejemplo):")
    if proyectos.exists():
        p = proyectos.first()
        campos_con_datos = []
        campos_sin_datos = []

        campos_principales = [
            'id_project', 'project_name', 'rf', 'project', 'project_leader',
            'finalizado', 'percent_complete', 'start', 'finish',
            'cost', 'baseline_cost', 'computo'
        ]

        for campo in campos_principales:
            valor = getattr(p, campo, None)
            if valor:
                campos_con_datos.append(campo)
            else:
                campos_sin_datos.append(campo)

        print(f"  Campos con datos: {len(campos_con_datos)}")
        print(f"  Campos sin datos: {len(campos_sin_datos)}")
        if campos_sin_datos:
            print(f"  Campos vacíos: {', '.join(campos_sin_datos[:5])}...")
else:
    print("⚠️  No hay proyectos en la base de datos.")
    print("   Ejecuta: python migrate_excel_to_mysql.py")

# Verificar eventos
print("\n\n📅 EVENTOS:")
print("-" * 80)
total_eventos = Evento.objects.count()
print(f"Total de eventos en la base de datos: {total_eventos}")

if total_eventos > 0:
    eventos = Evento.objects.all()[:5]
    print(f"\nPrimeros 5 eventos:")
    for e in eventos:
        print(f"  - ID: {e.id}, Título: {e.titulo or 'N/A'}, "
              f"Fecha: {e.fecha_inicio or 'N/A'}")
else:
    print("⚠️  No hay eventos en la base de datos.")

print("\n" + "=" * 80)
print("VERIFICACIÓN COMPLETADA")
print("=" * 80)




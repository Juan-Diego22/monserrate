from django.urls import path
from . import views

app_name = 'animals'

urlpatterns = [
    path('api/ultimo-toro/<int:animal_id>/', views.get_ultimo_toro, name='get_ultimo_toro'),
    # path('api/animals/',          views.animal_list,      name='animal_list'),
    # path('api/alertas/',          views.alertas_list,     name='alertas_list'),
    # path('api/reproducciones/',   views.crear_reproduccion, name='crear_reproduccion'),
]

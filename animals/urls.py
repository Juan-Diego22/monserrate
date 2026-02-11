from django.urls import path
from . import views

app_name = 'animals'

urlpatterns = [
    path('api/ultimo-toro/<int:animal_id>/', views.get_ultimo_toro, name='get_ultimo_toro'),
]

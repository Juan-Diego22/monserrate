from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AnimalViewSet, ReproductionViewSet
from . import views

app_name = 'animals'

router = DefaultRouter()
router.register(r'animals', AnimalViewSet)
router.register(r'reproductions', ReproductionViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('ultimo-toro/<int:animal_id>/', views.get_ultimo_toro, name='get_ultimo_toro'),
]

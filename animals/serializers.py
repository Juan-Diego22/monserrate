from rest_framework import serializers
from .models import Animal, Reproduction

class AnimalSerializer(serializers.ModelSerializer):
    # Campos adicionales para mostrar las opciones legibles
    edad_display = serializers.CharField(source='edad', read_only=True)
    ultimo_evento = serializers.SerializerMethodField()

    class Meta:
        model = Animal
        fields = '__all__' # Incluir todos los campos del modelo Animal, además de los campos adicionales

    def get_ultimo_evento(self, obj):
        # Obtener el último evento de reproducción
        ultimo = obj.reproducciones.order_by('-fecha_evento').first()
        if ultimo:
            return f"{ultimo.get_tipo_display()} - {ultimo.fecha_evento}"
        return "Sin eventos"

class ReproductionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reproduction
        fields = '__all__'
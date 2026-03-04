from django.contrib import admin
from .models import Animal, Reproduction
from django import forms
from django.core.exceptions import ValidationError
from django.urls import reverse
from django.utils.html import format_html

class ReproductionInline(admin.TabularInline):
    model = Reproduction
    extra = 0
    ordering = ('-fecha_evento',)

@admin.register(Animal)
class AnimalAdmin(admin.ModelAdmin):
    list_display = ('chapeta', 'edad', 'estado_actual', 'activa', 'ultimo_evento_display', 'acciones')
    search_fields = ('chapeta',)
    list_filter = ('estado_actual', 'activa')
    autocomplete_fields = ['madre']
    inlines = [ReproductionInline]

    def ultimo_evento_display(self, obj):
        """Obtiene el tipo y fecha del evento más reciente."""
        # Accedemos a la relación inversa definida en el modelo
        ultimo = obj.reproducciones.order_by('-fecha_evento', '-created_at').first()
        if ultimo:
            # get_tipo_display() devuelve el nombre legible (ej: 'Inseminación' en lugar de 'inseminacion')
            return f"{ultimo.get_tipo_display()} - {ultimo.fecha_evento.strftime('%d/%m/%Y')}"
        return "Sin eventos"
    
    # Configuramos el encabezado de la columna en el admin
    ultimo_evento_display.short_description = 'Último Evento'

    def get_queryset(self, request):
        """Optimizamos la consulta para mostrar el último evento sin hacer consultas adicionales por cada animal."""
        queryset = super().get_queryset(request)
        # Optimizamos la carga de las reproducciones relacionadas
        return queryset.prefetch_related('reproducciones')
    

    def acciones(self, obj):
        """Genera un enlace para ver la ficha detallada del animal."""
        # 'admin:animals_animal_change' se construye como: admin:APP_MODELO_change
        url = reverse('admin:animals_animal_change', args=[obj.pk])
        return format_html(
            '<a href="{}" style="color: #28a745; font-weight: bold; text-decoration: none;">'
            'Ver detalles'
            '</a>',
            url
        )
    
    acciones.short_description = 'Acciones'

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related('reproducciones')
    
class ReproductionAdminForm(forms.ModelForm):
    class Meta:
        model = Reproduction
        fields = "__all__"
    
    class Media:
        js = ('animals/js/reproduction_admin.js',)
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Si es un diagnóstico PRENADA, pre-llenar el toro del evento anterior
        if self.instance.pk and self.instance.tipo == 'diagnostico' and self.instance.estado == 'PRENADA':
            ultimo_evento = (
                Reproduction.objects
                .filter(
                    animal=self.instance.animal,
                    tipo__in=['inseminacion', 'monta'],
                    fecha_evento__lt=self.instance.fecha_evento
                )
                .order_by('-fecha_evento')
                .first()
            )
            if ultimo_evento and ultimo_evento.toro:
                self.fields['toro'].initial = ultimo_evento.toro
        
    def clean(self):
        """Valida las reglas de negocio para los eventos reproductivos."""
        cleaned_data = super().clean()
        tipo = cleaned_data.get('tipo')
        toro = cleaned_data.get('toro')
        estado = cleaned_data.get('estado')
        fecha_evento = cleaned_data.get('fecha_evento')
        animal = cleaned_data.get('animal')

        if tipo in ('inseminacion', 'monta'):
            if not toro:
                raise ValidationError("El campo 'toro' es obligatorio para los tipos 'inseminacion' y 'monta natural'.")
        
        # Para diagnósticos: permitir toro solo si es PRENADA, no si es VACIA
        elif tipo == 'diagnostico':
            if estado == 'VACIA' and toro:
                raise ValidationError("No se debe ingresar el toro cuando el diagnóstico es 'Vacía'.")
            if estado == 'PRENADA' and not toro:
                raise ValidationError("El campo 'toro' es obligatorio cuando el diagnóstico es 'Preñada'.")
        
        if tipo != 'diagnostico' and estado:
            raise ValidationError("El campo 'estado' solo se puede usar cuando el tipo es 'diagnostico'.")
        

        # ---- EDAD MÍNIMA PARA SERVICIO (15 MESES) ----
        if tipo in ('inseminacion', 'monta') and animal and fecha_evento:
            # Calculamos la edad exacta al momento del evento
            dias_edad = (fecha_evento - animal.fecha_nacimiento).days
            # 15 meses son aproximadamente 456 días (30.4 días por mes)
            meses_edad = dias_edad / 30.41
            
            if meses_edad < 15:
                raise ValidationError(
                    f"No se puede registrar una {tipo} para este animal. "
                    f"La edad al momento del evento sería de {int(meses_edad)} meses, "
                    f"y la edad mínima permitida en Monserrate es de 15 meses."
                )

        # ---- VALIDACIÓN DE ESTADO: NO PERMITIR SERVICIO A TERNERAS ----
        if tipo in ('inseminacion', 'monta') and animal:
            if animal.estado_actual == 'TERNERA':
                raise ValidationError(
                    f"Error de consistencia: El animal {animal.chapeta} figura como 'TERNERA'. "
                    "No se puede registrar un evento reproductivo para una ternera. "
                    "Primero debe alcanzar el estado de 'NOVILLA'."
                )    

        # ---- NUEVA VALIDACIÓN: 30 DÍAS ----
        if tipo == 'diagnostico':
            ultimo_evento = (
                Reproduction.objects
                .filter(
                    animal=animal,
                    tipo__in=['inseminacion', 'monta'],
                    fecha_evento__lt=fecha_evento
                )
                .order_by('-fecha_evento')
                .first()
            )

            if not ultimo_evento:
                raise ValidationError(
                    "No se puede registrar un diagnóstico sin un evento reproductivo previo."
                )

            dias_transcurridos = (fecha_evento - ultimo_evento.fecha_evento).days

            if dias_transcurridos < 30:
                raise ValidationError(
                    f"El diagnóstico solo se puede realizar después de 30 días. "
                    f"Han pasado solo {dias_transcurridos} días."
                )

        #---- VALIDACIÓN DE PARTO: MÍNIMO 260 DÍAS DESDE EL ÚLTIMO SERVICIO ----
        if tipo == 'parto':
            ultimo_servicio = (
                Reproduction.objects
                .filter(animal=animal, tipo__in=['inseminacion', 'monta'], fecha_evento__lt=fecha_evento)
                .order_by('-fecha_evento').first()
            )
            if ultimo_servicio:
                gestacion_dias = (fecha_evento - ultimo_servicio.fecha_evento).days
                # Una gestación bovina dura aprox 280 días. 
                # Validemos un rango lógico (ej. no menos de 260 días)
                if gestacion_dias < 260:
                    raise ValidationError(
                        f"Fecha de parto inconsistente. Solo han pasado {gestacion_dias} días desde el servicio."
                    )

        if tipo == 'secado' and animal:
            # Solo se puede secar una vaca que está actualmente en producción
            if animal.estado_actual != 'VACA_PRODUCCION':
                raise ValidationError(
                    f"No se puede secar a {animal.chapeta}. "
                    f"Su estado actual es {animal.get_estado_actual_display()}, "
                    "y solo se pueden secar vacas en producción."
                )                

        return cleaned_data
        
@admin.register(Reproduction)
class ReproductionAdmin(admin.ModelAdmin):
    form = ReproductionAdminForm
    list_display = ('animal', 'fecha_evento', 'tipo', 'estado', 'toro')
    list_filter = ('tipo', 'estado')
    search_fields = ('animal__chapeta', 'toro')
    autocomplete_fields = ['animal']

    

        



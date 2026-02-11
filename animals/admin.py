from django.contrib import admin
from .models import Animal, Reproduction
from django import forms
from django.core.exceptions import ValidationError
from django.utils.html import format_html
from django.utils.safestring import mark_safe

class ReproductionInline(admin.TabularInline):
    model = Reproduction
    extra = 0
    ordering = ('-fecha_evento',)

@admin.register(Animal)
class AnimalAdmin(admin.ModelAdmin):
    list_display = ('chapeta', 'estado_actual', 'activa', 'alerta_secado')
    search_fields = ('chapeta',)
    list_filter = ('estado_actual', 'activa')
    autocomplete_fields = ['madre']
    inlines = [ReproductionInline]

    @admin.display(description="Alerta secado", ordering=False)
    def alerta_secado(self, obj):
        alerta = obj.alerta_proxima_a_secar()

        if alerta is True:
            return mark_safe('<span style="color: orange; font-weight: bold;">⚠ Próxima a secar</span>')

        if alerta is False:
            return mark_safe('<span style="color: green;">✔ En tiempo</span>')

        return "-"

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

        return cleaned_data
        
@admin.register(Reproduction)
class ReproductionAdmin(admin.ModelAdmin):
    form = ReproductionAdminForm
    list_display = ('animal', 'fecha_evento', 'tipo', 'estado', 'toro')
    list_filter = ('tipo', 'estado')
    search_fields = ('animal__chapeta', 'toro')
    autocomplete_fields = ['animal']

    

        



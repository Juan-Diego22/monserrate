from django.contrib import admin
from .models import Animal, Reproduction
from django import forms
from django.core.exceptions import ValidationError

class ReproductionInline(admin.TabularInline):
    model = Reproduction
    extra = 0
    ordering = ('-fecha_evento',)

@admin.register(Animal)
class AnimalAdmin(admin.ModelAdmin):
    list_display = ('chapeta', 'estado_actual', 'activa')
    search_fields = ('chapeta',)
    list_filter = ('estado_actual', 'activa')
    autocomplete_fields = ['madre']
    inlines = [ReproductionInline]

class ReproductionAdminForm(forms.ModelForm):
    class Meta:
        model = Reproduction
        fields = "__all__"
        
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
        elif tipo == 'diagnostico' and toro:
            raise ValidationError("No se debe ingresar el campo 'toro' cuando el tipo es 'diagnostico'.")
        
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

    

        



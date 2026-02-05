from django.contrib import admin
from .models import Animal, Reproduction

class ReproductionInline(admin.TabularInline):
    model = Reproduction
    extra = 1
    autocomplete_fields = ['animal']

@admin.register(Animal)
class AnimalAdmin(admin.ModelAdmin):
    list_display = ('chapeta', 'estado_actual', 'activa')
    search_fields = ('chapeta',)
    list_filter = ('estado_actual', 'activa')
    autocomplete_fields = ['madre']
    inlines = [ReproductionInline]


@admin.register(Reproduction)
class ReproductionAdmin(admin.ModelAdmin):
    list_display = ('animal', 'fecha_evento', 'estado', 'toro')
    list_filter = ('estado',)
    search_fields = ('animal__chapeta', 'toro')
    autocomplete_fields = ['animal']
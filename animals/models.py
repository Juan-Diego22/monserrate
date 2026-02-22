from django.db import models
from django.utils import timezone
from datetime import timedelta, date
from django.core.exceptions import ValidationError




class Animal(models.Model):

    SEXO_CHOICES = [
        ('HEMBRA', 'Hembra'),
        ('MACHO', 'Macho'),
    ]

    ESTADO_CHOICES = [
        ('TERNERA', 'Ternera'),
        ('NOVILLA', 'Novilla'),
        ('VACA_PRODUCCION', 'Vaca en producción'),
        ('SECA', 'Vaca seca'),
        ('DESCARTADA', 'Descartada'),
    ]

    chapeta = models.CharField(
        max_length=20,
        unique=True
    )

    fecha_nacimiento = models.DateField()

    sexo = models.CharField(
        max_length=10,
        choices=SEXO_CHOICES,
        default='HEMBRA'
    )

    madre = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='crias'
    )

    padre_nombre = models.CharField(
        max_length=100,
        help_text="Nombre del toro (finca o inseminación)"
    )

    estado_actual = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='TERNERA'
    )

    activa = models.BooleanField(default=True)

    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Chapeta {self.chapeta}"

    def update_estado_by_age(self):
        """Actualiza el estado a NOVILLA si ha pasado 365 días desde nacimiento y está en TERNERA."""
        if self.estado_actual == 'TERNERA':
            dias_desde_nacimiento = (timezone.now().date() - self.fecha_nacimiento).days
            if dias_desde_nacimiento >= 365:
                self.estado_actual = 'NOVILLA'

    def save(self, *args, **kwargs):
        """Verifica y actualiza el estado según la edad antes de guardar."""
        self.update_estado_by_age()
        super().save(*args, **kwargs)

    def ultima_inseminacion_o_monta(self):
        """Retorna la última reproducción de tipo inseminación o monta."""
        return (
            self.reproducciones
            .filter(tipo__in=['inseminacion', 'monta'])
            .order_by('-fecha_evento')
            .first()
        )
    
    def ultimo_parto(self):
        return self.reproducciones.filter(
            tipo='parto'
        ).order_by('-fecha_evento').first()

    
    def diagnostico_mas_reciente(self):
        """Retorna el diagnóstico más reciente."""
        return (
            self.reproducciones
            .filter(tipo='diagnostico')
            .order_by('-fecha_evento')
            .first()
        )

    def esta_prenada(self):
        """Determina si está preñada considerando el historial completo."""
        ultimo_evento = self.reproducciones.order_by('-fecha_evento', '-created_at').first()
    
        if not ultimo_evento:
            return False
        
        # Si lo último fue un parto, ya no está preñada
        if ultimo_evento.tipo == 'parto':
            return False
            
        # Solo está preñada si el último diagnóstico así lo dice
        # Y no ha habido un parto posterior (implícito en el order_by)
        diagnostico = self.diagnostico_mas_reciente()
        return diagnostico.estado == "PRENADA" if diagnostico else False
    
    def fecha_inicio_prenez(self):
        """Calcula la fecha de inicio de la preñez basada en la última inseminación o monta."""
        if not self.esta_prenada():
            return None

        evento = self.ultima_inseminacion_o_monta()
        return evento.fecha_evento if evento else None

    
    def clean(self):
        """Valida que no se pueda cambiar el estado de una vaca en producción a estados anteriores."""
        if not self.pk:
            return  # 👈 si es nuevo, no validamos transición

        animal_bd = Animal.objects.get(pk=self.pk)

        estados_bloqueados = ['TERNERA', 'NOVILLA']

        if animal_bd.estado_actual == 'VACA_PRODUCCION' and self.estado_actual in estados_bloqueados:
            raise ValidationError(
                "Una vaca en producción no puede volver a Ternera o Novilla."
            )

    def edad(self):
        """Calcula la edad del animal en años y meses."""
        hoy = date.today()

        if not self.fecha_nacimiento:
            return "-"

        años = hoy.year - self.fecha_nacimiento.year
        meses = hoy.month - self.fecha_nacimiento.month

        if meses < 0:
            años -= 1
            meses += 12

        return f"{años}a {meses}m"
    
    edad.short_description = "Edad"
        

class Reproduction(models.Model):

    TIPO_CHOICES = [
        ('inseminacion', 'Inseminación'),
        ('monta', 'Monta natural'),
        ('diagnostico', 'Diagnóstico'),
        ('parto', 'Parto'),
    ]

    SEXO_CHOICES = [
    ('hembra', 'Hembra'),
    ('macho', 'Macho'),
    ]

    ESTADO_CHOICES = [
        ('PRENADA', 'Preñada'),
        ('VACIA', 'Vacía'),
    ]

    animal = models.ForeignKey(
        Animal,
        on_delete=models.CASCADE,
        related_name='reproducciones'
    )

    fecha_evento = models.DateField(default=timezone.now)

    tipo = models.CharField(
        max_length=50,
        choices=TIPO_CHOICES,
        default='inseminacion'
    )

    sexo_cria = models.CharField(
    max_length=10,
    choices=SEXO_CHOICES,
    null=True,
    blank=True
    )


    toro = models.CharField(
        max_length=100,
        help_text="Nombre del toro (finca o inseminación)",
        blank=True,
        null=True
    )

    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        blank=True,
        null=True
    )

    observaciones = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.animal.chapeta} - {self.fecha_evento}"

    def clean(self):
        """Validaciones personalizadas según el tipo de evento."""
        super().clean()

        # ✅ PARTO requiere sexo de cría
        if self.tipo == 'parto' and not self.sexo_cria:
            raise ValidationError("Debe indicar el sexo de la cría.")

        # ✅ Solo ciertos estados permiten parto
        if self.tipo == 'parto':

            estados_validos = ['NOVILLA', 'SECA']

            if self.animal.estado_actual not in estados_validos:
                raise ValidationError(
                    f"No se puede registrar parto en estado {self.animal.estado_actual}."
                )
        
        #✅ Validación específica para PARTO: no debe tener toro ni estado
        if self.tipo == 'parto':
            if self.toro:
                raise ValidationError("No debe indicar toro en un parto.")

            if self.estado:
                raise ValidationError("No debe indicar estado en un parto.")


    def save(self, *args, **kwargs):
        """Lógica de transición de estados automática al guardar."""
        super().save(*args, **kwargs)

        animal = self.animal
        if self.tipo == 'parto':
            animal.estado_actual = 'VACA_PRODUCCION'
            animal.save()
        elif self.tipo == 'diagnostico' and self.estado == 'VACIA':
            # Si estaba en producción, sigue ahí, pero si era novilla 
            # y falla preñez, sigue siendo novilla. No requiere cambio.
            pass

from django.db import models
from django.utils import timezone



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
    


class Reproduction(models.Model):

    TIPO_CHOICES = [
        ('inseminacion', 'Inseminación'),
        ('monta', 'Monta natural'),
        ('diagnostico', 'Diagnóstico'),
    ]

    ESTADO_CHOICES = [
        ('PRENADA', 'Preñada'),
        ('VACIA', 'Vacía'),
        ('OBSERVACION', 'Observación'),
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

    toro = models.CharField(
        max_length=100,
        help_text="Nombre del toro (finca o inseminación)"
    )

    estado = models.CharField(
        max_length=15,
        choices=ESTADO_CHOICES
    )

    observaciones = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.animal.chapeta} - {self.fecha_evento}"

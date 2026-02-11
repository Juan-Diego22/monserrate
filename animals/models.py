from django.db import models
from django.utils import timezone
from datetime import timedelta



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
    
    def diagnostico_mas_reciente(self):
        """Retorna el diagnóstico más reciente."""
        return (
            self.reproducciones
            .filter(tipo='diagnostico')
            .order_by('-fecha_evento')
            .first()
        )

    def esta_prenada(self):
        """Determina si el animal está preñado basado en el diagnóstico más reciente."""
        diagnostico = self.diagnostico_mas_reciente()

        if not diagnostico:
            return None  # No se puede determinar

        return diagnostico.estado == "PRENADA"
    
    def fecha_inicio_prenez(self):
        """Calcula la fecha de inicio de la preñez basada en la última inseminación o monta."""
        if not self.esta_prenada():
            return None

        evento = self.ultima_inseminacion_o_monta()
        return evento.fecha_evento if evento else None
    
    def fecha_maxima_produccion(self):
        """Calcula la fecha máxima de producción (fecha de parto aproximada)."""
        inicio = self.fecha_inicio_prenez()
        if not inicio:
            return None

        return inicio + timedelta(days=210)  # ~7 meses
    
    def alerta_proxima_seca(self):
        """Determina si el animal está cerca de ser seca."""
        fecha_limite = self.fecha_maxima_produccion()
        if not fecha_limite:
            return False

        hoy = timezone.now().date()
        return fecha_limite - timedelta(days=10) <= hoy < fecha_limite

    def alerta_proxima_a_secar(self):
        # 1. Debe estar preñada
        if self.esta_prenada() is not True:
            return None

        # 2. Debe estar en producción
        if self.estado_actual != 'VACA_PRODUCCION':
            return None

        # 3. Debe existir inseminación o monta
        evento = self.ultima_inseminacion_o_monta()
        if not evento:
            return None

        fecha_evento = evento.fecha_evento
        hoy = timezone.now().date()

        dias_transcurridos = (hoy - fecha_evento).days

        # 7 meses ≈ 210 días
        # alerta desde día 200
        return dias_transcurridos >= 200


class Reproduction(models.Model):

    TIPO_CHOICES = [
        ('inseminacion', 'Inseminación'),
        ('monta', 'Monta natural'),
        ('diagnostico', 'Diagnóstico'),
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

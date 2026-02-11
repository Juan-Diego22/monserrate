from django.shortcuts import render
from django.http import JsonResponse
from .models import Reproduction

def get_ultimo_toro(request, animal_id):
    """Retorna el toro del último evento de inseminación o monta para un animal."""
    try:
        ultimo_evento = (
            Reproduction.objects
            .filter(
                animal_id=animal_id,
                tipo__in=['inseminacion', 'monta']
            )
            .order_by('-fecha_evento')
            .first()
        )
        
        if ultimo_evento and ultimo_evento.toro:
            return JsonResponse({'toro': ultimo_evento.toro})
        else:
            return JsonResponse({'toro': None, 'error': 'No hay evento anterior'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

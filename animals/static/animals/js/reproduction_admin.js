(function() {
    function fillToroField() {
        const estadoField = document.getElementById('id_estado');
        const toroField = document.getElementById('id_toro');
        const tipoField = document.getElementById('id_tipo');
        const animalField = document.getElementById('id_animal');
        
        if (!estadoField || !toroField || !tipoField) return;
        
        // Escuchar cambios en el campo "estado"
        estadoField.addEventListener('change', function() {
            const estado = this.value;
            const tipo = tipoField.value;
            const animalId = animalField.value;
            
            if (tipo === 'diagnostico' && estado === 'PRENADA' && animalId) {
                // Obtener el toro del último evento
                fetch(`/animals/api/ultimo-toro/${animalId}/`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.toro) {
                            toroField.value = data.toro;
                        }
                    })
                    .catch(error => console.error('Error:', error));
            } else if (tipo === 'diagnostico' && estado === 'VACIA') {
                // Limpiar el campo toro si es VACIA
                toroField.value = '';
            }
        });
        
        // Escuchar cambios en el campo "tipo" para resetear si cambia
        tipoField.addEventListener('change', function() {
            if (this.value !== 'diagnostico') {
                toroField.value = '';
            }
        });
    }
    
    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fillToroField);
    } else {
        fillToroField();
    }
})();

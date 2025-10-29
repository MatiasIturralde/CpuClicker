document.addEventListener('DOMContentLoaded', () => {
    // Seleccionar los botones que abren las modales
    const btnEstadisticas = document.getElementById('btn-estadisticas');
    const btnGaleria = document.getElementById('btn-galeria');
    const btnAyuda = document.getElementById('btn-ayuda');
    const btnConfiguracion = document.getElementById('btn-configuracion');

    // Seleccionar las cards modales y sus botones de cierre
    const modalEstadisticas = document.getElementById('modal-estadisticas');
    const modalGaleria = document.getElementById('modal-galeria');
    const modalAyuda = document.getElementById('modal-ayuda');
    const modalConfiguracion = document.getElementById('modal-configuracion');

    const closeButtons = document.querySelectorAll('.close-btn');

    // Mapear botones a sus modales correspondientes
    const modalMap = {
        'btn-estadisticas': modalEstadisticas,
        'btn-galeria': modalGaleria,
        'btn-ayuda': modalAyuda,
        'btn-configuracion': modalConfiguracion
    };

    /**
     * Función para mostrar una modal específica
     * @param {HTMLElement} modalToShow La modal que se debe mostrar.
     */
    function showModal(modalToShow) {
        // Ocultar cualquier modal que esté visible
        document.querySelectorAll('.modal-card').forEach(modal => {
            modal.classList.remove('visible');
            modal.classList.add('hidden');
        });

        // Mostrar la modal seleccionada
        if (modalToShow) {
            modalToShow.classList.remove('hidden');
            modalToShow.classList.add('visible');
        }
    }

    /**
     * Función para ocultar una modal específica
     * @param {HTMLElement} modalToHide La modal que se debe ocultar.
     */
    function hideModal(modalToHide) {
        modalToHide.classList.remove('visible');
        modalToHide.classList.add('hidden');
    }

    // Agregar listeners a los botones de la interfaz principal
    btnEstadisticas.addEventListener('click', () => showModal(modalMap['btn-estadisticas']));
    btnGaleria.addEventListener('click', () => showModal(modalMap['btn-galeria']));
    btnAyuda.addEventListener('click', () => showModal(modalMap['btn-ayuda']));
    btnConfiguracion.addEventListener('click', () => showModal(modalMap['btn-configuracion']));

    // Agregar listeners a los botones de cierre
    closeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const modal = event.target.closest('.modal-card');
            if (modal) {
                hideModal(modal);
            }
        });
    });

    // Ocultar modal al hacer clic fuera de ella
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal-card')) {
            hideModal(event.target);
        }
    });
});
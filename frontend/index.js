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

    // --- Nuevas interacciones: login / register / ranking ---
    const btnLogin = document.getElementById('btn-login');
    const btnRegister = document.getElementById('btn-register');
    const modalLogin = document.getElementById('modal-login');
    const modalRegister = document.getElementById('modal-register');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');
    const loginMessage = document.getElementById('login-message');
    const regMessage = document.getElementById('reg-message');

    // Mapear nuevos botones
    modalMap['btn-login'] = modalLogin;
    modalMap['btn-register'] = modalRegister;

    btnLogin && btnLogin.addEventListener('click', () => showModal(modalLogin));
    btnRegister && btnRegister.addEventListener('click', () => showModal(modalRegister));

    // API base (ajustar si necesitas otra ruta)
    const API_BASE = './backend/api.php';

    // Helper: fetch JSON
    async function apiPost(action, payload) {
        const url = `${API_BASE}?action=${action}`;
        try {
            const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const contentType = resp.headers.get('content-type') || '';
            const text = await resp.text();
            // Si viene JSON, parsearlo; si no, devolver texto como mensaje
            if (contentType.indexOf('application/json') !== -1) {
                try {
                    return JSON.parse(text);
                } catch (e) {
                    return { success: false, message: 'Respuesta JSON inválida', raw: text };
                }
            }

            // No es JSON (posible error PHP/HTML) -> devolver como mensaje para debug/usuario
            return { success: false, message: text };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }

    // Manejar registro
    if (formRegister) {
        formRegister.addEventListener('submit', async (e) => {
            e.preventDefault();
            regMessage.textContent = '';
            const nombre = document.getElementById('reg-nombre').value.trim();
            const password = document.getElementById('reg-password').value;
            if (!nombre || !password) {
                regMessage.style.color = 'red';
                regMessage.textContent = 'Completa todos los campos';
                return;
            }
                try {
                    const res = await apiPost('register', { nombre, password });
                    if (res && res.success) {
                        regMessage.style.color = 'green';
                        regMessage.textContent = 'Usuario creado correctamente';
                        // set local user info (auto-login minimal)
                        const userObj = { id: res.id || null, nombre: nombre, clicks: 0, nivel: 1 };
                        localStorage.setItem('usuario', JSON.stringify(userObj));
                        // actualizar UI inmediatamente sin refrescar
                        const userDisplay = document.getElementById('user-display');
                        const clicksEl = document.getElementById('clicks-display');
                        if (userDisplay) userDisplay.textContent = nombre;
                        if (clicksEl) clicksEl.textContent = 0;
                        // actualizar imagen/nombre principal
                        loadCpuStatus();
                        setTimeout(() => {
                            hideModal(modalRegister);
                        }, 900);
                    } else {
                        regMessage.style.color = 'red';
                        // Mostrar mensaje limpio (si es HTML, recortar etiquetas)
                        const msg = res && res.message ? String(res.message).trim() : 'Error al crear usuario';
                        regMessage.textContent = msg.replace(/<[^>]*>/g, '').slice(0, 800);
                    }
                } catch (err) {
                    regMessage.style.color = 'red';
                    regMessage.textContent = err.message || 'Error al crear usuario';
                }
        });
    }

    // Manejar login
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            loginMessage.textContent = '';
            const nombre = document.getElementById('login-nombre').value.trim();
            const password = document.getElementById('login-password').value;
            if (!nombre || !password) {
                loginMessage.style.color = 'red';
                loginMessage.textContent = 'Completa todos los campos';
                return;
            }
                try {
                    const res = await apiPost('login', { nombre, password });
                    if (res && res.success) {
                        loginMessage.style.color = 'green';
                        loginMessage.textContent = 'Bienvenido ' + res.user.nombre;
                        // Guardar sesión mínima en localStorage
                        localStorage.setItem('usuario', JSON.stringify(res.user));
                        // actualizar UI inmediatamente sin refrescar
                        const userDisplay = document.getElementById('user-display');
                        const clicksEl = document.getElementById('clicks-display');
                        if (userDisplay) userDisplay.textContent = res.user.nombre;
                        if (clicksEl && typeof res.user.clicks !== 'undefined') clicksEl.textContent = res.user.clicks;
                        // actualizar imagen/nombre principal
                        loadCpuStatus();
                        setTimeout(() => hideModal(modalLogin), 800);
                    } else {
                        loginMessage.style.color = 'red';
                        const msg = res && res.message ? String(res.message).trim() : 'Error en el login';
                        loginMessage.textContent = msg.replace(/<[^>]*>/g, '').slice(0, 800);
                    }
                } catch (err) {
                    loginMessage.style.color = 'red';
                    loginMessage.textContent = err.message || 'Error en el login';
                }
        });
    }

        // On load, populate user display if exists
        (function initUserDisplay(){
            const user = JSON.parse(localStorage.getItem('usuario') || 'null');
            const el = document.getElementById('user-display');
            if (user && el) {
                el.textContent = user.nombre || 'Invitado';
            }
        })();

        // Inicializar clicks y posible imagen de CPU
        (function initUserStats(){
            const user = JSON.parse(localStorage.getItem('usuario') || 'null');
            const clicksEl = document.getElementById('clicks-display');
            const cpuNameEl = document.querySelector('.cpu-name');
            const cpuIconEl = document.querySelector('.cpu-icon');
            if (user) {
                if (clicksEl) clicksEl.textContent = user.clicks ?? 0;
                if (cpuNameEl && user.cpuActual) cpuNameEl.textContent = user.cpuActual;
                if (cpuIconEl && user.imagen) cpuIconEl.src = user.imagen;
            }

            // Handler del botón principal de click
            const cpuButton = document.getElementById('cpu-button');
            if (cpuButton) {
                cpuButton.addEventListener('click', async () => {
                    // incrementar contador en UI
                    const current = parseInt((clicksEl && clicksEl.textContent) || '0', 10) || 0;
                    const next = current + 1;
                    if (clicksEl) clicksEl.textContent = next;

                    // si hay usuario logueado, sincronizar con backend
                    const stored = JSON.parse(localStorage.getItem('usuario') || 'null');
                    if (stored && stored.id) {
                        try {
                            const res = await apiPost('updateClicks', { id: stored.id, clicks: next });
                            if (res && res.success && res.user) {
                                // actualizar localStorage y UI
                                localStorage.setItem('usuario', JSON.stringify(res.user));
                                if (clicksEl) clicksEl.textContent = res.user.clicks;
                                const userDisplay = document.getElementById('user-display');
                                if (userDisplay) userDisplay.textContent = res.user.nombre;
                                // actualizar imagen/CPU si llegaron
                                if (res.user.imagen && cpuIconEl) cpuIconEl.src = res.user.imagen;
                                if (res.user.cpuActual && cpuNameEl) cpuNameEl.textContent = res.user.cpuActual;
                                // actualizar estados de CPU en UI sin refrescar
                                loadCpuStatus();
                            }
                        } catch (err) {
                            console.error('Error actualizando clicks', err);
                        }
                    }
                });
            }
        })();

    // Ranking: obtener y poblar tabla
    async function fetchRanking() {
        const url = `${API_BASE}?action=ranking`;
        try {
            const resp = await fetch(url);
            const data = await resp.json();
            if (data.success) {
                populateRanking(data.data || []);
            }
        } catch (err) {
            console.error('Error al obtener ranking', err);
        }
    }

    function populateRanking(rows) {
        const tbody = document.querySelector('#ranking-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        rows.forEach((r, i) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding:6px; border-bottom:1px solid #eee">${i + 1}</td>
                <td style="padding:6px; border-bottom:1px solid #eee">${escapeHtml(r.nombre)}</td>
                <td style="padding:6px; border-bottom:1px solid #eee">${r.clicks}</td>
                <td style="padding:6px; border-bottom:1px solid #eee">${r.nivel}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Refresh button
    const btnRefresh = document.getElementById('btn-refresh-ranking');
    btnRefresh && btnRefresh.addEventListener('click', fetchRanking);

    // Cuando se abra la modal de clasificación, obtener datos
    const originalShowModal = showModal;
    // decorador simple: si abrimos la modal de ayuda, cargamos ranking
    window.showModal = function (modalToShow) {
        originalShowModal(modalToShow);
        if (modalToShow && modalToShow.id === 'modal-ayuda') {
            fetchRanking();
        }
    };

    // pequeño escapado para evitar inyección en la tabla
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Si quieres, podemos mostrar información del usuario en la modal de estadísticas
    function mostrarUsuarioEnEstadisticas() {
        const user = JSON.parse(localStorage.getItem('usuario') || 'null');
        if (!user) return;
        const main = modalEstadisticas.querySelector('.modal-body');
        if (!main) return;
        main.innerHTML = `\
            <h2>Estadisticas del usuario</h2>\
            <p>Nombre usuario: ${escapeHtml(user.nombre)}</p>\
            <p>Número de clicks totales: ${user.clicks}</p>\
            <p>Nivel: ${1 + Math.floor((user.clicks||0)/100)}</p>\
            `;
    }

    // Cuando abramos estadísticas, actualizar si hay usuario
    const origShow = window.showModal;
    window.showModal = function (modalToShow) {
        if (modalToShow && modalToShow.id === 'modal-estadisticas') {
            mostrarUsuarioEnEstadisticas();
        }
        origShow(modalToShow);
    };

    // Asegurar que las llamadas locales a showModal usen la versión envuelta
    showModal = window.showModal;

    // --- SISTEMA DE CPUs DESBLOQUEABLES ---
    const CLICKS_PER_CPU = 250;

    // Cargar estado de CPUs cuando se abre la galería
    function loadCpuStatus() {
        const user = JSON.parse(localStorage.getItem('usuario') || 'null');
        const userClicks = user ? (user.clicks || 0) : 0;
        const currentCpuId = Math.min(1 + Math.floor(userClicks / CLICKS_PER_CPU), 20);

        // Actualizar tarjetas de CPU con estado de "Obtenido"
        const cpuCards = document.querySelectorAll('.cpu-card');
        cpuCards.forEach((card, idx) => {
            const cpuNum = idx + 1;
            const isUnlocked = cpuNum <= currentCpuId;
            let statusEl = card.querySelector('.cpu-status');

            if (statusEl) {
                statusEl.textContent = isUnlocked ? '✅ Obtenido' : '❌ Bloqueado';
                statusEl.style.color = isUnlocked ? '#4ade80' : '#ef4444';
            } else {
                const newStatusEl = document.createElement('div');
                newStatusEl.className = 'cpu-status';
                newStatusEl.textContent = isUnlocked ? '✅ Obtenido' : '❌ Bloqueado';
                newStatusEl.style.color = isUnlocked ? '#4ade80' : '#ef4444';
                newStatusEl.style.fontSize = '0.65rem';
                newStatusEl.style.marginTop = '4px';
                newStatusEl.style.fontWeight = 'bold';
                const infoBox = card.querySelector('.cpu-info-box');
                if (infoBox) infoBox.appendChild(newStatusEl);
            }

            // Cambiar opacidad si no está desbloqueado
            card.style.opacity = isUnlocked ? '1' : '0.5';
            card.style.filter = isUnlocked ? 'grayscale(0%)' : 'grayscale(100%)';
        });

        // Sincronizar imagen y nombre del CPU principal con el actual del usuario
        const cpuNameEl = document.querySelector('.cpu-name');
        const cpuIconEl = document.querySelector('.cpu-icon');
        // Intentar usar el nombre y la imagen de la tarjeta correspondiente si existe
        const allCards = document.querySelectorAll('.cpu-card');
        const selectedCard = allCards[currentCpuId - 1];
        let mainName = 'CPU ' + currentCpuId;
        let mainImgSrc = './backend/Recursos/Imagenes-CPUs/CPU-' + currentCpuId + '.png';
        if (selectedCard) {
            const cardNameEl = selectedCard.querySelector('.cpu-card-name');
            const cardImgEl = selectedCard.querySelector('.cpu-card-img');
            if (cardNameEl && cardNameEl.textContent.trim()) mainName = cardNameEl.textContent.trim();
            if (cardImgEl && cardImgEl.src) mainImgSrc = cardImgEl.src;
        }
        if (cpuNameEl) cpuNameEl.textContent = mainName;
        if (cpuIconEl) cpuIconEl.src = mainImgSrc;
    }

    // Llamar a loadCpuStatus cuando se abre la galería
    const btnGaleriaEl = document.getElementById('btn-galeria');
    if (btnGaleriaEl) {
        btnGaleriaEl.addEventListener('click', () => {
            setTimeout(() => loadCpuStatus(), 100);
        });
    }

    // Inicializar CPU status al cargar la página
    loadCpuStatus();

});
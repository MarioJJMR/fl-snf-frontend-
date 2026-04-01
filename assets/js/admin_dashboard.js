/**
 * FUNDACIÓN LOYOLA - PANEL DE ADMINISTRADOR
 * admin-dashboard.js
 * Versión: 2.0
 */

// ============================================
// MÓDULO DE ADMINISTRACIÓN
// ============================================
const AdminModule = {
    _obras: [],

    /**
     * Inicialización del panel de administrador
     */
    init: () => {
        Utils.log('🔧 Iniciando panel de administrador');
        
        // Mostrar sección predeterminada
        AdminModule.showSection('obras');
        
        // Cargar obras registradas
        AdminModule.cargarObras();
        
        // Configurar event listeners
        AdminModule.setupEventListeners();
        
        Utils.log('✅ Panel de administrador listo');
    },

    /**
     * Configura los event listeners
     */
    setupEventListeners: () => {
        // Botón para mostrar formulario de registro de usuario
        const btnUsuario = Utils.getElement('btnMostrarRegistroUsuario');
        if (btnUsuario) {
            btnUsuario.addEventListener('click', () => {
                AdminModule.toggleForm('formRegistroUsuario', 'formRegistroObra');
            });
        }

        // Botón para mostrar formulario de registro de obra
        const btnObra = Utils.getElement('btnMostrarRegistroObra');
        if (btnObra) {
            btnObra.addEventListener('click', () => {
                AdminModule.toggleForm('formRegistroObra', 'formRegistroUsuario');
            });
        }

        // Formulario de registro de usuario
        const formUsuario = Utils.getElement('formRegistroUsuario');
        if (formUsuario) {
            formUsuario.addEventListener('submit', (e) => {
                e.preventDefault();
                AdminModule.registrarUsuario();
            });
        }

        // Formulario de registro de obra
        const formObra = Utils.getElement('formRegistroObra');
        if (formObra) {
            formObra.addEventListener('submit', (e) => {
                e.preventDefault();
                AdminModule.registrarObra();
            });
        }
    },

    /**
     * Alterna la visibilidad de formularios
     */
    toggleForm: (showFormId, hideFormId) => {
        const showForm = Utils.getElement(showFormId);
        const hideForm = Utils.getElement(hideFormId);
        
        if (showForm) {
            showForm.classList.toggle('hidden');
        }
        if (hideForm) {
            hideForm.classList.add('hidden');
        }
    },

    /**
     * Muestra una sección específica del panel
     */
    showSection: (sectionId) => {
        Utils.log(`📍 Admin - Navegando a: ${sectionId}`);
        
        // Ocultar todas las secciones
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.classList.add('hidden');
        });

        // Mostrar la sección seleccionada
        const section = Utils.getElement(sectionId);
        if (section) {
            section.classList.remove('hidden');
        } else {
            Utils.log(`❌ Sección no encontrada: ${sectionId}`);
        }
    },

    /**
     * Carga y muestra las obras registradas
     */
    cargarObras: async () => {
        const container = Utils.getElement('botonesObras');
        if (!container) return;
        container.innerHTML = '<p>Cargando obras...</p>';
        try {
            const obras = await API.obras.getAll();
            AdminModule._obras = obras;

            // Update stats
            const statObras = document.getElementById('stat-obras');
            if (statObras) statObras.textContent = obras.length;

            if (!obras.length) {
                container.innerHTML = '<p>No hay obras registradas.</p>';
                return;
            }
            container.innerHTML = '';
            obras.forEach((obra, index) => {
                const btn = document.createElement('button');
                btn.className = 'obra-btn';
                btn.style.cssText = 'min-width:250px;padding:1rem;margin:.5rem;cursor:pointer;';
                btn.textContent = obra.nombre_obra || obra.nombreObra || `Obra ${index + 1}`;
                btn.onclick = () => AdminModule.verDetallesObra(obra, index);
                container.appendChild(btn);
            });
        } catch (err) {
            container.innerHTML = `<p style="color:red">Error: ${err.message}</p>`;
        }
    },

    /**
     * Muestra detalles de una obra seleccionada
     */
    verDetallesObra: (obra, index) => {
        let detalles = document.getElementById('detallesObra');
        if (!detalles) {
            detalles = document.createElement('div');
            detalles.id = 'detallesObra';
            document.querySelector('.main-content, main, .content')?.appendChild(detalles);
        }
        detalles.innerHTML = `
            <div style="background:#fff;border:1px solid #ddd;border-radius:8px;padding:1.5rem;margin-top:1rem;">
                <h3>${obra.nombre_obra || obra.nombreObra || 'Sin nombre'}</h3>
                <p><strong>Dirección:</strong> ${obra.direccion || obra.direccionObra || '-'}</p>
                <p><strong>Teléfono:</strong> ${obra.telefono || obra.telefonoObra || '-'}</p>
                <p><strong>Correo:</strong> ${obra.correo || '-'}</p>
                <p><strong>Estado:</strong> ${obra.estado || '-'}</p>
                <p><strong>Fecha de registro:</strong> ${obra.fecha_registro ? new Date(obra.fecha_registro).toLocaleDateString('es-MX') : '-'}</p>
                <div style="margin-top:1rem;display:flex;gap:.5rem;flex-wrap:wrap;">
                    <button onclick="AdminModule.eliminarObra(${JSON.stringify(obra).replace(/"/g, '&quot;')})" style="background:#e74c3c;color:#fff;border:none;padding:.5rem 1rem;border-radius:4px;cursor:pointer;">🗑️ Eliminar</button>
                    <button onclick="AdminModule.cerrarDetalles()" style="background:#95a5a6;color:#fff;border:none;padding:.5rem 1rem;border-radius:4px;cursor:pointer;">✖ Cerrar</button>
                </div>
            </div>
        `;
        detalles.style.display = 'block';
    },

    /**
     * Cierra el panel de detalles
     */
    cerrarDetalles: () => {
        const detallesDiv = Utils.getElement('detallesObra');
        if (detallesDiv) {
            detallesDiv.classList.add('hidden');
        }
    },

    /**
     * Editar obra (placeholder)
     */
    editarObra: (index) => {
        Utils.showAlert('🔧 Funcionalidad de edición en desarrollo');
        // TODO: Implementar formulario de edición
    },

    /**
     * Eliminar obra
     */
    eliminarObra: async (obra) => {
        if (!confirm(`¿Eliminar la obra "${obra.nombre_obra || obra.nombreObra}"?`)) return;
        try {
            await API.obras.delete(obra.id);
            Utils.showToast('✅ Obra eliminada', 'var(--success)');
            AdminModule.cerrarDetalles();
            await AdminModule.cargarObras();
        } catch (err) {
            Utils.showToast('❌ Error: ' + err.message, 'red');
        }
    },

    /**
     * Registra un nuevo usuario
     */
    registrarUsuario: async () => {
        const usuario    = Utils.getElement('usuario')?.value.trim();
        const contrasena = Utils.getElement('contrasena')?.value.trim();

        if (!usuario || usuario.length < 4) {
            Utils.showToast('⚠️ El usuario debe tener al menos 4 caracteres', 'var(--warn)');
            return;
        }
        if (!contrasena || contrasena.length < 6) {
            Utils.showToast('⚠️ La contraseña debe tener al menos 6 caracteres', 'var(--warn)');
            return;
        }

        try {
            await API.usuarios.create({ usuario, contrasena, rol: 'usuario' });
            Utils.showToast(`✅ Usuario "${usuario}" creado`, 'var(--success)');
            const form = Utils.getElement('formRegistroUsuario');
            if (form) form.reset();

            // Update stats
            const usuarios = await API.usuarios.getAll();
            const statUsuarios = document.getElementById('stat-usuarios');
            if (statUsuarios) statUsuarios.textContent = usuarios.length;
        } catch (err) {
            Utils.showToast('❌ Error: ' + err.message, 'red');
        }
    },

    /**
     * Registra una nueva obra
     */
    registrarObra: async () => {
        const nombreObra    = Utils.getElement('nombreObra')?.value.trim();
        const direccionObra = Utils.getElement('direccionObra')?.value.trim();
        const telefonoObra  = Utils.getElement('telefonoObra')?.value.trim();

        if (!nombreObra || !direccionObra || !telefonoObra) {
            Utils.showToast('⚠️ Todos los campos son obligatorios', 'var(--warn)');
            return;
        }

        try {
            await API.obras.create({
                nombre_obra: nombreObra,
                direccion:   direccionObra,
                telefono:    telefonoObra
            });
            Utils.showToast(`✅ Obra "${nombreObra}" registrada`, 'var(--success)');
            const form = Utils.getElement('formRegistroObra');
            if (form) form.reset();
            await AdminModule.cargarObras();
        } catch (err) {
            Utils.showToast('❌ Error: ' + err.message, 'red');
        }
    },

    /**
     * Exporta datos de todas las obras
     */
    exportarDatos: async () => {
        try {
            const [obras, usuarios] = await Promise.all([
                API.obras.getAll(),
                API.usuarios.getAll()
            ]);
            const exportData = {
                obras,
                usuarios,
                fechaExportacion: new Date().toISOString(),
                version: '3.0'
            };
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `fundacion_loyola_admin_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            Utils.showToast('❌ Error al exportar: ' + err.message, 'red');
        }
    },

    /**
     * Genera reporte de obras
     */
    generarReporte: async () => {
        try {
            const obras = await API.obras.getAll();

            if (obras.length === 0) {
                Utils.showToast('⚠️ No hay obras para generar reporte', 'var(--warn)');
                return;
            }

            const reporte = `
FUNDACIÓN LOYOLA - REPORTE DE OBRAS
Fecha: ${new Date().toLocaleDateString()}
Total de obras: ${obras.length}

${'='.repeat(60)}

${obras.map((obra, i) => `
${i + 1}. ${obra.nombre_obra || obra.nombreObra}
   Dirección: ${obra.direccion || obra.direccionObra}
   Teléfono: ${obra.telefono || obra.telefonoObra}
   Fecha de registro: ${obra.fecha_registro ? new Date(obra.fecha_registro).toLocaleDateString() : '-'}
${'='.repeat(60)}
`).join('\n')}
        `;

            const blob = new Blob([reporte], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `reporte_obras_${Date.now()}.txt`;
            link.click();
            URL.revokeObjectURL(url);
            Utils.showToast('✅ Reporte generado correctamente', 'var(--success)');
        } catch (err) {
            Utils.showToast('❌ Error al generar reporte: ' + err.message, 'red');
        }
    },

    /**
     * Cierra sesión del administrador
     */
    cerrarSesion: async () => {
        if (!confirm('¿Deseas cerrar sesión?')) return;
        try { await API.auth.logout(); } catch { /* silent */ }
        sessionStorage.removeItem('usuarioActual');
        window.location.href = 'Inicio.html';
    }
};

// ============================================
// FUNCIONES GLOBALES (Compatibilidad)
// ============================================
window.showSection = AdminModule.showSection;
window.cerrarSesion = AdminModule.cerrarSesion;
window.AdminModule = AdminModule; // Exponer módulo globalmente

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    AdminModule.init();
});

// ============================================
// EXPORTAR MÓDULO
// ============================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminModule;
}
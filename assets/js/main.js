/**
 * FUNDACIÓN LOYOLA — MÓDULOS BASE
 * main.js  v3.0
 *
 * Cargado por: index.html  y  admin_dashboard.html
 * Proporciona: Utils · Storage · Navigation · Forms · Tables · Auth · Locations
 */

/* =====================================================
   CONFIG
   ===================================================== */
const CONFIG = {
  STORAGE_KEY: 'fl_snf_2025',   // Única clave raíz para todo el sistema
  VERSION: '3.0',
  DEBUG: false                   // Cambiar a true en desarrollo local
};

/* =====================================================
   Utils
   ===================================================== */
const Utils = {
  log(message, data = null) {
    if (CONFIG.DEBUG) console.log(`[FL] ${message}`, data ?? '');
  },

  /**
   * Muestra un toast de notificación.
   * Busca #toast en el DOM; si no existe, crea uno temporal.
   * Reemplaza completamente los alert() del sistema anterior.
   *
   * @param {string}  message  Texto a mostrar
   * @param {string}  [color]  Color de fondo opcional (hex/var)
   * @param {number}  [ms]     Duración en ms (default 3500)
   */
  showToast(message, color = 'var(--green-dark)', ms = 3500) {
    let toast = document.getElementById('toast');
    // Si la página no tiene el elemento toast, crearlo dinámicamente
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      toast.innerHTML = '<span id="toast-msg"></span>';
      document.body.appendChild(toast);
    }
    const msgEl = document.getElementById('toast-msg') ?? toast;
    msgEl.textContent = message;
    toast.style.background = color;
    toast.classList.add('show');
    clearTimeout(Utils._toastTimer);
    Utils._toastTimer = setTimeout(() => toast.classList.remove('show'), ms);
  },

  _toastTimer: null,

  /** @deprecated Usar Utils.showToast en su lugar */
  showAlert(message) {
    Utils.showToast(message);
  },

  getElement(id) {
    const el = document.getElementById(id);
    if (!el) Utils.log(`⚠️ Elemento no encontrado: ${id}`);
    return el;
  },

  formatCurrency(value) {
    const n = parseFloat(value) || 0;
    return '$' + n.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  }
};

/* =====================================================
   Storage  (API-backed — reemplaza localStorage)
   ===================================================== */
const Storage = {
  // Obtiene el obraId de la sesión activa
  _getObraId() {
    try {
      const s = JSON.parse(sessionStorage.getItem('usuarioActual') || '{}');
      return s.obraId || null;
    } catch { return null; }
  },

  async save(key, data) {
    const obraId = this._getObraId();
    if (!obraId) {
      console.warn('[Storage] Sin obraId en sesión, no se puede guardar:', key);
      return false;
    }
    try {
      await API.formularios.save(obraId, key, data);
      return true;
    } catch (err) {
      Utils.showToast('Error al guardar: ' + err.message, 'red');
      return false;
    }
  },

  async get(key) {
    const obraId = this._getObraId();
    if (!obraId) return null;
    try {
      return await API.formularios.get(obraId, key);
    } catch { return null; }
  },

  async getAll() {
    const obraId = this._getObraId();
    if (!obraId) return {};
    try {
      return await API.formularios.getAll(obraId);
    } catch { return {}; }
  },

  delete(key) {
    console.warn('[Storage.delete] No implementado en modo API:', key);
  },

  clear() {
    console.warn('[Storage.clear] Usa el panel de admin para gestionar datos.');
  },

  async export() {
    try {
      const allData = await this.getAll();
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fl_backup_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      Utils.showToast('Error al exportar: ' + err.message, 'red');
    }
  }
};

/* =====================================================
   Navigation  (usado por admin_dashboard.html)
   Nota: index.html usa su propio goTo() que sigue el
   patrón .section-page / .active — compatible con esto.
   ===================================================== */
const Navigation = {
  hideAllSections() {
    document.querySelectorAll('.form-container').forEach(s => s.classList.add('hidden'));
  },

  showSection(sectionId) {
    Utils.log(`📍 Navigation.showSection: ${sectionId}`);
    Navigation.hideAllSections();
    const welcome = Utils.getElement('welcomeSection');
    if (welcome) welcome.classList.add('hidden');
    const section = Utils.getElement(sectionId);
    if (section) {
      section.classList.remove('hidden');
      section.scrollIntoView({ behavior: 'smooth' });
    } else {
      Utils.showToast(`❌ Sección no encontrada: ${sectionId}`, 'var(--danger)');
    }
  },

  showWelcome() {
    Navigation.hideAllSections();
    const welcome = Utils.getElement('welcomeSection');
    if (welcome) welcome.classList.remove('hidden');
  }
};

/* =====================================================
   Forms
   ===================================================== */
const Forms = {
  calcularTotalColaboradores() {
    const ids = ['numJesuitas', 'numSacerdotes', 'numReligiosos', 'numLaicos'];
    const total = ids.reduce((sum, id) => sum + (parseInt(Utils.getElement(id)?.value) || 0), 0);
    const el = Utils.getElement('totalColaboradores');
    if (el) el.value = total;
  },

  toggleRedSocial(id) {
    Utils.getElement(id)?.classList.remove('hidden');
  },

  hideInput(id) {
    const el = Utils.getElement(id);
    if (el) { el.classList.add('hidden'); el.value = ''; }
  },

  collectFormData(formId) {
    const form = Utils.getElement(formId);
    if (!form) return null;
    const data = {};
    form.querySelectorAll('input[id], textarea[id], select[id]').forEach(el => {
      if (el.type !== 'file') data[el.id] = el.value;
    });
    return data;
  },

  async guardarDatosObra() {
    const formEl = Utils.getElement('datosObraForm');
    if (!formEl) return false;
    const data = Forms.collectFormData('datosObraForm');
    if (!data) return false;
    data.fechaGuardado = new Date().toISOString();
    const ok = await Storage.save('datosObra', data);
    if (ok) Utils.showToast('✅ Datos de la obra guardados correctamente', 'var(--success)');
    return ok;
  },

  async cargarDatosGuardados(formId, storageKey) {
    const data = await Storage.get(storageKey);
    if (!data) return;
    Object.entries(data).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el && el.type !== 'file') el.value = value;
    });
  },
};

/* =====================================================
   Tables
   ===================================================== */
const Tables = {
  agregarFila(tablaId) {
    const table = Utils.getElement(tablaId);
    if (!table) return;
    const lastRow = table.rows[table.rows.length - 1];
    const newRow = lastRow.cloneNode(true);
    newRow.querySelectorAll('input').forEach(i => { i.value = ''; });
    table.appendChild(newRow);
    Utils.log(`➕ Fila agregada a ${tablaId}`);
  },

  calcularTotalPresupuesto(input) {
    const row = input.closest('tr');
    if (!row) return;
    const qty  = parseFloat(row.querySelector('.num-piezas')?.value) || 0;
    const unit = parseFloat(row.querySelector('.costo-unitario')?.value) || 0;
    const el   = row.querySelector('.total');
    if (el) el.value = Utils.formatCurrency(qty * unit);
  },

  collectTableData(tableId) {
    const table = Utils.getElement(tableId);
    if (!table) return [];
    const data = [];
    Array.from(table.querySelectorAll('tr')).forEach((row, i) => {
      if (i === 0) return;
      const rowData = {};
      row.querySelectorAll('input').forEach(inp => {
        if (inp.value) rowData[inp.className || `field_${i}`] = inp.value;
      });
      if (Object.keys(rowData).length) data.push(rowData);
    });
    return data;
  }
};

/* =====================================================
   Auth
   ===================================================== */
const Auth = {
  verificarSesion(redirect = false) {
    try {
      const raw = sessionStorage.getItem('usuarioActual');
      if (raw) {
        const session = JSON.parse(raw);
        if (session.token) return session;
      }
    } catch { /* ignore */ }
    if (redirect) {
      Utils.log('🔒 Sin sesión activa — redirigiendo a login');
      window.location.href = 'Inicio.html';
    }
    return null;
  },

  async cerrarSesion() {
    if (!confirm('¿Deseas cerrar sesión?')) return;
    try { await API.auth.logout(); } catch { /* no importa */ }
    sessionStorage.removeItem('usuarioActual');
    window.location.href = 'Inicio.html';
  }
};

/* =====================================================
   Sections  (navegación de secciones en admin)
   ===================================================== */
const Sections = {
  showEstrategiaForm() {
    let c = Utils.getElement('estrategiaContainer');
    if (!c) {
      c = document.createElement('div');
      c.id = 'estrategiaContainer';
      c.classList.add('form-container', 'hidden');
      c.innerHTML = `
        <h2>📌 Estrategia</h2>
        <div class="form-group"><label>Misión</label><textarea id="mision" rows="3"></textarea></div>
        <div class="form-group"><label>Visión</label><textarea id="vision" rows="3"></textarea></div>
        <div class="form-group"><label>Objetivo General</label><textarea id="objetivoGeneral" rows="3"></textarea></div>
        <div class="action-bar">
          <button class="btn-secondary" onclick="Navigation.showWelcome()">Cancelar</button>
          <button class="btn-primary" onclick="Sections.guardarEstrategia()">💾 Guardar</button>
        </div>`;
      document.querySelector('.content')?.appendChild(c);
    }
    Forms.cargarDatosGuardados('estrategiaContainer', 'estrategia');
    Navigation.showSection('estrategiaContainer');
  },

  async guardarEstrategia() {
    const data = {
      mision:           document.getElementById('mision')?.value || '',
      vision:           document.getElementById('vision')?.value || '',
      objetivoGeneral:  document.getElementById('objetivoGeneral')?.value || '',
      fechaGuardado:    new Date().toISOString()
    };
    await Storage.save('estrategia', data);
    Utils.showToast('✅ Estrategia guardada correctamente', 'var(--success)');
  },

  showSondeoOptions()    { Navigation.showSection('sondeoContainer'); },
  showPresupuestoForm()  { Navigation.showSection('presupuesto'); },
  showImpactoForm()      { Navigation.showSection('impacto'); },
  showNecesidadesForm()  { Navigation.showSection('necesidades'); },
  showContextoObraForm() { Navigation.showSection('contextoObra'); }
};

/* =====================================================
   Locations
   ===================================================== */
const Locations = {
  municipios: {
    'Jalisco':      ['Guadalajara', 'Zapopan', 'Tlaquepaque', 'Tonalá', 'Tlajomulco'],
    'Nuevo León':   ['Monterrey', 'San Pedro Garza García', 'Guadalupe', 'San Nicolás'],
    'CDMX':         ['Cuauhtémoc', 'Iztapalapa', 'Gustavo A. Madero', 'Álvaro Obregón'],
    'Chiapas':      ['Tuxtla Gutiérrez', 'San Cristóbal de las Casas', 'Tapachula'],
    'Oaxaca':       ['Oaxaca de Juárez', 'San Juan Bautista Tuxtepec', 'Juchitán']
  },

  cargarMunicipios() {
    const estado     = Utils.getElement('estado')?.value;
    const municipioS = Utils.getElement('municipio');
    if (!municipioS) return;
    municipioS.innerHTML = '<option value="">Seleccione un municipio</option>';
    (Locations.municipios[estado] || []).forEach(m => {
      municipioS.insertAdjacentHTML('beforeend', `<option>${m}</option>`);
    });
  }
};

/* =====================================================
   Exposición global (compatibilidad con HTML inline)
   ===================================================== */
window.showSection           = Navigation.showSection.bind(Navigation);
window.showEstrategiaForm    = Sections.showEstrategiaForm.bind(Sections);
window.showSondeoOptions     = Sections.showSondeoOptions.bind(Sections);
window.showPresupuestoForm   = Sections.showPresupuestoForm.bind(Sections);
window.showImpactoForm       = Sections.showImpactoForm.bind(Sections);
window.showNecesidadesForm   = Sections.showNecesidadesForm.bind(Sections);
window.showContextoObraForm  = Sections.showContextoObraForm.bind(Sections);
window.calcularTotal         = Forms.calcularTotalColaboradores.bind(Forms);
window.toggleRedSocial       = Forms.toggleRedSocial.bind(Forms);
window.hideInput             = Forms.hideInput.bind(Forms);
window.cerrarSesion          = Auth.cerrarSesion.bind(Auth);
window.agregarFila           = Tables.agregarFila.bind(Tables);
window.cargarMunicipios      = Locations.cargarMunicipios.bind(Locations);
window.showToast             = Utils.showToast.bind(Utils);   // global convenience

/* =====================================================
   Inicialización
   ===================================================== */
document.addEventListener('DOMContentLoaded', () => {
  Utils.log('🚀 Sistema iniciado', { version: CONFIG.VERSION });
  Navigation.hideAllSections();
  const welcome = Utils.getElement('welcomeSection');
  if (welcome) welcome.classList.remove('hidden');
  Utils.log('✅ Sistema listo');
});

/* =====================================================
   Export (Node / bundler)
   ===================================================== */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG, Utils, Storage, Navigation, Forms, Tables, Auth, Sections, Locations };
}

/**
 * FUNDACIÓN LOYOLA — GESTOR DE FORMULARIOS
 * forms-manager.js  v3.0
 *
 * Depende de: main.js  (Utils, Storage, Navigation deben cargarse primero)
 * Usado por:  index.html
 */

const FormsManager = {

  /* ─── Validadores ──────────────────────────────── */
  validators: {
    required: v => v && v.trim() !== '',
    email:    v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    phone:    v => /^[\d\s\-+()]+$/.test(v),
    number:   v => v !== '' && !isNaN(v),
    url:      v => /^https?:\/\/.+/.test(v)
  },

  /**
   * Valida un formulario según las reglas indicadas.
   * @param {string} formId  ID del formulario (no usado actualmente, para futura extensión)
   * @param {object} rules   { fieldId: [{ type, message }] }
   * @returns {{ valid: boolean, errors: Array }}
   */
  validateForm(formId, rules) {
    const errors = [];
    Object.entries(rules).forEach(([fieldId, fieldRules]) => {
      const el = document.getElementById(fieldId);
      if (!el) return;
      fieldRules.forEach(rule => {
        const validator = FormsManager.validators[rule.type];
        if (!validator) return;
        if (!validator(el.value)) {
          errors.push({ field: fieldId, message: rule.message || `Campo ${fieldId} inválido` });
          el.classList.add('error');
        } else {
          el.classList.remove('error');
        }
      });
    });
    return { valid: errors.length === 0, errors };
  },

  showErrors(errors) {
    const lines = errors.map(e => `• ${e.message}`).join('\n');
    Utils.showToast(`⚠️ ${errors[0].message}`, 'var(--warn)', 4000);
    Utils.log('Errores de validación:', errors);
    // Si hay más de un error, también se loguean en consola para debug
  },

  /* ─── Guardar Contexto de la Obra ──────────────── */
  guardarContextoObra: async () => {
    const validation = FormsManager.validateForm('contextoObraForm', {
      ubicacion: [{ type: 'required', message: 'La ubicación es obligatoria' }],
      personasAtendidas: [{ type: 'required', message: 'Las personas atendidas son obligatorias' }]
    });
    if (!validation.valid) { FormsManager.showErrors(validation.errors); return false; }

    const data = {
      ubicacion:         document.getElementById('ubicacion')?.value || '',
      personasAtendidas: document.getElementById('personasAtendidas')?.value || '',
      economia:          document.getElementById('economia')?.value || '',
      problemasRegion:   document.getElementById('problemasRegion')?.value || '',
      fechaGuardado:     new Date().toISOString()
    };

    const ok = await Storage.save('contextoObra', data);
    if (ok) Utils.showToast('✅ Contexto de obra guardado', 'var(--success)');
    return ok;
  },

  /* ─── Guardar Presupuesto ───────────────────────── */
  guardarPresupuesto: async () => {
    const gastos         = Tables.collectTableData('tablaGastos');
    const financiamiento = Tables.collectTableData('tablaFinanciamiento');
    const data = { gastos, financiamiento, fechaGuardado: new Date().toISOString() };
    const ok = await Storage.save('presupuesto', data);
    if (ok) Utils.showToast('✅ Presupuesto guardado', 'var(--success)');
    return ok;
  },

  /* ─── Guardar Impacto ───────────────────────────── */
  guardarImpacto: async () => {
    const validation = FormsManager.validateForm('impactoForm', {
      beneficiadosDirectos: [
        { type: 'required', message: 'El número de beneficiados directos es obligatorio' },
        { type: 'number', message: 'Debe ser un número válido' }
      ]
    });
    if (!validation.valid) { FormsManager.showErrors(validation.errors); return false; }

    const fields = [
      'beneficiadosDirectos','beneficiadosIndirectos','mujeres','hombres',
      'adultosMayores','adolescentes','ninos','tamanoPoblacion','poblacionObjetivo',
      'tamanoFamilias','descripcionFamilias','situacionSocioeconomica',
      'condicionesEducativas','oportunidadesRecreacion','empleoDesempleo',
      'condicionesSalud','enfermedadesComunes','accesoServicios','identidadCultural',
      'desafiosPoliticos','comunidadesIndigenas','poblacionIndigena','lenguasIndigenas',
      'tasaMigracion','tendenciasMigracion','razonesMigracion','politicasMigratorias'
    ];
    const data = { fechaGuardado: new Date().toISOString() };
    fields.forEach(f => { data[f] = document.getElementById(f)?.value || ''; });

    const ok = await Storage.save('impacto', data);
    if (ok) Utils.showToast('✅ Impacto guardado', 'var(--success)');
    return ok;
  },

  /* ─── Guardar Proyectos a Financiar ────────────── */
  guardarProyectosFinanciar: async () => {
    const data = {
      descripcionProyecto: document.getElementById('descripcionProyecto')?.value || '',
      montoRequerido:      document.getElementById('montoRequerido')?.value || '',
      fechaGuardado:       new Date().toISOString()
    };
    const ok = await Storage.save('proyectosFinanciar', data);
    if (ok) Utils.showToast('✅ Proyectos a financiar guardados', 'var(--success)');
    return ok;
  },

  /* ─── Guardar Necesidades Materiales ───────────── */
  guardarNecesidadesMateriales: async () => {
    const data = {
      descripcionMateriales: document.getElementById('descripcionMateriales')?.value || '',
      cantidadMateriales:    document.getElementById('cantidadMateriales')?.value || '',
      fechaGuardado:         new Date().toISOString()
    };
    const ok = await Storage.save('necesidadesMateriales', data);
    if (ok) Utils.showToast('✅ Necesidades materiales guardadas', 'var(--success)');
    return ok;
  },

  /* ─── Guardar formulario genérico ──────────────── */
  guardarFormulario: async (formId, storageKey, redirectTo) => {
    const data = Forms.collectFormData(formId);
    if (!data) return false;
    data.fechaGuardado = new Date().toISOString();
    const ok = await Storage.save(storageKey, data);
    if (ok) {
      Utils.showToast('✅ Formulario guardado', 'var(--success)');
      if (redirectTo) Navigation.showSection(redirectTo);
    }
    return ok;
  },

  /* ─── Cancelar formulario ───────────────────────── */
  cancelarFormulario(formId, redirectTo = 'welcomeSection') {
    if (!confirm('¿Descartar los cambios actuales?')) return;
    document.getElementById(formId)?.reset();
    Navigation.showSection(redirectTo);
  },

  /* ─── Auto-guardado periódico ───────────────────── */
  autoSave: {
    _interval: null,

    start(storageKey, intervalMs = 60000) {
      FormsManager.autoSave.stop();
      FormsManager.autoSave._interval = setInterval(async () => {
        const data = {};
        document.querySelectorAll('input[id], textarea[id], select[id]').forEach(el => {
          if (el.type !== 'file') data[el.id] = el.value;
        });
        data.autoSaved = true;
        data.fechaAutoGuardado = new Date().toISOString();
        try {
          await Storage.save(`autosave_${storageKey}`, data);
          Utils.log('💾 Auto-guardado ejecutado');
        } catch { /* silent fail */ }
      }, intervalMs);
    },

    stop() {
      if (FormsManager.autoSave._interval) {
        clearInterval(FormsManager.autoSave._interval);
        FormsManager.autoSave._interval = null;
      }
    }
  }
};

/* =====================================================
   Exposición global
   ===================================================== */
window.guardarContextoObra         = () => FormsManager.guardarContextoObra();
window.guardarPresupuesto          = () => FormsManager.guardarPresupuesto();
window.guardarImpacto              = () => FormsManager.guardarImpacto();
window.guardarProyectosFinanciar   = () => FormsManager.guardarProyectosFinanciar();
window.guardarNecesidadesMateriales= () => FormsManager.guardarNecesidadesMateriales();
window.cancelarFormulario          = (f, r) => FormsManager.cancelarFormulario(f, r);

/** Compatibilidad retroactiva */
window.guardarEnBlocDeNotas = () => {
  Utils.showToast('✅ Datos guardados en el sistema');
  Utils.log('Storage actual:', Storage.getAll());
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FormsManager;
}

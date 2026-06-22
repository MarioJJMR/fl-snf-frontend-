/**
 * Tests for main.js — Utils, Storage, Navigation, Forms, Tables, Auth, Locations
 */

// Provide a minimal API stub so Storage can call API.formularios.*
global.API = {
  formularios: {
    save: jest.fn().mockResolvedValue({}),
    get:  jest.fn().mockResolvedValue(null),
    getAll: jest.fn().mockResolvedValue({})
  }
};

const {
  Utils,
  Storage,
  Navigation,
  Forms,
  Tables,
  Auth,
  Locations
} = require('../assets/js/main.js');

// ── Utils ──────────────────────────────────────────────────────────────────────

describe('Utils.formatCurrency', () => {
  test('formats zero', () => {
    expect(Utils.formatCurrency(0)).toBe('$0.00');
  });

  test('formats integer', () => {
    expect(Utils.formatCurrency(1000)).toBe('$1,000.00');
  });

  test('formats decimal', () => {
    expect(Utils.formatCurrency(1234.5)).toBe('$1,234.50');
  });

  test('formats large number', () => {
    expect(Utils.formatCurrency(1000000)).toBe('$1,000,000.00');
  });

  test('handles string input', () => {
    expect(Utils.formatCurrency('500')).toBe('$500.00');
  });

  test('handles non-numeric string as 0', () => {
    expect(Utils.formatCurrency('abc')).toBe('$0.00');
  });
});

describe('Utils.showToast', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('creates toast element when not present', () => {
    Utils.showToast('Hello');
    expect(document.getElementById('toast')).not.toBeNull();
  });

  test('sets toast message text', () => {
    Utils.showToast('Test message');
    const msgEl = document.getElementById('toast-msg');
    expect(msgEl.textContent).toBe('Test message');
  });

  test('applies show class', () => {
    Utils.showToast('Test');
    expect(document.getElementById('toast').classList.contains('show')).toBe(true);
  });

  test('uses existing toast element when present', () => {
    document.body.innerHTML = '<div id="toast"><span id="toast-msg"></span></div>';
    Utils.showToast('Existing');
    expect(document.getElementById('toast-msg').textContent).toBe('Existing');
  });
});

describe('Utils.getElement', () => {
  test('returns element when it exists', () => {
    document.body.innerHTML = '<div id="myEl"></div>';
    expect(Utils.getElement('myEl')).not.toBeNull();
  });

  test('returns null when element missing', () => {
    document.body.innerHTML = '';
    expect(Utils.getElement('nonexistent')).toBeNull();
  });
});

// ── Storage ────────────────────────────────────────────────────────────────────

describe('Storage._getObraId', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test('returns obraId from session', () => {
    sessionStorage.setItem('usuarioActual', JSON.stringify({ obraId: 42 }));
    expect(Storage._getObraId()).toBe(42);
  });

  test('returns null when no session', () => {
    expect(Storage._getObraId()).toBeNull();
  });

  test('returns null on malformed JSON', () => {
    sessionStorage.setItem('usuarioActual', '{bad json}');
    expect(Storage._getObraId()).toBeNull();
  });
});

describe('Storage.save', () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  test('returns false when no obraId in session', async () => {
    const result = await Storage.save('testKey', { foo: 'bar' });
    expect(result).toBe(false);
    expect(API.formularios.save).not.toHaveBeenCalled();
  });

  test('calls API and returns true on success', async () => {
    sessionStorage.setItem('usuarioActual', JSON.stringify({ obraId: 10 }));
    API.formularios.save.mockResolvedValueOnce({});
    const result = await Storage.save('testKey', { foo: 'bar' });
    expect(result).toBe(true);
    expect(API.formularios.save).toHaveBeenCalledWith(10, 'testKey', { foo: 'bar' });
  });

  test('returns false when API throws', async () => {
    document.body.innerHTML = '';
    sessionStorage.setItem('usuarioActual', JSON.stringify({ obraId: 10 }));
    API.formularios.save.mockRejectedValueOnce(new Error('Network error'));
    const result = await Storage.save('testKey', {});
    expect(result).toBe(false);
  });
});

describe('Storage.get', () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  test('returns null when no obraId', async () => {
    const result = await Storage.get('key');
    expect(result).toBeNull();
  });

  test('calls API with correct params', async () => {
    sessionStorage.setItem('usuarioActual', JSON.stringify({ obraId: 5 }));
    API.formularios.get.mockResolvedValueOnce({ data: 1 });
    const result = await Storage.get('myKey');
    expect(API.formularios.get).toHaveBeenCalledWith(5, 'myKey');
    expect(result).toEqual({ data: 1 });
  });
});

// ── Navigation ─────────────────────────────────────────────────────────────────

describe('Navigation', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="form-container" id="sec1">Section 1</div>
      <div class="form-container" id="sec2">Section 2</div>
      <div id="welcomeSection">Welcome</div>
    `;
    // jsdom does not implement scrollIntoView
    document.querySelectorAll('*').forEach(el => {
      el.scrollIntoView = jest.fn();
    });
  });

  test('hideAllSections adds hidden to all .form-container', () => {
    Navigation.hideAllSections();
    document.querySelectorAll('.form-container').forEach(el => {
      expect(el.classList.contains('hidden')).toBe(true);
    });
  });

  test('showSection removes hidden from target', () => {
    document.getElementById('sec1').classList.add('hidden');
    Navigation.showSection('sec1');
    expect(document.getElementById('sec1').classList.contains('hidden')).toBe(false);
  });

  test('showSection hides welcome section', () => {
    Navigation.showSection('sec1');
    expect(document.getElementById('welcomeSection').classList.contains('hidden')).toBe(true);
  });

  test('showWelcome reveals welcome section', () => {
    document.getElementById('welcomeSection').classList.add('hidden');
    Navigation.showWelcome();
    expect(document.getElementById('welcomeSection').classList.contains('hidden')).toBe(false);
  });
});

// ── Forms ──────────────────────────────────────────────────────────────────────

describe('Forms.collectFormData', () => {
  test('collects input and textarea values by id', () => {
    document.body.innerHTML = `
      <form id="testForm">
        <input id="name" value="Mario" />
        <textarea id="notes">Some notes</textarea>
        <input id="fileField" type="file" />
      </form>
    `;
    const data = Forms.collectFormData('testForm');
    expect(data).toEqual({ name: 'Mario', notes: 'Some notes' });
    expect(data.fileField).toBeUndefined();
  });

  test('returns null if form not found', () => {
    document.body.innerHTML = '';
    expect(Forms.collectFormData('missing')).toBeNull();
  });
});

describe('Forms.calcularTotalColaboradores', () => {
  test('sums all collaborator fields', () => {
    document.body.innerHTML = `
      <input id="numJesuitas" value="2" />
      <input id="numSacerdotes" value="3" />
      <input id="numReligiosos" value="1" />
      <input id="numLaicos" value="4" />
      <input id="totalColaboradores" value="" />
    `;
    Forms.calcularTotalColaboradores();
    expect(document.getElementById('totalColaboradores').value).toBe('10');
  });

  test('treats empty fields as 0', () => {
    document.body.innerHTML = `
      <input id="numJesuitas" value="" />
      <input id="numSacerdotes" value="" />
      <input id="numReligiosos" value="" />
      <input id="numLaicos" value="5" />
      <input id="totalColaboradores" value="" />
    `;
    Forms.calcularTotalColaboradores();
    expect(document.getElementById('totalColaboradores').value).toBe('5');
  });
});

// ── Tables ─────────────────────────────────────────────────────────────────────

describe('Tables.collectTableData', () => {
  test('returns empty array when table not found', () => {
    document.body.innerHTML = '';
    expect(Tables.collectTableData('missing')).toEqual([]);
  });

  test('skips header row and collects data rows', () => {
    document.body.innerHTML = `
      <table id="myTable">
        <tr><th>Col1</th><th>Col2</th></tr>
        <tr>
          <td><input class="col1" value="A" /></td>
          <td><input class="col2" value="B" /></td>
        </tr>
        <tr>
          <td><input class="col1" value="C" /></td>
          <td><input class="col2" value="D" /></td>
        </tr>
      </table>
    `;
    const data = Tables.collectTableData('myTable');
    expect(data).toHaveLength(2);
    expect(data[0]).toEqual({ col1: 'A', col2: 'B' });
    expect(data[1]).toEqual({ col1: 'C', col2: 'D' });
  });

  test('skips rows with no filled inputs', () => {
    document.body.innerHTML = `
      <table id="emptyTable">
        <tr><th>Col</th></tr>
        <tr><td><input class="col" value="" /></td></tr>
      </table>
    `;
    expect(Tables.collectTableData('emptyTable')).toEqual([]);
  });
});

describe('Tables.calcularTotalPresupuesto', () => {
  test('multiplies qty by unit cost and formats result', () => {
    document.body.innerHTML = `
      <table>
        <tr>
          <td><input class="num-piezas" value="5" /></td>
          <td><input class="costo-unitario" value="100" /></td>
          <td><input class="total" value="" /></td>
        </tr>
      </table>
    `;
    const input = document.querySelector('.num-piezas');
    Tables.calcularTotalPresupuesto(input);
    expect(document.querySelector('.total').value).toBe('$500.00');
  });

  test('handles missing row gracefully', () => {
    const orphanInput = document.createElement('input');
    expect(() => Tables.calcularTotalPresupuesto(orphanInput)).not.toThrow();
  });
});

// ── Auth ───────────────────────────────────────────────────────────────────────

describe('Auth.verificarSesion', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test('returns session object when valid token present', () => {
    const session = { token: 'abc123', obraId: 1 };
    sessionStorage.setItem('usuarioActual', JSON.stringify(session));
    expect(Auth.verificarSesion()).toEqual(session);
  });

  test('returns null when no session stored', () => {
    expect(Auth.verificarSesion()).toBeNull();
  });

  test('returns null when session has no token', () => {
    sessionStorage.setItem('usuarioActual', JSON.stringify({ obraId: 1 }));
    expect(Auth.verificarSesion()).toBeNull();
  });

  test('returns null on malformed JSON', () => {
    sessionStorage.setItem('usuarioActual', 'bad json');
    expect(Auth.verificarSesion()).toBeNull();
  });
});

// ── Locations ──────────────────────────────────────────────────────────────────

describe('Locations', () => {
  test('estados contains 32 entries', () => {
    expect(Locations.estados).toHaveLength(32);
  });

  test('estados includes key states', () => {
    expect(Locations.estados).toContain('Jalisco');
    expect(Locations.estados).toContain('Ciudad de México');
    expect(Locations.estados).toContain('Chiapas');
  });

  test('municipios maps known states', () => {
    expect(Locations.municipios['Jalisco']).toContain('Guadalajara');
    expect(Locations.municipios['Nuevo León']).toContain('Monterrey');
  });

  test('cargarMunicipios populates select for known state', () => {
    document.body.innerHTML = `
      <select id="estado"><option value="Jalisco" selected>Jalisco</option></select>
      <select id="municipio"></select>
    `;
    Locations.cargarMunicipios();
    const opts = Array.from(document.getElementById('municipio').options).map(o => o.value);
    expect(opts).toContain('Guadalajara');
  });

  test('cargarMunicipios resets select for unknown state', () => {
    document.body.innerHTML = `
      <select id="estado"><option value="Extranjero" selected>Extranjero</option></select>
      <select id="municipio"><option>Old</option></select>
    `;
    Locations.cargarMunicipios();
    const opts = document.getElementById('municipio').options;
    expect(opts).toHaveLength(1);
    expect(opts[0].value).toBe('');
  });
});

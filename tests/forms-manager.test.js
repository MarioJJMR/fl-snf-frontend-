/**
 * Tests for forms-manager.js — FormsManager.validators & validateForm
 */

// Stubs required by forms-manager.js when loaded via require()
global.Utils = {
  showToast: jest.fn(),
  log: jest.fn()
};
global.Storage = {
  save: jest.fn().mockResolvedValue(true)
};
global.Tables = {
  collectTableData: jest.fn().mockReturnValue([])
};
global.Navigation = {
  showSection: jest.fn()
};
global.Forms = {
  collectFormData: jest.fn().mockReturnValue({})
};

const FormsManager = require('../assets/js/forms-manager.js');

// ── Validators ─────────────────────────────────────────────────────────────────

describe('FormsManager.validators.required', () => {
  const { required } = FormsManager.validators;

  test('returns truthy for non-empty string', () => {
    expect(required('hello')).toBeTruthy();
  });

  test('returns falsy for empty string', () => {
    expect(required('')).toBeFalsy();
  });

  test('returns falsy for whitespace-only string', () => {
    expect(required('   ')).toBeFalsy();
  });

  test('returns falsy for null', () => {
    expect(required(null)).toBeFalsy();
  });

  test('returns falsy for undefined', () => {
    expect(required(undefined)).toBeFalsy();
  });
});

describe('FormsManager.validators.email', () => {
  const { email } = FormsManager.validators;

  test('accepts valid email', () => {
    expect(email('user@example.com')).toBe(true);
  });

  test('accepts email with subdomain', () => {
    expect(email('user@mail.example.com')).toBe(true);
  });

  test('rejects missing @', () => {
    expect(email('userexample.com')).toBe(false);
  });

  test('rejects missing domain', () => {
    expect(email('user@')).toBe(false);
  });

  test('rejects missing TLD', () => {
    expect(email('user@domain')).toBe(false);
  });

  test('rejects empty string', () => {
    expect(email('')).toBe(false);
  });
});

describe('FormsManager.validators.phone', () => {
  const { phone } = FormsManager.validators;

  test('accepts digits only', () => {
    expect(phone('1234567890')).toBe(true);
  });

  test('accepts formatted phone with dashes and parens', () => {
    expect(phone('+1 (800) 555-1234')).toBe(true);
  });

  test('rejects letters', () => {
    expect(phone('123-abc-4567')).toBe(false);
  });

  test('rejects empty string', () => {
    expect(phone('')).toBe(false);
  });
});

describe('FormsManager.validators.number', () => {
  const { number } = FormsManager.validators;

  test('accepts integer string', () => {
    expect(number('42')).toBe(true);
  });

  test('accepts decimal string', () => {
    expect(number('3.14')).toBe(true);
  });

  test('accepts zero', () => {
    expect(number('0')).toBe(true);
  });

  test('rejects empty string', () => {
    expect(number('')).toBe(false);
  });

  test('rejects non-numeric string', () => {
    expect(number('abc')).toBe(false);
  });
});

describe('FormsManager.validators.url', () => {
  const { url } = FormsManager.validators;

  test('accepts https URL', () => {
    expect(url('https://example.com')).toBe(true);
  });

  test('accepts http URL', () => {
    expect(url('http://example.com/path')).toBe(true);
  });

  test('rejects URL without protocol', () => {
    expect(url('example.com')).toBe(false);
  });

  test('rejects ftp URL', () => {
    expect(url('ftp://example.com')).toBe(false);
  });

  test('rejects empty string', () => {
    expect(url('')).toBe(false);
  });
});

// ── validateForm ───────────────────────────────────────────────────────────────

describe('FormsManager.validateForm', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form id="testForm">
        <input id="email" value="" />
        <input id="nombre" value="" />
      </form>
    `;
  });

  test('returns valid=true when all fields pass', () => {
    document.getElementById('email').value = 'user@test.com';
    document.getElementById('nombre').value = 'Mario';

    const result = FormsManager.validateForm('testForm', {
      email:  [{ type: 'required' }, { type: 'email', message: 'Email inválido' }],
      nombre: [{ type: 'required', message: 'Nombre requerido' }]
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('returns valid=false with errors when fields fail', () => {
    const result = FormsManager.validateForm('testForm', {
      email:  [{ type: 'required', message: 'Email requerido' }],
      nombre: [{ type: 'required', message: 'Nombre requerido' }]
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });

  test('adds error class to invalid field', () => {
    FormsManager.validateForm('testForm', {
      email: [{ type: 'required', message: 'Requerido' }]
    });

    expect(document.getElementById('email').classList.contains('error')).toBe(true);
  });

  test('removes error class from valid field', () => {
    document.getElementById('nombre').value = 'Test';
    document.getElementById('nombre').classList.add('error');

    FormsManager.validateForm('testForm', {
      nombre: [{ type: 'required', message: 'Requerido' }]
    });

    expect(document.getElementById('nombre').classList.contains('error')).toBe(false);
  });

  test('skips rule when field element does not exist', () => {
    const result = FormsManager.validateForm('testForm', {
      nonExistentField: [{ type: 'required', message: 'X' }]
    });
    expect(result.valid).toBe(true);
  });

  test('skips unknown validator type gracefully', () => {
    document.getElementById('email').value = 'anything';
    const result = FormsManager.validateForm('testForm', {
      email: [{ type: 'unknownType', message: 'X' }]
    });
    expect(result.valid).toBe(true);
  });

  test('uses default error message when none provided', () => {
    const result = FormsManager.validateForm('testForm', {
      email: [{ type: 'required' }]
    });
    expect(result.errors[0].message).toMatch(/email/i);
  });
});

// ── autoSave ───────────────────────────────────────────────────────────────────

describe('FormsManager.autoSave', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    FormsManager.autoSave.stop();
    jest.useRealTimers();
  });

  test('stop clears interval without error when not started', () => {
    expect(() => FormsManager.autoSave.stop()).not.toThrow();
  });

  test('start sets an interval', () => {
    FormsManager.autoSave.start('testKey', 5000);
    expect(FormsManager.autoSave._interval).not.toBeNull();
  });

  test('stop nullifies interval', () => {
    FormsManager.autoSave.start('testKey', 5000);
    FormsManager.autoSave.stop();
    expect(FormsManager.autoSave._interval).toBeNull();
  });

  test('start replaces existing interval', () => {
    FormsManager.autoSave.start('key1', 5000);
    const first = FormsManager.autoSave._interval;
    FormsManager.autoSave.start('key2', 5000);
    expect(FormsManager.autoSave._interval).not.toBe(first);
  });
});

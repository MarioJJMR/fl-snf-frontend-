/**
 * Tests for api.js — API client (getToken, getSession, request, helpers)
 */

// Provide CONFIG so api.js can read it
global.CONFIG = {
  API_BASE: 'http://localhost:3001/api',
  REQUEST_TIMEOUT_MS: 10000
};

// api.js uses fetch — mock it globally
global.fetch = jest.fn();

// api.js redirects on 401 — stub window.location
delete global.window.location;
global.window.location = { href: '' };

require('../assets/js/api.js');
const API = global.API;

// ── getToken ───────────────────────────────────────────────────────────────────

describe('API.getToken', () => {
  beforeEach(() => { sessionStorage.clear(); });

  test('returns token from session', () => {
    sessionStorage.setItem('usuarioActual', JSON.stringify({ token: 'tok123' }));
    expect(API.getToken()).toBe('tok123');
  });

  test('returns null when no session', () => {
    expect(API.getToken()).toBeNull();
  });

  test('returns null when session has no token', () => {
    sessionStorage.setItem('usuarioActual', JSON.stringify({ obraId: 1 }));
    expect(API.getToken()).toBeNull();
  });

  test('returns null on malformed JSON', () => {
    sessionStorage.setItem('usuarioActual', 'bad json');
    expect(API.getToken()).toBeNull();
  });
});

// ── getSession ─────────────────────────────────────────────────────────────────

describe('API.getSession', () => {
  beforeEach(() => { sessionStorage.clear(); });

  test('returns parsed session object', () => {
    const session = { token: 'tok', obraId: 5 };
    sessionStorage.setItem('usuarioActual', JSON.stringify(session));
    expect(API.getSession()).toEqual(session);
  });

  test('returns empty object when nothing stored', () => {
    expect(API.getSession()).toEqual({});
  });

  test('returns empty object on malformed JSON', () => {
    sessionStorage.setItem('usuarioActual', '{bad}');
    expect(API.getSession()).toEqual({});
  });
});

// ── request ────────────────────────────────────────────────────────────────────

describe('API.request', () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.clearAllMocks();
    window.location.href = '';
  });

  function mockFetch(status, body) {
    fetch.mockResolvedValueOnce({
      status,
      json: () => Promise.resolve(body)
    });
  }

  test('sends GET request with correct URL', async () => {
    mockFetch(200, { success: true, data: { id: 1 } });
    await API.request('/obras', { method: 'GET' });
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/obras',
      expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) })
    );
  });

  test('includes Authorization header when token exists', async () => {
    sessionStorage.setItem('usuarioActual', JSON.stringify({ token: 'mytoken' }));
    mockFetch(200, { success: true, data: {} });
    await API.request('/test', { method: 'GET' });
    const [, opts] = fetch.mock.calls[0];
    expect(opts.headers['Authorization']).toBe('Bearer mytoken');
  });

  test('omits Authorization header when no token', async () => {
    mockFetch(200, { success: true, data: {} });
    await API.request('/test', { method: 'GET' });
    const [, opts] = fetch.mock.calls[0];
    expect(opts.headers['Authorization']).toBeUndefined();
  });

  test('serializes object body to JSON string', async () => {
    mockFetch(200, { success: true, data: {} });
    await API.request('/test', { method: 'POST', body: { foo: 'bar' } });
    const [, opts] = fetch.mock.calls[0];
    expect(opts.body).toBe(JSON.stringify({ foo: 'bar' }));
  });

  test('returns data on success', async () => {
    mockFetch(200, { success: true, data: { name: 'Obra 1' } });
    const result = await API.request('/obras/1', { method: 'GET' });
    expect(result).toEqual({ name: 'Obra 1' });
  });

  test('throws error when success=false', async () => {
    mockFetch(200, { success: false, error: 'Not found' });
    await expect(API.request('/obras/999', { method: 'GET' })).rejects.toThrow('Not found');
  });

  test('redirects to login and returns null on 401', async () => {
    mockFetch(401, { success: false });
    const result = await API.request('/protected', { method: 'GET' });
    expect(result).toBeNull();
    expect(window.location.href).toBe('Inicio.html');
    expect(sessionStorage.getItem('usuarioActual')).toBeNull();
  });

  test('throws readable error on fetch failure', async () => {
    fetch.mockRejectedValueOnce(new Error('Failed to fetch'));
    await expect(API.request('/test', { method: 'GET' })).rejects.toThrow(
      'No se puede conectar al servidor'
    );
  });
});

// ── HTTP shorthand methods ─────────────────────────────────────────────────────

describe('API shorthand methods', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ success: true, data: {} })
    });
  });

  test('API.get calls request with GET', async () => {
    const spy = jest.spyOn(API, 'request');
    await API.get('/test');
    expect(spy).toHaveBeenCalledWith('/test', { method: 'GET' });
  });

  test('API.post calls request with POST and body', async () => {
    const spy = jest.spyOn(API, 'request');
    await API.post('/test', { key: 'val' });
    expect(spy).toHaveBeenCalledWith('/test', { method: 'POST', body: { key: 'val' } });
  });

  test('API.put calls request with PUT and body', async () => {
    const spy = jest.spyOn(API, 'request');
    await API.put('/test/1', { key: 'val' });
    expect(spy).toHaveBeenCalledWith('/test/1', { method: 'PUT', body: { key: 'val' } });
  });

  test('API.delete calls request with DELETE', async () => {
    const spy = jest.spyOn(API, 'request');
    await API.delete('/test/1');
    expect(spy).toHaveBeenCalledWith('/test/1', { method: 'DELETE' });
  });
});

// ── Auth namespace ─────────────────────────────────────────────────────────────

describe('API.auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ success: true, data: {} })
    });
  });

  test('login posts to /auth/login', async () => {
    const spy = jest.spyOn(API, 'post');
    await API.auth.login('user', 'pass');
    expect(spy).toHaveBeenCalledWith('/auth/login', { usuario: 'user', contrasena: 'pass' });
  });

  test('logout posts to /auth/logout', async () => {
    const spy = jest.spyOn(API, 'post');
    await API.auth.logout();
    expect(spy).toHaveBeenCalledWith('/auth/logout');
  });

  test('me gets /auth/me', async () => {
    const spy = jest.spyOn(API, 'get');
    await API.auth.me();
    expect(spy).toHaveBeenCalledWith('/auth/me');
  });
});

// ── Obras namespace ────────────────────────────────────────────────────────────

describe('API.obras', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ success: true, data: [] })
    });
  });

  test('getAll gets /obras', async () => {
    const spy = jest.spyOn(API, 'get');
    await API.obras.getAll();
    expect(spy).toHaveBeenCalledWith('/obras');
  });

  test('getById gets /obras/:id', async () => {
    const spy = jest.spyOn(API, 'get');
    await API.obras.getById(5);
    expect(spy).toHaveBeenCalledWith('/obras/5');
  });

  test('create posts to /obras', async () => {
    const spy = jest.spyOn(API, 'post');
    await API.obras.create({ nombre: 'Test' });
    expect(spy).toHaveBeenCalledWith('/obras', { nombre: 'Test' });
  });

  test('update puts to /obras/:id', async () => {
    const spy = jest.spyOn(API, 'put');
    await API.obras.update(3, { nombre: 'Updated' });
    expect(spy).toHaveBeenCalledWith('/obras/3', { nombre: 'Updated' });
  });

  test('delete deletes /obras/:id', async () => {
    const spy = jest.spyOn(API, 'delete');
    await API.obras.delete(3);
    expect(spy).toHaveBeenCalledWith('/obras/3');
  });
});

// ── Notificaciones namespace ───────────────────────────────────────────────────

describe('API.notificaciones', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({ success: true, data: [] })
    });
  });

  test('getByObra gets correct endpoint', async () => {
    const spy = jest.spyOn(API, 'get');
    await API.notificaciones.getByObra(7);
    expect(spy).toHaveBeenCalledWith('/notificaciones/obra/7');
  });

  test('marcarLeidas posts correct endpoint', async () => {
    const spy = jest.spyOn(API, 'post');
    await API.notificaciones.marcarLeidas(7);
    expect(spy).toHaveBeenCalledWith('/notificaciones/obra/7/leer');
  });
});

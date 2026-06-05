/**
 * api.js — Cliente HTTP centralizado para FL-SNF
 * Maneja todas las llamadas al backend con JWT automático
 * Requiere: config.js cargado antes que este script
 */

const API = {

  getToken() {
    try {
      const session = JSON.parse(sessionStorage.getItem('usuarioActual') || '{}');
      return session.token || null;
    } catch { return null; }
  },

  getSession() {
    try {
      return JSON.parse(sessionStorage.getItem('usuarioActual') || '{}');
    } catch { return {}; }
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      ...options
    };
    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    const timeoutMs = (window.CONFIG && CONFIG.REQUEST_TIMEOUT_MS) || 10000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    config.signal = controller.signal;

    try {
      const base = (window.CONFIG && CONFIG.API_BASE) || 'http://localhost:3001/api';
      const res = await fetch(`${base}${endpoint}`, config);
      clearTimeout(timer);
      const data = await res.json();

      // Token expirado o no autorizado → redirigir al login
      if (res.status === 401) {
        sessionStorage.removeItem('usuarioActual');
        window.location.href = 'Inicio.html';
        return null;
      }

      if (!data.success) throw new Error(data.error || 'Error en la solicitud');
      return data.data;

    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new Error('La solicitud tardó demasiado. Verifica tu conexión o que el servidor esté activo.');
      }
      if (err.message.includes('Failed to fetch')) {
        throw new Error('No se puede conectar al servidor. Verifica que el backend esté corriendo.');
      }
      throw err;
    }
  },

  get(url)         { return this.request(url, { method: 'GET' }); },
  post(url, body)  { return this.request(url, { method: 'POST', body }); },
  put(url, body)   { return this.request(url, { method: 'PUT', body }); },
  delete(url)      { return this.request(url, { method: 'DELETE' }); },

  // ── Auth ──────────────────────────────────────────────────────────
  auth: {
    login(usuario, contrasena) {
      return API.post('/auth/login', { usuario, contrasena });
    },
    loginGoogle(id_token) {
      return API.post('/auth/google', { id_token });
    },
    logout() {
      return API.post('/auth/logout');
    },
    me() {
      return API.get('/auth/me');
    }
  },

  // ── Obras ─────────────────────────────────────────────────────────
  obras: {
    getAll()        { return API.get('/obras'); },
    getById(id)     { return API.get(`/obras/${id}`); },
    create(data)    { return API.post('/obras', data); },
    update(id, data){ return API.put(`/obras/${id}`, data); },
    delete(id)      { return API.delete(`/obras/${id}`); }
  },

  // ── Usuarios ──────────────────────────────────────────────────────
  usuarios: {
    getAll()        { return API.get('/usuarios'); },
    getByObra(obraId) { return API.get(`/usuarios/obra/${obraId}`); },
    create(data)    { return API.post('/usuarios', data); },
    update(id, data){ return API.put(`/usuarios/${id}`, data); },
    delete(id)      { return API.delete(`/usuarios/${id}`); }
  },

  // ── Formularios ───────────────────────────────────────────────────
  formularios: {
    getAll(obraId)           { return API.get(`/formularios/${obraId}`); },
    get(obraId, formKey)     { return API.get(`/formularios/${obraId}/${formKey}`); },
    save(obraId, formKey, d) { return API.post(`/formularios/${obraId}/${formKey}`, d); }
  },

  // ── Proyectos ─────────────────────────────────────────────────────
  proyectos: {
    getAll(obraId)            { return API.get(`/proyectos/${obraId}`); },
    getByTipo(obraId, tipo)   { return API.get(`/proyectos/${obraId}/${tipo}`); },
    create(obraId, tipo, d)   { return API.post(`/proyectos/${obraId}/${tipo}`, d); },
    update(id, d)             { return API.put(`/proyectos/${id}`, d); },
    updateStatus(id, status)  { return API.request(`/proyectos/${id}/status`, { method: 'PATCH', body: { status } }); },
    delete(id)                { return API.delete(`/proyectos/${id}`); }
  },

  // ── Correo ────────────────────────────────────────────────────────
  correo: {
    enviarSondeo(data) { return API.post('/correo/sondeo', data); }
  },

  // ── Documentos ────────────────────────────────────────────────────
  documentos: {
    getAll(obraId) {
      return API.get(`/documentos/${obraId}`);
    },
    async upload(obraId, archivos, categoria = 'general') {
      // archivos: FileList o Array de File
      const token = API.getToken();
      const base = (window.CONFIG && CONFIG.API_BASE) || 'http://localhost:3001/api';
      const formData = new FormData();
      Array.from(archivos).forEach(f => formData.append('archivos', f));
      formData.append('categoria', categoria);

      const res = await fetch(`${base}/documentos/${obraId}`, {
        method: 'POST',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: formData
      });
      if (res.status === 401) { sessionStorage.removeItem('usuarioActual'); window.location.href = 'Inicio.html'; return null; }
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error al subir archivos');
      return data.data;
    },
    getDownloadUrl(obraId, id) {
      return API.get(`/documentos/${obraId}/descargar/${id}`);
    },
    delete(id) { return API.delete(`/documentos/${id}`); }
  }
};

// Exponer globalmente
window.API = API;

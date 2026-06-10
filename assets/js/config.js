/**
 * config.js — Configuración centralizada de la aplicación FL-SNF
 * Edita este archivo para cambiar el entorno (local, staging, producción).
 */

const CONFIG = {

  // ── API ──────────────────────────────────────────────────────────────
  // Cambia esta URL al desplegar en producción.
  API_BASE: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001/api'
    : 'https://fl-snf-backend-production.up.railway.app/api',

  // ── EmailJS ───────────────────────────────────────────────────────────
  // Regístrate en https://emailjs.com y reemplaza los valores.
  EMAILJS: {
    publicKey:  'TU_PUBLIC_KEY',   // Account > API Keys
    serviceId:  'TU_SERVICE_ID',   // Email Services
    templateId: 'TU_TEMPLATE_ID'   // Email Templates
  },

  // ── Google OAuth ──────────────────────────────────────────────────────
  // Reemplaza con tu Google Client ID desde console.cloud.google.com
  GOOGLE_CLIENT_ID: '541500948890-d2ipv871f902omto134ipr606it0pq58.apps.googleusercontent.com',

  // ── Timeouts ──────────────────────────────────────────────────────────
  REQUEST_TIMEOUT_MS: 10000,  // 10 segundos

  // ── Feature Flags ─────────────────────────────────────────────────────────
  // Cambiar a false para deshabilitar la funcionalidad sin borrar el código.
  FEATURES: {
    GOOGLE_LOGIN: true   // false = oculta el botón "Continuar con Google"
  }
};

window.CONFIG = CONFIG;

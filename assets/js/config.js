/**
 * config.js — Configuración centralizada de la aplicación FL-SNF
 * Edita este archivo para cambiar el entorno (local, staging, producción).
 */

const CONFIG = {

  // ── API ──────────────────────────────────────────────────────────────
  // Cambia esta URL al desplegar en producción.
  API_BASE: 'https://fl-snf-backend-production.up.railway.app/api',

  // ── EmailJS ───────────────────────────────────────────────────────────
  // Regístrate en https://emailjs.com y reemplaza los valores.
  EMAILJS: {
    publicKey:  'TU_PUBLIC_KEY',   // Account > API Keys
    serviceId:  'TU_SERVICE_ID',   // Email Services
    templateId: 'TU_TEMPLATE_ID'   // Email Templates
  },

  // ── Google OAuth ──────────────────────────────────────────────────────
  // Reemplaza con tu Google Client ID desde console.cloud.google.com
  GOOGLE_CLIENT_ID: 'TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com',

  // ── Timeouts ──────────────────────────────────────────────────────────
  REQUEST_TIMEOUT_MS: 10000  // 10 segundos
};

window.CONFIG = CONFIG;

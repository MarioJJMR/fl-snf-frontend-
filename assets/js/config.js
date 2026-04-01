/**
 * config.js — Configuración centralizada de la aplicación FL-SNF
 * Edita este archivo para cambiar el entorno (local, staging, producción).
 */

const CONFIG = {

  // ── API ──────────────────────────────────────────────────────────────
  // Cambia esta URL al desplegar en producción.
  API_BASE: 'https://TU-PROYECTO.up.railway.app/api', // ← reemplaza con tu URL de Railway

  // ── EmailJS ───────────────────────────────────────────────────────────
  // Regístrate en https://emailjs.com y reemplaza los valores.
  EMAILJS: {
    publicKey:  'TU_PUBLIC_KEY',   // Account > API Keys
    serviceId:  'TU_SERVICE_ID',   // Email Services
    templateId: 'TU_TEMPLATE_ID'   // Email Templates
  },

  // ── Timeouts ──────────────────────────────────────────────────────────
  REQUEST_TIMEOUT_MS: 10000  // 10 segundos
};

window.CONFIG = CONFIG;

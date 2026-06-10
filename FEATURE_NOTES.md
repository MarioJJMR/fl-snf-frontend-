# Feature: Sistema de Notificaciones para Admin

## Descripcion

Implementacion de una bandeja de envio de notificaciones desde el panel de administrador
hacia las obras registradas en el sistema FL-SNF. Permite al administrador redactar y
enviar avisos por correo electronico a los usuarios de una o todas las obras, con registro
historico de los envios.

---

## Cambios incluidos

### Frontend

#### Nuevas secciones en admin_dashboard.html

**Notificaciones**
- Panel de composicion con selector de destinatarios (todas las obras o individual),
  campo de asunto, area de mensaje y boton de envio con feedback inmediato
- Panel de historial: asunto, fecha, obras destinatarias, total de usuarios notificados
  y preview del mensaje, ordenado del mas reciente al mas antiguo

**Seguimiento de Obras**
- Vista grid con tarjeta por obra: badge de estado, barra de progreso del sondeo,
  pills de secciones completadas vs pendientes, contadores de documentos/proyectos/usuarios,
  fecha de ultima actividad y boton de detalle
- Busqueda por nombre y filtro por estado

#### api.js
- API.correo.enviarNotificacion(data)
- API.correo.getNotificaciones()

#### Feature flags (config.js)
- FEATURES.GOOGLE_LOGIN: false — oculta el boton de Google en el login

#### Documentos Institucionales (index.html)
- Carpeta renombrada a "Logotipos institucionales"
- Campo de enlace Google Drive institucional editable por la obra
- Vista de documentos en modal de detalle de obra en el admin (solo lectura)

#### Mensajes de validacion (index.html)
- Toast rojo actualizado con instruccion clara al intentar avanzar sin guardar

---

## Cambios en Backend

### Nueva tabla: notificaciones
  id, asunto, mensaje, destinatarios (JSON), nombres_obras (JSON),
  enviado_por, total_enviados, fecha_envio

### Nuevos endpoints
  POST  /api/correo/notificacion    (admin)
  GET   /api/correo/notificaciones  (admin)

### Logica POST /correo/notificacion
  1. Recibe asunto, mensaje, obras (IDs o "todas")
  2. Consulta usuarios con email de las obras seleccionadas
  3. Envia correo individual con template HTML branded
  4. Guarda registro en tabla notificaciones
  5. Retorna { totalEnviados, nombresObras }

### Seed actualizado (db/seed.js)
  - Obras: Obra San Ignacio, Centro Comunitario San Ignacio
  - Usuarios (password: 12345678):
      plataforma@fundacionloyola.mx (admin)
      admin/director/gestor @obra.mx (Obra San Ignacio)
      admin/director/gestor @sanignacio.org.mx (CCSI)

---

## Como probar localmente

  Backend : cd fl-snf-backend  && npm run dev   (puerto 3001)
  Frontend: cd fl-snf-frontend && npx serve . --listen 8080
  Login   : http://localhost:8080/Inicio.html
  Usuario : plataforma / 12345678

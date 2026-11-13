/* Configuración editable del sitio. Nada de llaves ni tokens aquí: este archivo es público. */
window.PPS_CONFIG = {
  // Correo que recibe las solicitudes de reunión.
  salesEmail: "ventas@ppssac.com",

  // WhatsApp comercial en formato internacional, solo dígitos. Vacío = se oculta el botón de WhatsApp.
  // Pendiente de confirmar con el cliente qué número debe recibir los leads.
  salesWhatsApp: "",

  // Opcional: URL de un webhook (CRM, GoHighLevel, etc.) que reciba la solicitud en JSON por POST.
  leadWebhook: "",

  // Opcional: URL del backend de IA (ver /api/chat.js). Vacío = el asistente responde con la base
  // de conocimiento local incluida en chat.js.
  chatEndpoint: "",

  // Horario ofrecido para reuniones (hora de Lima).
  meetingHours: ["09:00", "10:00", "11:00", "12:00", "15:00", "16:00", "17:00"],
  meetingDaysAhead: 8
};

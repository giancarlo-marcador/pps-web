/* Asistente de PPS.
   Modo 1 (por defecto): responde con la base de conocimiento local (KB) de este archivo.
   Modo 2: si PPS_CONFIG.chatEndpoint tiene una URL, las preguntas van al backend de IA (/api/chat.js)
           y la KB local queda como respaldo si el backend falla.
   En ambos modos, la agenda de reuniones se resuelve aquí, paso a paso. */
(function () {
  "use strict";
  var C = window.PPS_CONFIG;
  var $ = function (s) { return document.querySelector(s); };
  var norm = function (s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ñ\s/&.-]/g, " "); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  var KB = [
    { id: "fabrican", p: -1, k: ["fabrican", "fabricacion", "productos", "hacen", "ofrecen", "servicios", "spool", "spools", "estructura", "estructuras", "soporte", "soportes", "equipos", "tanque", "tanques", "tolva", "tolvas", "chute", "trampa", "trampas", "caldereria", "dedican"],
      a: "Fabricamos <b>spools de piping</b>, <b>estructuras</b> (livianas, medianas y pesadas), <b>soportes</b>, <b>equipos mecánicos</b> (tanques, tolvas, chutes), <b>trampas de lanzamiento y recibo</b> y <b>calderería metálica</b>.\n\nEl servicio es integral: suministro, ingeniería, fabricación, ensayos, pruebas hidrostáticas, tratamiento térmico, revestimiento, pintura y despacho." },
    { id: "materiales", k: ["material", "materiales", "acero", "aceros", "carbono", "inoxidable", "inoxidables", "duplex", "superduplex", "aleado", "aleados", "grado", "grados", "a106", "a312", "p91", "p22", "p11", "astm", "api", "disimiles", "aleacion"],
      a: "Trabajamos estos materiales:\n• <b>Acero al carbono</b>: A36, A53, A106, A234, API 5L (3 – 48 mm)\n• <b>Inoxidable</b>: A312, A182, A790 (3 – 22 mm)\n• <b>Dúplex y superdúplex</b>: S32205, S32750, S32760 (3 – 28 mm)\n• <b>Aleados</b>: P5, P11, P22, P91 (4.76 – 42 mm)\n• Uniones disímiles y <b>HDPE</b>." },
    { id: "diametros", k: ["diametro", "diametros", "pulgadas", "espesor", "espesores", "tamano", "medidas", "rango", "72", "schedule", "grande", "maximo", "minimo", "dimensiones"],
      a: "Fabricamos spools de <b>½” hasta 72”</b> de diámetro, con espesores de <b>3 a 50 mm</b>. En HDPE llegamos hasta <b>900 mm</b> (SDR 33 a SDR 11)." },
    { id: "hdpe", k: ["hdpe", "polietileno", "termofusion", "sdr", "plastico"],
      a: "Sí, fabricamos spools de <b>HDPE</b> por termofusión, hasta <b>900 mm</b> de diámetro, en SDR 33 a SDR 11." },
    { id: "capacidad", k: ["capacidad", "produccion", "mensual", "mes", "cuantas", "volumen", "producen", "toneladas", "ton", "turno"],
      a: "La planta tiene una capacidad de <b>30,000 pulgadas diametrales al mes</b>, además de <b>100 TON/mes</b> y <b>1,000 m²/mes</b>. Despachamos entre <b>6 y 8 unidades diarias</b>." },
    { id: "planta", k: ["planta", "ubicacion", "ubicados", "direccion", "donde", "taller", "instalaciones", "punta", "negra", "lima", "visita", "visitar", "m2", "area", "llegar", "mapa"],
      a: "Estamos en la <b>Carretera Panamericana Sur Km 46, Punta Negra, Lima, Perú</b>. La planta tiene más de <b>30,000 m²</b> y está distribuida como un proceso continuo. Si desea conocerla, puedo agendarle una visita." },
    { id: "equipos", k: ["maquinas", "maquinaria", "equipamiento", "grua", "gruas", "cnc", "plasma", "oxicorte", "torno", "ranurado", "ranuradora", "victaulic", "miller", "roscadora", "soldar", "portico"],
      a: "Equipamiento principal:\n• Grúas pórtico de 5 TM y 15 TM\n• Corte CNC por plasma y oxicorte (tubos de 2” a 24”)\n• 110 máquinas de soldar Miller: GTAW, SMAW, FCAW, SAW, y arco sumergido\n• Ranuradoras Victaulic (Ø2” a Ø24”)\n• Torno paralelo (volteo Ø1000 mm, bancada 3000 mm)\n• Horno de tratamiento térmico de hasta 6 TON\n• Roscadoras Ridgid (½” a 4”)" },
    { id: "end", k: ["ensayo", "ensayos", "end", "ndt", "nde", "radiografia", "gammagrafia", "ultrasonido", "tintes", "penetrantes", "particulas", "magneticas", "pmi", "dureza", "ferrita", "inspeccion", "inspector", "inspectores", "cwi", "itp", "destructivos"],
      a: "Ejecutamos <b>ensayos no destructivos</b>: inspección visual, tintes penetrantes, gammagrafía, ultrasonido, partículas magnéticas, PMI, dureza y ferrita.\n\nContamos con inspectores <b>CWI y Nivel 2</b>, elaboramos un <b>ITP por proyecto</b> y los reportes forman parte del dossier de calidad." },
    { id: "calidad", k: ["calidad", "iso", "9001", "certificacion", "certificado", "certificados", "certificada", "dossier", "trazabilidad", "wps", "pqr", "homologacion", "bureau", "norma", "normas"],
      a: "Nuestro sistema de gestión está <b>certificado ISO 9001:2015</b>. Trabajamos con procedimientos de soldadura calificados (WPS, PQR), soldadores calificados, ITP por proyecto, trazabilidad por etapas y dossier de calidad en cada entrega." },
    { id: "hidro", k: ["hidrostatica", "hidrostaticas", "presion", "psi", "estanqueidad", "prueba", "pruebas", "hidraulica"],
      a: "Realizamos <b>pruebas hidrostáticas</b> en planta de hasta <b>5,000 PSI</b>, con registro en carta de presión." },
    { id: "termico", k: ["termico", "termicos", "tratamiento", "pwht", "horno", "alivio", "tensiones"],
      a: "Hacemos <b>tratamiento térmico</b> en horno propio con quemadores, con capacidad de hasta <b>6 TON</b>, y registro de la curva de temperatura." },
    { id: "pintura", k: ["pintura", "pintado", "granallado", "arenado", "recubrimiento", "revestimiento", "caucho", "poliuretano", "ceramico", "coating", "cabina", "epoxico", "lined", "engomado"],
      a: "Aplicamos <b>revestimiento interior y exterior</b> y pintura según la especificación de su proyecto:\n• Granallado automático y manual: 250 m²/día\n• Cabinas de pintado: 2,500 m²\n• Supervisión del proveedor de pintura en arranque, aplicación y ensayos de adherencia." },
    { id: "ingenieria", k: ["ingenieria", "isometrico", "isometricos", "plano", "planos", "3d", "modelado", "modelamiento", "spoolgen", "spooleado", "detalle", "diseno"],
      a: "Sí, hacemos la <b>ingeniería de detalle</b>: planos de fabricación en taller (Spoolgen) a partir de sus isométricos, modelamiento 3D y gestión de materiales con control de almacén y producción en base de datos." },
    { id: "suministro", k: ["suministro", "suministran", "importacion", "importan", "compra", "compran", "tuberia", "accesorios", "bridas", "proveen", "incluye"],
      a: "Podemos encargarnos del <b>suministro del material</b>, de origen local o importado, o fabricar con material que usted entregue. Lo vemos según su proyecto." },
    { id: "despacho", k: ["despacho", "transporte", "envio", "envian", "logistica", "entrega", "entregan", "embalaje", "flete", "camion", "obra", "exportacion", "exportan", "chile", "colombia", "internacional", "extranjero", "paises"],
      a: "Nos encargamos del <b>rotulado, embalaje, carga y transporte</b> hasta su obra, a nivel local e internacional. Ya hemos exportado a <b>Chile</b> (Proyecto Spence SGO, 150,000 PD) y <b>Colombia</b> (Buriticá y ODL)." },
    { id: "experiencia", k: ["experiencia", "proyectos", "clientes", "referencias", "trabajado", "anos", "trayectoria", "portafolio", "casos", "talara", "quellaveco", "antamina", "toquepala", "pampilla", "quienes"],
      a: "Tenemos <b>9 años de experiencia</b> y más de <b>1.8 millones de pulgadas diametrales</b> procesadas. Algunos proyectos:\n• Modernización de la Refinería de Talara: 588,000 PD\n• Spence SGO (Chile): 150,000 PD\n• Refinería La Pampilla: 117,000 PD\n• Quellaveco: 108,000 PD\n• Mina Toquepala: 100,544 PD\n\nLa lista completa está en la sección <a href=\"#experiencia\">Experiencia</a>." },
    { id: "sectores", p: -1, k: ["sector", "sectores", "mineria", "minera", "oil", "gas", "energia", "refineria", "infraestructura", "industria", "gobierno", "estado", "publico", "sedapal", "petroleo"],
      a: "Atendemos <b>minería, oil &amp; gas, refinería, energía e infraestructura</b>. Hemos fabricado para proyectos de Antamina, Las Bambas, Quellaveco, Petroperú, Repsol, Lima Airport Partners y plantas desaladoras, entre otros." },
    { id: "precio", p: 3, k: ["precio", "precios", "costo", "costos", "cuesta", "cotizacion", "cotizar", "tarifa", "presupuesto", "cuanto vale", "propuesta"],
      a: "Los precios dependen del material, los diámetros, el alcance de ensayos y pintura, y el plazo, así que no manejo tarifas aquí. Para cotizar puede escribir a <a href=\"mailto:ventas@ppssac.com\">ventas@ppssac.com</a> con sus isométricos o su alcance, o le agendo una reunión con el equipo comercial.", offer: true },
    { id: "plazo", p: 2, k: ["plazo", "plazos", "tiempo", "demora", "demoran", "cuando", "lead", "urgente", "rapido", "cronograma", "fecha"],
      a: "El plazo depende del volumen, el material y el alcance (ensayos, tratamiento, pintura). La planta trabaja como un proceso continuo, lo que acorta los tiempos de fabricación. Para darle una fecha concreta, lo mejor es revisar su alcance con el equipo comercial.", offer: true },
    { id: "contacto", k: ["contacto", "contactar", "correo", "email", "telefono", "llamar", "escribir", "ventas", "representante", "asesor", "humano", "persona", "vendedor", "gerente"],
      a: "Puede escribir a <a href=\"mailto:ventas@ppssac.com\">ventas@ppssac.com</a>. Si prefiere, le agendo ahora una reunión con un representante comercial.", offer: true },
    { id: "trabajo", k: ["trabajo", "empleo", "vacante", "vacantes", "cv", "curriculum", "postular", "practicas"],
      a: "Para oportunidades laborales, escriba a <a href=\"mailto:recursos.humanos@ppssac.com\">recursos.humanos@ppssac.com</a>." },
    { id: "proveedor", k: ["proveedor", "proveedores", "venderles", "ofrecerles", "licitacion"],
      a: "Si desea ser proveedor de PPS, escriba a <a href=\"mailto:logistica@ppssac.com\">logistica@ppssac.com</a>." }
  ];
  var BOOK_WORDS = ["agendar", "agenda", "agendo", "agendemos", "reunion", "cita", "reunirme", "reunirnos", "llamada", "videollamada", "meeting", "coordinar", "reservar"];
  var GREET = ["hola", "buenas", "buenos", "hello", "hi", "saludos"];
  var THANKS = ["gracias", "perfecto", "genial", "excelente", "ok", "listo"];

  var fab = $("#chat-fab"), box = $("#chat"), log = $("#chat-log"), chips = $("#chat-chips"), form = $("#chat-form"), input = $("#chat-input");
  var started = false, busy = false, history = [], flow = null, misses = 0;
  var BASE_CHIPS = ["¿Qué fabrican?", "Materiales y diámetros", "Capacidad de planta", "Ensayos y calidad", "Experiencia"];

  function open() {
    box.classList.add("is-open"); box.setAttribute("aria-hidden", "false");
    fab.classList.add("is-off"); fab.setAttribute("aria-expanded", "true");
    if (!started) {
      started = true;
      bot("Hola, soy el asistente automático de PPS. Puedo responder sobre lo que fabricamos, materiales, capacidad, calidad y experiencia, o agendarle una reunión con un representante de ventas.\n\n¿En qué le ayudo?");
      setChips(BASE_CHIPS, true);
    }
    if (window.matchMedia("(min-width: 821px)").matches) setTimeout(function () { input.focus(); }, 350);
  }
  function close() {
    box.classList.remove("is-open"); box.setAttribute("aria-hidden", "true");
    fab.classList.remove("is-off"); fab.setAttribute("aria-expanded", "false"); fab.focus();
  }
  fab.addEventListener("click", open);
  $("#chat-close").addEventListener("click", close);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && box.classList.contains("is-open")) close(); });
  window.PPS_openChat = open;

  function add(cls, html) {
    var m = document.createElement("div"); m.className = "msg " + cls; m.innerHTML = html;
    log.appendChild(m); log.scrollTop = log.scrollHeight; return m;
  }
  function bot(html) { history.push({ role: "assistant", content: html.replace(/<[^>]+>/g, "") }); return add("msg--bot", html); }
  function user(text) { history.push({ role: "user", content: text }); return add("msg--user", esc(text)); }
  function setChips(list, withBook) {
    chips.innerHTML = "";
    if (withBook) list = ["Agendar reunión"].concat(list);
    list.forEach(function (t) {
      var b = document.createElement("button"); b.type = "button"; b.textContent = t;
      if (t === "Agendar reunión") b.className = "is-primary";
      b.addEventListener("click", function () { send(t); });
      chips.appendChild(b);
    });
    chips.scrollLeft = 0;
  }
  function typing(fn, ms) {
    busy = true;
    var t = add("msg--typing msg--bot", "<i></i><i></i><i></i>");
    setTimeout(function () { t.remove(); busy = false; fn(); }, ms || 550);
  }

  function has(words, tokens) { return words.some(function (w) { return tokens.indexOf(w) > -1; }); }
  function answerLocal(text) {
    var n = norm(text), tokens = n.split(/\s+/).filter(Boolean);
    var ranked = KB.map(function (e) {
      var s = 0;
      e.k.forEach(function (k) { if (k.indexOf(" ") > -1 ? n.indexOf(k) > -1 : tokens.indexOf(k) > -1) s += k.length > 5 ? 2 : 1; });
      return { e: e, s: s ? s + (e.p || 0) : 0 };
    }).filter(function (r) { return r.s > 0; }).sort(function (a, b) { return b.s - a.s; });
    if (ranked.length) {
      var top = ranked[0], second = ranked[1];
      // Si la pregunta toca dos temas con el mismo peso, responde ambos.
      if (second && second.s >= 2 && second.s >= top.s && !top.e.offer && !second.e.offer) {
        return { a: top.e.a + "\n\n" + second.e.a };
      }
      return top.e;
    }
    if (has(GREET, tokens)) return { a: "Hola. Cuénteme qué necesita fabricar o qué quiere saber de PPS." };
    if (has(THANKS, tokens)) return { a: "Con gusto. Si necesita algo más, aquí estoy." };
    return null;
  }

  /* ---------- Flujo de agenda ---------- */
  var STEPS = [
    { f: "nombre", q: "Con gusto. ¿Cuál es su nombre y apellido?", ok: function (v) { return v.length >= 3; }, bad: "¿Me indica su nombre y apellido?" },
    { f: "empresa", q: function (d) { return "Gracias, " + esc(d.nombre.split(" ")[0]) + ". ¿De qué empresa o entidad nos escribe?"; }, ok: function (v) { return v.length >= 2; }, bad: "¿Cuál es el nombre de su empresa?" },
    { f: "pais", q: "¿Desde qué país?", chips: ["Perú", "Chile", "Colombia", "Otro"], ok: function (v) { return v.length >= 2; } },
    { f: "correo", q: "¿A qué correo le enviamos la confirmación?", ok: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }, bad: "Ese correo parece incompleto. ¿Me lo escribe de nuevo?" },
    { f: "modalidad", q: "¿Prefiere videollamada o visitar la planta en Punta Negra?", chips: ["Videollamada", "Visita a planta"], ok: function (v) { return v.length >= 2; } },
    { f: "dia", q: "¿Qué día le acomoda?", chips: function () { return window.PPS_SLOTS.days.slice(0, 6); }, ok: function (v) { return v.length >= 2; } },
    { f: "hora", q: "¿A qué hora? (hora de Lima)", chips: function () { return window.PPS_SLOTS.hours; }, ok: function (v) { return /\d/.test(v); }, bad: "Indíqueme una hora, por ejemplo 10:00." },
    { f: "detalle", q: "Por último, ¿qué necesita fabricar? Una línea basta; si prefiere contarlo en la reunión, escriba «omitir».", chips: ["Omitir"], ok: function () { return true; } }
  ];
  function startFlow() { flow = { i: 0, d: {} }; ask(); }
  function ask() {
    var st = STEPS[flow.i];
    bot(typeof st.q === "function" ? st.q(flow.d) : st.q);
    var c = typeof st.chips === "function" ? st.chips() : (st.chips || []);
    setChips(c.concat(["Cancelar"]));
  }
  function flowInput(text) {
    if (/^cancelar$/i.test(text.trim())) { flow = null; typing(function () { bot("Listo, cancelé la solicitud. ¿Le ayudo con algo más?"); setChips(BASE_CHIPS, true); }); return; }
    var st = STEPS[flow.i], v = text.trim();
    if (!st.ok(v)) { typing(function () { bot(st.bad || "¿Me lo indica de nuevo?"); }, 350); return; }
    flow.d[st.f] = (st.f === "detalle" && /^omitir$/i.test(v)) ? "" : v;
    flow.i++;
    if (flow.i < STEPS.length) { typing(ask, 380); return; }
    var d = flow.d; flow = null;
    typing(function () {
      var r = window.PPS_buildRequest(d);
      var m = bot("Su solicitud quedó así:\n\n<b>" + esc(d.nombre) + "</b> · " + esc(d.empresa) + " (" + esc(d.pais) + ")\n" + esc(d.modalidad) + " · " + esc(d.dia) + ", " + esc(d.hora) + " hora de Lima\n\nEnvíela con un toque y el equipo comercial le confirmará la reunión en " + esc(d.correo) + ".");
      var a = document.createElement("div"); a.className = "msg__actions";
      a.innerHTML = '<a href="' + esc(r.mail) + '">Enviar por correo</a>' + (r.wa ? '<a href="' + esc(r.wa) + '" target="_blank" rel="noopener">Enviar por WhatsApp</a>' : "");
      m.appendChild(a); log.scrollTop = log.scrollHeight;
      setChips(BASE_CHIPS);
    }, 700);
  }

  /* ---------- Envío ---------- */
  function send(text) {
    text = String(text || "").trim();
    if (!text || busy) return;
    user(text); input.value = "";
    if (flow) { flowInput(text); return; }

    var tokens = norm(text).split(/\s+/);
    if (has(BOOK_WORDS, tokens)) { typing(startFlow, 400); return; }

    if (C.chatEndpoint) { askBackend(text); return; }
    typing(function () { reply(answerLocal(text)); });
  }
  function reply(e) {
    if (e) {
      misses = 0; bot(e.a);
      setChips(BASE_CHIPS, true);
      if (e.offer) setChips(["Agendar reunión"].concat(BASE_CHIPS.slice(0, 3)));
      return;
    }
    misses++;
    bot(misses > 1
      ? "Prefiero no darle un dato equivocado. Lo más útil es que lo vea directamente con un representante comercial: ¿le agendo una reunión?"
      : "Ese dato no lo tengo a la mano. Puedo contarle sobre fabricación, materiales, capacidad, calidad o experiencia, o agendarle una reunión con ventas para verlo en detalle.");
    setChips(BASE_CHIPS, true);
  }
  function askBackend(text) {
    busy = true;
    var t = add("msg--typing msg--bot", "<i></i><i></i><i></i>");
    var ctl = new AbortController(), to = setTimeout(function () { ctl.abort(); }, 20000);
    fetch(C.chatEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history.slice(-12) }), signal: ctl.signal })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) {
        t.remove(); busy = false;
        if (!j || !j.reply) throw new Error("vacío");
        bot(esc(j.reply).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"));
        if (j.book) startFlow(); else setChips(BASE_CHIPS, true);
      })
      .catch(function () { t.remove(); busy = false; reply(answerLocal(text)); })
      .finally(function () { clearTimeout(to); });
  }
  form.addEventListener("submit", function (e) { e.preventDefault(); send(input.value); });
})();

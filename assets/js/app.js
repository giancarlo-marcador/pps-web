(function () {
  "use strict";
  var D = window.PPS_DATA, C = window.PPS_CONFIG;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var nf = new Intl.NumberFormat("en-US");
  var norm = function (s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

  $("#year").textContent = new Date().getFullYear();

  /* ---------- Navegación ---------- */
  var nav = $("#nav"), burger = $("#burger"), menu = $("#menu"), lastY = 0;
  var sentinel = document.createElement("div");
  sentinel.style.cssText = "position:absolute;top:0;height:80px;width:1px;pointer-events:none";
  document.body.prepend(sentinel);
  new IntersectionObserver(function (e) { nav.classList.toggle("is-scrolled", !e[0].isIntersecting); }).observe(sentinel);

  function setMenu(open) {
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    document.documentElement.style.overflow = open ? "hidden" : "";
  }
  burger.addEventListener("click", function () { setMenu(!menu.classList.contains("is-open")); });
  $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  var links = $$(".nav__links a");
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      links.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id); });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach(function (s) { spy.observe(s); });

  /* ---------- Marquee de clientes ---------- */
  var mq = $("#marquee");
  var row = D.clients.map(function (c) { return "<span>" + esc(c) + "</span>"; }).join("");
  mq.innerHTML = row + row;
  $("#clients-sr").textContent = "Clientes: " + D.clients.join(", ") + ".";

  /* ---------- Proceso ---------- */
  var tabs = $("#process-tabs"), fig = $("#process-figure"), panel = $("#process-panel");
  var current = -1, auto = null, userTook = false;
  D.process.forEach(function (st, i) {
    var b = document.createElement("button");
    b.className = "step"; b.type = "button"; b.setAttribute("role", "tab"); b.id = "step-" + i;
    b.innerHTML = '<span class="step__node">' + String(i + 1).padStart(2, "0") + '</span><span class="step__label">' + esc(st.key) + "</span>";
    b.addEventListener("click", function () { userTook = true; clearInterval(auto); show(i, true); });
    tabs.appendChild(b);
    var im = new Image();
    im.alt = st.alt; im.loading = "lazy"; im.decoding = "async"; im.dataset.src = "assets/img/" + st.img + ".webp";
    fig.appendChild(im);
  });
  var cap = document.createElement("figcaption"); fig.appendChild(cap);
  tabs.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault(); userTook = true; clearInterval(auto);
    var n = D.process.length, d = (e.key === "ArrowDown" || e.key === "ArrowRight") ? 1 : -1;
    show((current + d + n) % n, true); tabs.children[current].focus();
  });
  function show(i, scrollTab) {
    if (i === current) return;
    current = i;
    var st = D.process[i], n = D.process.length;
    $$(".step", tabs).forEach(function (b, k) {
      b.classList.toggle("is-active", k === i); b.classList.toggle("is-done", k < i);
      b.setAttribute("aria-selected", String(k === i)); b.tabIndex = k === i ? 0 : -1;
    });
    tabs.style.setProperty("--p", n > 1 ? i / (n - 1) : 0);
    $$("img", fig).forEach(function (im, k) {
      if (k === i || k === (i + 1) % n) { if (!im.src) im.src = im.dataset.src; }
      im.classList.toggle("is-on", k === i);
    });
    cap.textContent = String(i + 1).padStart(2, "0") + " / " + String(n).padStart(2, "0") + " · " + st.key;
    panel.setAttribute("aria-labelledby", "step-" + i);
    panel.innerHTML = '<div class="panel-swap"><h3>' + esc(st.title) + "</h3><p>" + esc(st.text) + '</p></div><ul class="process__specs panel-swap">' +
      st.specs.map(function (s) { return "<li><span>" + esc(s[0]) + "</span><b>" + esc(s[1]) + "</b></li>"; }).join("") + "</ul>";
    if (scrollTab && tabs.scrollWidth > tabs.clientWidth) {
      var b = tabs.children[i]; tabs.scrollTo({ left: b.offsetLeft - 24, behavior: reduce ? "auto" : "smooth" });
    }
  }
  show(0);
  if (!reduce) {
    new IntersectionObserver(function (e) {
      clearInterval(auto);
      if (e[0].isIntersecting && !userTook) auto = setInterval(function () { show((current + 1) % D.process.length, true); }, 5200);
    }, { threshold: .35 }).observe($(".process"));
  }

  /* ---------- Tabla de proyectos ---------- */
  var tbody = $("#projects tbody"), filters = $("#filters"), search = $("#search"), more = $("#ledger-more"), countEl = $("#ledger-count");
  var state = { f: "all", q: "", all: false }, LIMIT = 10;
  var maxPD = Math.max.apply(null, D.projects.map(function (p) { return p.pd; }));
  var defs = [["all", "Todos"]].concat(Object.keys(D.sectors).map(function (k) { return [k, D.sectors[k]]; })).concat([["x", "Exportación"]]);
  var match = function (p, f) { return f === "all" || (f === "x" ? !!p.x : p.s === f); };
  defs.forEach(function (d) {
    var n = D.projects.filter(function (p) { return match(p, d[0]); }).length;
    var b = document.createElement("button");
    b.type = "button"; b.dataset.f = d[0]; b.setAttribute("aria-pressed", String(d[0] === "all"));
    b.innerHTML = esc(d[1]) + "<small>" + n + "</small>";
    b.addEventListener("click", function () {
      state.f = d[0]; state.all = false;
      $$("button", filters).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      render();
    });
    filters.appendChild(b);
  });
  search.addEventListener("input", function () { state.q = norm(search.value.trim()); render(); });
  more.addEventListener("click", function () { state.all = !state.all; render(); });

  function render() {
    var list = D.projects.filter(function (p) {
      return match(p, state.f) && (!state.q || norm(p.c + " " + p.p + " " + p.l + " " + p.y + " " + D.sectors[p.s]).indexOf(state.q) > -1);
    });
    var total = list.reduce(function (a, p) { return a + p.pd; }, 0);
    var shown = (state.all || state.q) ? list : list.slice(0, LIMIT);
    tbody.innerHTML = shown.length ? shown.map(function (p) {
      var w = p.pd ? Math.max(.012, Math.sqrt(p.pd / maxPD)) : 0;
      return "<tr><td>" + esc(p.c) + (p.x ? '<span class="flag">EXPORT</span>' : "") + "</td>" +
        "<td>" + esc(p.p) + '<br><span class="sector">' + esc(D.sectors[p.s]) + "</span></td>" +
        '<td class="loc">' + esc(p.l) + '</td><td class="per">' + esc(p.y) + "</td>" +
        '<td class="num pd">' + (p.pd ? nf.format(p.pd) + " PD" : "Calificación") + '<span class="bar"><i data-w="' + w.toFixed(3) + '"></i></span></td></tr>';
    }).join("") : '<tr><td class="empty" colspan="5">Ningún proyecto coincide con esa búsqueda. Pruebe con un cliente, una región o un sector.</td></tr>';
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      $$(".bar i", tbody).forEach(function (i) { i.style.setProperty("--w", i.dataset.w); });
    }); });
    countEl.textContent = shown.length + " de " + list.length + " proyectos · " + nf.format(total) + " PD" +
      (state.f === "all" && !state.q ? " · más " + nf.format(D.otherPD) + " PD en otros proyectos nacionales" : "");
    more.hidden = !!state.q || list.length <= LIMIT;
    more.firstElementChild.textContent = state.all ? "Ver menos" : "Ver los " + list.length + " proyectos";
  }
  render();

  /* ---------- Reveal + contadores ---------- */
  var groups = new Map();
  $$("[data-reveal]").forEach(function (el) {
    var k = el.parentElement, n = groups.get(k) || 0;
    el.style.setProperty("--d", Math.min(n, 6) * 70 + "ms"); groups.set(k, n + 1);
  });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add("is-in"); io.unobserve(en.target);
      $$("[data-count]", en.target).forEach(count);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: .08 });
  $$("[data-reveal]").forEach(function (el) { io.observe(el); });

  function count(el) {
    if (reduce || el.dataset.done) return;
    el.dataset.done = "1";
    var to = parseFloat(el.dataset.count), dec = parseInt(el.dataset.decimals || "0", 10), t0 = performance.now(), dur = 1700;
    var fmt = function (v) { return dec ? v.toFixed(dec) : nf.format(Math.round(v)); };
    (function tick(t) {
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      el.textContent = fmt(to * e);
      if (k < 1) requestAnimationFrame(tick); else el.textContent = fmt(to);
    })(t0);
  }

  /* ---------- Agenda ---------- */
  var DOW = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"], MON = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  function businessDays(n) {
    var out = [], d = new Date(); d.setHours(12, 0, 0, 0);
    while (out.length < n) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) out.push({ label: DOW[d.getDay()] + " " + d.getDate() + " " + MON[d.getMonth()], dow: DOW[d.getDay()], day: d.getDate(), mon: MON[d.getMonth()] });
    }
    return out;
  }
  var days = businessDays(C.meetingDaysAhead || 8);
  window.PPS_SLOTS = { days: days.map(function (d) { return d.label; }), hours: C.meetingHours };
  $("#pick-day").innerHTML = days.map(function (d, i) {
    return '<label><input type="radio" name="dia" value="' + d.label + '"' + (i === 0 ? " checked" : "") + "><span><small>" + d.dow + "</small>" + d.day + " " + d.mon + "</span></label>";
  }).join("");
  $("#pick-time").innerHTML = C.meetingHours.map(function (h, i) {
    return '<label><input type="radio" name="hora" value="' + h + '"' + (i === 1 ? " checked" : "") + "><span>" + h + "</span></label>";
  }).join("");

  // Arma el texto de la solicitud y los enlaces de envío. Lo usan el formulario y el chat.
  window.PPS_buildRequest = function (d) {
    var lines = [
      "Solicitud de reunión · PPS",
      "",
      "Nombre:    " + d.nombre,
      "Empresa:   " + d.empresa,
      "País:      " + (d.pais || "-"),
      "Sector:    " + (d.sector || "-"),
      "Correo:    " + d.correo,
      "Teléfono:  " + (d.telefono || "-"),
      "Modalidad: " + (d.modalidad || "Videollamada"),
      "Fecha:     " + d.dia + ", " + d.hora + " (hora de Lima)"
    ];
    if (d.detalle) lines.push("", "Requerimiento:", d.detalle);
    var text = lines.join("\n");
    var subject = "Solicitud de reunión · " + d.empresa + " · " + d.dia + " " + d.hora;
    if (C.leadWebhook) {
      try { fetch(C.leadWebhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d), keepalive: true }).catch(function () {}); } catch (e) {}
    }
    return {
      text: text,
      mail: "mailto:" + C.salesEmail + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(text),
      wa: C.salesWhatsApp ? "https://wa.me/" + C.salesWhatsApp + "?text=" + encodeURIComponent(text) : ""
    };
  };

  var form = $("#booking"), err = $("#booking-error");
  var stepForm = $('[data-step="form"]', form), stepDone = $('[data-step="done"]', form);
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var d = {}; new FormData(form).forEach(function (v, k) { d[k] = String(v).trim(); });
    var bad = [];
    ["nombre", "empresa", "correo"].forEach(function (k) {
      var ok = !!d[k] && (k !== "correo" || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d[k]));
      form.elements[k].classList.toggle("is-bad", !ok); if (!ok) bad.push(k);
    });
    if (bad.length) {
      err.hidden = false;
      err.textContent = bad.indexOf("correo") > -1 && d.correo ? "Revise el correo: parece incompleto." : "Complete nombre, empresa y correo para poder confirmarle la reunión.";
      form.elements[bad[0]].focus(); return;
    }
    err.hidden = true;
    var r = window.PPS_buildRequest(d);
    $("#booking-summary").textContent = r.text;
    $("#send-mail").href = r.mail;
    var wa = $("#send-wa"); wa.hidden = !r.wa; if (r.wa) wa.href = r.wa;
    stepForm.hidden = true; stepDone.hidden = false;
    stepDone.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
  });
  $("#booking-edit").addEventListener("click", function () { stepDone.hidden = true; stepForm.hidden = false; });
})();


/* Portada: carrusel foto + video de fondo */
(function () {
  var hero = document.querySelector(".hero"); if (!hero) return;
  var slides = [].slice.call(hero.querySelectorAll("[data-slide]"));
  var dots = [].slice.call(hero.querySelectorAll(".hero__dot"));
  var tag = document.getElementById("hero-tag");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (slides.length < 2 || reduce) { var pg = document.getElementById("hero-pager"); if (pg) pg.hidden = true; return; }
  var i = 0, timer = null;

  function fit(frame) {
    var w = hero.offsetWidth, h = hero.offsetHeight, k = 1.18; // el 18 % extra oculta los rótulos del reproductor
    var fw = Math.max(w, h * 16 / 9) * k;
    frame.style.width = fw + "px"; frame.style.height = fw * 9 / 16 + "px";
  }
  function mount(slide) {
    if (slide.firstChild || !slide.dataset.yt) return;
    var id = slide.dataset.yt, f = document.createElement("iframe");
    f.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&mute=1&loop=1&playlist=" + id + "&controls=0&playsinline=1&rel=0&disablekb=1&iv_load_policy=3&modestbranding=1";
    f.allow = "autoplay; encrypted-media"; f.title = "Video de fondo"; f.tabIndex = -1;
    fit(f); slide.appendChild(f);
  }
  function show(n) {
    i = (n + slides.length) % slides.length;
    slides.forEach(function (s, k) { s.classList.toggle("is-on", k === i); });
    var hold = +slides[i].dataset.hold || 7000, isVideo = !!slides[i].dataset.yt;
    dots.forEach(function (d, k) { d.classList.remove("is-on"); d.style.setProperty("--hold", hold + "ms"); if (k === i) { void d.offsetWidth; d.classList.add("is-on"); } });
    hero.classList.toggle("is-video", isVideo);
    if (tag) tag.hidden = !isVideo;
    clearTimeout(timer); timer = setTimeout(function () { show(i + 1); }, hold);
  }
  dots.forEach(function (d, k) { d.addEventListener("click", function () { slides.forEach(mount); show(k); }); });
  window.addEventListener("resize", function () { slides.forEach(function (s) { if (s.firstChild && s.firstChild.tagName === "IFRAME") fit(s.firstChild); }); });
  window.addEventListener("load", function () { setTimeout(function () { slides.forEach(mount); }, 1200); });
  dots[0].style.setProperty("--hold", (+slides[0].dataset.hold || 7000) + "ms");
  timer = setTimeout(function () { show(1); }, +slides[0].dataset.hold || 7000);
})();

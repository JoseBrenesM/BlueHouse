// Menú móvil (igual que la landing formal)
(function () {
  var b = document.querySelector('.menu-b'), p = document.getElementById('panel');
  if (!b || !p) return;
  function cerrar(foco) { p.classList.remove('abierto'); b.setAttribute('aria-expanded', 'false'); if (foco) b.focus(); }
  b.addEventListener('click', function () {
    if (b.getAttribute('aria-expanded') === 'true') cerrar(false);
    else { p.style.top = Math.round(document.querySelector('header.barra').getBoundingClientRect().bottom) + 'px'; p.classList.add('abierto'); b.setAttribute('aria-expanded', 'true'); p.querySelector('a').focus(); }
  });
  p.addEventListener('click', function (e) { if (e.target.closest('a')) cerrar(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && p.classList.contains('abierto')) cerrar(true); });
})();
// Encabezado: toma el tono de lo que pasa por debajo (igual que la landing formal)
(function () {
  var h = document.querySelector('header.barra');
  if (!h) return;
  var pendiente = false;
  var tono = function () {
    pendiente = false;
    var y = h.getBoundingClientRect().bottom + 2;
    var el = document.elementFromPoint(24, y);
    var t = '';
    if (el && el.closest('.recorrido')) t = 'foto';
    else if (el && el.closest('.oscuro')) t = 'oscuro';
    else if (el && el.closest('.papel')) t = 'papel';
    h.classList.toggle('sobre-foto', t === 'foto');
    h.classList.toggle('sobre-oscuro', t === 'oscuro');
    h.classList.toggle('sobre-papel', t === 'papel');
  };
  window.__tono = tono;
  window.addEventListener('scroll', function () { if (!pendiente) { pendiente = true; requestAnimationFrame(tono); } }, { passive: true });
  window.addEventListener('resize', tono);
  tono();
})();

// Acerca de Blue House: pestañas accesibles que avanzan solas (se detienen al tocarlas o con movimiento reducido)
(function () {
  var sec = document.querySelector('.acerca');
  if (!sec) return;
  var tabs = Array.prototype.slice.call(sec.querySelectorAll('[role="tab"]'));
  var panes = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
  var actual = 0, auto = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ir = function (n, porUsuario) {
    n = (n + tabs.length) % tabs.length;
    if (porUsuario) { auto = false; sec.classList.remove('auto'); }
    if (n === actual) return;
    tabs.forEach(function (t, i) { t.setAttribute('aria-selected', i === n ? 'true' : 'false'); t.tabIndex = i === n ? 0 : -1; });
    panes[actual].hidden = true;
    panes[n].hidden = false;
    actual = n;
    if (window.__animarPanel) window.__animarPanel(panes[n]);
    if (porUsuario) tabs[n].scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { ir(i, true); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); ir(actual + 1, true); tabs[actual].focus(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); ir(actual - 1, true); tabs[actual].focus(); }
    });
    t.querySelector('.barra-t').addEventListener('animationend', function () { if (auto) ir(actual + 1, false); });
  });
  // Avanza solo cuando la sección está a la vista
  if (auto && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (auto) sec.classList.toggle('auto', x.isIntersecting); });
    }, { threshold: 0.35 }).observe(sec);
  }
  // Deslizar en el celular
  var x0 = null;
  sec.querySelector('.paneles').addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  sec.querySelector('.paneles').addEventListener('touchend', function (e) {
    if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) ir(actual + (dx < 0 ? 1 : -1), true);
  }, { passive: true });
})();

(function () {
  var raiz = document.documentElement;
  var quitarIntro = function () { raiz.classList.remove('con-intro', 'intro-lock'); var t = document.querySelector('.telon'); if (t) t.style.display = 'none'; };
  if (!window.gsap || !window.ScrollTrigger) { quitarIntro(); return; } // sin librerías: página completa y quieta
  gsap.registerPlugin(ScrollTrigger);
  var mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', function () {
    // Scroll con inercia (Lenis), atado al reloj de GSAP
    var lenis = null, latido = null;
    if (window.Lenis) {
      lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
      lenis.on('scroll', function () { ScrollTrigger.update(); if (window.__tono) window.__tono(); });
      latido = function (t) { lenis.raf(t * 1000); };
      gsap.ticker.add(latido);
      gsap.ticker.lagSmoothing(0);
      document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
          var id = a.getAttribute('href'); var dest = id.length > 1 && document.querySelector(id);
          if (!dest) return; e.preventDefault(); lenis.scrollTo(dest, { offset: -64, duration: 1.4 });
        });
      });
    }

    // ---- Recorrido: la cámara nunca se detiene; avanza, camina al siguiente cuarto y se funde con él ----
    var sec = document.getElementById('inicio');
    var pasos = Array.prototype.slice.call(sec.querySelectorAll('.paso'));
    var imgs = pasos.map(function (p) { return p.querySelector('img'); });
    var fichas = pasos.map(function (p) { return p.querySelector('.ficha'); });
    var pista = sec.querySelector('.pista');
    sec.classList.add('vivo');
    var cine = sec.querySelector('.cine'), video = cine.querySelector('video');
    var EN_VIDEO = 4, marcas = [0, 5.06, 10.15, 13.95];   // segundo del video donde queda cada cuarto
    pasos.forEach(function (p, i) {
      imgs[i].style.objectPosition = p.dataset.ver + ' 50%';
      imgs[i].loading = 'eager';
      if (i < EN_VIDEO) p.classList.add('en-video');
      gsap.set(p, { zIndex: i < EN_VIDEO ? 20 - i : pasos.length - i, autoAlpha: 1 });
      gsap.set(imgs[i], { transformOrigin: p.dataset.foco, scale: 1, force3D: true });
      if (i) gsap.set(fichas[i], { autoAlpha: 0, y: 28 });
    });
    gsap.set(cine, { zIndex: 10, transformOrigin: '58% 60%' });
    var figuras = pasos.map(function (p) { return p.querySelector('figure'); });
    var reloj = { t: 0 };
    var tl = gsap.timeline({ defaults: { ease: 'none' } });
    tl.to(pista, { autoAlpha: 0, duration: 0.3 }, 0);
    var lectura = 1.1, camino = 1.3, fundido = 0.75, t = 0, inicios = [], esperas = [];
    for (var i = 0; i < pasos.length - 1; i++) {
      // Tramos en video: la cámara camina más tiempo (2.2) y arranca casi apenas sale de la parada
      var enVideo = i < EN_VIDEO - 1;
      lectura = enVideo ? (i === 0 ? 0.3 : 0.6) : 1.1; camino = enVideo ? 2.2 : 1.3;
      inicios.push(t); esperas.push(lectura);
      var inicioFundido = t + lectura + camino - fundido;
      if (i < EN_VIDEO - 1) {
        // El video camina al cuarto siguiente; si no cargó, quedan las fotos con su fundido
        tl.to(reloj, { t: marcas[i + 1], duration: camino, ease: 'none' }, t + lectura);   // el clip ya acelera y frena solo
        tl.to(figuras[i], { autoAlpha: 0, duration: fundido, ease: 'sine.inOut' }, inicioFundido);
      } else {
        var capa = i === EN_VIDEO - 1 ? [imgs[i], cine] : imgs[i];
        tl.to(capa, { scale: 1.12, duration: lectura }, t);
        tl.to(capa, { scale: 1.75, duration: camino, ease: 'sine.in' }, t + lectura);
        tl.to([pasos[i], i === EN_VIDEO - 1 ? cine : null].filter(Boolean), { autoAlpha: 0, duration: fundido, ease: 'sine.inOut' }, inicioFundido);
        tl.fromTo(imgs[i + 1], { scale: 0.96 }, { scale: 1, duration: fundido + 0.2, ease: 'sine.out' }, inicioFundido);
      }
      tl.to(fichas[i], { autoAlpha: 0, y: -20, duration: 0.35, ease: 'sine.in' }, t + lectura + 0.15);
      tl.to(fichas[i + 1], { autoAlpha: 1, y: 0, duration: 0.4, ease: 'sine.out' }, t + lectura + camino - 0.1);
      t += lectura + camino;
    }
    inicios.push(t); esperas.push(1.1);
    tl.to(imgs[pasos.length - 1], { scale: 1.08, duration: 0.9 }, t);

    // El video se descarga entero (para que adelantar y retroceder sea inmediato) y se muestra cuando está listo
    var quietas = Array.prototype.slice.call(cine.querySelectorAll('.quieta')), enParada = 0;
    var pintar = function () {
      if (video.readyState >= 2 && !video.seeking && Math.abs(video.currentTime - reloj.t) > 0.02) video.currentTime = reloj.t;
      // Foto nítida solo cuando el video está detenido en un cuarto y ya mostró ese cuadro
      var k = -1; marcas.forEach(function (m, i) { if (Math.abs(reloj.t - m) < 0.03) k = i; });
      if (k >= 0 && (video.seeking || Math.abs(video.currentTime - marcas[k]) > 0.06)) k = enParada;
      if (k !== enParada) { quietas.forEach(function (q, i) { q.classList.toggle('ver', i === k); }); enParada = k; }
    };
    // En pantallas verticales se baja solo la franja que se ve (recortada en el mismo punto que las fotos, al 60 %);
    // con ahorro de datos o conexión 2G se queda con las fotos. La descarga empieza cuando la página ya cargó.
    var red = navigator.connection || {}, ahorro = red.saveData || /(^|-)2g$/.test(red.effectiveType || '');
    var archivo = matchMedia('(max-aspect-ratio: 63/100)').matches ? 'video/recorrido-movil.mp4' : 'video/recorrido.mp4';
    var usarFuente = function (src, evento) {
      video.src = src;
      video.addEventListener(evento, function () {
        // Safari en iPhone no pinta los cuadros al adelantar hasta que el video se reprodujo una vez
        var listo = function () { video.currentTime = reloj.t; sec.classList.add('con-video'); gsap.ticker.add(pintar); };
        var p = video.play(); if (p && p.then) p.then(function () { video.pause(); listo(); }, listo); else { video.pause(); listo(); }
      }, { once: true });
      video.load();
    };
    var cargarVideo = function () {
      if (ahorro) return;
      // Abierta con doble clic (file://) el navegador no deja descargarlo con fetch: se carga directo en el <video>
      if (location.protocol === 'file:') { video.preload = 'auto'; usarFuente(archivo, 'canplaythrough'); return; }
      fetch(archivo).then(function (r) { if (!r.ok) throw 0; return r.blob(); })
        .then(function (b) { usarFuente(URL.createObjectURL(b), 'loadeddata'); })
        .catch(function () { video.preload = 'auto'; usarFuente(archivo, 'canplaythrough'); });
    };
    if (document.readyState === 'complete') cargarVideo(); else window.addEventListener('load', cargarVideo, { once: true });
    var st = ScrollTrigger.create({ trigger: sec, start: 'top top', end: '+=' + (pasos.length * 110) + '%', pin: true, scrub: 0.8, animation: tl, invalidateOnRefresh: true });

    // ---- Recorrido por pasos: cada gesto (rueda, dedo o tecla), fuerte o suave, lleva al cuarto siguiente o al anterior
    //      con la misma animación; nunca queda a medio camino entre dos fotos ----
    var paradas = [0];
    for (var q = 1; q < pasos.length; q++) paradas.push(Math.min(inicios[q] + esperas[q] - 0.1, tl.duration() - 0.05));
    var yDe = function (T) { return st.start + (T / tl.duration()) * (st.end - st.start); };
    var tActual = function () { var y = window.scrollY; return gsap.utils.clamp(0, tl.duration(), (y - st.start) / (st.end - st.start) * tl.duration()); };
    var enZona = function () { var y = window.scrollY; return y >= st.start - 2 && y <= st.end - 2; };
    var paradaHacia = function (dir) {
      var T = tActual(), i;
      if (dir > 0) { for (i = 0; i < paradas.length; i++) if (paradas[i] > T + 0.05) return paradas[i]; }
      else { for (i = paradas.length - 1; i >= 0; i--) if (paradas[i] < T - 0.05) return paradas[i]; }
      return null;
    };
    var moviendo = false, ultimaDir = 1, pendiente = 0;
    var paso = null, turno = 0;
    var irA = function (T) {
      moviendo = true;
      var mio = ++turno, y = yDe(T), o = { y: window.scrollY };
      // Un tramo en video dura 2.2 s y uno de fotos 1.9 s, medidos contra la distancia real entre las dos paradas
      var Tn = tActual(), k = paradas.indexOf(T), vecino = paradas[k - (T > Tn ? 1 : -1)];
      var tramoT = vecino === undefined ? Math.abs(T - Tn) : Math.abs(T - vecino);
      var dur = (T <= paradas[EN_VIDEO - 1] + 0.01 && tActual() <= paradas[EN_VIDEO - 1] + 0.01 ? 2.2 : 1.9) * gsap.utils.clamp(0.4, 1.6, Math.abs(T - Tn) / Math.max(0.01, tramoT));
      if (lenis) lenis.stop();
      if (paso) paso.kill();
      var fin = function () {
        if (mio !== turno || !moviendo) return;   // un aviso viejo no toca el paso actual
        moviendo = false; paso = null;
        if (lenis) { lenis.start(); lenis.scrollTo(y, { immediate: true, force: true }); }
        if (pendiente) { var d = pendiente; pendiente = 0; gsap.delayedCall(0.05, function () { if (gesto(d)) rafagaUsada = true; }); }
      };
      paso = gsap.to(o, { y: y, duration: dur, ease: 'sine.out', onUpdate: function () { window.scrollTo(0, o.y); }, onComplete: fin });
      gsap.delayedCall(dur + 0.6, fin);          // seguro: nunca queda trabado
    };
    var conIntro = function () { return document.documentElement.classList.contains('con-intro'); };
    // Devuelve true si el gesto lo maneja el recorrido (y hay que frenar el scroll normal)
    var gesto = function (dir) {
      if (conIntro() || !enZona()) return false;
      if (moviendo) return true;
      var T = paradaHacia(dir);
      if (T === null) return false;           // primer cuarto hacia arriba o último hacia abajo: scroll normal
      ultimaDir = dir; irA(T); return true;
    };
    // Rueda o trackpad: una ráfaga continua cuenta como un solo gesto
    var ultimaRueda = 0, rafagaUsada = false;
    var rueda = function (e) {
      if (conIntro() || Math.abs(e.deltaY) < 1) return;
      var ahora = performance.now(), continua = ahora - ultimaRueda < 160; ultimaRueda = ahora;
      if (!continua) rafagaUsada = false;
      if (!enZona()) return;
      var dir = e.deltaY > 0 ? 1 : -1;
      if (moviendo && !continua) pendiente = dir;   // gesto nuevo mientras camina: se cumple al llegar
      if (moviendo || rafagaUsada) { if (paradaHacia(dir) !== null || moviendo) { e.preventDefault(); e.stopImmediatePropagation(); } return; }
      if (gesto(dir)) { rafagaUsada = true; e.preventDefault(); e.stopImmediatePropagation(); }
    };
    // Dedo: cualquier deslizamiento, corto o largo, cambia de cuarto
    var y0 = null, dedoDir = 0, dedoUsado = false;
    var tocar = function (e) { y0 = e.touches[0].clientY; dedoDir = 0; dedoUsado = false; };
    var mover = function (e) {
      if (y0 === null || conIntro() || !enZona()) return;
      var dy = y0 - e.touches[0].clientY;
      if (!dedoDir && Math.abs(dy) > 4) dedoDir = dy > 0 ? 1 : -1;
      if (!dedoDir) return;
      if (moviendo && !dedoUsado && Math.abs(dy) > 18) { dedoUsado = true; pendiente = dedoDir; }
      if (moviendo || dedoUsado) { if (e.cancelable) e.preventDefault(); return; }
      if (paradaHacia(dedoDir) === null) return;
      if (e.cancelable) e.preventDefault();
      if (Math.abs(dy) > 18) { dedoUsado = true; gesto(dedoDir); }
    };
    var soltar = function () { y0 = null; };
    var tecla = function (e) {
      var t = e.target; if (t && (t.isContentEditable || /INPUT|TEXTAREA|SELECT|BUTTON/.test(t.tagName))) return;
      var dir = { ArrowDown: 1, PageDown: 1, ' ': e.shiftKey ? -1 : 1, ArrowUp: -1, PageUp: -1 }[e.key];
      if (dir && gesto(dir)) e.preventDefault();
    };
    window.addEventListener('wheel', rueda, { passive: false, capture: true });
    window.addEventListener('touchstart', tocar, { passive: true });
    window.addEventListener('touchmove', mover, { passive: false });
    window.addEventListener('touchend', soltar, { passive: true });
    window.addEventListener('keydown', tecla);
    // Si el scroll termina a medio camino (barra de scroll, inercia, enlace), se acomoda en el cuarto más cercano en la dirección que venía
    var vieneDe = window.scrollY;
    var alTerminar = function () {
      var y = window.scrollY; if (y !== vieneDe) ultimaDir = y > vieneDe ? 1 : -1; vieneDe = y;
      if (moviendo || conIntro() || !enZona()) return;
      var T = tActual(), cerca = paradas.some(function (p) { return Math.abs(p - T) < 0.06; });
      if (cerca || T > paradas[paradas.length - 1]) return;
      var dest = paradaHacia(ultimaDir); if (dest === null) dest = paradaHacia(-ultimaDir);
      if (dest !== null) irA(dest);
    };
    ScrollTrigger.addEventListener('scrollEnd', alTerminar);
    var quitarPasos = function () {
      window.removeEventListener('wheel', rueda, { capture: true });
      window.removeEventListener('touchstart', tocar); window.removeEventListener('touchmove', mover); window.removeEventListener('touchend', soltar);
      window.removeEventListener('keydown', tecla); ScrollTrigger.removeEventListener('scrollEnd', alTerminar);
    };

    // ---- Acerca: al cambiar de pestaña, la foto entra con un barrido y el texto sube ----
    window.__animarPanel = function (pane) {
      var foto = pane.querySelector('.foto-a img'), textos = pane.querySelectorAll('.texto-a > :not(.asesores), .asesores li');
      if (foto) gsap.fromTo(foto, { clipPath: 'inset(0 0 0 100%)', scale: 1.08 }, { clipPath: 'inset(0 0 0 0%)', scale: 1, duration: 1.1, ease: 'expo.out' });
      gsap.fromTo(textos, { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .7, stagger: .07, ease: 'power3.out', delay: .15 });
    };

    // ---- Servicios: cada dibujo se traza al aparecer ----
    gsap.utils.toArray('.dib').forEach(function (svg) {
      var trazos = svg.querySelectorAll('path');
      trazos.forEach(function (t) { var L = t.getTotalLength(); t.style.strokeDasharray = L; t.style.strokeDashoffset = L; });
      gsap.to(trazos, { strokeDashoffset: 0, duration: 1.2, stagger: .18, ease: 'power2.inOut',
        scrollTrigger: { trigger: svg, start: 'top 88%', toggleActions: 'play none none reverse' } });
    });

    // ---- Propiedades: la foto se descubre de abajo hacia arriba ----
    gsap.utils.toArray('.anuncio figure').forEach(function (f) {
      gsap.fromTo(f, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.2, ease: 'expo.out',
        scrollTrigger: { trigger: f, start: 'top 85%', toggleActions: 'play none none reverse' } });
      gsap.fromTo(f.querySelector('img'), { scale: 1.15 }, { scale: 1, duration: 1.6, ease: 'expo.out',
        scrollTrigger: { trigger: f, start: 'top 85%', toggleActions: 'play none none reverse' } });
    });

    // ---- Construcción: el riel avanza con el scroll y enciende cada paso ----
    var lista = document.querySelector('.pasos');
    if (lista) {
      lista.classList.add('vivo');
      var filas = Array.prototype.slice.call(lista.querySelectorAll('li'));
      gsap.fromTo(lista.querySelector('.riel i'), { scaleY: 0 }, { scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: lista, start: 'top 60%', end: 'bottom 60%', scrub: .4,
          onUpdate: function (self) { var k = Math.round(self.progress * (filas.length - 1)); filas.forEach(function (f, i) { f.classList.toggle('activo', i <= k && self.progress > 0.01); }); } } });
    }

    // ---- Propietarios: la foto se desliza y el rótulo se planta; el aviso se voltea entre vender y alquilar ----
    (function () {
      var fp = document.querySelector('.foto-p');
      if (!fp) return;
      gsap.fromTo(fp.querySelector('img'), { yPercent: -4 }, { yPercent: 4, ease: 'none', scrollTrigger: { trigger: fp, start: 'top bottom', end: 'bottom top', scrub: .5 } });
      var rot = fp.querySelector('.rotulo-p'), cara = rot.querySelector('.cara'), textos = ['Se vende', 'Se alquila'], k = 0, giro = null;
      gsap.set(rot, { yPercent: 140 });
      var voltear = function () {
        gsap.timeline()
          .to(cara, { rotateX: 90, duration: .28, ease: 'power2.in', onComplete: function () { k = 1 - k; cara.textContent = textos[k]; } })
          .to(cara, { rotateX: 0, duration: .4, ease: 'back.out(2)' });
      };
      ScrollTrigger.create({ trigger: fp, start: 'top 70%', end: 'bottom top',
        onEnter: function () {
          gsap.to(rot, { yPercent: 0, duration: .9, ease: 'back.out(1.4)', overwrite: true });
          if (!giro) giro = setInterval(voltear, 3200);
        },
        onLeave: function () { clearInterval(giro); giro = null; },
        onEnterBack: function () { if (!giro) giro = setInterval(voltear, 3200); },
        onLeaveBack: function () { clearInterval(giro); giro = null; gsap.to(rot, { yPercent: 140, duration: .5, ease: 'power2.in', overwrite: true }); }
      });
      gsap.from('.encargos li', { x: -16, autoAlpha: 0, duration: .6, stagger: .09, ease: 'power3.out', scrollTrigger: { trigger: '.encargos', start: 'top 80%', toggleActions: 'play none none reverse' } });
    })();

    // ---- Lema: la foto de las llaves se acerca y el texto sube ----
    gsap.fromTo('.entrega img', { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.entrega', start: 'top bottom', end: 'bottom bottom', scrub: .6 } });
    gsap.from('.entrega .lema p', { y: 40, autoAlpha: 0, duration: 1, stagger: .15, ease: 'power3.out', scrollTrigger: { trigger: '.entrega', start: 'top 55%', toggleActions: 'play none none reverse' } });

    // ---- Intro (Sello BRN), igual que en la landing formal: la H sube como edificio, la B toma volumen y vuela al encabezado ----
    var telon = document.querySelector('.telon'), destino = document.querySelector('.barra .marca .monograma');
    var terminar = function () { quitarIntro(); if (destino) destino.style.visibility = 'visible'; if (lenis) lenis.start(); ScrollTrigger.refresh(); if (window.__tono) window.__tono(); };
    if (telon && destino && raiz.classList.contains('con-intro') && window.scrollY < 40) {
      window.__introBRN = true;
      if (lenis) lenis.stop();
      raiz.classList.add('intro-lock');
      var copia = destino.cloneNode(true);
      copia.classList.add('sello');
      telon.insertBefore(copia, telon.querySelector('.t-marca'));
      var a = destino.getBoundingClientRect(), b = copia.getBoundingClientRect();
      var dx = a.left + a.width / 2 - (b.left + b.width / 2), dy = a.top + a.height / 2 - (b.top + b.height / 2), esc = a.width / (b.width || 1);
      var torre = copia.querySelector('.h-torre'), barra = copia.querySelector('.h-barra'), torre2 = copia.querySelector('.h-torre2');
      var canto = copia.querySelector('.b-canto'), cara = copia.querySelector('.b-cara');
      // Sobre el marino usa los colores del manual sobre azul; el encabezado queda sobre la foto (tono oscuro), así que los conserva al llegar.
      var sobreAzul = { '#8A8A8A': '#C6CBD0', '#C5C5C5': '#FFFFFF', '#02527E': '#0070AE', '#033756': '#008BC6' };
      Array.prototype.slice.call(copia.querySelectorAll('[fill]')).forEach(function (e) { var f = e.getAttribute('fill'); if (sobreAzul[f]) e.setAttribute('fill', sobreAzul[f]); });
      gsap.set([torre, torre2], { scaleY: 0, transformOrigin: '50% 100%' });
      gsap.set(barra, { scaleX: 0, transformOrigin: '0% 50%' });
      gsap.set(cara, { autoAlpha: 0, y: 10 });
      gsap.set(canto, { autoAlpha: 0, x: 0 });
      var it = gsap.timeline({ defaults: { ease: 'expo.out' }, onComplete: terminar });
      it.to(torre, { scaleY: 1, duration: .8, ease: 'power3.out' }, .15)
        .to(barra, { scaleX: 1, duration: .35, ease: 'power2.out' }, .62)
        .to(torre2, { scaleY: 1, duration: .55, ease: 'power3.out' }, .72)
        .to(cara, { autoAlpha: 1, y: 0, duration: .55, ease: 'power3.out' }, .9)
        .to(canto, { autoAlpha: 1, x: 6, duration: .6, ease: 'power3.out' }, 1.1)
        .from('.telon .t-marca', { y: 18, autoAlpha: 0, duration: .8 }, 1.1)
        .from('.telon .t-linea', { y: 12, autoAlpha: 0, duration: .7 }, 1.3)
        .to('.telon .t-marca, .telon .t-linea', { y: -10, autoAlpha: 0, duration: .3, ease: 'power2.in' }, 2.05)
        .to(copia, { x: dx, y: dy, scale: esc, duration: .8, ease: 'expo.inOut' }, 2.1)
        .to('.telon .velo', { autoAlpha: 0, duration: .45, ease: 'power2.out' }, 2.3);
      var saltar = function () { it.timeScale(4); };
      telon.addEventListener('click', saltar);
      window.addEventListener('wheel', saltar, { once: true, passive: true });
      window.addEventListener('touchmove', saltar, { once: true, passive: true });
      window.addEventListener('keydown', saltar, { once: true });
    } else {
      terminar();
    }

    return function () {
      quitarIntro(); quitarPasos(); sec.classList.remove('vivo');
      pasos.forEach(function (p) { gsap.set(p, { clearProps: 'all' }); });
      gsap.ticker.remove(pintar);
      if (lenis) { gsap.ticker.remove(latido); lenis.destroy(); }
    };
  });
  mm.add('(prefers-reduced-motion: reduce)', function () { quitarIntro(); });
})();

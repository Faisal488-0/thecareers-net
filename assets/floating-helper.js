/* Original visual-only floating helper. No Avatar Lab code, analytics, network or AI calls. */
(() => {
  'use strict';
  if (window.FLOATING_HELPER_ENABLED === false || !document.body || document.getElementById('fh-root')) return;
  const ar = document.documentElement.lang.toLowerCase().startsWith('ar');
  const labels = ar ? {
    open: 'المساعد البصري العائم', description: 'أيقونة إرشادية فقط؛ لا تقرأ بياناتك ولا ترسل طلبات.',
    move: 'اسحب الأيقونة أو استخدم الأسهم لتحريكها.',
    roam: 'تفعيل الحركة الهادئة', stop: 'إيقاف الحركة الهادئة', hide: 'إخفاء', show: 'إظهار', close: 'إغلاق'
  } : {
    open: 'Floating visual helper', description: 'Visual guide only; no personal data access or network requests.',
    move: 'Drag the icon or use arrow keys to reposition.',
    roam: 'Enable gentle movement', stop: 'Stop gentle movement', hide: 'Hide', show: 'Show', close: 'Close'
  };
  const key = 'thecareers-floating-helper-v1';
  const size = 52;
  const margin = 12;
  const clamp = (value, min, max) => Math.max(min, Math.min(value, Math.max(min, max)));
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (_) {}
  let x = Number.isFinite(stored.x) ? stored.x : innerWidth - size - 16;
  let y = Number.isFinite(stored.y) ? stored.y : innerHeight - size - 110;
  let hidden = stored.hidden === true;
  let roam = stored.roam === true;
  let opened = false;
  let drag = null;
  let moved = false;
  const host = document.createElement('div');
  host.id = 'fh-root';
  host.className = 'fh-root';
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'fh-trigger';
  trigger.textContent = '✦';
  trigger.setAttribute('aria-label', labels.open + '. ' + labels.move);
  trigger.setAttribute('aria-expanded', 'false');
  const panel = document.createElement('section');
  panel.className = 'fh-panel';
  panel.setAttribute('aria-label', labels.open);
  panel.hidden = true;
  const heading = document.createElement('strong');
  heading.textContent = labels.open;
  const description = document.createElement('p');
  description.textContent = labels.description + ' ' + labels.move;
  const movement = document.createElement('button');
  movement.type = 'button';
  const visibility = document.createElement('button');
  visibility.type = 'button';
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = labels.close;
  panel.append(heading, description, movement, visibility, close);
  host.append(trigger, panel);
  document.body.append(host);
  const save = () => {
    try { localStorage.setItem(key, JSON.stringify({ x, y, hidden, roam })); } catch (_) {}
  };
  const draw = () => {
    x = clamp(x, margin, innerWidth - size - margin);
    y = clamp(y, margin, innerHeight - size - margin);
    host.style.left = x + 'px';
    host.style.top = y + 'px';
    panel.style.left = x < innerWidth / 2 ? '0' : 'auto';
    panel.style.right = x < innerWidth / 2 ? 'auto' : '0';
    panel.style.bottom = y > innerHeight / 2 ? 'calc(100% + 10px)' : 'auto';
    panel.style.top = y > innerHeight / 2 ? 'auto' : 'calc(100% + 10px)';
    trigger.textContent = hidden ? '+' : '✦';
    trigger.setAttribute('aria-label', hidden ? labels.show : labels.open + '. ' + labels.move);
    trigger.setAttribute('aria-expanded', String(opened && !hidden));
    panel.hidden = !opened || hidden;
    movement.textContent = roam ? labels.stop : labels.roam;
    visibility.textContent = labels.hide;
    save();
  };
  trigger.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    drag = { px: event.clientX, py: event.clientY, x, y };
    moved = false;
    trigger.setPointerCapture(event.pointerId);
  });
  trigger.addEventListener('pointermove', event => {
    if (!drag) return;
    const dx = event.clientX - drag.px, dy = event.clientY - drag.py;
    if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
    if (moved) { x = drag.x + dx; y = drag.y + dy; draw(); }
  });
  const stopDrag = () => { drag = null; };
  trigger.addEventListener('pointerup', stopDrag);
  trigger.addEventListener('pointercancel', stopDrag);
  trigger.addEventListener('click', () => {
    if (moved) { moved = false; return; }
    if (hidden) hidden = false;
    else opened = !opened;
    draw();
  });
  trigger.addEventListener('keydown', event => {
    const step = { ArrowUp: [0,-24], ArrowDown: [0,24], ArrowLeft: [-24,0], ArrowRight: [24,0] }[event.key];
    if (step) { event.preventDefault(); x += step[0]; y += step[1]; draw(); }
    if (event.key === 'Escape') { opened = false; draw(); }
  });
  movement.addEventListener('click', () => { roam = !roam; draw(); });
  visibility.addEventListener('click', () => { hidden = true; opened = false; draw(); trigger.focus(); });
  close.addEventListener('click', () => { opened = false; draw(); trigger.focus(); });
  window.addEventListener('resize', draw, { passive: true });
  window.setInterval(() => {
    if (!roam || hidden || opened || drag || document.hidden || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    y = y < innerHeight / 2 ? innerHeight - size - 120 : 100;
    draw();
  }, 18000);
  draw();
})();

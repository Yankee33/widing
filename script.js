/* ====== НАЛАШТУВАННЯ — міняй тут ====== */
const CONFIG = {
  groom: 'Василь',
  bride: 'Людмила',
  date: '2027-08-27T10:30:00',        // дата й час церемонії
  secondDay: '',                      // напр. '28.08.2027'; '' = питання про другий день прибране
  places: [
    { title: 'Місце церемонії', address: 'Прага, Чехія',  map: 'https://www.google.com/maps/search/?api=1&query=Prague' },
    { title: 'Місце святкування', address: 'Прага, Чехія', map: 'https://www.google.com/maps/search/?api=1&query=Prague' }
  ],
  // Куди слати анкети: URL Google Apps Script / Formspree. Порожньо = тільки повідомлення "дякуємо".
  telegram: 'https://t.me/',          // посилання на Telegram-групу гостей
  formEndpoint: ''
};
/* ======================================= */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const MONTHS = ['січень','лютий','березень','квітень','травень','червень','липень','серпень','вересень','жовтень','листопад','грудень'];
const pad = n => String(n).padStart(2, '0');

/* ---------- підстановка даних ---------- */
const target = new Date(CONFIG.date);
const names = `${CONFIG.groom} & ${CONFIG.bride}`;
$$('[data-names]').forEach(el => el.textContent = names);
$$('[data-names-caps]').forEach(el => el.textContent = names);
$('[data-month]').textContent = MONTHS[target.getMonth()];
$('[data-day]').textContent = target.getDate();
$('[data-year]').textContent = target.getFullYear();
$('[data-date-short]').textContent = `${pad(target.getDate())}.${pad(target.getMonth() + 1)}.${target.getFullYear()}`;
CONFIG.places.forEach((p, i) => {
  $(`[data-place-title="${i}"]`).textContent = p.title;
  $(`[data-place-addr="${i}"]`).textContent = p.address;
  $(`[data-map="${i}"]`).href = p.map;
});
$('#tgLink').href = CONFIG.telegram;
if (CONFIG.secondDay) {
  $('[data-second-day]').textContent = `Чи плануєте Ви бути на другому дні весілля (${CONFIG.secondDay})?`;
} else {
  $('#day2Set').remove();
}

/* ---------- перли на клапані конверта ---------- */
function layoutEnvelope() {
  const flap = $('#flap');
  if (!flap) return;
  const w = flap.clientWidth, h = flap.clientHeight;
  const svg = $('#flapSvg');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  const size = Math.max(16, w * 0.052);               // діаметр перлини
  const gap = size * 1.12;                            // крок
  const yEdge = h * 0.667 - size * 0.15;
  const d = `M${-size},${yEdge - size * 0.1} L${w / 2},${h - size * 0.45} L${w + size},${yEdge - size * 0.1}`;
  const base = $('#pearlBase'), shine = $('#pearlShine');
  base.setAttribute('d', d);
  base.setAttribute('stroke-width', size);
  base.setAttribute('stroke-dasharray', `0 ${gap}`);
  shine.setAttribute('d', d);
  shine.setAttribute('stroke-width', size * 0.38);
  shine.setAttribute('stroke-dasharray', `0 ${gap}`);
  shine.setAttribute('transform', `translate(${-size * 0.16},${-size * 0.18})`);
}
layoutEnvelope();
addEventListener('resize', layoutEnvelope);

/* ---------- відкриття конверта ---------- */
const intro = $('#intro');
const env = $('#envelope');
let opened = false;

function openEnvelope() {
  if (opened) return;
  opened = true;
  env.classList.add('open');
  intro.classList.add('opened');
  if (navigator.vibrate) navigator.vibrate(20);
  setTimeout(() => intro.classList.add('out'), 2900);     // конверт зникає, лишається лист
  setTimeout(() => intro.classList.add('leave'), 3800);   // лист розчиняється — з'являється сайт
  setTimeout(() => {
    document.body.classList.remove('locked');
    intro.remove();
    startReveal();
  }, 4900);
}
env.addEventListener('click', openEnvelope);
env.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEnvelope(); }
});

/* ---------- кружечки дрес-коду: підготовка (стартують із першої позиції) ---------- */
function prepSwatches() {
  $$('.swatches').forEach(row => {
    if (row.classList.contains('go')) return;
    const items = $$('.sw', row);
    items.forEach(s => { s.style.setProperty('--dx', '0px'); s.style.setProperty('--rot', '0deg'); });
    const first = items[0].getBoundingClientRect();
    const r = first.width / 2;
    items.forEach(s => {
      const dx = first.left - s.getBoundingClientRect().left;     // від'ємне: стартують зліва
      const rot = (dx / r) * (180 / Math.PI);                      // кочення: відстань / радіус
      s.style.setProperty('--dx', dx + 'px');
      s.style.setProperty('--rot', rot + 'deg');
    });
  });
}
prepSwatches();
addEventListener('resize', prepSwatches);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(prepSwatches);

/* ---------- поява при скролі ---------- */
function startReveal() {
  $('#hero').classList.add('in-view');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      if (e.target.classList.contains('swatches')) e.target.classList.add('go');
      io.unobserve(e.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal, .swatches').forEach(el => io.observe(el));
}

/* ---------- деталі: бульбашки ---------- */
$$('.detail__btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const row = btn.closest('.detail');
    const wasOpen = row.classList.contains('open');
    $$('.detail.open').forEach(d => d.classList.remove('open'));
    if (!wasOpen) row.classList.add('open');
  });
});

/* ---------- зворотний відлік ---------- */
const tEls = { d: $('[data-t=d]'), h: $('[data-t=h]'), m: $('[data-t=m]'), s: $('[data-t=s]') };
function tick() {
  let diff = Math.max(0, target - new Date());
  const d = Math.floor(diff / 864e5); diff %= 864e5;
  const h = Math.floor(diff / 36e5);  diff %= 36e5;
  const m = Math.floor(diff / 6e4);   diff %= 6e4;
  const s = Math.floor(diff / 1e3);
  tEls.d.textContent = d; tEls.h.textContent = pad(h); tEls.m.textContent = pad(m); tEls.s.textContent = pad(s);
}
tick();
setInterval(tick, 1000);

/* ---------- анкета ---------- */
const form = $('#rsvpForm');
const msg = $('#formMsg');
form.addEventListener('submit', async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  if (!data.name || !data.name.trim() || !data.attend) {
    msg.textContent = 'Будь ласка, вкажіть ім\'я та чи плануєте бути.';
    return;
  }
  const btn = $('button[type=submit]', form);
  btn.disabled = true;
  msg.textContent = 'Надсилаємо…';
  try {
    if (CONFIG.formEndpoint) {
      await fetch(CONFIG.formEndpoint, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ ...data, sentAt: new Date().toISOString() })
      });
    } else {
      console.log('RSVP (endpoint не задано):', data);
    }
    form.reset();
    msg.textContent = data.attend === 'yes' ? 'Дякуємо! Чекаємо на Вас ♥' : 'Дякуємо, що повідомили. Нам Вас буде не вистачати ♥';
  } catch (err) {
    msg.textContent = 'Не вдалося надіслати. Спробуйте ще раз.';
    btn.disabled = false;
  }
});

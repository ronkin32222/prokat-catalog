/* UI interactions: category preview, subtle 3D pointer response, transparent lead handoff. */
(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReducedMotion && 'IntersectionObserver' in window) document.documentElement.classList.add('js-motion');
  // Spotlight hover: subtle moving light follows pointer across rental category cards.
  if (!prefersReducedMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.industry').forEach(card => {
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', ((event.clientX-rect.left)/rect.width*100).toFixed(1)+'%');
        card.style.setProperty('--mouse-y', ((event.clientY-rect.top)/rect.height*100).toFixed(1)+'%');
      });
    });
  }
  const catalogData = {
    tools: [
      { cat: 'ИНСТРУМЕНТЫ', name: 'Строительное оборудование', price: '1 500 ₽', image: 'photo-1504307651254-35680f356dfd' },
      { cat: 'ОБОРУДОВАНИЕ', name: 'Инструменты для работы', price: '900 ₽', image: 'photo-1581092918056-0c4c3acd3789' }
    ],
    vehicles: [
      { cat: 'СПЕЦТЕХНИКА', name: 'Строительная техника', price: '8 000 ₽', image: 'photo-1541888946425-d81bb19240f5' },
      { cat: 'ОБОРУДОВАНИЕ', name: 'Техника на объект', price: '3 500 ₽', image: 'photo-1504307651254-35680f356dfd' }
    ],
    apartments: [
      { cat: 'ЖИЛЬЁ', name: 'Апартаменты с террасой', price: '4 500 ₽', image: 'photo-1600585154340-be6161a56a0' },
      { cat: 'ЖИЛЬЁ', name: 'Загородный дом', price: '7 000 ₽', image: 'photo-1600607687939-ce8a6c25118c' }
    ],
    cars: [
      { cat: 'АВТОПРОКАТ', name: 'Спортивное купе', price: '9 000 ₽', image: 'photo-1503376780353-7e6692767b70' },
      { cat: 'АВТОПРОКАТ', name: 'Легковой автомобиль', price: '3 200 ₽', image: 'photo-1552519507-da3b142c6e3d' }
    ]
  };
  document.querySelectorAll('[data-kind]').forEach(button => button.addEventListener('click', () => {
    const items = catalogData[button.dataset.kind];
    if (!items) return;
    document.querySelectorAll('[data-kind]').forEach(el => {
      const active = el === button;
      el.classList.toggle('is-active', active);
      el.setAttribute('aria-pressed', String(active));
    });
    items.forEach((item, index) => {
      const n = index + 1;
      const img = document.getElementById('scene-img-' + n);
      if (img) {
        img.src = 'https://images.unsplash.com/' + item.image + '?w=640&auto=format&fit=crop&q=85';
        img.alt = item.name;
      }
      const cat = document.getElementById('scene-cat-' + n);
      const name = document.getElementById('scene-name-' + n);
      const price = document.getElementById('scene-price-' + n);
      if (cat) cat.textContent = item.cat;
      if (name) name.textContent = item.name;
      if (price) price.textContent = item.price;
    });
  }));
  document.querySelector('[data-kind="tools"]')?.setAttribute('aria-pressed','true');
  document.querySelectorAll('[data-kind]:not([data-kind="tools"])').forEach(el => el.setAttribute('aria-pressed','false'));

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), {threshold:.08, rootMargin:'0px 0px -30px 0px'});
    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
  } else document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('is-visible'));

  // Links cannot be silently submitted without a backend. Clipboard + Telegram keeps the intent explicit.
  const telegramUrl = 'https://t.me/pokeroho';
  document.querySelectorAll('[data-lead-form]').forEach(form => {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const input = form.querySelector('input[name="storeUrl"]');
      if (!input?.checkValidity()) { input?.reportValidity(); return; }
      const feedback = document.getElementById(form.id + '-feedback');
      const message = 'Здравствуйте! Хочу бесплатно посмотреть каталог для моей аренды. Ссылка на объявления: ' + input.value.trim();
      window.open(telegramUrl, '_blank', 'noopener,noreferrer');
      let copied = false;
      try { await navigator.clipboard.writeText(message); copied = true; }
      catch (_) {
        const textarea = document.createElement('textarea');
        textarea.value = message; textarea.style.position='fixed'; textarea.style.left='-9999px';
        document.body.appendChild(textarea); textarea.select();
        try { copied = document.execCommand('copy'); } catch (_) { copied = false; }
        textarea.remove();
      }
      if (feedback) {
        feedback.textContent = copied
          ? 'Сообщение скопировано. Вставьте его в Telegram и отправьте — заявка ещё не отправлена.'
          : 'Напишите мне в Telegram и вставьте ссылку на ваши объявления. Автоматически заявка не отправлена.';
        const direct = document.createElement('a');
        direct.href = telegramUrl; direct.target = '_blank'; direct.rel = 'noopener noreferrer';
        direct.textContent = ' Открыть чат ↗';
        direct.style.textDecoration='underline'; direct.style.marginLeft='6px';
        feedback.append(direct);
      }
    });
  });

  const guide = document.getElementById('demo-guide');
  const guideText = guide?.querySelector('span:nth-child(2)');
  document.getElementById('demo-guide-dismiss')?.addEventListener('click', () => {guide.hidden = true;});
  document.getElementById('send')?.addEventListener('click', () => {
    if (guideText && !guide.hidden) guideText.textContent = 'Шаг 2 из 3: заявка появилась у владельца. Подтвердите её справа.';
  });
  document.getElementById('o-next')?.addEventListener('click', () => {
    if (guideText && !guide.hidden) guideText.textContent = 'Шаг 3 из 3: отметьте выдачу и возврат, чтобы даты оставались актуальными.';
  });
  document.getElementById('o-reset')?.addEventListener('click', () => {
    if (guideText && !guide.hidden) guideText.textContent = 'Шаг 1 из 3: выберите объект аренды и даты';
  });
})();
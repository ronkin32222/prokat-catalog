/* Landing conversion and guided demo interactions. No lead data is stored or sent automatically. */
(() => {
  const forms = document.querySelectorAll('[data-lead-form]');
  const telegramUrl = 'https://t.me/pokeroho';
  forms.forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const input = form.querySelector('input[name="storeUrl"]');
      if (!input?.checkValidity()) { input?.reportValidity(); return; }
      const link = input.value.trim();
      const message = 'Здравствуйте! Хочу бесплатный пример каталога для своего проката. Мои объявления: ' + link;
      const feedback = document.getElementById(form.id + '-feedback');
      // Opening a new tab synchronously preserves browser user-gesture permission.
      const contactWindow = window.open(telegramUrl, '_blank', 'noopener,noreferrer');
      let copied = false;
      try {
        await navigator.clipboard.writeText(message);
        copied = true;
      } catch (_) {
        try {
          const buffer = document.createElement('textarea');
          buffer.value = message;
          buffer.style.position = 'fixed';
          buffer.style.left = '-9999px';
          document.body.appendChild(buffer);
          buffer.select();
          copied = document.execCommand('copy');
          buffer.remove();
        } catch (_) { /* show manual instruction below */ }
      }
      if (feedback) {
        feedback.textContent = copied
          ? 'Текст заявки скопирован. Вставьте его в открывшийся чат Telegram и отправьте.'
          : 'Откройте Telegram и отправьте ссылку из поля в сообщении. Заявка ещё не отправлена.';
      }
      if (!contactWindow) {
        const fallback = document.createElement('a');
        fallback.href = telegramUrl;
        fallback.target = '_blank';
        fallback.rel = 'noopener noreferrer';
        fallback.textContent = 'Открыть Telegram';
        fallback.style.textDecoration = 'underline';
        feedback?.append(' ', fallback);
      }
    });
  });

  const guide = document.getElementById('demo-guide');
  const guideText = guide?.querySelector('span:nth-child(2)');
  const dismiss = document.getElementById('demo-guide-dismiss');
  if (!guide || !guideText) return;

  dismiss?.addEventListener('click', () => { guide.hidden = true; });
  document.getElementById('send')?.addEventListener('click', () => {
    if (!guide.hidden) guideText.textContent = 'Шаг 2 из 3: заявка появилась справа. Нажмите «Подтвердить заявку».';
  });
  document.getElementById('o-next')?.addEventListener('click', () => {
    if (!guide.hidden) guideText.textContent = 'Шаг 3 из 3: отметьте выдачу и возврат. Так доступность останется актуальной.';
  });
  document.getElementById('o-reset')?.addEventListener('click', () => {
    if (!guide.hidden) guideText.textContent = 'Шаг 1 из 3: выберите инструмент и даты';
  });
})();
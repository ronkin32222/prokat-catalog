// Local-only demo: nothing leaves the browser.
(function () {
  var products = [
    { id: 'drill', icon: 'i-drill', name: 'Перфоратор SDS‑plus', price: 800, deposit: 3000, qty: 2 },
    { id: 'grinder', icon: 'i-grinder', name: 'УШМ 230 мм', price: 600, deposit: 2000, qty: 3 },
    { id: 'ladder', icon: 'i-ladder', name: 'Лестница 3×9', price: 400, deposit: 0, qty: 1 },
    { id: 'gen', icon: 'i-gen', name: 'Генератор 3 кВт', price: 1500, deposit: 10000, qty: 1 }
  ];
  var flow = {
    new: { label: 'Новая', pill: 'pill--new', next: 'Подтвердить заявку', to: 'ok', reserved: false },
    ok: { label: 'Подтверждена', pill: 'pill--ok', next: 'Отметить выдачу', to: 'out', reserved: true },
    out: { label: 'Выдана', pill: 'pill--out', next: 'Принять возврат', to: 'back', reserved: true },
    back: { label: 'Возвращена', pill: 'pill--back', next: null, reserved: false }
  };
  var order = ['new', 'ok', 'out', 'back'];
  var DAY = 864e5;
  var $ = function (id) { return document.getElementById(id); };
  var rub = function (n) { return n.toLocaleString('ru-RU') + ' ₽'; };
  var state = { product: products[0], status: null };

  var list = $('products');
  products.forEach(function (p, i) {
    var div = document.createElement('div');
    div.className = 'opt';
    div.innerHTML = '<input type="radio" name="product" id="p-' + p.id + '" value="' + p.id + '"' + (i ? '' : ' checked') + '>' +
      '<label for="p-' + p.id + '"><svg aria-hidden="true"><use href="#' + p.icon + '"/></svg><span>' + p.name +
      '<small>' + rub(p.price) + ' / сутки</small></span></label>';
    list.appendChild(div);
  });
  list.addEventListener('change', function (e) {
    state.product = products.filter(function (p) { return p.id === e.target.value; })[0];
    render();
  });

  var iso = function (d) { return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var from = $('d-from'), to = $('d-to');
  from.min = to.min = iso(today);
  var plus = function (n) { var d = new Date(today); d.setDate(d.getDate() + n); return iso(d); };
  from.value = plus(1);
  to.value = plus(3);
  ['change', 'input'].forEach(function (ev) { from.addEventListener(ev, render); to.addEventListener(ev, render); });

  // Typed dates bypass the native min, so validate ISO strings here too.
  function dateError() {
    if (!from.value || !to.value) return 'Выберите даты начала и возврата.';
    if (from.value < from.min) return 'Дата начала не может быть в прошлом.';
    if (to.value <= from.value) return 'Дата возврата должна быть позже даты начала.';
    return '';
  }
  function days() {
    return dateError() ? 0 : Math.round((new Date(to.value) - new Date(from.value)) / DAY);
  }
  function fmt(v) { return new Date(v).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: 'UTC' }); }

  function render() {
    var p = state.product, n = days(), locked = state.status && state.status !== 'back';
    var html;
    if (n < 1) {
      html = '<div class="err">' + dateError() + '</div>';
    } else {
      html = '<div><span>' + rub(p.price) + ' × ' + n + ' сут.</span><span>' + rub(p.price * n) + '</span></div>' +
        '<div><span>Залог</span><span>' + (p.deposit ? rub(p.deposit) + ', при выдаче' : 'не требуется') + '</span></div>' +
        '<div class="total"><span>Итого за аренду</span><span>' + rub(p.price * n) + '</span></div>';
    }
    $('sum').innerHTML = html;
    var send = $('send');
    send.disabled = n < 1 || locked;
    send.textContent = locked ? 'Заявка отправлена' : 'Отправить заявку';
    from.disabled = to.disabled = locked;
    list.querySelectorAll('input').forEach(function (i) { i.disabled = locked; });

    var reserved = state.status && flow[state.status].reserved ? 1 : 0;
    $('stock').textContent = (p.qty - reserved) + ' из ' + p.qty; // product inputs are locked while an order is active
    $('stock-hint').textContent = !state.status ? 'Инструмент резервируется только после подтверждения.' :
      state.status === 'new' ? 'Заявка ждёт решения: инструмент ещё не зарезервирован.' :
      reserved ? 'Подтверждено: одна единица зарезервирована.' : 'Инструмент вернулся и снова свободен.';

    $('order-empty').hidden = !!state.status;
    $('order-body').hidden = !state.status;
    if (!state.status) return;
    var f = flow[state.status];
    $('o-status').className = 'pill ' + f.pill;
    $('o-status').textContent = f.label;
    var idx = order.indexOf(state.status);
    $('track').querySelectorAll('li').forEach(function (li, i) { li.classList.toggle('done', i <= idx); });
    var next = $('o-next');
    next.hidden = !f.next;
    if (f.next) next.textContent = f.next;
  }

  $('send').addEventListener('click', function () {
    var p = state.product, n = days();
    if (n < 1) return;
    state.status = 'new';
    var period = fmt(from.value) + ' — ' + fmt(to.value);
    $('o-title').textContent = p.name;
    $('o-meta').textContent = period + ' · ' + rub(p.price * n) + (p.deposit ? ' · залог ' + rub(p.deposit) : '');
    $('notify-text').innerHTML = '<b>Новая заявка</b><br>' + p.name + '<br>' + period + ' · ' + rub(p.price * n);
    $('notify').hidden = false;
    announce('Заявка отправлена. Владелец получил уведомление.');
    render();
    $('o-next').focus();
  });
  $('o-next').addEventListener('click', function () {
    state.status = flow[state.status].to;
    announce('Статус заявки: ' + flow[state.status].label);
    render();
    (flow[state.status].next ? $('o-next') : $('o-reset')).focus();
  });
  $('o-reset').addEventListener('click', function () {
    state.status = null;
    $('notify').hidden = true;
    announce('Демо сброшено.');
    render();
    $('send').focus();
  });
  function announce(t) { $('demo-live').textContent = t; }

  render();
})();

const fs = require('fs'); const vm = require('vm'); const { El, Doc, Ev } = require('./minidom');
const qvJs = fs.readFileSync('../tools/grs-quickview.js', 'utf8'), pdJs = fs.readFileSync('../tools/grs-product.js', 'utf8');
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const E = (t, a, k) => new El(t, a, k);
function ctx(document) { return vm.createContext({ document, setTimeout, CustomEvent: Ev, Event: Ev, JSON, console }); }
// ---------- quick view ----------
{
  const d = new Doc(); const body = d.append(E('body'));
  const bGate = body.append(E('div', { class: 'card' }, [E('button', { class: 'btn-o qv', 'data-quick': 'gate-panels-holed' })])).children[0];
  const bCg = body.append(E('div', { class: 'card' }, [E('button', { class: 'btn-o qv', 'data-quick': 'custom-glass-railing', 'data-qc': '1' })])).children[0];
  const bSp = body.append(E('div', { class: 'card' }, [E('button', { class: 'btn-o qv', 'data-quick': 'glass-railing-spigot' })])).children[0];
  const M = body.append(E('div', { class: 'modal', id: 'qvm', 'data-cl': 'Custom glass', 'data-sl': 'Start your project' }));
  const T = M.append(E('div', { class: 'mtxt' }));
  const pill = T.append(E('div', { class: 'pprow' }, [E('span', { class: 'instock' }, ['In Stock'])])).children[0];
  const ow = T.append(E('div', { class: 'opt qv-opt', id: 'qoptw', hidden: true }));
  const qb = T.append(E('div', { class: 'opt', id: 'qbuy' }, ['qty']));
  const qo = T.append(E('a', { class: 'btn dark cart-btn', id: 'qopts', href: '/products/x', hidden: true }, [E('span', { class: 'dot' }), E('span', {}, ['Choose options'])]));
  const ql = T.append(E('a', { class: 'qv-more', id: 'qlink', href: '/products/x' }, ['View details']));
  const c = ctx(d); vm.runInContext(qvJs, c);
  function open(h, opts, on, vid) { ql.setAttribute('href', '/products/' + h); qo.setAttribute('href', '/products/' + h); qb.hidden = false; qo.hidden = true; pill.textContent = 'In Stock'; pill.classList.remove('out'); ow.hidden = !opts.length; ow.children = []; const g = ow.append(E('div', { class: 'vp-g' })).append(E('div', { class: 'vp' })); opts.forEach((v, i) => g.append(E('button', { class: 'vp-c' + (on.includes(i) ? ' on' : ''), 'data-val': v }, [v]))); d.dispatchEvent(new Ev('grs:qv', { detail: { h, v: vid } })); }
  const gate = ['33.6"', '33.6" (Custom)', '39.6"', '46"', '57.7" (Custom)'];
  bGate.dispatchEvent(new Ev('click', { bubbles: true })); open('gate-panels-holed', gate, [0], 11);
  ok(pill.textContent === 'In Stock' && !qb.hidden && qo.hidden, 'QV gate standard: In Stock, quantity + Add to cart');
  open('gate-panels-holed', gate, [1], 22);
  ok(pill.textContent === 'Custom glass' && qb.hidden && !qo.hidden, 'QV gate (Custom) variant: Custom glass, no quantity/add, start button');
  ok(qo.children[1].textContent === 'Start your project' && qo.getAttribute('href') === '/products/gate-panels-holed?variant=22', 'QV gate (Custom): label + link with variant');
  ok(!ow.hidden, 'QV gate (Custom): options stay so the customer can switch back');
  open('gate-panels-holed', gate, [3], 33);
  ok(pill.textContent === 'In Stock' && !qb.hidden && qo.hidden && qo.children[1].textContent === 'Choose options', 'QV gate back to standard: restored');
  bCg.dispatchEvent(new Ev('click', { bubbles: true })); open('custom-glass-railing', ['Default Title', 'Default_cpc_77C2752D1A964'], [0], 44);
  ok(pill.textContent === 'Custom glass' && qb.hidden && !qo.hidden && ow.hidden, 'QV custom glass: Custom glass, start, cpc options hidden');
  ok(qo.getAttribute('href') === '/products/custom-glass-railing#pcalc', 'QV custom glass: link to the product page calculator');
  open('custom-stair-glass', ['Default Title', 'Default_cpc_4F99FDCC83954'], [0], 55);
  ok(pill.textContent === 'Custom glass' && qb.hidden && ow.hidden, 'QV custom stair opened without card flag: custom');
  bSp.dispatchEvent(new Ev('click', { bubbles: true })); open('glass-railing-spigot', ['Brushed', 'Matte'], [0], 66);
  ok(pill.textContent === 'In Stock' && !qb.hidden && qo.hidden && !M.classList.contains('qv-custom'), 'QV spigot after custom: normal');
}
// ---------- product page ----------
const tick = () => new Promise(r => setTimeout(r, 15));
function page(data, id, now) {
  const d = new Doc(); const body = d.append(E('body')); const F = body.append(E('form', { id: 'grs-pform' }));
  const I = F.append(E('input', { type: 'hidden', name: 'id', value: id }));
  F.append(E('span', Object.assign({ class: 'instock', id: 'pstock' }), [now ? 'Custom glass' : 'In Stock']));
  F.append(E('span', Object.assign({ class: 'olab', id: 'pqlab' }, now ? { hidden: true } : {}), ['Quantity']));
  F.append(E('div', Object.assign({ class: 'qtyrow', id: 'pqrow' }, now ? { hidden: true } : {}), [E('button', Object.assign({ id: 'padd' }, now ? { disabled: true } : {}), ['Add'])]));
  F.append(E('div', Object.assign({ class: 'qtyrow', id: 'pstartw' }, now ? {} : { hidden: true }), [E('a', { id: 'pstart', href: '#pcalc' }, ['Start'])]));
  const mb = body.append(E('div', { class: 'mbar', id: 'mbar' }));
  mb.append(E('div', Object.assign({ class: 'qty' }, now ? { hidden: true } : {}), ['q'])); mb.append(E('button', Object.assign({ id: 'madd' }, now ? { hidden: true, disabled: true } : {}), ['Add'])); mb.append(E('a', Object.assign({ id: 'mstart' }, now ? {} : { hidden: true }), ['Start']));
  body.append(E('script', { type: 'application/json', id: 'grs-pdata' }, [JSON.stringify(data)]));
  vm.runInContext(pdJs, ctx(d)); return { d, I, $: id => d.getElementById(id), mq: () => mb.children[0] };
}
(async () => {
  const gate = { in: 'In Stock', out: 'Sold out', cp: false, cv: [2, 4], cl: 'Custom glass', v: [{ id: 1, a: true }, { id: 2, a: true }, { id: 3, a: false }, { id: 4, a: true }] };
  let P = page(gate, 1, false); await tick();
  ok(P.$('pstock').textContent === 'In Stock' && !P.$('pqrow').hidden && P.$('pstartw').hidden && !P.$('madd').hidden && P.$('mstart').hidden, 'PDP gate standard: normal');
  P.I.value = 2; P.I.dispatchEvent(new Ev('change', { bubbles: true })); await tick();
  ok(P.$('pstock').textContent === 'Custom glass' && P.$('pqrow').hidden && P.$('pqlab').hidden && !P.$('pstartw').hidden && P.$('padd').disabled, 'PDP gate (Custom): pill, no quantity, start, add disabled');
  ok(P.$('madd').hidden && P.mq().hidden && !P.$('mstart').hidden, 'PDP gate (Custom): phone bar shows start');
  P.I.value = 3; P.I.dispatchEvent(new Ev('change', { bubbles: true })); await tick();
  ok(P.$('pstock').textContent === 'Sold out' && P.$('pstock').classList.contains('out') && !P.$('pqrow').hidden && P.$('pstartw').hidden && !P.$('madd').hidden, 'PDP back to a standard (sold out) variant: normal');
  P = page({ in: 'Custom glass', out: 'Sold out', cp: true, cv: [], cl: 'Custom glass', v: [{ id: 9, a: true }] }, 9, true); await tick();
  ok(P.$('pstock').textContent === 'Custom glass' && P.$('pqrow').hidden && !P.$('pstartw').hidden && P.$('padd').disabled, 'PDP custom glass: stays custom');
  P = page({ in: 'In Stock', out: 'Sold out', cp: false, cv: [], cl: 'Custom glass', v: [{ id: 5, a: true }] }, 5, false); await tick();
  ok(P.$('pstock').textContent === 'In Stock' && !P.$('pqrow').hidden && P.$('pstartw').hidden && !P.$('padd').disabled, 'PDP normal product: untouched');
  console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
})();

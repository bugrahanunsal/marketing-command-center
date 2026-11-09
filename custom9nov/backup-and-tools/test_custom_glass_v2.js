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
// ---------- product page (9 Nov 14:42: quantity and Add to cart stay; only the pill says Custom glass) ----------
const tick = () => new Promise(r => setTimeout(r, 15));
function page(data, id) {
  const d = new Doc(); const body = d.append(E('body')); const F = body.append(E('form', { id: 'grs-pform' }));
  const I = F.append(E('input', { type: 'hidden', name: 'id', value: id }));
  const v0 = data.v.find(x => x.id === id), c0 = data.cp || data.cv.includes(id);
  // what the Liquid renders
  const pill = F.append(E('span', { class: 'instock' + (v0.a ? '' : ' out'), id: 'pstock' }, [v0.a ? (c0 ? data.cl : data.in) : data.out]));
  F.append(E('span', { class: 'olab' }, ['Quantity']));
  const row = F.append(E('div', { class: 'qtyrow product-form__buttons' }, [E('button', Object.assign({ id: 'padd' }, v0.a ? {} : { disabled: true }), ['Add'])]));
  const mb = body.append(E('div', { class: 'mbar', id: 'mbar' }));
  mb.append(E('div', { class: 'qty' }, ['q'])); mb.append(E('button', Object.assign({ id: 'madd' }, v0.a ? {} : { disabled: true }), ['Add']));
  body.append(E('script', { type: 'application/json', id: 'grs-pdata' }, [JSON.stringify(data)]));
  vm.runInContext(pdJs, ctx(d));
  // grs-product.js yt(): new id, change event, then Et() right away (pill in/out, buttons by availability)
  function choose(nid) { I.value = nid; I.dispatchEvent(new Ev('change', { bubbles: true })); const v = data.v.find(x => x.id === nid);
    pill.textContent = v.a ? data.in : data.out; pill.classList.toggle('out', !v.a); ['padd', 'madd'].forEach(k => { d.getElementById(k).disabled = !v.a; }); }
  const buyable = () => !row.hidden && !d.getElementById('padd').disabled && !d.getElementById('madd').disabled && !mb.children[0].hidden && !d.getElementById('madd').hidden;
  return { d, choose, buyable, pill, $: k => d.getElementById(k) };
}
(async () => {
  const gate = { in: 'In Stock', out: 'Sold out', cp: false, cv: [2, 4], cl: 'Custom glass', v: [{ id: 1, a: true }, { id: 2, a: true }, { id: 3, a: false }, { id: 4, a: true }] };
  let P = page(gate, 1); await tick();
  ok(P.pill.textContent === 'In Stock' && P.buyable(), 'PDP gate standard: In Stock, quantity, Add to cart');
  P.choose(2); await tick();
  ok(P.pill.textContent === 'Custom glass' && !P.pill.classList.contains('out') && P.buyable(), 'PDP gate (Custom): pill Custom glass, quantity and Add to cart stay');
  P.choose(3); await tick();
  ok(P.pill.textContent === 'Sold out' && P.pill.classList.contains('out') && P.$('padd').disabled, 'PDP standard sold out: Sold out, Add disabled');
  P.choose(4); await tick();
  ok(P.pill.textContent === 'Custom glass' && P.buyable(), 'PDP gate other (Custom): Custom glass, buyable');
  P.choose(1); await tick();
  ok(P.pill.textContent === 'In Stock' && P.buyable(), 'PDP back to standard: In Stock');
  P = page(gate, 2); await tick();
  ok(P.pill.textContent === 'Custom glass' && P.buyable(), 'PDP opened on a (Custom) variant: Custom glass, buyable');
  P = page({ in: 'Custom glass', out: 'Sold out', cp: true, cv: [], cl: 'Custom glass', v: [{ id: 9, a: true }] }, 9); await tick();
  ok(P.pill.textContent === 'Custom glass' && P.buyable(), 'PDP custom glass (calculator): Custom glass, quantity and Add to cart');
  P = page({ in: 'In Stock', out: 'Sold out', cp: false, cv: [], cl: 'Custom glass', v: [{ id: 5, a: true }] }, 5); await tick();
  ok(P.pill.textContent === 'In Stock' && P.buyable(), 'PDP normal product: untouched');
  P = page({ in: 'Custom glass', out: 'Sold out', cp: true, cv: [], cl: 'Custom glass', v: [{ id: 7, a: false }] }, 7); await tick();
  ok(P.pill.textContent === 'Sold out' && P.$('padd').disabled, 'PDP custom glass not available: Sold out like the button');
  console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
})();

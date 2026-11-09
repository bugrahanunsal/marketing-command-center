// Quick view text = the product page's first description (lead), checked against the Liquid rules ported to Python.
const fs = require('fs'); const vm = require('vm'); const { El, Doc, Ev } = require('./minidom');
const js = fs.readFileSync('../tools/qv-lead.js', 'utf8');
const exp = JSON.parse(fs.readFileSync('../qvdesc/expect.json', 'utf8'));
let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
const ent = s => s.replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#(\d+);/g, (m, d) => String.fromCharCode(+d)).replace(/&amp;/g, '&');
function setup(root, failSet, delay) {
  const d = new Doc(); const body = d.append(new El('body')); const Q = body.append(new El('p', { class: 'lead', id: 'qdesc' }));
  Q.style = { visibility: '' };
  d.createElement = () => { const o = { content: { textContent: '' } }; Object.defineProperty(o, 'innerHTML', { set(v) { o.content.textContent = ent(String(v).replace(/<[^>]+>/g, '')); } }); return o; };
  const calls = [];
  const fetch = url => { calls.push(url); const h = decodeURIComponent(url.replace(/^.*\/products\//, '').replace(/\.js$/, ''));
    return new Promise(res => setTimeout(() => res(failSet.has(h) ? { ok: false } : { ok: true, json: () => Promise.resolve({ title: exp[h].title, description: exp[h].description }) }), delay(h))); };
  const ctx = vm.createContext({ document: d, window: { GRS: { root } }, fetch, setTimeout, Promise, encodeURIComponent, String, Object, JSON });
  vm.runInContext(js, ctx);
  // grs.js Ee(): sets #qdesc to de(ct(description),220), then kt() fires grs:qv
  const open = h => { Q.textContent = exp[h].orig; d.dispatchEvent(new Ev('grs:qv', { detail: { h, v: 1 } })); };
  return { Q, open, calls };
}
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  // every product, one at a time
  let E = setup('/', new Set(), () => 2);
  for (const h of Object.keys(exp)) {
    E.open(h);
    const hiddenNow = E.Q.style.visibility === 'hidden';
    await wait(8);
    const good = E.Q.textContent === exp[h].want && E.Q.style.visibility === '';
    if (!good) console.log('   got :', E.Q.textContent, '\n   want:', exp[h].want);
    ok(good && hiddenNow, h + (exp[h].want !== exp[h].orig ? ' → lead' : ' (unchanged)'));
  }
  ok(E.calls.every(u => u.indexOf('/products/') === 0), 'fetch URLs without locale prefix on /');
  // reopen from cache: replaced at once, no new fetch
  const n0 = E.calls.length; E.open('custom-glass-railing');
  ok(E.Q.textContent === exp['custom-glass-railing'].want && E.Q.style.visibility === '' && E.calls.length === n0, 'reopen: lead at once from cache, no fetch');
  // variant change inside the quick view fires grs:qv again: text stays
  E.Q.textContent = exp['custom-glass-railing'].want; E.open.call(null, 'custom-glass-railing');
  ok(E.Q.textContent === exp['custom-glass-railing'].want, 'variant change: lead stays');
  // race: A slow, B opened before A answers; A must not overwrite B
  E = setup('/fr/', new Set(), h => h === 'custom-stair-glass' ? 30 : 2);
  E.open('custom-stair-glass'); await wait(1); E.open('glass-railing-spigot'); await wait(10);
  ok(E.Q.textContent === exp['glass-railing-spigot'].want && E.Q.style.visibility === '', 'race: second product shown');
  await wait(40);
  ok(E.Q.textContent === exp['glass-railing-spigot'].want, 'race: late answer for the first product ignored');
  ok(E.calls[0] === '/fr/products/custom-stair-glass.js', 'French pages fetch /fr/products/...');
  // failure: keep grs.js text, visible
  E = setup('/', new Set(['custom-glass-railing']), () => 2);
  E.open('custom-glass-railing'); await wait(8);
  ok(E.Q.textContent === exp['custom-glass-railing'].orig && E.Q.style.visibility === '', 'fetch fails: original text, visible');
  // double grs:qv while pending: one fetch
  E = setup('/', new Set(), () => 10);
  E.open('custom-glass-railing'); E.open('custom-glass-railing'); await wait(20);
  ok(E.calls.length === 1 && E.Q.textContent === exp['custom-glass-railing'].want, 'two events while pending: one fetch');
  console.log(fails ? fails + ' FAILED' : 'ALL PASSED');
})();

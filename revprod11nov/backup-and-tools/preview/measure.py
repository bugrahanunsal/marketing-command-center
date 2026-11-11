import json, re, html, sys
sys.path.insert(0, '.')
import emu
from playwright.sync_api import sync_playwright
products = json.load(open('/home/claude/cust/rev/products-reviews-2026-11-11.json', encoding='utf-8'))
print('keys', sorted(products[0].keys()))
# names of the reviews the section can show, with the product title
iv = emu.index_view(products, 3017, 4.94, '')
rows = []
for h, d in iv['p'].items():
    for r in d['r']:
        rows.append((r[2], d['t'], h, r[0], len(r[4])))
print('products with reviews', len(iv['p']), 'reviews', len(rows))
names = sorted({r[0] for r in rows}, key=len)
titles = sorted({r[1] for r in rows}, key=len)
print('name length: max', len(names[-1]), repr(names[-1]), '| top 5:', [(len(n), n) for n in names[-5:]])
print('title length: max', len(titles[-1]), '| all:', [(len(t), t) for t in titles])
with sync_playwright() as pw:
    b = pw.chromium.launch(args=['--no-sandbox'])
    pg = b.new_page()
    pg.set_content('<style>@font-face{font-family:x}body{font-family:Poppins,sans-serif}b{font-size:15px;font-weight:600;white-space:nowrap}i{font-style:normal;font-size:14.5px;font-weight:600;white-space:nowrap}</style><div id=a></div>')
    w = pg.evaluate("""([names, titles]) => { var a = document.getElementById('a'), o = {n: {}, t: {}, tw: {}}; names.forEach(function(n){ var e = document.createElement('b'); e.textContent = n; a.appendChild(e); o.n[n] = e.getBoundingClientRect().width; a.removeChild(e) }); titles.forEach(function(t){ var e = document.createElement('i'); e.textContent = t; a.appendChild(e); o.t[t] = e.getBoundingClientRect().width; var m = 0; t.split(/\\s+/).forEach(function(x){ e.textContent = x; m = Math.max(m, e.getBoundingClientRect().width) }); o.tw[t] = m; a.removeChild(e) }); return o }""", [names, titles])
    b.close()
json.dump({'w': w, 'rows': rows}, open('measure.json', 'w'))
nw = sorted(w['n'].values())
print('name px: median %.0f, p90 %.0f, p98 %.0f, max %.0f' % (nw[len(nw)//2], nw[int(len(nw)*.9)], nw[int(len(nw)*.98)], nw[-1]))
print('title px:', sorted((round(v), k[:40]) for k, v in w['t'].items()))

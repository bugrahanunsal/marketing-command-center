# Correction (owner, 9 Nov 2026 15:27 ET): 10 mm tempered glass is the gate panel only; custom glass stays 12 mm.
# Draft theme: the number box and the product FAQ "hide" setting now point at the gate panel; the custom products are
# back in the materials section. Store: the gate panel description (EN, FR, ES) and two image alts say 10 mm.
import hashlib, json, sys
GATE = "gate-panels-holed-for-the-hinges-latch-and-floor-lock"
T = '/home/claude/cust/tenmm/'
OUT = sys.argv[1]
def md5(s): return hashlib.md5(s.encode()).hexdigest()
def rep(s, old, new):
    assert s.count(old) == 1, (s.count(old), old[:100]); return s.replace(old, new)

p = open(T + 'out/grs-product.liquid', encoding='utf-8').read(); assert md5(p) == '6669f7fa6b113cc47c43d792be85b929'
p = rep(p, '(custom glass is 10 mm, owner 9 Nov 2026)', '(the gate panels are 10 mm, owner 9 Nov 2026)')
p = rep(p, '"info":"For example the custom glass products, which are 10 mm."', '"info":"For example the gate panels, which are 10 mm."')
assert 'custom glass is 10' not in p
open(OUT + '/grs-product.liquid', 'w', encoding='utf-8').write(p)

f = open(T + 'out/grs-product-faq.liquid', encoding='utf-8').read(); assert md5(f) == '008169f153ed8217f9aaa3da43d17596'
f = rep(f, 'picked in its "Hide on these products" setting (custom glass, owner 9 Nov 2026).', 'picked in its "Hide on these products" setting (the 10 mm gate panels, owner 9 Nov 2026).')
f = rep(f, '"info":"For example a general answer that does not fit the custom glass."', '"info":"For example a general answer that does not fit the 10 mm gate panels."')
open(OUT + '/grs-product-faq.liquid', 'w', encoding='utf-8').write(f)

cur = open(T + 'out/product.json', encoding='utf-8').read(); assert md5(cur) == '0e262f1c661d75a67f98ce4628e8fc55'
orig = open(T + 'templates__product-before-2026-11-09.json', encoding='utf-8').read(); assert md5(orig) == '9a86183df2622825948b5f73a0183d11'
head = cur[:cur.index('{')]; j = json.loads(cur[cur.index('{'):]); jo = json.loads(orig[orig.index('{'):])
j['sections']['main']['blocks']['fact1']['settings']['alt_products'] = [GATE]
j['sections']['faq']['blocks']['q1']['settings']['hide_products'] = [GATE]
j['sections']['materials']['settings']['products'] = jo['sections']['materials']['settings']['products']
new = head + json.dumps(j, indent=2, ensure_ascii=False) + '\n'
open(OUT + '/product.json', 'w', encoding='utf-8').write(new)
jo['sections']['main']['blocks']['fact1']['settings'].update(alt_products=[GATE], alt_value='10')
jo['sections']['faq']['blocks']['q1']['settings']['hide_products'] = [GATE]
assert jo == json.loads(new[new.index('{'):]), 'template differs from the original by more than the two settings'

g = json.load(open('gate-before-2026-11-09.json', encoding='utf-8'))['product']
en = g['descriptionHtml']; assert en.count('<strong>12mm tempered glass</strong>') == 1 and en.count('12mm') == 1
fr = [x['value'] for x in g['fr'] if x['key'] == 'body_html'][0]; assert fr.count('<strong>verre trempé de 12 mm</strong>') == 1 and fr.count('12 mm') == 1
es = [x['value'] for x in g['es'] if x['key'] == 'body_html'][0]; assert es.count('<strong>vidrio templado de 12 mm</strong>') == 1 and es.count('12 mm') == 1
store = {'id': g['id'], 'en': en.replace('12mm', '10mm'), 'fr': fr.replace('12 mm', '10 mm'), 'es': es.replace('12 mm', '10 mm'),
         'alts': {m['id']: m['alt'].replace('12mm', '10mm') for m in g['media']['nodes'] if '12mm' in (m['alt'] or '')}}
assert len(store['alts']) == 2
json.dump(store, open(OUT + '/gate-10mm.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump({'g': {'id': g['id'], 'descriptionHtml': store['en']}}, open(OUT + '/vars-gate-en.json', 'w'), ensure_ascii=True)
print('EN sha256 after update should be', hashlib.sha256(store['en'].encode()).hexdigest())
for fn in ('grs-product.liquid', 'grs-product-faq.liquid', 'product.json'):
    b = open(OUT + '/' + fn, 'rb').read(); print(fn, len(b), hashlib.md5(b).hexdigest())

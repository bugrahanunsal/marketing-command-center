# Custom glass is 10 mm tempered glass, not 12 mm (owner, 9 Nov 2026 15:19 ET).
# Draft theme: number box can show another number on chosen products; a product FAQ question can be hidden on chosen
# products; the product template uses both and stops showing the 12 mm materials section on the two custom products.
# Store: the two product descriptions (EN) and their FR/ES translations say 10mm / 10 mm instead of 12mm / 12 mm.
import hashlib, json, re, sys

CUSTOM = ["custom-glass-railing", "custom-stair-glass"]
OUT = sys.argv[1]

def md5(s): return hashlib.md5(s.encode()).hexdigest()
def rep(s, old, new, n=1):
    assert s.count(old) == n, (s.count(old), old[:100]); return s.replace(old, new)

# ---- sections/grs-product.liquid: number box with another number on chosen products
p = open('/home/claude/cust/out/grs-product.liquid', encoding='utf-8').read()
assert md5(p) == 'c405a6528ebe5b78b09b345b4d8f746d'
p = rep(p, """{%- assign facts = section.blocks | where: 'type', 'fact' -%}""",
        """{%- comment -%} Number boxes: a box can show another number on the products picked in its "Another number on some products" settings (custom glass is 10 mm, owner 9 Nov 2026). {%- endcomment -%}
{%- assign facts = section.blocks | where: 'type', 'fact' -%}""")
p = rep(p, """{%- for block in facts -%}<li {{ block.shopify_attributes }}>""",
        """{%- for block in facts -%}{%- liquid
  assign fv = block.settings.value
  if block.settings.alt_value != blank
    for x in block.settings.alt_products
      if x.handle == p.handle
        assign fv = block.settings.alt_value
        break
      endif
    endfor
  endif
-%}<li {{ block.shopify_attributes }}>""")
p = rep(p, """<span class="pf-n">{{ block.settings.value }}<small>""", """<span class="pf-n">{{ fv }}<small>""")
p = rep(p, """{"type":"url","id":"link","label":"Link"}]}""",
        """{"type":"url","id":"link","label":"Link"},{"type":"header","content":"Another number on some products"},{"type":"product_list","id":"alt_products","label":"Products","limit":20,"info":"For example the custom glass products, which are 10 mm."},{"type":"text","id":"alt_value","label":"Number on these products"}]}""")
open(OUT + '/grs-product.liquid', 'w', encoding='utf-8').write(p)

# ---- sections/grs-product-faq.liquid: hide a question on chosen products
f = open('sections__grs-product-faq.liquid', encoding='utf-8').read()
assert md5(f) == 'e6332804d07949fc0e74933777adc50c'
f = rep(f, """  picked in its "Show on these products" setting, or on every product when that is empty. An optional U.S. answer""",
        """  picked in its "Show on these products" setting, or on every product when that is empty, but never on the products
  picked in its "Hide on these products" setting (custom glass, owner 9 Nov 2026). An optional U.S. answer""")
f = rep(f, """        if x.handle == product.handle
          assign show = true
          break
        endif
      endfor
    endif
    assign ans = block.settings.answer
    if grs_us and block.settings.answer_us != blank
      assign ans = block.settings.answer_us
    endif
  -%}{%- if show -%}{%- assign n = n | plus: 1 -%}""",
        """        if x.handle == product.handle
          assign show = true
          break
        endif
      endfor
    endif
    if show
      for x in block.settings.hide_products
        if x.handle == product.handle
          assign show = false
          break
        endif
      endfor
    endif
    assign ans = block.settings.answer
    if grs_us and block.settings.answer_us != blank
      assign ans = block.settings.answer_us
    endif
  -%}{%- if show -%}{%- assign n = n | plus: 1 -%}""")
f = rep(f, """{"type":"paragraph","content":"Each question shows on the products picked in it, or on every product when none are picked."}""",
        """{"type":"paragraph","content":"Each question shows on the products picked in it, or on every product when none are picked. Products picked in \\"Hide on these products\\" never show it."}""")
f = rep(f, """{"type":"product_list","id":"products","label":"Show on these products","limit":50,"info":"Leave empty to show on every product."},""",
        """{"type":"product_list","id":"products","label":"Show on these products","limit":50,"info":"Leave empty to show on every product."},{"type":"product_list","id":"hide_products","label":"Hide on these products","limit":50,"info":"For example a general answer that does not fit the custom glass."},""")
open(OUT + '/grs-product-faq.liquid', 'w', encoding='utf-8').write(f)

# ---- templates/product.json
t = open('templates__product-before-2026-11-09.json', encoding='utf-8').read()
assert md5(t) == '9a86183df2622825948b5f73a0183d11'
head, body = t[:t.index('{')], t[t.index('{'):]
j = json.loads(body)
fact1 = j['sections']['main']['blocks']['fact1']['settings']
assert fact1['value'] == '12' and fact1['unit'] == 'mm' and fact1['title'] == 'Tempered glass'
fact1['alt_products'] = CUSTOM; fact1['alt_value'] = '10'
q1 = j['sections']['faq']['blocks']['q1']['settings']
assert q1['question'] == 'How thick is your glass?' and '12mm' in q1['answer'] and not q1.get('products')
q1['hide_products'] = CUSTOM
mp = j['sections']['materials']['settings']['products']
assert all(h in mp for h in CUSTOM)
j['sections']['materials']['settings']['products'] = [h for h in mp if h not in CUSTOM]
newt = head + json.dumps(j, indent=2, ensure_ascii=False) + '\n'
open(OUT + '/product.json', 'w', encoding='utf-8').write(newt)
# the rest must be unchanged
j0 = json.loads(body)
j0['sections']['main']['blocks']['fact1']['settings'].update(alt_products=CUSTOM, alt_value='10')
j0['sections']['faq']['blocks']['q1']['settings']['hide_products'] = CUSTOM
j0['sections']['materials']['settings']['products'] = [h for h in mp if h not in CUSTOM]
assert j0 == json.loads(newt[newt.index('{'):])

# ---- product descriptions and translations
d = json.load(open('products-before-2026-11-09.json', encoding='utf-8'))
store = {}
for k, n_en in (('a', 2), ('b', 3)):
    pr = d[k]
    en = pr['descriptionHtml']; assert en.count('12mm') == n_en and en.count('12 mm') == 0
    out = {'id': pr['id'], 'handle': pr['handle'], 'en': en.replace('12mm', '10mm')}
    for loc in ('fr', 'es'):
        v = [x['value'] for x in pr[loc] if x['key'] == 'body_html'][0]
        assert v.count('12 mm') == n_en and v.count('12mm') == 0, (loc, v.count('12 mm'))
        out[loc] = v.replace('12 mm', '10 mm')
    for lab in ('en', 'fr', 'es'):
        assert not re.search(r'1\s?2\s?mm', out[lab])
    store[pr['handle']] = out
json.dump(store, open(OUT + '/descriptions-10mm.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for fn in ('grs-product.liquid', 'grs-product-faq.liquid', 'product.json'):
    b = open(OUT + '/' + fn, 'rb').read(); print(fn, len(b), hashlib.md5(b).hexdigest())
EOF_MARKER = None

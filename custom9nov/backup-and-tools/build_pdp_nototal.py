# Calculator products (type Custom glass): no "· total" on the Add to cart buttons, because the total would use the
# base variant's price (e.g. 705.38) instead of the price the calculator works out.
import hashlib, sys
p = sys.argv[1]; s = open(p, encoding='utf-8').read()
assert hashlib.md5(s.encode()).hexdigest() == 'b650d3a43bb4f06079ccae282369ae6b', 'unexpected base'
def rep(old, new):
    global s
    assert s.count(old) == 1, (s.count(old), old[:90]); s = s.replace(old, new)
for k in ('ptot', 'mtot'):
    rep('{% endif %}</span> · <span id="KEY">{{ cv.price | times: q0 | money }}</span>'.replace('KEY', k),
        '{% endif %}</span>{% unless cg_p %} · <span id="KEY">{{ cv.price | times: q0 | money }}</span>{% endunless %}'.replace('KEY', k))
rep('    the quantity, then Add to cart, so the quantity and Add to cart stay here (owner, 9 Nov 2026, 14:42 ET).\n',
    '    the quantity, then Add to cart, so the quantity and Add to cart stay here (owner, 9 Nov 2026, 14:42 ET).\n'
    '    On products of type Custom glass the Add to cart buttons show no total: it would use the base variant\'s price,\n'
    '    not the price the calculator works out.\n')
open(p, 'w', encoding='utf-8').write(s); b = s.encode(); print(p, len(b), hashlib.md5(b).hexdigest())

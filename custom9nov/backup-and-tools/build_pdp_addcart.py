# Product page: custom glass keeps the quantity and Add to cart (owner, 9 Nov 2026 14:42 ET).
# Only the stock pill says "Custom glass"; "Start your project" stays in the quick view only.
import hashlib, re, sys
src, dst = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()
assert hashlib.md5(s.encode()).hexdigest() == '0a58147e0812fd2d118c8953fe881ad3', 'unexpected base'

def rep(old, new):
    global s
    assert s.count(old) == 1, (s.count(old), old[:90])
    s = s.replace(old, new)

# 1. Liquid flags: drop the start button label, calculator check and link.
a = s.index('  comment\n    Custom glass (owner, 9 Nov 2026)')
end_marker = "    assign cg_href = routes.root_url | append: '/pages/contact' | replace: '//', '/'\n  endif\n"
b = s.index(end_marker, a) + len(end_marker)
old_block = s[a:b]
new_block = """  comment
    Custom glass (owner, 9 Nov 2026): products of type "Custom glass" and variants whose option says Custom show
    "Custom glass" in the stock pill instead of In stock. The quick view shows "Start your project" (a link to this
    page) instead of the quantity and Add to cart. On this page the visitor enters the sizes in the calculator, then
    the quantity, then Add to cart, so the quantity and Add to cart stay here (owner, 9 Nov 2026, 14:42 ET).
  endcomment
  assign cg_p = false
  if p.type == 'Custom glass' or p.handle == 'custom-glass-railing' or p.handle == 'custom-stair-glass'
    assign cg_p = true
  endif
  assign cg_ids = ','
  assign cg_list = ''
  for v in p.variants
    assign vt = v.title | downcase
    if vt contains 'custom' or vt contains 'sur mesure' or vt contains 'medida'
      assign cg_ids = cg_ids | append: v.id | append: ','
      if cg_list != ''
        assign cg_list = cg_list | append: ','
      endif
      assign cg_list = cg_list | append: v.id
    endif
  endfor
  assign cg_key = ',' | append: cv.id | append: ','
  assign cg_now = cg_p
  if cg_ids contains cg_key
    assign cg_now = true
  endif
  assign t_custom = section.settings.custom_label
  if t_custom == blank or t_custom == 'Custom glass'
    capture t_custom
      render 'grs-custom-t', k: 'pill'
    endcapture
  endif
  if cg_p
    assign t_in_stock = t_custom
  endif
"""
for must in ("assign cg_p = false", "assign cg_list = cg_list | append: v.id", "assign t_in_stock = t_custom"):
    assert must in old_block
s = s[:a] + new_block + s[b:]

# 2. Pill: "Custom glass" while the variant can be bought, Sold out otherwise (matches the Add to cart button).
rep('<span class="instock{% unless cv.available or cg_now %} out{% endunless %}" id="pstock">{% if cg_now %}{{ t_custom }}{% elsif cv.available %}{{ t_in_stock }}{% else %}{{ t_sold_out }}{% endif %}</span>',
    '<span class="instock{% unless cv.available %} out{% endunless %}" id="pstock">{% if cv.available %}{% if cg_now %}{{ t_custom }}{% else %}{{ t_in_stock }}{% endif %}{% else %}{{ t_sold_out }}{% endif %}</span>')
# 3. Quantity and Add to cart back as in the original section.
rep('<span class="olab" id="pqlab"{% if cg_now %} hidden{% endif %}>{{ t_qty_label }}</span><div class="qtyrow product-form__buttons" id="pqrow"{% if cg_now %} hidden{% endif %}>',
    '<span class="olab">{{ t_qty_label }}</span><div class="qtyrow product-form__buttons">')
rep('id="padd"{% if cg_now or cv.available == false %} disabled{% endif %}>', 'id="padd"{% unless cv.available %} disabled{% endunless %}>')
rep('<div class="qtyrow" id="pstartw"{% unless cg_now %} hidden{% endunless %}><a class="btn dark cart-btn" id="pstart" href="{{ cg_href }}"><span class="dot"></span><span>{{ t_start }}</span></a></div>', '')
# 4. Phone bar back as in the original section.
rep('<div class="qty" style="flex:0 0 auto"{% if cg_now %} hidden{% endif %}>', '<div class="qty" style="flex:0 0 auto">')
rep('id="madd"{% if cg_now %} hidden disabled{% elsif cv.available == false %} disabled{% endif %}>', 'id="madd"{% unless cv.available %} disabled{% endunless %}>')
rep('<a class="btn" id="mstart" href="{{ cg_href }}" style="flex:1"{% unless cg_now %} hidden{% endunless %}><span class="dot"></span><span>{{ t_start }}</span></a>', '')
rep('<style>#mstart{min-width:0;font-size:15px!important;justify-content:center}#mstart .dot{display:none}#mstart>span:last-child{min-width:0;white-space:normal;text-align:center;line-height:1.2}</style>\n', '')
# 5. Variant change hook: only the pill (grs-product.js Et() handles quantity, button and Sold out).
i = s.index('<script>(function(){var D=document.getElementById("grs-pdata")')
j = s.index('</script>\n', i) + len('</script>\n')
hook = open(sys.argv[3], encoding='utf-8').read().strip()
s = s[:i] + '<script>' + hook + '</script>\n' + s[j:]
# 6. Schema: the start button settings are gone; the pill label stays.
rep(r'''{"type":"text","id":"start_label","label":"Button for custom glass","info":"Replaces the quantity and Add to cart. Empty: \"Start your project\" in the visitor's language."},{"type":"url","id":"custom_link","label":"Button link","info":"Used when this page has no calculator app block. Empty: the link under the button (quote)."},''', '')
rep(r'''"info":"Shown instead of In stock on products of type Custom glass and on variants whose option says Custom. Empty: \"Custom glass\" in the visitor's language."}''',
    r'''"info":"Shown instead of In stock on products of type Custom glass and on variants whose option says Custom. The quick view shows \"Start your project\" for them; this page keeps the quantity and Add to cart. Empty: \"Custom glass\" in the visitor's language."}''')
for gone in ('cg_href', 't_start', 'has_calc', 'pstartw', 'mstart', 'pqlab', 'pqrow', 'start_label', 'custom_link'):
    assert gone not in s, gone
open(dst, 'w', encoding='utf-8').write(s)
b = s.encode(); print(dst, len(b), hashlib.md5(b).hexdigest())

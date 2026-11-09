import json, hashlib, re
D = '/home/claude/cust/draft/'
O = '/home/claude/cust/out/'

def rep(s, old, new, count=1):
    n = s.count(old)
    assert n == count, (n, old[:120])
    return s.replace(old, new)

# ---------- snippets/grs-custom-t.liquid (new) ----------
custom_t = """{%- comment -%}
  Texts for custom (made-to-order) glass, in the visitor's language: k: 'pill' (stock pill on the product page and in
  the quick view) or 'start' (the button that replaces the quantity and Add to cart). Owner, 9 Nov 2026.
{%- endcomment -%}
{%- liquid
  assign lc = request.locale.iso_code | slice: 0, 2
  if k == 'start'
    case lc
      when 'fr'
        echo 'Commencer votre projet'
      when 'es'
        echo 'Comenzar su proyecto'
      else
        echo 'Start your project'
    endcase
  else
    case lc
      when 'fr'
        echo 'Verre sur mesure'
      when 'es'
        echo 'Vidrio a la medida'
      else
        echo 'Custom glass'
    endcase
  endif
-%}
"""
open(O + 'grs-custom-t.liquid', 'w').write(custom_t)

# ---------- sections/grs-product.liquid ----------
p = open(D + 'sections__grs-product.liquid').read()

# 1) variables after p / cv
old = "  assign p = product\n  assign cv = p.selected_or_first_available_variant\n"
new = old + """
  comment
    Custom glass (owner, 9 Nov 2026): made-to-order glass is never added to the cart from the theme. Products of type
    "Custom glass" and variants whose option says Custom show "Custom glass" in the stock pill and a "Start your
    project" button instead of the quantity and Add to cart (also in the phone bar). The button goes to the calculator
    app block on this page (#pcalc), else to the "Button link" setting, else to the quote link.
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
  assign t_start = section.settings.start_label
  if t_start == blank or t_start == 'Start your project'
    capture t_start
      render 'grs-custom-t', k: 'start'
    endcapture
  endif
  if cg_p
    assign t_in_stock = t_custom
  endif
  assign has_calc = false
  for block in section.blocks
    if block.type == '@app'
      assign has_calc = true
      break
    endif
  endfor
  if has_calc
    assign cg_href = '#pcalc'
  elsif section.settings.custom_link != blank
    capture cg_href
      render 'grs-url', url: section.settings.custom_link
    endcapture
  elsif section.settings.quote_link != blank
    capture cg_href
      render 'grs-url', url: section.settings.quote_link
    endcapture
  else
    assign cg_href = routes.root_url | append: '/pages/contact' | replace: '//', '/'
  endif
"""
p = rep(p, old, new)

# 2) stock pill
old = '<span class="instock{% unless cv.available %} out{% endunless %}" id="pstock">{% if cv.available %}{{ t_in_stock }}{% else %}{{ t_sold_out }}{% endif %}</span>'
new = '<span class="instock{% unless cv.available or cg_now %} out{% endunless %}" id="pstock">{% if cg_now %}{{ t_custom }}{% elsif cv.available %}{{ t_in_stock }}{% else %}{{ t_sold_out }}{% endif %}</span>'
p = rep(p, old, new)

# 3) first app block = calculator anchor
old = "{%- when '@app' -%}<div class=\"papp\" {{ block.shopify_attributes }}>"
new = "{%- when '@app' -%}<div class=\"papp\"{% unless pcalc_done %} id=\"pcalc\"{% assign pcalc_done = true %}{% endunless %} {{ block.shopify_attributes }}>"
p = rep(p, old, new)

# 4) quantity label, row, add button, start button
old = '<span class="olab">{{ t_qty_label }}</span><div class="qtyrow product-form__buttons">'
new = '<span class="olab" id="pqlab"{% if cg_now %} hidden{% endif %}>{{ t_qty_label }}</span><div class="qtyrow product-form__buttons" id="pqrow"{% if cg_now %} hidden{% endif %}>'
p = rep(p, old, new)
old = 'id="padd"{% unless cv.available %} disabled{% endunless %}>'
new = 'id="padd"{% if cg_now or cv.available == false %} disabled{% endif %}>'
p = rep(p, old, new)
old = '</span></span></button></div><p class="perr" id="perr" role="alert" hidden></p>'
new = '</span></span></button></div><div class="qtyrow" id="pstartw"{% unless cg_now %} hidden{% endunless %}><a class="btn dark cart-btn" id="pstart" href="{{ cg_href }}"><span class="dot"></span><span>{{ t_start }}</span></a></div><p class="perr" id="perr" role="alert" hidden></p>'
p = rep(p, old, new)

# 5) phone bar
old = '<div class="mbar" id="mbar"><div class="qty" style="flex:0 0 auto">'
new = '<div class="mbar" id="mbar"><div class="qty" style="flex:0 0 auto"{% if cg_now %} hidden{% endif %}>'
p = rep(p, old, new)
old = '<button type="button" class="btn" id="madd"{% unless cv.available %} disabled{% endunless %}>'
new = '<button type="button" class="btn" id="madd"{% if cg_now %} hidden disabled{% elsif cv.available == false %} disabled{% endif %}>'
p = rep(p, old, new)
old = '</span></span></button></div>\n<script type="application/json" id="grs-pdata">'
new = '</span></span></button><a class="btn" id="mstart" href="{{ cg_href }}" style="flex:1"{% unless cg_now %} hidden{% endunless %}><span class="dot"></span><span>{{ t_start }}</span></a></div>\n<script type="application/json" id="grs-pdata">'
p = rep(p, old, new)

# 6) product data: custom flags + label
old = '"err":{{ t_error_text | json }},"v":['
new = '"err":{{ t_error_text | json }},"cp":{{ cg_p | json }},"cv":[{{ cg_list }}],"cl":{{ t_custom | json }},"v":['
p = rep(p, old, new)

# 7) hook script after the product data (variant changes)
hook = ('<script>(function(){var D=document.getElementById("grs-pdata"),F=document.getElementById("grs-pform");if(!D||!F)return;'
        'var d;try{d=JSON.parse(D.textContent)}catch(e){return}var C=d.cv||[];if(!d.cp&&!C.length)return;'
        'var I=F.querySelector(\'input[name="id"]\');function g(i){return document.getElementById(i)}'
        'function set(){var id=I?+I.value:0,c=!!d.cp||C.indexOf(id)>-1,s=g("pstock"),a=g("padd"),m=g("madd"),b=g("mbar"),'
        'v=(d.v||[]).filter(function(x){return x.id===id})[0];'
        'if(s){if(c){s.textContent=d.cl;s.classList.remove("out")}else if(v){s.textContent=v.a?d["in"]:d.out;s.classList.toggle("out",!v.a)}}'
        '["pqlab","pqrow"].forEach(function(k){var e=g(k);e&&(e.hidden=c)});var w=g("pstartw");w&&(w.hidden=!c);'
        'if(b){var q=b.querySelector(".qty");q&&(q.hidden=c);m&&(m.hidden=c);var ms=g("mstart");ms&&(ms.hidden=!c)}'
        'if(c){a&&(a.disabled=!0);m&&(m.disabled=!0)}}'
        'F.addEventListener("change",function(){setTimeout(set,0)});'
        'document.readyState==="loading"?document.addEventListener("DOMContentLoaded",function(){setTimeout(set,0)}):setTimeout(set,0)})();</script>')
old = ']}</script>\n{%- comment -%}\n  Structured data:'
new = ']}</script>\n' + hook + '\n{%- comment -%}\n  Structured data:'
p = rep(p, old, new)

# 8) schema settings
i = p.find('{% schema %}'); j = p.find('{% endschema %}')
sch = json.loads(p[i + len('{% schema %}'):j])
ids = [s.get('id') for s in sch['settings']]
k = ids.index('quote_link')
add = [
  {"type": "header", "content": "Custom glass (made to order)"},
  {"type": "text", "id": "custom_label", "label": "Stock label for custom glass", "info": "Shown instead of In stock on products of type Custom glass and on variants whose option says Custom. Empty: \"Custom glass\" in the visitor's language."},
  {"type": "text", "id": "start_label", "label": "Button for custom glass", "info": "Replaces the quantity and Add to cart. Empty: \"Start your project\" in the visitor's language."},
  {"type": "url", "id": "custom_link", "label": "Button link", "info": "Used when this page has no calculator app block. Empty: the link under the button (quote)."}
]
sch['settings'][k + 1:k + 1] = add
p = p[:i] + '{% schema %}\n' + json.dumps(sch, ensure_ascii=False, separators=(',', ':')) + '\n' + p[j:]
open(O + 'grs-product.liquid', 'w').write(p)

# ---------- snippets/grs-quickview.liquid ----------
q = open(D + 'snippets__grs-quickview.liquid').read()
old = '<div class="modal" id="qvm" role="dialog"'
new = ('{%- capture qv_cl -%}{% render \'grs-custom-t\', k: \'pill\' %}{%- endcapture -%}'
       '{%- capture qv_sl -%}{% render \'grs-custom-t\', k: \'start\' %}{%- endcapture -%}'
       '<div class="modal" id="qvm" data-cl="{{ qv_cl | escape }}" data-sl="{{ qv_sl | escape }}" role="dialog"')
q = rep(q, old, new)
qscript = ('{%- comment -%} Custom glass (owner, 9 Nov 2026): custom products (type Custom glass, the price calculator\'s '
           'products) and variants whose option says Custom show "Custom glass" in the pill and "Start your project" '
           '(the product page) instead of the quantity and Add to cart. Runs after grs.js on each grs:qv. {%- endcomment -%}\n'
           '<script>(function(){var M=document.getElementById("qvm");if(!M)return;var CL=M.getAttribute("data-cl"),SL=M.getAttribute("data-sl"),'
           'R=/custom|sur mesure|medida/i,L=null,O=null;'
           'document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest("[data-quick]");b&&(L=b)},!0);'
           'document.addEventListener("grs:qv",function(e){var d=e.detail||{},h=d.h||"",s=M.querySelector(".instock"),'
           'b=document.getElementById("qbuy"),g=document.getElementById("qopts"),w=document.getElementById("qoptw"),k=document.getElementById("qlink");'
           'if(!s||!b||!g)return;var t=g.querySelector("span:last-child");O===null&&t&&(O=t.textContent);'
           'var all=[].slice.call(M.querySelectorAll("#qoptw .vp-c")),'
           'p=!!(L&&L.getAttribute("data-quick")===h&&L.hasAttribute("data-qc"))||/^custom-/.test(h)||all.some(function(x){return(x.getAttribute("data-val")||"").indexOf("Default_cpc_")===0}),'
           'v=all.some(function(x){return x.classList.contains("on")&&R.test(x.getAttribute("data-val")||"")}),c=p||v;'
           'M.classList.toggle("qv-custom",c);p&&w&&(w.hidden=!0);'
           'if(c){s.textContent=CL;s.classList.remove("out");b.hidden=!0;g.hidden=!1;t&&(t.textContent=SL);'
           'var u=((k&&k.getAttribute("href"))||g.getAttribute("href")||"").split("#")[0].split("?")[0];'
           'g.setAttribute("href",u+(p?"#pcalc":"?variant="+d.v))}'
           'else{b.hidden=!1;g.hidden=!0;t&&O!==null&&(t.textContent=O)}})})();</script>\n')
q = q.rstrip('\n') + '\n' + qscript
open(O + 'grs-quickview.liquid', 'w').write(q)

# ---------- snippets/grs-card.liquid ----------
c = open(D + 'snippets__grs-card.liquid').read()
old = '<button class="btn-o qv" type="button" data-quick="{{ p.handle }}">'
new = '<button class="btn-o qv" type="button" data-quick="{{ p.handle }}"{% if p.type == \'Custom glass\' %} data-qc="1"{% endif %}>'
c = rep(c, old, new)
open(O + 'grs-card.liquid', 'w').write(c)

for f in ('grs-custom-t.liquid', 'grs-product.liquid', 'grs-quickview.liquid', 'grs-card.liquid'):
    b = open(O + f, 'rb').read()
    print(f, len(b), hashlib.md5(b).hexdigest())

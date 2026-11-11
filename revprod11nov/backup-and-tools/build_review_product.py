# Product page reviews: each review shows the product it was written for (owner, 11 Nov 2026 11:23 ET).
# Changes sections/grs-product-reviews.liquid only; assets/grs-product.js and the style files are untouched.
import hashlib, json, sys

SRC, DST, CSS, JS = sys.argv[1:5]
s = open(SRC, encoding='utf-8').read()
assert hashlib.md5(s.encode()).hexdigest() == '5808e331f1a78eb9fa36f6663d2b8380', 'unexpected base'
css = open(CSS, encoding='utf-8').read().strip()
js = open(JS, encoding='utf-8').read().strip()
for bad in ('{{', '{%', '</script', '</style'):  # '}}' alone is plain text to Liquid
    assert bad not in css and bad not in js, bad


def rep(old, new):
    global s
    assert s.count(old) == 1, (s.count(old), old[:100])
    s = s.replace(old, new)


# 1. Header comment
rep("""  App blocks (the Judge.me review widget: every review, writing a review, and the review data Google reads) sit under
  the reviews in a line that opens them.
""", """  App blocks (the Judge.me review widget: every review, writing a review, and the review data Google reads) sit under
  the reviews in a line that opens them.
  Each review shows the product it was written for (owner, 11 Nov 2026): a small photo and the product name beside the
  reviewer. The product's own reviews show this product; the store's recent reviews each show their own product, as
  a link to it.
""")

# 2. Product photo and label of this product
rep("""  assign revs = w | split: "<div class='jdgm-rev jdgm-divider-top'"
-%}
""", """  assign revs = w | split: "<div class='jdgm-rev jdgm-divider-top'"
-%}
{%- liquid
  comment
    Product shown with each review. Photo: the Brushed Stainless variant's studio photo when the product has one
    (as in the collection reviews), otherwise the product's first photo. The first review's product is printed
    below with the review; the script at the end of this file adds it again each time assets/grs-product.js draws
    another review, so that file stays as it is.
  endcomment
  assign pr_im = p.featured_image
  assign pr_st = 0
  for v in p.variants
    if v.featured_image and v.options contains 'Brushed Stainless' or v.options contains 'Inox brossé' or v.options contains 'Acero inoxidable cepillado'
      assign pr_im = v.featured_image
      assign pr_st = 1
      break
    endif
  endfor
  assign pr_src = ''
  if pr_im
    assign pr_src = pr_im | image_url: width: 120
  endif
  assign t_product = 'grs.js.rv_product' | t
-%}
<style>""" + css + """</style>
""")

# 3. Data for the script on the section element
rep("""data-store-eb="{{ t_eyebrow_store | escape }}"><div class="wrap sp">""",
    """data-store-eb="{{ t_eyebrow_store | escape }}" data-pr-l="{{ t_product | escape }}" data-pr-t="{{ p.title | escape }}" data-pr-i="{{ pr_src | escape }}" data-pr-s="{{ pr_st }}"><div class="wrap sp">""")

# 4. The first review (printed by Liquid) gets its product
rep("""{{ t_verified }}</em>{%- endif -%}</span></div>{%- endif -%}
</div><div class="sp-nav\"""",
    """{{ t_verified }}</em>{%- endif -%}</span><span class="sp-pr">{%- if pr_src != '' -%}<span class="sp-pr-im"><img class="ph{% if pr_st == 1 %} studio{% endif %}" src="{{ pr_src | escape }}" alt="" width="60" height="60" loading="lazy" decoding="async"></span>{%- endif -%}<span class="sp-pr-t"><span class="sp-pr-l">{{ t_product }}</span><span class="sp-pr-n">{{ p.title | escape }}</span></span></span></div>{%- endif -%}
</div><div class="sp-nav\"""")

# 5. Photos of the other products (only when the store's reviews fill in), then the script
rep("""<script type="application/json" class="sp-data">""",
    """{%- if shown < 2 -%}
{%- comment -%} Photos of the other reviewed products, by product address, for the store's reviews that fill in. {%- endcomment -%}
<script type="application/json" class="sp-pmap">{
{%- assign pm_sep = '' -%}
{%- paginate collections.all.products by 250 -%}
{%- for q in collections.all.products -%}
{%- liquid
  assign q_rc = q.metafields.reviews.rating_count.value | plus: 0
  if q_rc < 1 or q.handle == p.handle
    continue
  endif
  assign q_im = q.featured_image
  assign q_st = 0
  for v in q.variants
    if v.featured_image and v.options contains 'Brushed Stainless' or v.options contains 'Inox brossé' or v.options contains 'Acero inoxidable cepillado'
      assign q_im = v.featured_image
      assign q_st = 1
      break
    endif
  endfor
  assign q_src = ''
  if q_im
    assign q_src = q_im | image_url: width: 120
  endif
-%}
{{ pm_sep }}{{ q.url | json }}:[{{ q_src | json }},{{ q_st }}]
{%- assign pm_sep = ',' -%}
{%- endfor -%}
{%- endpaginate -%}
}</script>
{%- endif -%}
<script type="application/json" class="sp-data">""")
rep("""{{ t_based_on | json }},"r":[{{ rows }}]}</script></section>""",
    """{{ t_based_on | json }},"r":[{{ rows }}]}</script>
<script>""" + js + """</script></section>""")

# 6. Schema note
rep("""With fewer than two 4 or 5 star reviews of its own, the store's recent reviews show instead."}""",
    """With fewer than two 4 or 5 star reviews of its own, the store's recent reviews show instead. Each review shows the photo and name of the product it was written for."}""")

a = s.index('{% schema %}') + len('{% schema %}'); b = s.index('{% endschema %}')
json.loads(s[a:b])
# comment lines inside {% liquid %} must not start with a tag word
import re
for blk in re.findall(r'\n  comment\n(.*?)\n  endcomment', s, re.S):
    for line in blk.split('\n'):
        w = line.strip().split(' ')[0].strip(',.:;').lower()
        assert w not in ('if', 'for', 'case', 'when', 'assign', 'capture', 'unless', 'else', 'elsif', 'endif', 'endfor', 'render', 'include', 'echo', 'liquid', 'raw', 'comment', 'cycle', 'increment', 'decrement', 'break', 'continue', 'tablerow', 'paginate', 'form', 'section', 'style', 'schema', 'javascript', 'layout', 'endcase', 'endunless', 'endcapture', 'endraw'), line
open(DST, 'w', encoding='utf-8').write(s)
b = s.encode(); print(DST, len(b), hashlib.md5(b).hexdigest())

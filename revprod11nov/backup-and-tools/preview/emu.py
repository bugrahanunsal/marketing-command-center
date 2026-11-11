# Local preview only: a hand port of sections/grs-product-reviews.liquid (with the 11 Nov product chip) and of
# templates/index.grs-reviews.liquid to Python, fed with the real Judge.me metafields, so the real theme styles and
# the real assets/grs-product.js can be run in a headless browser. Not part of the theme.
import datetime, html, json, re

REV = '/home/claude/cust/rev/'
STARS5 = re.sub(r'\{%-?\s*comment.*?endcomment\s*-?%\}', '', open(REV + 'snippets__grs-stars.liquid', encoding='utf-8').read(), flags=re.S).strip()
STAR = STARS5[:STARS5.index('</svg>') + 6]
CHK = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>'


def esc(s):
    return html.escape(str(s), quote=True).replace('&#x27;', '&#39;')


def jfilter(v):  # Shopify's json filter
    return json.dumps(v, ensure_ascii=False).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')


def strip_html(s):
    s = re.sub(r'<script.*?</script>|<style.*?</style>|<!--.*?-->', '', s, flags=re.S)
    return re.sub(r'<[^>]*>', '', s)


def num(n):
    return '{:,}'.format(int(n))


def date_fmt(d, lang='en'):
    y, m, dd = [int(x) for x in d.split('-')]
    if lang == 'fr':
        mo = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'][m - 1]
        return '%d %s %d' % (dd, mo, y)
    return datetime.date(y, m, dd).strftime('%B %-d, %Y')


def parse_widget(w):
    """Port of the Liquid that reads judgeme.widget: histogram and reviews [st, dt, au, ti, bd, vb]."""
    hist = []
    for x in w.split("data-frequency='")[1:6]:
        try:
            hist.append(int(x.split("'")[0]))
        except ValueError:
            hist.append(0)
    out = []
    for rv in w.split("<div class='jdgm-rev jdgm-divider-top'")[1:]:
        a = rv.split("jdgm-rev__rating' data-score='")
        st = int((a[1].split("'")[0] if len(a) > 1 else '0') or 0)
        a = rv.split('jdgm-rev__timestamp')
        a = a[1].split("data-content='") if len(a) > 1 else ['']
        dt = (a[1].split("'")[0] if len(a) > 1 else '')[:10]
        a = rv.split("<span class='jdgm-rev__author'>")
        au = a[1].split('</span>')[0].strip() if len(a) > 1 else ''
        ti = ''
        if "<b class='jdgm-rev__title'>" in rv:
            ti = strip_html(rv.split("<b class='jdgm-rev__title'>")[1].split('</b>')[0]).strip()
        a = rv.split("<div class='jdgm-rev__body'>")
        bd = a[1].split('</div>')[0] if len(a) > 1 else ''
        bd = strip_html(bd.replace('</p>', ' ')).replace('\r', '').replace('\n', '').strip()
        vb = 1 if "data-verified-buyer='true'" in rv else 0
        out.append([st, dt, au, ti, bd, vb])
    return hist, out


def thumb(p):
    """[src, studio] as the Liquid picks it: here the featured image; studio when it is a brushed-stainless studio shot."""
    im = ((p.get('featuredMedia') or {}).get('image') or {}).get('url') or ''
    if not im:
        return ['', 0]
    st = 1 if 'brushed-stainless' in im else 0
    # as image_url gives it: on the store's own address (same origin), which the studio script needs
    im = '//grs.local/cdn/shop/files/' + im.split('/files/')[-1]
    return [im + ('&' if '?' in im else '?') + 'width=120', st]


def product_url(p, root=''):
    return root + '/products/' + p['handle']


def index_view(products, t_n, t_avg, root=''):
    """Port of templates/index.grs-reviews.liquid."""
    P = {}
    for p in products:
        rc = int(((p.get('rc') or {}).get('value')) or 0)
        if rc < 1:
            continue
        w = (p.get('w') or {}).get('value') or ''
        hist, revs = parse_widget(w)
        avg = float(json.loads(p['rt']['value'])['value'])
        P[p['handle']] = {'t': p['title'], 'u': product_url(p, root), 'avg': avg, 'n': rc, 'h': hist or [0, 0, 0, 0, 0], 'r': [[r[0], r[1], r[2], r[3], r[4], r[5]] for r in revs]}
    return {'n': t_n, 'avg': t_avg, 'p': P}


def section(p, products, t_n, css, js, T, root='', lang='en', chip=True):
    """Port of sections/grs-product-reviews.liquid. T: texts. chip=False gives the section as it was before."""
    rc = int(((p.get('rc') or {}).get('value')) or 0)
    avg = float(json.loads(p['rt']['value'])['value']) if p.get('rt') else 0
    w = (p.get('w') or {}).get('value') or ''
    hist, revs = parse_widget(w)
    tot = sum(hist)
    pr_src, pr_st = thumb(p)
    o = []
    if chip:
        o.append('<style>' + css + '</style>\n')
    o.append('<section class="sec sp-sec" aria-labelledby="sp-h" style="--max:1440px;--grs-pt:1.0;--grs-pb:1.0;" data-grs data-sp data-h="%s" data-root="%s" data-store-eb="%s"' % (p['handle'], (root or '') + '/', esc(T['eyebrow_store'])))
    if chip:
        o.append(' data-pr-l="%s" data-pr-t="%s" data-pr-i="%s" data-pr-s="%d"' % (esc(T['product']), esc(p['title']), esc(pr_src), pr_st))
    o.append('><div class="wrap sp"><div class="sp-sum"><span class="dot-eyebrow">%s</span><h2 class="mh2" id="sp-h">%s</h2>' % (T['eyebrow'], T['heading']))
    if rc > 0:
        pct = avg * 20
        o.append('<div class="sp-avg"><b>%s</b><span><span class="sp-stars" role="img" aria-label="Rated %s out of 5"><span class="rate-s" aria-hidden="true"><span class="rate-bg">%s</span><span class="rate-fg" style="width:%s%%">%s</span></span></span>%s %s %s</span></div>' % (round(avg, 2), round(avg, 2), STARS5, pct, STARS5, T['based_on'], num(rc), T['word']))
        o.append('\n<div class="sp-hist">')
        for k in range(5):
            c = hist[k] if k < len(hist) else 0
            pc = c * 100.0 / tot if tot > 0 else 0
            if tot > 0 and c > 0 and pc < 1.5:
                pc = 1.5
            o.append('<div class="crv-hr"><span>%d%s</span><i><b style="width:%s%%"></b></i><em>%d</em></div>' % (5 - k, STAR, pc, c))
        o.append('</div>')
    o.append('\n<button type="button" class="btn rv-all sp-all" data-rvall=""><span class="dot"></span>%s %s %s</button></div>' % (T['all_label'], num(t_n), T['word']))
    o.append('\n<div class="sp-stage"><span class="sp-mark" aria-hidden="true">“</span><div class="sp-q in" id="spq" aria-live="polite">')
    shown = 0
    rows = []
    first = None
    for r in revs:
        st, dt, au, ti, bd, vb = r
        if st >= 4 and len(bd) >= 20:
            rows.append('[%d,%s,%s,%s,%d]' % (st, jfilter(dt), jfilter(au), jfilter(bd), vb))
            shown += 1
            if shown == 1:
                first = r
    if shown > 0:
        st, dt, au, ti, bd, vb = first
        o.append('<div class="sp-top"><span class="crv-st" role="img" aria-label="%d out of 5 stars">%s</span><time datetime="%s">%s</time></div>' % (st, STAR * st, dt, date_fmt(dt, lang)))
        o.append('<blockquote class="sp-text%s"><p>%s</p></blockquote>' % (' sp-long' if len(bd) > 260 else '', esc(bd)))
        o.append('<div class="sp-who"><span class="rvm-av" aria-hidden="true">%s</span><span><b>%s</b>%s</span>' % (au[:1].upper(), au, ('<em>' + CHK + T['verified'] + '</em>') if vb == 1 else ''))
        if chip:
            o.append('<span class="sp-pr">')
            if pr_src != '':
                o.append('<span class="sp-pr-im"><img class="ph%s" src="%s" alt="" width="60" height="60" loading="lazy" decoding="async"></span>' % (' studio' if pr_st == 1 else '', esc(pr_src)))
            o.append('<span class="sp-pr-t"><span class="sp-pr-l">%s</span><span class="sp-pr-n">%s</span></span></span>' % (T['product'], esc(p['title'])))
        o.append('</div>')
    o.append('\n</div><div class="sp-nav"%s><button type="button" class="sp-btn" data-sp="-1" aria-label="Previous review"><svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true"><path d="M15 6H1.5M6.5 1l-5 5 5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg></button><span class="sp-count" id="spcount">1 / %d</span><button type="button" class="sp-btn" data-sp="1" aria-label="Next review"><svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true"><path d="M1 6h13.5M9.5 1l5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg></button></div></div></div>' % (' hidden' if shown < 2 else '', shown))
    o.append('\n<div class="wrap sp-apps"><details class="sp-more"><summary>%s<svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M1 1l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg></summary><div class="sp-app"></div></details></div>' % T['apps_label'])
    if chip and shown < 2:
        m = []
        for q in products:
            q_rc = int(((q.get('rc') or {}).get('value')) or 0)
            if q_rc < 1 or q['handle'] == p['handle']:
                continue
            q_src, q_st = thumb(q)
            m.append('%s:[%s,%d]' % (jfilter(product_url(q, root)), jfilter(q_src), q_st))
        o.append('<script type="application/json" class="sp-pmap">{' + ','.join(m) + '}</script>')
    o.append('<script type="application/json" class="sp-data">{"own":%d,"verified":%s,"based":%s,"r":[%s]}</script>' % (shown, jfilter(T['verified']), jfilter(T['based_on']), ','.join(rows)))
    if chip:
        o.append('\n<script>' + js + '</script>')
    o.append('</section>')
    return ''.join(o), shown


TEXTS = {
    'en': {'eyebrow': 'This product', 'eyebrow_store': 'Our customers', 'heading': 'Customer reviews', 'based_on': 'Based on', 'all_label': 'See all', 'verified': 'Verified buyer', 'apps_label': 'All reviews of this product, or write one', 'word': 'reviews', 'product': 'Product'},
    'fr': {'eyebrow': 'Ce produit', 'eyebrow_store': 'Nos clients', 'heading': 'Avis clients', 'based_on': 'Selon', 'all_label': 'Voir les', 'verified': 'Acheteur vérifié', 'apps_label': 'Tous les avis sur ce produit ou rédiger un avis', 'word': 'avis', 'product': 'Produit'},
    'es': {'eyebrow': 'Este producto', 'eyebrow_store': 'Nuestros clientes', 'heading': 'Reseñas de clientes', 'based_on': 'Basado en', 'all_label': 'Ver las', 'verified': 'Comprador verificado', 'apps_label': 'Todas las reseñas de este producto, o escriba una', 'word': 'reseñas', 'product': 'Producto'},
}


def page(sec_html, dark=False, lang='en', extra_css=''):
    D = '/home/claude/cust/draft/'
    return ('<!doctype html><html class="js grs-css%s" lang="%s"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            '<link rel="stylesheet" href="/css/grs.css"><link rel="stylesheet" href="/css/grs-product.css">'
            '<style>:root{--sans:"Poppins",ui-sans-serif,system-ui,sans-serif;--mono:"DejaVu Sans Mono",ui-monospace,monospace}:root:not(.grs-dark){--fg2:#6B6B67}%s</style>'
            '<script src="/js/grs-studio.js" data-worker="/js/grs-studio-worker.js" defer></script>'
            '<script>window.GRS={root:"/",t:{}}</script></head><body><main id="main">%s</main>'
            '<script src="/js/grs-product.js" defer></script></body></html>') % (' grs-dark' if dark else '', lang, extra_css, sec_html)

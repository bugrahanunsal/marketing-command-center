# Local preview: runs the real theme styles and the real assets/grs-product.js on the ported section (emu.py).
import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
import emu
from playwright.sync_api import sync_playwright

D = '/home/claude/cust/draft/'
HERE = os.path.dirname(os.path.abspath(__file__)) + '/'
products = json.load(open('/home/claude/cust/rev/products-reviews-2026-11-11.json', encoding='utf-8'))
by = {p['handle']: p for p in products}
T_N, T_AVG = 3017, 4.94
css = open(HERE + '../chip.css', encoding='utf-8').read().strip()
js = open(HERE + '../chip.js', encoding='utf-8').read().strip()
FILES = {'/css/grs.css': (D + 'assets__grs.css', 'text/css'), '/css/grs-product.css': (D + 'assets__grs-product.css', 'text/css'), '/js/grs-product.js': (D + 'assets__grs-product.js', 'application/javascript'), '/js/grs-studio.js': ('/home/claude/cust/rev/assets__grs-studio.js', 'application/javascript'), '/js/grs-studio-worker.js': (HERE + 'grs-studio-worker.js', 'application/javascript')}
PAGES = {}
LOG = []


def handler(route, request):
    u = request.url
    if 'cdn.shopify.com' in u or '/cdn/shop/files/' in u:
        f = 'studio.png' if 'brushed-stainless' in u else 'cover.jpg'
        if 'connector' in u and 'brushed-stainless' in u:
            f = 'studio2.png'
        return route.fulfill(status=200, content_type='image/png' if f.endswith('png') else 'image/jpeg', body=open(HERE + f, 'rb').read())
    path = u.split('grs.local', 1)[1] if 'grs.local' in u else u
    if path in FILES:
        fn, ct = FILES[path]
        return route.fulfill(status=200, content_type=ct + '; charset=utf-8', body=open(fn, 'rb').read())
    if 'view=grs-reviews' in path:
        root = path.split('/?view=')[0]
        LOG.append('fetch ' + path)
        return route.fulfill(status=200, content_type='text/html; charset=utf-8', body=json.dumps(emu.index_view(products, T_N, T_AVG, root), ensure_ascii=False))
    if path in PAGES:
        return route.fulfill(status=200, content_type='text/html; charset=utf-8', body=PAGES[path])
    if path.startswith('/products/') or path.startswith('/fr/products/'):
        return route.fulfill(status=200, content_type='text/html; charset=utf-8', body='<html><body>product page ' + path + '</body></html>')
    return route.abort()


def make(name, handle, chip=True, dark=False, lang='en', root='', extra_css=''):
    sec, shown = emu.section(by[handle], products, T_N, css, js, emu.TEXTS[lang], root=root, lang=lang, chip=chip)
    PAGES['/p/' + name] = emu.page(sec, dark=dark, lang=lang, extra_css=extra_css)
    return shown


def run(jobs):
    out = {}
    with sync_playwright() as pw:
        b = pw.chromium.launch(args=['--no-sandbox'])
        for job in jobs:
            name = job['name']
            ctx = b.new_context(viewport={'width': job.get('w', 1440), 'height': job.get('h', 900)}, device_scale_factor=job.get('dpr', 1))
            pg = ctx.new_page()
            errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.on('console', lambda m: errs.append('console.' + m.type + ': ' + m.text) if m.type in ('error',) else None)
            pg.route('**/*', handler)
            pg.goto('http://grs.local/p/' + name, wait_until='load')
            pg.wait_for_timeout(job.get('wait', 500))
            res = {'errors': errs}
            if job.get('fn'):
                res['result'] = job['fn'](pg)
            pg.add_style_tag(content='.sp-q.in{animation:none!important}')
            pg.wait_for_timeout(80)
            target = job.get('target', '.sp')
            pg.locator(target).first.screenshot(path=HERE + 'shot-' + name + job.get('suffix', '') + '.png')
            out[name + job.get('suffix', '')] = res
            ctx.close()
        b.close()
    return out


if __name__ == '__main__':
    pass

import shots, emu, json, copy
by = shots.by
JS_STATE = """() => { var w = document.querySelector('.sp-who'); var c = w && w.querySelector('.sp-pr'); var im = c && c.querySelector('img'); return {count: document.querySelector('#spcount').textContent, who: w ? w.innerText.replace(/\\n/g,' | ') : null, chips: document.querySelectorAll('#spq .sp-pr').length, tag: c ? c.tagName + ' ' + (c.getAttribute('href')||'') : null, img: im ? im.className : null, html: c ? c.querySelector('.sp-pr-n').innerHTML : null, stray: w ? w.querySelectorAll('a:not(.sp-pr)').length : null} }"""
# 1. own product without a photo, title with characters that need escaping
fake = copy.deepcopy(by['glass-railing-spigot']); fake['handle'] = 'fake-noimg'; fake['title'] = 'Glass & <b>Panel</b> 6" "x"'; fake['featuredMedia'] = None
shots.products.append(fake); shots.by['fake-noimg'] = fake
shots.make('noimg', 'fake-noimg')
# 2. fallback page whose photo list misses the products (as if the list were empty)
sec, shown = emu.section(by['glass-railing-screws'], shots.products, shots.T_N, shots.css, shots.js, emu.TEXTS['en'])
import re
sec2 = re.sub(r'<script type="application/json" class="sp-pmap">.*?</script>', '<script type="application/json" class="sp-pmap">{}</script>', sec, flags=re.S)
shots.PAGES['/p/nomap'] = emu.page(sec2)
sec3 = re.sub(r'<script type="application/json" class="sp-pmap">.*?</script>', '<script type="application/json" class="sp-pmap">{broken</script>', sec, flags=re.S)
shots.PAGES['/p/badmap'] = emu.page(sec3)
# 3. French
shots.make('fr', 'glass-railing-side-mount-spigot', lang='fr', root='/fr')
def walk(n, extra=None):
    def fn(pg):
        out = [pg.evaluate(JS_STATE)]
        for i in range(n):
            pg.click('.sp-btn[data-sp="1"]'); pg.wait_for_timeout(140); out.append(pg.evaluate(JS_STATE))
        if extra: out.append(extra(pg))
        return out
    return fn
# 4. theme editor: the section is replaced and shopify:section:load fires (scripts in the new HTML are run again)
def editor(pg):
    return pg.evaluate("""async () => {
      var wrap = document.querySelector('#main'); var html = wrap.innerHTML;
      wrap.innerHTML = html;                                    // new section element, as the editor does
      wrap.querySelectorAll('script:not([type])').forEach(function (s) { var n = document.createElement('script'); n.textContent = s.textContent; s.replaceWith(n); });
      wrap.dispatchEvent(new CustomEvent('shopify:section:load', {bubbles: true}));
      await new Promise(r => setTimeout(r, 300));
      var before = document.querySelectorAll('#spq .sp-pr').length;
      document.querySelector('.sp-btn[data-sp="1"]').click();
      await new Promise(r => setTimeout(r, 200));
      return {editor: true, chipsAfterReload: before, chipsAfterNext: document.querySelectorAll('#spq .sp-pr').length, count: document.querySelector('#spcount').textContent, who: document.querySelector('.sp-who').innerText.replace(/\\n/g, ' | ')};
    }""")
# 5. prev button and many quick clicks
def stress(pg):
    return pg.evaluate("""async () => {
      var n = document.querySelector('.sp-btn[data-sp="1"]'), p = document.querySelector('.sp-btn[data-sp="-1"]'), bad = 0;
      for (var i = 0; i < 40; i++) { (i % 3 ? n : p).click(); await new Promise(r => setTimeout(r, 5)); if (document.querySelectorAll('#spq .sp-pr').length !== 1) bad++; }
      return {stress: true, bad: bad, count: document.querySelector('#spcount').textContent, nodes: document.querySelectorAll('.sp-pr').length};
    }""")
shots.make('spigot2', 'glass-railing-spigot')
shots.make('side2', 'glass-railing-side-mount-spigot')
r = shots.run([
  {'name': 'noimg', 'w': 1440, 'fn': walk(1), 'wait': 700},
  {'name': 'nomap', 'w': 1440, 'fn': walk(1), 'wait': 1000},
  {'name': 'badmap', 'w': 1440, 'fn': walk(1), 'wait': 1000},
  {'name': 'fr', 'w': 1440, 'fn': walk(2), 'wait': 1000},
  {'name': 'spigot2', 'w': 1440, 'fn': walk(1, editor), 'wait': 700},
  {'name': 'side2', 'w': 1440, 'fn': walk(0, stress), 'wait': 1000},
])
for k, v in r.items():
    print('==', k, 'errors:', v['errors'])
    for row in v.get('result') or []:
        print('   ', row)
print(shots.LOG)

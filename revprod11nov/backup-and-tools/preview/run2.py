import shots, json
JS_STATE = """() => { var w = document.querySelector('.sp-who'); var im = w && w.querySelector('.sp-pr img'); return {count: document.querySelector('#spcount').textContent, who: w ? w.innerText.replace(/\\n/g,' | ') : null, chips: document.querySelectorAll('#spq .sp-pr').length, tag: w && w.querySelector('.sp-pr') ? w.querySelector('.sp-pr').tagName + ' ' + (w.querySelector('.sp-pr').getAttribute('href')||'') : null, img: im ? (im.className + ' ' + (im.currentSrc||im.src).slice(0,40)) : null, strayLinks: w ? w.querySelectorAll('a:not(.sp-pr)').length : null, eyebrow: document.querySelector('.sp-sum .dot-eyebrow').textContent} }"""
def walk(n):
    def fn(pg):
        out = [pg.evaluate(JS_STATE)]
        for i in range(n):
            pg.click('.sp-btn[data-sp="1"]'); pg.wait_for_timeout(150); out.append(pg.evaluate(JS_STATE))
        return out
    return fn
shots.make('spigot', 'glass-railing-spigot')
shots.make('spigot-dark', 'glass-railing-spigot', dark=True)
shots.make('panel', 'glass-railing-34-tempered-glass-panel')
shots.make('sidemount', 'glass-railing-side-mount-spigot')
shots.make('screws', 'glass-railing-screws')
r = shots.run([
  {'name': 'spigot', 'w': 1440, 'fn': walk(4), 'wait': 900},
  {'name': 'spigot-dark', 'w': 1440, 'wait': 900},
  {'name': 'spigot', 'w': 900, 'suffix': '-900', 'wait': 900},
  {'name': 'spigot', 'w': 390, 'h': 800, 'suffix': '-390', 'dpr': 2, 'wait': 900},
  {'name': 'panel', 'w': 1440, 'wait': 900},
  {'name': 'panel', 'w': 390, 'h': 800, 'suffix': '-390', 'dpr': 2, 'wait': 900},
  {'name': 'sidemount', 'w': 1440, 'fn': walk(8), 'wait': 1200},
  {'name': 'screws', 'w': 1440, 'fn': walk(3), 'wait': 1200},
  {'name': 'screws', 'w': 390, 'h': 800, 'suffix': '-390', 'dpr': 2, 'fn': walk(1), 'wait': 1200},
])
for k, v in r.items():
    print('==', k, 'errors:', v['errors'])
    for row in v.get('result') or []:
        print('   ', row)
print(shots.LOG)

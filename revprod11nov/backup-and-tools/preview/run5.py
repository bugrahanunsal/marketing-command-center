import shots, emu, copy, json, sys
by = shots.by
fake = copy.deepcopy(by['glass-railing-34-tempered-glass-panel']); fake['handle'] = 'fake-long'
fake['w']['value'] = fake['w']['value'].replace("<span class='jdgm-rev__author'>Frauke Wenzel</span>", "<span class='jdgm-rev__author'>Vladimir Lukyanov-Cherny Alexandrovich</span>")
shots.products.append(fake); shots.by['fake-long'] = fake
fake2 = copy.deepcopy(by['glass-railing-34-tempered-glass-panel']); fake2['handle'] = 'fake-mid'
fake2['w']['value'] = fake2['w']['value'].replace("<span class='jdgm-rev__author'>Frauke Wenzel</span>", "<span class='jdgm-rev__author'>Vladimir Lukyanov-Cherny</span>")
shots.products.append(fake2); shots.by['fake-mid'] = fake2
shots.make('long', 'fake-long'); shots.make('mid', 'fake-mid'); shots.make('spg', 'glass-railing-spigot'); shots.make('pan', 'glass-railing-34-tempered-glass-panel')
JS = """() => { var w = document.querySelector('.sp-who'), c = w.querySelector('.sp-pr'), s = document.querySelector('.sp-stage'), q = document.querySelector('#spq'), r = c.getBoundingClientRect(), wr = w.getBoundingClientRect(), a = w.querySelector('.rvm-av').getBoundingClientRect(), n = w.querySelector('b').getBoundingClientRect(), t = c.querySelector('.sp-pr-n'), tr = t.getBoundingClientRect(); return {q: Math.round(q.getBoundingClientRect().width), mode: getComputedStyle(w).display, who: Math.round(wr.width) + 'x' + Math.round(wr.height), chip: Math.round(r.width) + 'x' + Math.round(r.height), chipTop: Math.round(r.top - wr.top), av: Math.round(a.width), nameLines: Math.round(n.height / 22.5), titleW: Math.round(tr.width), titleClamped: t.scrollHeight > t.clientHeight + 1, overflow: w.scrollWidth > w.clientWidth + 1, border: getComputedStyle(c).borderLeftWidth} }"""
jobs = []
names = sys.argv[1:] or ['long', 'mid', 'pan', 'spg']
for nm in names:
    for w in (1600, 1440, 1280, 1200, 1100, 1024, 990, 989, 900, 760, 750, 749, 600, 390, 340):
        jobs.append({'name': nm, 'w': w, 'h': 900, 'suffix': '-%d' % w, 'fn': (lambda pg: pg.evaluate(JS)), 'wait': 350})
r = shots.run(jobs)
for k, v in r.items(): print('%-10s' % k, v['errors'] or '', v['result'])

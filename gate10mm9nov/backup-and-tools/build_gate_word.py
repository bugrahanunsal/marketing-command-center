# Gate panel first line: "10mm Tempered Glass Gate Panels…" (owner, 9 Nov 2026 15:40 ET).
import hashlib, json
s = json.load(open('out/gate-note.json', encoding='utf-8'))   # = live now (read back exact)
def rep(t, old, new):
    assert t.count(old) == 1, (t.count(old), old[:90]); return t.replace(old, new)
en = rep(s['en'], '<p><strong>10mm Tempered Glass Panels for Self-Closing Doors with <a', '<p><strong>10mm Tempered Glass Gate Panels for Self-Closing Doors with <a')
fr = rep(s['fr'], '<p><strong>Panneaux de verre trempé de 10 mm pour portes', '<p><strong>Panneaux de portail en verre trempé de 10 mm pour portes')
es = rep(s['es'], '<p><strong>Paneles de vidrio templado de 10 mm para puertas', '<p><strong>Paneles de puerta de vidrio templado de 10 mm para puertas')
out = {'id': s['id'], 'en': en, 'fr': fr, 'es': es}
json.dump(out, open('out/gate-word.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump({'g': {'id': s['id'], 'descriptionHtml': en}}, open('out/vars-gate-word-en.json', 'w'), ensure_ascii=True)
print('EN sha256 should be', hashlib.sha256(en.encode()).hexdigest())

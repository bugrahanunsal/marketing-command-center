# Gate panel: 10mm in the first line and a note under "Important" (owner, 9 Nov 2026 15:34 ET: "evet onu da ekle kesinlikle").
import hashlib, json
s = json.load(open('out/gate-10mm.json', encoding='utf-8'))   # = what is live now (read back exact)
def rep(t, old, new):
    assert t.count(old) == 1, (t.count(old), old[:90]); return t.replace(old, new)
en, fr, es = s['en'], s['fr'], s['es']
en = rep(en, 'Gate Hardware</a> collection.</p>\n',
         'Gate Hardware</a> collection.</p>\n<p><strong>Note:</strong> this gate panel is 10mm tempered glass, not 12mm like our railing glass panels. Our gate hinges, latch and floor lock fit this panel.</p>\n')
en = rep(en, '<p><strong>Glass Panels for Self-Closing Doors with <a', '<p><strong>10mm Tempered Glass Panels for Self-Closing Doors with <a')
fr = rep(fr, 'Quincaillerie de porte</a>.</p>\n',
         'Quincaillerie de porte</a>.</p>\n<p><strong>Remarque :</strong> ce panneau de porte est en verre trempé de 10 mm, et non de 12 mm comme nos panneaux de rampe en verre. Nos charnières, notre loquet et notre verrou de plancher conviennent à ce panneau.</p>\n')
fr = rep(fr, '<p><strong>Panneaux de verre pour portes à fermeture automatique avec <a', '<p><strong>Panneaux de verre trempé de 10 mm pour portes à fermeture automatique avec <a')
es = rep(es, 'Herrajes para puertas</a>.</p>\n',
         'Herrajes para puertas</a>.</p>\n<p><strong>Nota:</strong> este panel de puerta es de vidrio templado de 10 mm, no de 12 mm como nuestros paneles de vidrio para barandal. Nuestras bisagras, nuestro pestillo y nuestro pasador de piso son compatibles con este panel.</p>\n')
es = rep(es, '<p><strong>Paneles de vidrio para puertas de cierre automático con <a', '<p><strong>Paneles de vidrio templado de 10 mm para puertas de cierre automático con <a')
out = {'id': s['id'], 'en': en, 'fr': fr, 'es': es}
json.dump(out, open('out/gate-note.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump({'g': {'id': s['id'], 'descriptionHtml': en}}, open('out/vars-gate-note-en.json', 'w'), ensure_ascii=True)
print('EN sha256 should be', hashlib.sha256(en.encode()).hexdigest())

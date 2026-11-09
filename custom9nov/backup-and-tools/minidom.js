// Tiny DOM for testing the two inline scripts (no network for jsdom here).
class Ev { constructor(type, o = {}) { this.type = type; this.bubbles = !!o.bubbles; this.detail = o.detail; this._stop = false; } stopPropagation() { this._stop = true; } preventDefault() {} }
class CL { constructor(el) { this.el = el; } get list() { return (this.el.attrs.class || '').split(/\s+/).filter(Boolean); } contains(c) { return this.list.includes(c); }
  add(...c) { const l = this.list; c.forEach(x => l.includes(x) || l.push(x)); this.el.attrs.class = l.join(' '); }
  remove(...c) { this.el.attrs.class = this.list.filter(x => !c.includes(x)).join(' '); }
  toggle(c, f) { const has = this.contains(c); const want = f === undefined ? !has : !!f; want ? this.add(c) : this.remove(c); return want; } }
class El {
  constructor(tag, attrs = {}, kids = []) { this.tagName = tag.toUpperCase(); this.attrs = {}; Object.entries(attrs).forEach(([k, v]) => this.attrs[k] = v === true ? '' : String(v)); this.children = []; this.parentNode = null; this.ls = {}; this._text = null; kids.forEach(k => typeof k === 'string' ? (this._text = k) : this.append(k)); this.classList = new CL(this); }
  append(k) { k.parentNode = this; this.children.push(k); return k; }
  get id() { return this.attrs.id || ''; }
  getAttribute(n) { return n in this.attrs ? this.attrs[n] : null; } setAttribute(n, v) { this.attrs[n] = String(v); } hasAttribute(n) { return n in this.attrs; } removeAttribute(n) { delete this.attrs[n]; }
  get hidden() { return this.hasAttribute('hidden'); } set hidden(v) { v ? this.setAttribute('hidden', '') : this.removeAttribute('hidden'); }
  get disabled() { return this.hasAttribute('disabled'); } set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }
  get value() { return this.attrs.value || ''; } set value(v) { this.attrs.value = String(v); } get name() { return this.attrs.name || ''; }
  get textContent() { return this._text !== null ? this._text : this.children.map(c => c.textContent).join(''); } set textContent(v) { this.children = []; this._text = String(v); }
  set innerHTML(v) { throw new Error('innerHTML not supported in minidom'); }
  all() { const out = []; const walk = e => e.children.forEach(c => { out.push(c); walk(c); }); walk(this); return out; }
  matchesSimple(s) { // compound: tag#id.class[attr="v"]:last-child
    let m, rest = s;
    const tag = (m = rest.match(/^[a-z]+/i)) ? m[0] : null; if (tag) rest = rest.slice(tag.length);
    if (tag && this.tagName !== tag.toUpperCase()) return false;
    const re = /(#[\w-]+)|(\.[\w-]+)|(\[([\w-]+)(?:="([^"]*)")?\])|(:last-child)/g; let x;
    while ((x = re.exec(rest))) {
      if (x[1] && this.id !== x[1].slice(1)) return false;
      if (x[2] && !this.classList.contains(x[2].slice(1))) return false;
      if (x[3]) { if (!this.hasAttribute(x[4])) return false; if (x[5] !== undefined && this.getAttribute(x[4]) !== x[5]) return false; }
      if (x[6] && (!this.parentNode || this.parentNode.children[this.parentNode.children.length - 1] !== this)) return false;
    }
    return true;
  }
  matches(sel) { const parts = sel.trim().split(/\s+/); if (!this.matchesSimple(parts[parts.length - 1])) return false; let i = parts.length - 2, p = this.parentNode; while (i >= 0 && p) { if (p.matchesSimple && p.matchesSimple(parts[i])) i--; p = p.parentNode; } return i < 0; }
  querySelectorAll(sel) { return this.all().filter(e => e.matches(sel)); } querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
  closest(sel) { let e = this; while (e && e.matches) { if (e.matches(sel)) return e; e = e.parentNode; } return null; }
  addEventListener(t, f, cap) { (this.ls[t] = this.ls[t] || []).push({ f, cap: !!cap }); }
  dispatchEvent(ev) { ev.target = this; const path = []; let e = this; while (e) { path.push(e); e = e.parentNode; }
    for (let i = path.length - 1; i >= 1; i--) (path[i].ls[ev.type] || []).filter(l => l.cap).forEach(l => l.f.call(path[i], ev));
    (this.ls[ev.type] || []).forEach(l => l.f.call(this, ev));
    if (ev.bubbles) for (let i = 1; i < path.length && !ev._stop; i++) (path[i].ls[ev.type] || []).filter(l => !l.cap).forEach(l => l.f.call(path[i], ev));
    return true; }
}
class Doc extends El { constructor() { super('#document'); this.readyState = 'complete'; } getElementById(id) { return this.all().find(e => e.id === id) || null; } }
module.exports = { El, Doc, Ev };

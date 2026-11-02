(function () {
  'use strict';
  /*
    Studio photo backdrop correction and late-loading hover photos.
    From Fuanne's "Fuanne edits" copy (27 Oct); merged into the draft on 2 Nov with three additions:
    - phones and other devices without hover never download the hover photo (the theme never shows it there);
    - cards added to the page later (by script) get their hover photo too;
    - a colour swatch that already set the hover photo is never overwritten here.
  */
  var script = document.currentScript;
  var workerURL = script && script.dataset.worker;
  var jobs = new Map(), pending = new WeakMap(), completed = new WeakMap(), blobURLs = new WeakMap();
  var worker, workerFailed = false, sequence = 0;

  function reveal(image) { image.classList.add('ffd'); }
  function finish(id, blob) {
    var job = jobs.get(id);
    if (!job) return;
    jobs.delete(id);
    clearTimeout(job.timer);
    if (pending.get(job.image) !== id) return;
    pending.delete(job.image);
    if ((job.image.currentSrc || job.image.src) !== job.source) {
      queue(job.image);
      return;
    }
    if (blob) {
      var previous = blobURLs.get(job.image);
      var url = URL.createObjectURL(blob);
      blobURLs.set(job.image, url);
      job.image.srcset = '';
      job.image.src = url;
      completed.set(job.image, url);
      if (previous) URL.revokeObjectURL(previous);
    } else {
      completed.set(job.image, job.source);
    }
    reveal(job.image);
  }

  function getWorker() {
    if (worker || workerFailed) return worker;
    try {
      if (!workerURL || !window.Worker || !window.OffscreenCanvas || !window.createImageBitmap) throw new Error('unsupported');
      worker = new Worker(workerURL);
      worker.onmessage = function (event) { finish(event.data.id, event.data.blob); };
      worker.onerror = function () {
        workerFailed = true;
        worker.terminate();
        worker = null;
        Array.from(jobs.keys()).forEach(function (id) { finish(id); });
      };
    } catch (error) { workerFailed = true; }
    return worker;
  }

  function process(image) {
    if (!image.complete || !image.naturalWidth) return;
    var source = image.currentSrc || image.src;
    if (!source || /^(blob:|data:)/.test(source) || completed.get(image) === source) { reveal(image); return; }
    var existing = pending.get(image);
    if (existing && jobs.get(existing) && jobs.get(existing).source === source) return;
    var currentWorker = getWorker();
    if (!currentWorker) { reveal(image); return; }
    var id = ++sequence;
    pending.set(image, id);
    var job = { image: image, source: source, timer: setTimeout(function () { finish(id); }, 5000) };
    jobs.set(id, job);
    createImageBitmap(image).then(function (bitmap) {
      if (!jobs.has(id) || pending.get(image) !== id || !worker) { bitmap.close(); return; }
      worker.postMessage({ id: id, bitmap: bitmap }, [bitmap]);
    }).catch(function () { finish(id); });
  }

  var observer = window.IntersectionObserver && new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { observer.unobserve(entry.target); process(entry.target); }
    });
  }, { rootMargin: '300px' });
  function queue(image) {
    // The original photo stays available while its enhanced version is prepared.
    reveal(image);
    if (observer) observer.observe(image);
    else process(image);
  }
  function matches(image) {
    return image && image.tagName === 'IMG' && (image.classList.contains('studio') || image.closest('.ndp-im.st'));
  }
  document.addEventListener('load', function (event) { if (matches(event.target)) queue(event.target); }, true);
  document.addEventListener('error', function (event) { if (matches(event.target)) reveal(event.target); }, true);
  document.querySelectorAll('img.studio,.ndp-im.st img').forEach(queue);
  document.addEventListener('shopify:section:load', function (event) {
    event.target.querySelectorAll('img.studio,.ndp-im.st img').forEach(queue);
  });
  window.grsFF = queue;

  // Secondary photos are decorative. Keep the first photo visible until its alternate is ready.
  var noHover = window.matchMedia && window.matchMedia('(hover: none)').matches;
  function loadAlternate(image) {
    var source = image.dataset.grsHoverSrc;
    if (!source) return;
    delete image.dataset.grsHoverSrc;
    image.addEventListener('load', function () {
      var card = image.closest('.card');
      if (card) card.classList.add('grs-hover-ready');
    }, { once: true });
    image.srcset = image.dataset.grsHoverSrcset || '';
    delete image.dataset.grsHoverSrcset;
    image.src = source;
  }
  var alternateObserver = window.IntersectionObserver && new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { alternateObserver.unobserve(entry.target); loadAlternate(entry.target); }
    });
  });
  function observeAlternates(root) {
    if (noHover || !root || !root.querySelectorAll) return;
    var list = root.querySelectorAll('img[data-grs-hover-src]');
    if (root.matches && root.matches('img[data-grs-hover-src]')) list = [root].concat(Array.from(list));
    Array.prototype.forEach.call(list, function (image) {
      if (alternateObserver) alternateObserver.observe(image);
      else loadAlternate(image);
    });
  }
  observeAlternates(document);
  document.addEventListener('shopify:section:load', function (event) { observeAlternates(event.target); });
  if (!noHover && window.MutationObserver) {
    new MutationObserver(function (records) {
      records.forEach(function (record) {
        record.addedNodes.forEach(function (node) { if (node.nodeType === 1) observeAlternates(node); });
      });
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
})();

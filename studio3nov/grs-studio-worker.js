/* Preserve the studio backdrop correction without blocking shopping interactions. */
self.onmessage = async function (event) {
  const { id, bitmap } = event.data;
  try {
    const scale = Math.min(1, 900 / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const pixels = context.getImageData(0, 0, width, height);
    const data = pixels.data;
    /* Only a photo on a light studio backdrop is corrected. A render with a transparent background (PNG) has no
       backdrop: its transparent pixels read as black, the division below would push the product to white and it
       would vanish on the card. The same goes for a photo whose edges are dark. Those are left as they are. */
    let sampled = 0, transparent = 0, dark = 0;
    const edge = Math.min(width, Math.max(2, Math.round(width / 40)));
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < edge; x++) {
        for (const px of [y * width + x, y * width + width - 1 - x]) {
          const o = px * 4;
          sampled++;
          if (data[o + 3] < 250) transparent++;
          else if (data[o] + data[o + 1] + data[o + 2] < 3 * 150) dark++;
        }
      }
    }
    if (transparent > sampled * 0.02 || dark > sampled * 0.5) {
      self.postMessage({ id, skipped: true });
      return;
    }
    const left = [], right = [];
    for (let y = 0; y < height; y++) {
      for (let channel = 0; channel < 3; channel++) {
        const a = [], b = [];
        for (let x = 0; x < edge; x++) {
          a.push(data[(y * width + x) * 4 + channel]);
          b.push(data[(y * width + width - 1 - x) * 4 + channel]);
        }
        a.sort((a, b) => a - b);
        b.sort((a, b) => a - b);
        left[channel] = a[edge >> 1];
        right[channel] = b[edge >> 1];
      }
      for (let x = 0; x < width; x++) {
        const position = width > 1 ? x / (width - 1) : 0;
        const offset = (y * width + x) * 4;
        for (let channel = 0; channel < 3; channel++) {
          const background = Math.max(120, left[channel] * (1 - position) + right[channel] * position);
          data[offset + channel] = Math.min(255, data[offset + channel] * 255 / background);
        }
      }
    }
    context.putImageData(pixels, 0, 0);
    const blob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.92 });
    self.postMessage({ id, blob });
  } catch (error) {
    if (bitmap && bitmap.close) bitmap.close();
    self.postMessage({ id, error: true });
  }
};

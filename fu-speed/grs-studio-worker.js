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
    const edge = Math.min(width, Math.max(2, Math.round(width / 40)));
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

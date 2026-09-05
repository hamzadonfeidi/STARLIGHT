const colorCache = new Map();

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const rgbToHex = (r, g, b) =>
  `#${[r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('')}`;

const hexToRgb = (hex) => {
  const value = hex.replace('#', '');
  const full = value.length === 3
    ? value.split('').map((c) => c + c).join('')
    : value;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
};

/** Boost saturation & lightness for atmospheric backgrounds */
const vibranceBoost = (hex, { sat = 1.45, light = 1.12 } = {}) => {
  const { r, g, b } = hexToRgb(hex);
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  let h = 0;
  let s = max === 0 ? 0 : (max - min) / max;
  const l = (max + min) / 2;

  if (s !== 0) {
    const d = max - min;
    if (max === r / 255) h = ((g - b) / 255 / d) % 6;
    else if (max === g / 255) h = (b - r) / 255 / d + 2;
    else h = (r - g) / 255 / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  s = clamp(s * sat, 0.35, 1);
  const newL = clamp(l * light, 0.22, 0.62);

  const c = (1 - Math.abs(2 * newL - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = newL - c / 2;

  let r1, g1, b1;

  if (h < 60) [r1, g1, b1] = [c, x, 0];
  else if (h < 120) [r1, g1, b1] = [x, c, 0];
  else if (h < 180) [r1, g1, b1] = [0, c, x];
  else if (h < 240) [r1, g1, b1] = [0, x, c];
  else if (h < 300) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];

  return rgbToHex((r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255);
};

const colorDistance = (a, b) =>
  Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });

/**
 * Extract 3 vibrant dominant colors from a product image.
 * @param {string} imageUrl
 * @returns {Promise<[string, string, string]>}
 */
export async function extractDominantColors(imageUrl) {
  if (!imageUrl) {
    return ['#7b2ff7', '#ff2d6a', '#00c8ff'];
  }

  if (colorCache.has(imageUrl)) {
    return colorCache.get(imageUrl);
  }

  try {
    const img = await loadImage(imageUrl);
    const canvas = document.createElement('canvas');
    const size = 56;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, size, size);

    const { data } = ctx.getImageData(0, 0, size, size);
    const buckets = new Map();

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha < 40) continue;

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      const spread = Math.max(r, g, b) - Math.min(r, g, b);

      if (brightness < 28 || brightness > 238) continue;
      if (spread < 12) continue;

      const key = `${Math.round(r / 24) * 24}-${Math.round(g / 24) * 24}-${Math.round(b / 24) * 24}`;
      const bucket = buckets.get(key) || { r: 0, g: 0, b: 0, count: 0 };
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      bucket.count += 1;
      buckets.set(key, bucket);
    }

    const ranked = [...buckets.values()]
      .map(({ r, g, b, count }) => ({
        r: r / count,
        g: g / count,
        b: b / count,
        count,
        hex: rgbToHex(r / count, g / count, b / count),
      }))
      .sort((a, b) => b.count - a.count);

    const picked = [];
    for (const entry of ranked) {
      if (picked.length >= 3) break;
      const tooClose = picked.some(
        (p) => colorDistance(p, entry) < 48
      );
      if (!tooClose) picked.push(entry);
    }

    while (picked.length < 3) {
      const fallbacks = ['#e040fb', '#00e5ff', '#ff5252', '#7c4dff', '#ffab40'];
      picked.push({ hex: fallbacks[picked.length % fallbacks.length] });
    }

    const colors = picked.map((p, i) =>
      vibranceBoost(p.hex, { sat: 1.35 + i * 0.08, light: 1.08 + i * 0.04 })
    );

    colorCache.set(imageUrl, colors);
    return colors;
  } catch (err) {
    console.warn('Color extraction failed, using fallback palette:', err);
    const fallback = ['#9d4edd', '#ff006e', '#00bbf9'];
    colorCache.set(imageUrl, fallback);
    return fallback;
  }
}

/** Warm up palette cache for gallery products */
export function prefetchDominantColors(imageUrls = []) {
  imageUrls.forEach((url) => {
    if (url && !colorCache.has(url)) {
      extractDominantColors(url).catch(() => {});
    }
  });
}

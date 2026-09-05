export function assetUrl(path) {
  if (!path || /^(https?:|data:|blob:)/i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${import.meta.env.BASE_URL}${normalizedPath}`;
}

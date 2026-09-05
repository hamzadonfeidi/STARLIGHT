import { useEffect, useMemo, useRef } from 'react';

// Use the requested Deep Magenta as the shader fallback
const FALLBACK_HEX = '#CA2851';

const VERTEX_SHADER = `
  attribute vec2 aPosition;
  varying vec2 vUv;

  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uTopColor;
  uniform vec3 uBottomColor;
  uniform vec3 uAccentColor;
  uniform vec3 uDarkColor;
  uniform vec2 uFocusPoint;
  uniform float uFocusStrength;

  varying vec2 vUv;

  mat2 rotate2d(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
  }

  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    float a = dot(hash2(i + vec2(0.0, 0.0)) * 2.0 - 1.0, f - vec2(0.0, 0.0));
    float b = dot(hash2(i + vec2(1.0, 0.0)) * 2.0 - 1.0, f - vec2(1.0, 0.0));
    float c = dot(hash2(i + vec2(0.0, 1.0)) * 2.0 - 1.0, f - vec2(0.0, 1.0));
    float d = dot(hash2(i + vec2(1.0, 1.0)) * 2.0 - 1.0, f - vec2(1.0, 1.0));

    return 0.5 + 0.5 * mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float grain(vec2 uv) {
    vec2 pixel = uv * uResolution;
    float gt = fract(uTime * 0.05);
    float seed = dot(pixel + vec2(gt * 71.0, -gt * 47.0), vec2(12.9898, 78.233));
    return fract(sin(seed) * 43758.5453123);
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    float t = uTime * 0.45;

    vec2 p = uv - 0.5;
    p.x *= aspect;

    float turning = noise(vec2(t * 0.08, p.x * p.y + t * 0.03));
    vec2 q = p * rotate2d((turning - 0.5) * 6.2831853 + 3.1415926);

    q.x += sin(q.y * 5.0 + t * 2.0) * 0.034;
    q.y += sin(q.x * 7.5 + t * 1.35) * 0.028;
    q += (noise(q * 2.1 + t * 0.18) - 0.5) * 0.055;

    vec3 leftBand = mix(
      uAccentColor,
      mix(uAccentColor, uDarkColor, 0.35),
      smoothstep(-0.35, 0.22, q.x + noise(q * 1.4 + t * 0.12) * 0.16)
    );
    vec3 rightBand = mix(
      uBottomColor,
      uTopColor,
      smoothstep(-0.45, 0.28, q.x - noise(q * 1.2 - t * 0.1) * 0.14)
    );

    float verticalBlend = 1.0 - smoothstep(-0.28, 0.54, q.y + sin(q.x * 2.2 + t * 0.18) * 0.08);
    vec3 color = mix(leftBand, rightBand, verticalBlend);

    float upperGlow = 1.0 - smoothstep(0.0, 0.78, length(vec2((uv.x - 0.24) * aspect, uv.y - 0.86)));
    float upperGlowAlt = 1.0 - smoothstep(0.0, 0.74, length(vec2((uv.x - 0.24) * aspect, uv.y - 0.14)));
    float lowerGlow = 1.0 - smoothstep(0.06, 0.95, length(vec2((uv.x - 0.52) * aspect, uv.y - 0.18)));
    float darkCorner = max(
      1.0 - smoothstep(0.0, 0.58, length(vec2((uv.x - 0.92) * aspect * 1.3, uv.y - 0.88))),
      1.0 - smoothstep(0.0, 0.58, length(vec2((uv.x - 0.92) * aspect * 1.3, uv.y - 0.12)))
    );
    float darkEdge = smoothstep(0.52, 1.0, uv.x) * smoothstep(0.18, 1.0, uv.y);

    color = mix(color, uTopColor, max(upperGlow, upperGlowAlt) * 0.72);
    color = mix(color, uBottomColor, lowerGlow * 0.32);
    color = mix(color, uDarkColor, darkCorner * 0.72 + smoothstep(0.72, 1.0, uv.x) * 0.16 + darkEdge * 0.08);

    vec2 focusDelta = uv - uFocusPoint;
    focusDelta.x *= aspect;
    float focusMask = (1.0 - smoothstep(0.0, 0.58, length(focusDelta))) * uFocusStrength;
    color = mix(color, mix(color, uTopColor, 0.62), focusMask);

    float speckle = grain(uv);
    float coarse = grain(floor(uv * uResolution * 0.44) / uResolution);
    color += (speckle - 0.5) * 0.14;
    color -= coarse * 0.035;

    gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
  }
`;

const sanitizeHex = (hex) => {
  if (!hex || typeof hex !== 'string') return FALLBACK_HEX;

  let value = hex.trim().replace('#', '');
  if (/^[0-9a-f]{3}$/i.test(value)) {
    value = value.split('').map((char) => char + char).join('');
  }

  return /^[0-9a-f]{6}$/i.test(value) ? `#${value}` : FALLBACK_HEX;
};

const hexToRgb = (hex) => {
  const value = sanitizeHex(hex).slice(1);
  const number = Number.parseInt(value, 16);

  return [
    ((number >> 16) & 255) / 255,
    ((number >> 8) & 255) / 255,
    (number & 255) / 255,
  ];
};

const rgbToHsl = ([r, g, b]) => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;

  if (max === min) return [0, 0, lightness];

  const delta = max - min;
  const saturation = lightness > 0.5
    ? delta / (2 - max - min)
    : delta / (max + min);
  let hue = 0;

  if (max === r) hue = (g - b) / delta + (g < b ? 6 : 0);
  if (max === g) hue = (b - r) / delta + 2;
  if (max === b) hue = (r - g) / delta + 4;

  return [hue / 6, saturation, lightness];
};

const hslToRgb = ([h, s, l]) => {
  if (s === 0) return [l, l, l];

  const hueToRgb = (p, q, t) => {
    let value = t;
    if (value < 0) value += 1;
    if (value > 1) value -= 1;
    if (value < 1 / 6) return p + (q - p) * 6 * value;
    if (value < 1 / 2) return q;
    if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return [
    hueToRgb(p, q, h + 1 / 3),
    hueToRgb(p, q, h),
    hueToRgb(p, q, h - 1 / 3),
  ];
};

const mixRgb = (first, second, amount) => first.map((channel, index) => (
  channel + (second[index] - channel) * amount
));

const createPalette = (sourceHex) => {
  const sourceRgb = hexToRgb(sourceHex);
  const skylrkBase = hexToRgb(FALLBACK_HEX);
  const [h, s, l] = rgbToHsl(mixRgb(skylrkBase, sourceRgb, sourceHex === FALLBACK_HEX ? 0 : 0.28));
  const hue = h || 0.56;
  const saturation = Math.max(0.32, Math.min(1, s || 0.62));
  // Build base palette
  const base = {
    top: hslToRgb([hue, Math.min(saturation * 0.86, 1), Math.min(Math.max(l, 0.84), 0.9)]),
    bottom: hslToRgb([hue, Math.min(saturation * 0.92, 1), 0.8]),
    accent: hslToRgb([hue, Math.min(saturation * 0.78, 1), 0.7]),
    dark: hslToRgb([hue, Math.min(saturation * 0.7, 1), 0.21]),
  };

  // Darken slightly by mixing with black to avoid overly pale outputs
  const darkenAmount = 0.22;
  const black = [0, 0, 0];

  return {
    top: mixRgb(base.top, black, darkenAmount),
    bottom: mixRgb(base.bottom, black, darkenAmount),
    accent: mixRgb(base.accent, black, darkenAmount),
    dark: mixRgb(base.dark, black, darkenAmount),
  };
};

const compileShader = (gl, type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
};

const createProgram = (gl) => {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(message);
  }

  return program;
};

const InteractiveBackground = ({ productColors }) => {
  const canvasRef = useRef(null);
  const palette = useMemo(() => {
    // If the caller provides a full color trio, use it directly for top/bottom/accent
    if (productColors && Array.isArray(productColors) && productColors.length >= 3) {
      const top = hexToRgb(productColors[0]);
      const bottom = hexToRgb(productColors[1]);
      const accent = hexToRgb(productColors[2]);
      const dark = mixRgb(top, [0, 0, 0], 0.22);
      return { top, bottom, accent, dark };
    }

    // If a single color is supplied or none, fall back to the original palette generator
    if (productColors?.[0]) return createPalette(productColors[0]);

    // Default requested palette
    const top = hexToRgb('#CA2851'); // Deep Magenta
    const bottom = hexToRgb('#FFB173'); // Soft Orange
    const accent = hexToRgb('#FFE3B3'); // Light Cream
    const dark = mixRgb(top, [0, 0, 0], 0.22);

    return { top, bottom, accent, dark };
  }, [productColors]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: true,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });

    if (!gl) return undefined;

    const program = createProgram(gl);
    const positionBuffer = gl.createBuffer();
    const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
    const pointer = {
      x: 0.5,
      y: 0.54,
      tx: 0.5,
      ty: 0.54,
      strength: 0.2,
      targetStrength: 0.2,
    };
    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduceMotion = reduceMotionQuery.matches;
    let animationId = 0;
    let start = performance.now();

    const uniforms = {
      time: gl.getUniformLocation(program, 'uTime'),
      resolution: gl.getUniformLocation(program, 'uResolution'),
      topColor: gl.getUniformLocation(program, 'uTopColor'),
      bottomColor: gl.getUniformLocation(program, 'uBottomColor'),
      accentColor: gl.getUniformLocation(program, 'uAccentColor'),
      darkColor: gl.getUniformLocation(program, 'uDarkColor'),
      focusPoint: gl.getUniformLocation(program, 'uFocusPoint'),
      focusStrength: gl.getUniformLocation(program, 'uFocusStrength'),
    };

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const position = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    gl.uniform3fv(uniforms.topColor, palette.top);
    gl.uniform3fv(uniforms.bottomColor, palette.bottom);
    gl.uniform3fv(uniforms.accentColor, palette.accent);
    gl.uniform3fv(uniforms.darkColor, palette.dark);

    const resize = () => {
      const ratio = dpr();
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = Math.max(1, Math.floor(width * ratio));
      canvas.height = Math.max(1, Math.floor(height * ratio));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    };

    const render = (now) => {
      const time = reduceMotion ? 0 : (now - start) / 1000;
      const ease = reduceMotion ? 0.035 : 0.045;

      pointer.x += (pointer.tx - pointer.x) * ease;
      pointer.y += (pointer.ty - pointer.y) * ease;
      pointer.strength += (pointer.targetStrength - pointer.strength) * 0.045;

      gl.uniform1f(uniforms.time, time);
      gl.uniform2f(uniforms.focusPoint, pointer.x, pointer.y);
      gl.uniform1f(uniforms.focusStrength, pointer.strength);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationId = window.requestAnimationFrame(render);
    };

    const handlePointerMove = (event) => {
      pointer.tx = event.clientX / Math.max(window.innerWidth, 1);
      pointer.ty = 1 - event.clientY / Math.max(window.innerHeight, 1);
      pointer.targetStrength = 0.92;
    };

    const handlePointerLeave = () => {
      pointer.targetStrength = 0.18;
    };

    const handleReduceMotion = (event) => {
      reduceMotion = event.matches;
      start = performance.now();
    };

    resize();
    render(start);

    window.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('resize', resize);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);
    reduceMotionQuery.addEventListener('change', handleReduceMotion);

    return () => {
      window.cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.visualViewport?.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      reduceMotionQuery.removeEventListener('change', handleReduceMotion);
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
    };
  }, [palette]);

  return (
    <canvas
      ref={canvasRef}
      className="interactive-bg"
      aria-hidden="true"
      id="gradient-canvas"
    />
  );
};

export default InteractiveBackground;

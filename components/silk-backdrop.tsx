"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Calm, slow-moving WebGL "silk" backdrop.
 * Raw WebGL (no dependencies), colours pulled from the CSS design tokens so it
 * follows light/dark theme. Falls back to nothing when WebGL is unavailable.
 */

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;

uniform vec2 u_res;
uniform float u_time;
uniform vec3 u_base;
uniform vec3 u_deep;
uniform vec3 u_gold;

// smooth value noise
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p = mat2(1.6, 1.2, -1.2, 1.6) * p;
    a *= 0.5;
  }
  return v;
}

// height field of the draped cloth
float height(vec2 p, float t) {
  float folds = sin(p.x * 2.4 + fbm(p * 1.1 + t * 0.05) * 3.2 + t * 0.16);
  float drape = sin(p.y * 1.7 - p.x * 0.6 + t * 0.11);
  return 0.55 * folds + 0.35 * drape + 0.45 * fbm(p * 0.9 - t * 0.03);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);
  float t = u_time;
  vec2 p = uv * 2.6;

  // surface normal from the height field -> real shading, reads as 3D cloth
  float e = 0.012;
  float h = height(p, t);
  float hx = height(p + vec2(e, 0.0), t);
  float hy = height(p + vec2(0.0, e), t);
  vec3 n = normalize(vec3(-(hx - h) / e, -(hy - h) / e, 2.4));

  vec3 lightDir = normalize(vec3(sin(t * 0.07) * 0.5 - 0.35, 0.65, 0.85));
  float diff = clamp(dot(n, lightDir), 0.0, 1.0);
  float spec = pow(clamp(dot(reflect(-lightDir, n), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 28.0);
  float rim = pow(1.0 - clamp(n.z, 0.0, 1.0), 2.5);

  // very restrained tinting — the backdrop must never fight the content
  vec3 col = u_base;
  col = mix(col, u_deep, 0.16 * diff + 0.06 * h);
  col = mix(col, u_gold, 0.10 * rim + 0.16 * spec);

  // soft vignette keeps the centre calm
  float vig = smoothstep(1.5, 0.2, length(uv));
  col = mix(u_base, col, 0.45 + 0.55 * vig);

  // gentle grain kills banding
  col += (hash(gl_FragCoord.xy + t) - 0.5) * 0.008;

  gl_FragColor = vec4(col, 1.0);
}
`;

function readColor(styles: CSSStyleDeclaration, name: string, fallback: [number, number, number]) {
  const raw = styles.getPropertyValue(name).trim();
  if (!raw) return fallback;
  // oklch() etc. is only reliably resolved by painting it — computed styles keep the source syntax.
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return fallback;
  ctx.fillStyle = "#000";
  ctx.fillStyle = raw;
  if (ctx.fillStyle === "#000" && !/^#0{3,8}$/i.test(raw)) return fallback;
  ctx.fillRect(0, 0, 1, 1);
  const data = ctx.getImageData(0, 0, 1, 1).data;
  return [(data[0] ?? 0) / 255, (data[1] ?? 0) / 255, (data[2] ?? 0) / 255] as [
    number,
    number,
    number,
  ];
}

export function SilkBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [enabled, setEnabled] = useState(false);

  // Never block first paint with WebGL: phones, small screens, reduced-motion
  // and low-core devices get the flat CSS backdrop instead, and desktops only
  // start the shader once the browser is idle after load.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const smallOrWeak =
      window.innerWidth < 1024 || (navigator.hardwareConcurrency ?? 8) <= 4;
    if (coarse || reduced || smallOrWeak) return;

    let cancelled = false;
    const start = () => {
      if (!cancelled) setEnabled(true);
    };
    const idle = (
      window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }
    ).requestIdleCallback;
    const handle = idle ? idle(start, { timeout: 2500 }) : window.setTimeout(start, 1200);
    return () => {
      cancelled = true;
      const cancelIdle = (
        window as unknown as { cancelIdleCallback?: (id: number) => void }
      ).cancelIdleCallback;
      if (idle && cancelIdle) cancelIdle(handle as number);
      else window.clearTimeout(handle as number);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
      preserveDrawingBuffer: false,
    });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, "u_res");
    const uTime = gl.getUniformLocation(program, "u_time");
    const uBase = gl.getUniformLocation(program, "u_base");
    const uDeep = gl.getUniformLocation(program, "u_deep");
    const uGold = gl.getUniformLocation(program, "u_gold");

    const applyPalette = () => {
      const styles = getComputedStyle(document.documentElement);
      gl.uniform3fv(uBase, readColor(styles, "--background", [0.98, 0.96, 0.92]));
      gl.uniform3fv(uDeep, readColor(styles, "--primary", [0.35, 0.09, 0.1]));
      gl.uniform3fv(uGold, readColor(styles, "--gold", [0.8, 0.65, 0.35]));
    };
    applyPalette();

    // Coarse pointers (phones/tablets) render at a lower internal resolution:
    // the backdrop is heavily blurred by content anyway, and this roughly
    // halves fragment work on mobile GPUs.
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 0.75 : 1.25);
    const resize = () => {
      const w = Math.floor(canvas.clientWidth * dpr);
      const h = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width === w && canvas.height === h) return;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
    };
    resize();

    let resizePending = false;
    const onResize = () => {
      if (resizePending) return;
      resizePending = true;
      requestAnimationFrame(() => {
        resizePending = false;
        resize();
      });
    };
    window.addEventListener("resize", onResize, { passive: true });

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let running = true;
    let last = 0;
    // 30fps is plenty for a slow-drifting backdrop and halves GPU work.
    const frameInterval = 1000 / 30;
    const start = performance.now();

    const draw = (time: number) => {
      gl.uniform1f(uTime, reduced.matches ? 8 : (time - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (time: number) => {
      if (!running) return;
      if (reduced.matches) {
        draw(time);
        return;
      }
      if (time - last >= frameInterval) {
        last = time;
        draw(time);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const themeObserver = new MutationObserver(() => {
      applyPalette();
      draw(performance.now());
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
      themeObserver.disconnect();
    };
  }, [enabled]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-background to-primary/10" />
      {enabled ? <canvas ref={ref} className="relative h-full w-full" /> : null}
      <div className="absolute inset-0 bg-background/25" />
    </div>
  );
}

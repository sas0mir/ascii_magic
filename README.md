/*
ASCII Art Web Component — Framework-Agnostic TS Library
======================================================

Features
- <ascii-art> custom element that converts an image (src) into ASCII art.
- Works with any framework (React/Vue/Svelte/Angular) or plain HTML.
- Props via attributes or JS properties: src, charset, scale, invert, color, max-width, max-height, bg, contrast, brightness.
- Renders into <pre> with monospace font inside Shadow DOM; optional colorized output using foreground color approximation.
- Zero deps. TypeScript, ESM. SSR-safe (no-op until connected).

Quick usage (HTML)
------------------
<script type="module" src="/ascii-art.js"></script>
<ascii-art src="/img.jpg" charset="@%#*+=-:. " scale="0.25" color invert></ascii-art>

React wrapper (example)
-----------------------
// import "ascii-art" (side-effect) once in your app entry.
// <AsciiArt src="/img.jpg" scale={0.2} color invert />
export function AsciiArt(props: React.HTMLAttributes<HTMLElement> & {
src?: string; charset?: string; scale?: number; invert?: boolean; color?: boolean;
maxWidth?: number; maxHeight?: number; bg?: string; contrast?: number; brightness?: number;
}) {
const ref = React.useRef<HTMLElement>(null)
React.useEffect(() => {
if (!ref.current) return
for (const [k, v] of Object.entries(props)) {
if (v === undefined) continue
// @ts-ignore
ref.current[k] = v
}
}, [props])
const { children, ...rest } = props
return React.createElement('ascii-art', { ref, ...rest }, children)
}

Vue 3 wrapper (example)
-----------------------
// main.ts: import 'ascii-art'
export default {
name: 'AsciiArt',
props: { src: String, charset: String, scale: Number, invert: Boolean, color: Boolean,
maxWidth: Number, maxHeight: Number, bg: String, contrast: Number, brightness: Number },
mounted() { this.apply() },
watch: { $props: { deep: true, handler() { this.apply() } } },
methods: { apply() { Object.assign(this.$el, this.$props) } },
render() { return h('ascii-art') }
}

Build tip
---------
- Compile with tsc to produce ascii-art.js (ESM) and types.
- "types": "./ascii-art.d.ts"; "exports": { ".": { "import": "./ascii-art.js", "types": "./ascii-art.d.ts" } }

*/

// ------------------------
// Implementation
// ------------------------
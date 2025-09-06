const DEFAULT_CHARSET = "@%#*+=-:. ";

type Options = {
    src?: string
    charset?: string
    scale?: number // 0..1 sampling density; smaller = fewer columns
    invert?: boolean
    color?: boolean
    maxWidth?: number
    maxHeight?: number
    bg?: string
    contrast?: number // multiplier (e.g. 1.2)
    brightness?: number // offset (-255..255)
}

function clamp(n: number, min: number, max: number) { return Math.min(max, Math.max(min, n)) }

class AsciiArt extends HTMLElement {
    static get observedAttributes() {
        return ['src','charset','scale','invert','color','max-width','max-height','bg','contrast','brightness']
    }

    // public JS properties mirror attributes
    get src() { return this.getAttribute('src') || '' }
    set src(v: string | null) { v === null ? this.removeAttribute('src') : this.setAttribute('src', v) }

    get charset() { return this.getAttribute('charset') || DEFAULT_CHARSET }
    set charset(v: string | null) { v === null ? this.removeAttribute('charset') : this.setAttribute('charset', v) }

    get scale() { return Number(this.getAttribute('scale') ?? '0.18') }
    set scale(v: number | null) { v == null ? this.removeAttribute('scale') : this.setAttribute('scale', String(v)) }

    get invert() { return this.hasAttribute('invert') }
    set invert(v: boolean) { v ? this.setAttribute('invert','') : this.removeAttribute('invert') }

    get color() { return this.hasAttribute('color') }
    set color(v: boolean) { v ? this.setAttribute('color','') : this.removeAttribute('color') }

    get maxWidth() { return Number(this.getAttribute('max-width') ?? '0') }
    set maxWidth(v: number | null) { v == null ? this.removeAttribute('max-width') : this.setAttribute('max-width', String(v)) }

    get maxHeight() { return Number(this.getAttribute('max-height') ?? '0') }
    set maxHeight(v: number | null) { v == null ? this.removeAttribute('max-height') : this.setAttribute('max-height', String(v)) }

    get bg() { return this.getAttribute('bg') || 'transparent' }
    set bg(v: string | null) { v == null ? this.removeAttribute('bg') : this.setAttribute('bg', v) }

    get contrast() { return Number(this.getAttribute('contrast') ?? '1') }
    set contrast(v: number | null) { v == null ? this.removeAttribute('contrast') : this.setAttribute('contrast', String(v)) }

    get brightness() { return Number(this.getAttribute('brightness') ?? '0') }
    set brightness(v: number | null) { v == null ? this.removeAttribute('brightness') : this.setAttribute('brightness', String(v)) }

    private root: ShadowRoot
    private pre: HTMLPreElement
    private styleEl: HTMLStyleElement
    private ro?: ResizeObserver
    private img?: HTMLImageElement
    private dirty = false
    private raf = 0

    constructor() {
        super()
        this.root = this.attachShadow({ mode: 'open' })
        this.styleEl = document.createElement('style')
        this.pre = document.createElement('pre')
        this.pre.setAttribute('part', 'pre')
        this.pre.style.margin = '0'
        this.pre.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
        this.pre.style.whiteSpace = 'pre'
        this.pre.style.lineHeight = '1'
        this.pre.style.background = 'transparent'
        this.root.append(this.styleEl, this.pre)
    }

    connectedCallback() {
        this.updateStyles()
        this.ensureResizeObserver()
        this.loadImage()
    }

    disconnectedCallback() {
        this.ro?.disconnect()
        if (this.raf) cancelAnimationFrame(this.raf)
    }

    attributeChangedCallback() {
        this.updateStyles()
        if (this.img && this.img.src && (this.dirty = true)) this.scheduleRender()
        else if (this.getAttribute('src')) this.loadImage()
    }

    private updateStyles() {
        const bg = this.bg
        this.styleEl.textContent = `:host{display:inline-block;background:${bg}} pre{font-size:12px}`
    }

    private ensureResizeObserver() {
        if (this.ro) return
        this.ro = new ResizeObserver(() => this.scheduleRender())
        this.ro.observe(this)
    }

    private loadImage() {
        const src = this.src
        if (!src) return
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => { this.img = img; this.scheduleRender() }
        img.onerror = () => { this.pre.textContent = '[ascii-art] failed to load image' }
        img.src = src
    }

    private scheduleRender() {
        if (this.raf) cancelAnimationFrame(this.raf)
        this.raf = requestAnimationFrame(() => this.renderAscii())
    }

    private renderAscii() {
        this.raf = 0
        const img = this.img
        if (!img) return

        // Determine target size
        const hostW = this.maxWidth || this.clientWidth || img.width
        const hostH = this.maxHeight || this.clientHeight || img.height

        const scale = clamp(this.scale || 0.18, 0.05, 1)
        // Character aspect ratio: typical terminal character ~ 0.5 width:height
        const charAspect = 0.5

        let targetW = Math.max(1, Math.floor(hostW * scale))
        let targetH = Math.max(1, Math.floor(hostH * scale / charAspect))

        // Fit image while preserving aspect ratio
        const ratio = img.width / img.height
        if (targetW / targetH > ratio) targetW = Math.floor(targetH * ratio)
        else targetH = Math.floor(targetW / ratio)

        const off = document.createElement('canvas')
        off.width = targetW
        off.height = targetH
        const ctx = off.getContext('2d', { willReadFrequently: true })!
        ctx.drawImage(img, 0, 0, targetW, targetH)
        let data = ctx.getImageData(0, 0, targetW, targetH).data

        const charset = (this.charset || DEFAULT_CHARSET)
        const chars = this.invert ? charset : [...charset].reverse().join('')

        const lines: string[] = []
        const colorize = this.color
        const contrast = this.contrast || 1
        const brightness = this.brightness || 0

        // Build DOM fragment for color mode; otherwise fast string join
        if (colorize) {
            const frag = document.createDocumentFragment()
            this.pre.innerHTML = ''
            for (let y = 0; y < targetH; y++) {
                const div = document.createElement('div')
                div.style.lineHeight = '1'
                div.style.margin = '0'
                div.style.padding = '0'
                for (let x = 0; x < targetW; x++) {
                    const i = (y * targetW + x) * 4
                    let r = data[i], g = data[i+1], b = data[i+2]
                    let lum = (0.2126*r + 0.7152*g + 0.0722*b)
                    lum = clamp(lum * contrast + brightness, 0, 255)
                    const idx = Math.floor((lum / 255) * (chars.length - 1))
                    const ch = chars[idx]
                    const span = document.createElement('span')
                    span.textContent = ch
                    span.style.color = `rgb(${r},${g},${b})`
                    div.appendChild(span)
                }
                frag.appendChild(div)
            }
            this.pre.appendChild(frag)
        } else {
            for (let y = 0; y < targetH; y++) {
                let row = ''
                for (let x = 0; x < targetW; x++) {
                    const i = (y * targetW + x) * 4
                    let r = data[i], g = data[i+1], b = data[i+2]
                    let lum = (0.2126*r + 0.7152*g + 0.0722*b)
                    lum = clamp(lum * contrast + brightness, 0, 255)
                    const idx = Math.floor((lum / 255) * (chars.length - 1))
                    row += chars[idx]
                }
                lines.push(row)
            }
            this.pre.textContent = lines.join('\n')
        }
    }
}

if (!customElements.get('ascii-art')) customElements.define('ascii-art', AsciiArt)

// Type declarations (basic)
declare global {
    interface HTMLElementTagNameMap { 'ascii-art': AsciiArt }
}

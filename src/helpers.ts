import { ArcProps, Chart } from 'chart.js'
import { valueOrDefault, isNullOrUndef, toLineHeight } from 'chart.js/helpers'
import Center from './Center'
import { FontOptions } from './OutLabelsOptions'
import Size from './Size'

export function getFontString(font: FontOptions): string {
    if (!font || isNullOrUndef(font.size) || isNullOrUndef(font.family)) {
        return ''
    }

    return (
        (font.style ? font.style + ' ' : '') +
        (font.weight ? font.weight + ' ' : '') +
        font.size +
        'px ' +
        font.family
    )
}

// @todo move this in Chart.helpers.canvas.textSize
// @todo cache calls of measureText if font doesn't change?!
export function textSize(
    ctx: CanvasRenderingContext2D,
    lines: RegExpMatchArray,
    font: FontOptions
): Size {
    const prev = ctx.font
    let width = 0

    ctx.font = getFontString(font)

    for (let i = 0; i < lines.length; ++i) {
        width = Math.max(ctx.measureText(lines[i]).width, width)
    }

    ctx.font = prev

    return {
        height: lines.length * font.lineSize,
        width: width,
    }
}

// @todo move this method in Chart.helpers.options.toFont
export function parseFont(value: FontOptions, height: number): FontOptions {
    const defaults = Chart.defaults
    let size = valueOrDefault(value.size, defaults.font.size)

    if (value.resizable) {
        size = adaptTextSizeToHeight(height, value.minSize, value.maxSize)
    }

    value.lineSize = toLineHeight(value.lineHeight.toString(), size)

    value.size = size

    return value
}

export function adaptTextSizeToHeight(
    height: number,
    min?: number,
    max?: number
): number {
    const size = (height / 100) * 2.5
    if (min && size < min) {
        return min
    }
    if (max && size > max) {
        return max
    }
    return size
}

export function drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number
): void {
    const HALF_PI = Math.PI / 2

    if (radius) {
        const r = Math.min(radius, h / 2, w / 2)
        const left = x + r
        const top = y + r
        const right = x + w - r
        const bottom = y + h - r

        ctx.moveTo(x, top)
        if (left < right && top < bottom) {
            ctx.arc(left, top, r, -Math.PI, -HALF_PI)
            ctx.arc(right, top, r, -HALF_PI, 0)
            ctx.arc(right, bottom, r, 0, HALF_PI)
            ctx.arc(left, bottom, r, HALF_PI, Math.PI)
        } else if (left < right) {
            ctx.moveTo(left, y)
            ctx.arc(right, top, r, -HALF_PI, HALF_PI)
            ctx.arc(left, top, r, HALF_PI, Math.PI + HALF_PI)
        } else if (top < bottom) {
            ctx.arc(left, top, r, -Math.PI, 0)
            ctx.arc(left, bottom, r, 0, Math.PI)
        } else {
            ctx.arc(left, top, r, -Math.PI, Math.PI)
        }
        ctx.closePath()
        ctx.moveTo(x, y)
    } else {
        ctx.rect(x, y, w, h)
    }
}

export function positionCenter(arc: ArcProps, stretch: number): Center {
    const angle = (arc.startAngle + arc.endAngle) / 2
    const cosA = Math.cos(angle)
    const sinA = Math.sin(angle)
    const d = arc.outerRadius

    const stretchedD = d + stretch
    return {
        x: arc.x + cosA * stretchedD,
        y: arc.y + sinA * stretchedD,
        d: stretchedD,
        arc: arc,
        anchor: {
            x: arc.x + cosA * d,
            y: arc.y + sinA * d,
        },
        copy: {
            x: arc.x + cosA * stretchedD,
            y: arc.y + sinA * stretchedD,
        },
    }
}

export function moveFromAnchor(center: Center, dist: number): Center {
    const arc = center.arc
    let d = center.d
    const angle = (arc.startAngle + arc.endAngle) / 2
    const cosA = Math.cos(angle)
    const sinA = Math.sin(angle)

    d += dist

    return {
        x: arc.x + cosA * d,
        y: arc.y + sinA * d,
        d: d,
        arc: arc,
        anchor: center.anchor,
        copy: {
            x: arc.x + cosA * d,
            y: arc.y + sinA * d,
        },
    }
}

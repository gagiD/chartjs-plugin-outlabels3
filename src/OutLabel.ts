import OutLabelsOptions, {
    FontOptions,
    StringCallback,
} from './OutLabelsOptions'
import { resolve, toPadding } from 'chart.js/helpers'
import { drawRoundedRect, getFontString, parseFont, textSize } from './helpers'
import Size from './Size'
import { Point } from 'chart.js'
import Rect from './Rect'
import OutLabelsContext from './OutLabelsContext'

export default class OutLabel {
    ctx: CanvasRenderingContext2D
    index: number
    context: OutLabelsContext
    arc: any

    encodedText: string | StringCallback
    text: string
    lines: RegExpMatchArray
    label: string
    value: number

    style: any

    length: number
    size: Size

    x1!: number
    y1!: number
    x!: number
    y!: number
    rect: Rect = { height: 0, width: 0, x: 0, y: 0 }
    nx!: number

    get center(): Point {
        return {
            x: this.x,
            y: this.y,
        }
    }

    constructor(
        ctx: CanvasRenderingContext2D,
        index: number,
        config: OutLabelsOptions,
        context: OutLabelsContext
    ) {
        if (!config.display) {
            throw new Error('Label display property is set to false.')
        }

        this.ctx = ctx
        this.index = index
        this.context = context

        // Init text
        const label = context.labels[index]
        let text = resolve([config.text], context, index) as string
        if (!text) text = '%l %p'

        /* Replace label marker */
        text = text.replace(/%l/gi, label)

        /* Replace value marker with possible precision value */
        ;(text.match(/%v\.?(\d*)/gi) || [])
            .map(function (val) {
                const prec = val.replace(/%v\./gi, '')
                if (prec.length) {
                    return +prec
                } else {
                    return config.valuePrecision
                }
            })
            .forEach(function (val) {
                if (text)
                    text = text.replace(
                        /%v\.?(\d*)/i,
                        context.value.toFixed(val)
                    )
            })

        /* Replace percent marker with possible precision value */
        ;(text.match(/%p\.?(\d*)/gi) || [])
            .map(function (val) {
                const prec = val.replace(/%p\./gi, '')
                if (prec.length) {
                    return +prec
                } else {
                    return config.percentPrecision
                }
            })
            .forEach(function (val) {
                if (text)
                    text = text.replace(
                        /%p\.?(\d*)/i,
                        (context.percent * 100).toFixed(val) + '%'
                    )
            })

        // Count lines
        const lines = text.match(/[^\r\n]+/g)

        // If no lines => nothing to display
        if (!lines || !lines.length) throw new Error('No text to show.')

        // Remove unnecessary spaces
        for (let i = 0; i < lines.length; ++i) {
            lines[i] = lines[i].trim()
        }

        this.encodedText = config.text
        this.text = text
        this.lines = lines
        this.label = label
        this.value = context.value

        // Init style
        const fontConfig = Object.assign(new FontOptions(), config.font)
        this.style = {
            backgroundColor: resolve(
                [config.backgroundColor, 'black'],
                context,
                index
            ),
            borderColor: resolve([config.borderColor, 'black'], context, index),
            borderRadius: resolve([config.borderRadius, 0], context, index),
            borderWidth: resolve([config.borderWidth, 0], context, index),
            lineWidth: resolve([config.lineWidth, 2], context, index),
            lineColor: resolve([config.lineColor, 'black'], context, index),
            color: resolve([config.color, 'white'], context, index),
            font: parseFont(
                resolve([fontConfig]) ?? fontConfig,
                parseFloat(ctx.canvas.style.height.slice(0, -2))
            ),
            padding: toPadding(resolve([config.padding], context, index)),
            textAlign: resolve([config.textAlign, 'left'], context, index),
        }

        this.length = resolve([config.length, 40], context, index) ?? 40
        this.size = textSize(ctx, this.lines, this.style.font)
    }

    computeRect(): Rect {
        return {
            x:
                this.x +
                (this.nx < 0 ? -this.size.width : 0) -
                this.style.padding.left -
                this.style.borderWidth,
            y:
                this.y -
                this.size.height / 2 -
                this.style.padding.top -
                this.style.borderWidth,
            width:
                this.size.width +
                2 * this.style.borderWidth +
                this.style.padding.width,
            height:
                this.size.height +
                2 * this.style.borderWidth +
                this.style.padding.height,
        }
    }

    drawText(): void {
        const font = this.style.font
        const color = this.style.color

        if (!this.lines.length || !color) {
            return
        }

        this.ctx.font = getFontString(this.style.font)
        this.ctx.fillStyle = color
        this.ctx.textAlign = this.nx < 0 ? 'right' : 'left'
        this.ctx.textBaseline = 'middle'

        const x = this.x
        let y = this.y
        for (let idx = 0; idx < this.lines.length; ++idx) {
            this.ctx.fillText(
                this.lines[idx],
                Math.round(x),
                Math.round(y),
                Math.round(this.size.width)
            )

            y += font.lineSize
        }
    }

    drawRect(): void {
        this.ctx.beginPath()

        drawRoundedRect(
            this.ctx,
            this.rect.x,
            this.rect.y,
            this.rect.width,
            this.rect.height,
            this.style.borderRadius
        )
        this.ctx.closePath()

        if (this.style.backgroundColor) {
            this.ctx.fillStyle = this.style.backgroundColor || 'black'
            this.ctx.fill()
        }

        if (this.style.borderColor && this.style.borderWidth) {
            this.ctx.strokeStyle = this.style.borderColor
            this.ctx.lineWidth = this.style.borderWidth
            this.ctx.lineJoin = 'miter'
            this.ctx.stroke()
        }
    }

    drawLine(): void {
        this.ctx.save()

        this.ctx.strokeStyle = this.style.lineColor
        this.ctx.lineWidth = this.style.lineWidth
        this.ctx.lineJoin = 'miter'
        this.ctx.beginPath()

        this.ctx.moveTo(this.x1, this.y1)
        this.ctx.lineTo(this.x, this.y)
        this.ctx.stroke()

        this.ctx.restore()
    }

    draw(): void {
        this.drawRect()
        this.drawText()
    }

    updateRects(): void {
        this.rect = this.computeRect()
    }

    positionCenter(arc: any): void {
        this.arc = arc
        const chart = this.context.chart

        const midAngle = (arc.startAngle + arc.endAngle) / 2
        const nx = Math.cos(midAngle)
        const ny = Math.sin(midAngle)
        //const d = arc.outerRadius
        /*
        const viewWidth = chart.chartArea.width
        const viewLeft = chart.chartArea.x
        const viewTop = chart.chartArea.y
        const viewHeight = chart.chartArea.height */

        const cx = (chart.chartArea.left + chart.chartArea.right) / 2
        const cy = (chart.chartArea.top + chart.chartArea.bottom) / 2
        const r = arc.outerRadius

        const x1 = r * nx + cx
        const y1 = r * ny + cy

        const x2 = x1 + nx * this.length
        const y2 = y1 + ny * this.length

        this.x1 = x1
        this.y1 = y1
        this.x = x2
        this.y = y2
        this.nx = nx
    }
}

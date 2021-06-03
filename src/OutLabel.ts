import OutLabelsOptions, { FontOptions } from './OutLabelsOptions'
import { resolve, toPadding } from 'chart.js/helpers'
import {
    drawRoundedRect,
    moveFromAnchor,
    parseFont,
    positionCenter,
    textSize,
} from './helpers'
import Size from './Size'
import { Point } from 'chart.js'
import Rect from './Rect'
import Center from './Center'
import OutLabelsContext from './OutLabelsContext'

export default class OutLabel {
    ctx: CanvasRenderingContext2D

    encodedText: string
    text: string
    lines: RegExpMatchArray
    label: string
    value: number

    style: any

    stretch: number
    size: Size
    offsetStep: number
    offset: Point
    predictedOffset: Point

    textRect: Rect = { height: 0, width: 0, x: 0, y: 0 }
    labelRect: Rect = { height: 0, width: 0, x: 0, y: 0 }

    center: Center

    constructor(
        ctx: CanvasRenderingContext2D,
        el: any,
        index: number,
        config: OutLabelsOptions,
        context: OutLabelsContext
    ) {
        if (!config.display) {
            throw new Error('Label display property is set to false.')
        }

        this.ctx = ctx

        // Init text
        const label = context.labels[index]
        let text = resolve([config.text], context, index)
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
                resolve([config.font, new FontOptions()]) ?? config.font,
                parseFloat(ctx.canvas.style.height.slice(0, -2))
            ),
            padding: toPadding(resolve([config.padding, 0], context, index)),
            textAlign: resolve([config.textAlign, 'left'], context, index),
        }

        this.stretch = resolve([config.stretch, 40], context, index) ?? 0
        this.size = textSize(ctx, this.lines, this.style.font)

        this.offsetStep = this.size.width / 20
        this.offset = {
            x: 0,
            y: 0,
        }
        this.predictedOffset = this.offset

        const angle = -((el.startAngle + el.endAngle) / 2) / Math.PI
        const val = Math.abs(angle - Math.trunc(angle))

        if (val > 0.45 && val < 0.55) {
            this.predictedOffset.x = 0
        } else if (angle <= 0.45 && angle >= -0.45) {
            this.predictedOffset.x = this.size.width / 2
        } else if (angle >= -1.45 && angle <= -0.55) {
            this.predictedOffset.x = -this.size.width / 2
        }

        this.center = positionCenter(el, this.stretch)
    }

    computeLabelRect(): Rect {
        let width = this.textRect.width + 2 * this.style.borderWidth
        let height = this.textRect.height + 2 * this.style.borderWidth

        const x =
            this.textRect.x - this.style.padding.left - this.style.borderWidth
        const y =
            this.textRect.y - this.style.padding.top - this.style.borderWidth

        width += this.style.padding.width
        height += this.style.padding.height

        return {
            x: x,
            y: y,
            width: width,
            height: height,
        }
    }

    computeTextRect(): Rect {
        return {
            x: this.center.x - this.size.width / 2,
            y: this.center.y - this.size.height / 2,
            width: this.size.width,
            height: this.size.height,
        }
    }

    getPoints(): Point[] {
        return [
            {
                x: this.labelRect.x,
                y: this.labelRect.y,
            },
            {
                x: this.labelRect.x + this.labelRect.width,
                y: this.labelRect.y,
            },
            {
                x: this.labelRect.x + this.labelRect.width,
                y: this.labelRect.y + this.labelRect.height,
            },
            {
                x: this.labelRect.x,
                y: this.labelRect.y + this.labelRect.height,
            },
        ]
    }

    containsPoint(point: Point, offset: number): boolean {
        if (!offset) {
            offset = 5
        }

        return (
            this.labelRect.x - offset <= point.x &&
            point.x <= this.labelRect.x + this.labelRect.width + offset &&
            this.labelRect.y - offset <= point.y &&
            point.y <= this.labelRect.y + this.labelRect.height + offset
        )
    }

    drawText(): void {
        const align = this.style.textAlign
        const font = this.style.font
        const color = this.style.color
        let x, y, idx

        if (!this.lines.length || !color) {
            return
        }

        x = this.textRect.x
        y = this.textRect.y + font.lineSize / 2

        if (align === 'center') {
            x += this.textRect.width / 2
        } else if (align === 'end' || align === 'right') {
            x += this.textRect.width
        }

        this.ctx.font = this.style.font.string
        this.ctx.fillStyle = color
        this.ctx.textAlign = align
        this.ctx.textBaseline = 'middle'

        for (idx = 0; idx < this.lines.length; ++idx) {
            this.ctx.fillText(
                this.lines[idx],
                Math.round(x),
                Math.round(y),
                Math.round(this.textRect.width)
            )

            y += font.lineSize
        }
    }

    drawLabel(): void {
        this.ctx.beginPath()

        drawRoundedRect(
            this.ctx,
            Math.round(this.labelRect.x),
            Math.round(this.labelRect.y),
            Math.round(this.labelRect.width),
            Math.round(this.labelRect.height),
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
        this.ctx.moveTo(this.center.anchor.x, this.center.anchor.y)
        this.ctx.lineTo(this.center.copy.x, this.center.copy.y)
        this.ctx.stroke()

        this.ctx.restore()
    }

    draw(): void {
        this.drawLabel()
        this.drawText()
    }

    update(view: any, elements: any, max: number): void {
        this.center = positionCenter(view, this.stretch)
        this.moveLabelToOffset()

        this.center.x += this.offset.x
        this.center.y += this.offset.y

        let valid = false

        while (!valid) {
            this.textRect = this.computeTextRect()
            this.labelRect = this.computeLabelRect()
            const rectPoints = this.getPoints()

            valid = true

            for (let e = 0; e < max; ++e) {
                const element = elements[e]
                if (!element) {
                    continue
                }

                valid = true
                if (valid) continue

                const elPoints = element.getPoints()

                for (let p = 0; p < rectPoints.length; ++p) {
                    if (element.containsPoint(rectPoints[p])) {
                        valid = false
                        break
                    }

                    if (this.containsPoint(elPoints[p], 0)) {
                        valid = false
                        break
                    }
                }
            }

            if (!valid) {
                this.center = moveFromAnchor(this.center, 1)
                this.center.x += this.offset.x
                this.center.y += this.offset.y
            }
        }
    }

    moveLabelToOffset(): void {
        if (
            this.predictedOffset.x <= 0 &&
            this.offset.x > this.predictedOffset.x
        ) {
            this.offset.x -= this.offsetStep
            if (this.offset.x <= this.predictedOffset.x) {
                this.offset.x = this.predictedOffset.x
            }
        } else if (
            this.predictedOffset.x >= 0 &&
            this.offset.x < this.predictedOffset.x
        ) {
            this.offset.x += this.offsetStep
            if (this.offset.x >= this.predictedOffset.x) {
                this.offset.x = this.predictedOffset.x
            }
        }
    }
}

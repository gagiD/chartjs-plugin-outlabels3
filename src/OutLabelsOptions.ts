export class PaddingOptions {
    top = 4
    right = 4
    bottom = 4
    left = 4
}

export class FontOptions {
    family?: string
    size?: number
    style?: 'normal' | 'italic' | 'oblique' | 'initial' | 'inherit' = undefined
    weight?: string
    resizable = true
    minSize?: number
    maxSize?: number
    lineHeight = 1.2
    lineSize = 0
}

export default class OutLabelsOptions {
    display = true
    text = '%l %p'
    textAlign = 'center'
    color = 'white'
    borderRadius = 0
    borderWidth = 0
    lineWidth = 2
    stretch = 40
    percentPrecision = 1
    valuePrecision = 3

    padding: PaddingOptions = new PaddingOptions()

    font: FontOptions = new FontOptions()

    backgroundColor(context: any): string {
        return context.dataset.backgroundColor
    }

    borderColor(context: any): string {
        return context.dataset.backgroundColor
    }

    lineColor(context: any): string {
        return context.dataset.backgroundColor
    }
}

export class PaddingOptions {
    top = 4
    right = 4
    bottom = 4
    left = 4
}

export class FontOptions {
    family = "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
    size?: number
    style?: 'normal' | 'italic' | 'oblique' | 'initial' | 'inherit' = 'normal'
    weight?: string
    resizable = true
    minSize?: number
    maxSize?: number
    lineHeight = 1.2
    lineSize = 0
}

// eslint-disable-next-line no-unused-vars
export type BooleanCallback = (item: any) => boolean
// eslint-disable-next-line no-unused-vars
export type StringCallback = (item: any) => string

export default class OutLabelsOptions {
    display: boolean | BooleanCallback = true
    text: string | StringCallback = '%l %p'
    textAlign = 'center'
    color = 'white'
    borderRadius = 0
    borderWidth = 0
    lineWidth = 2
    length = 40
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

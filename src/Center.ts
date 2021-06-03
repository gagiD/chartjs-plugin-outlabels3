import { ArcProps, Point } from 'chart.js'

export default interface Center {
    x: number
    y: number
    d: number
    arc: ArcProps
    anchor: Point
    copy: Point
}

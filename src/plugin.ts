import { Chart, Plugin } from 'chart.js'
import { AnyObject } from 'chart.js/types/basic'
import OutLabel from './OutLabel'
import OutLabelsContext from './OutLabelsContext'
import OutLabelsOptions from './OutLabelsOptions'

declare type OutLabelsPlugin = Plugin<'doughnut', AnyObject>

//const LABEL_KEY = '$outlabels'

const outLabels: Map<number, OutLabel> = new Map()

export default {
    id: 'outlabels',
    afterDatasetUpdate: function (chart: Chart<'doughnut'>, args, options) {
        const config = Object.assign(new OutLabelsOptions(), options)
        const labels = chart.config.data.labels
        const dataset = chart.data.datasets[args.index]
        const display = config && config.display
        const elements = args.meta.data
        const ctx = chart.ctx

        ctx.save()

        for (let i = 0; i < elements.length; ++i) {
            const el = elements[i]

            const percent =
                dataset.data[i] /
                dataset.data.reduce((sum, current) => sum + current)

            const context = {
                chart: chart,
                dataIndex: i,
                dataset: dataset,
                labels: labels,
                datasetIndex: args.index,
                value: dataset.data[i],
                percent: percent,
            } as OutLabelsContext

            if (display && el && chart.getDataVisibility(args.index)) {
                try {
                    const newLabel = new OutLabel(ctx, el, i, config, context)
                    outLabels.set(i, newLabel)
                } catch (e) {
                    //newLabel = null
                }
            }
        }

        ctx.restore()
    },

    afterDatasetDraw: function (_chart, args) {
        const elements = args.meta.data || []
        for (let i = 0; i < elements.length; ++i) {
            const label = outLabels.get(i)
            if (!label) {
                continue
            }

            const el = elements[i]

            label.update(el, elements, i)
            label.drawLine()
            label.draw()
        }
    },
} as OutLabelsPlugin

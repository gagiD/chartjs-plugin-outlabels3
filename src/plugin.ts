import { Chart, Plugin } from 'chart.js'
import { resolve } from 'chart.js/helpers'
import { AnyObject } from 'chart.js/types/basic'
import OutLabel from './OutLabel'
import OutLabelsContext from './OutLabelsContext'
import OutLabelsOptions from './OutLabelsOptions'

declare type OutLabelsPlugin = Plugin<'doughnut', AnyObject>

//const LABEL_KEY = '$outlabels'

const outLabels: Map<string, Map<number, OutLabel>> = new Map()

export default {
    id: 'outlabels',
    beforeInit: function (chart) {
        outLabels.set(chart.id, new Map())
    },
    afterDatasetUpdate: function (chart: Chart<'doughnut'>, args, options) {
        const config = Object.assign(new OutLabelsOptions(), options)
        const labels = chart.config.data.labels
        const dataset = chart.data.datasets[args.index]
        const elements = args.meta.data
        const ctx = chart.ctx

        const chartOutlabels = outLabels.get(chart.id)
        if (!chartOutlabels) return

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

            const display = resolve([config.display, false], context, i)
            if (display && el && chart.getDataVisibility(args.index)) {
                try {
                    const newLabel = new OutLabel(ctx, el, i, config, context)
                    chartOutlabels.set(i, newLabel)
                } catch (e) {
                    console.log(e)
                    //newLabel = null
                }
            }
        }

        ctx.restore()
    },
    afterDatasetDraw: function (chart, args) {
        const ctx = chart.ctx
        ctx.save()

        const chartOutlabels = outLabels.get(chart.id)
        if (!chartOutlabels) return

        const elements = args.meta.data || []
        for (let i = 0; i < elements.length; ++i) {
            const label = chartOutlabels.get(i)
            if (!label) {
                continue
            }

            const el = elements[i]

            label.update(el, elements, i)
            label.drawLine()

            label.draw()
        }

        ctx.restore()
    },
} as OutLabelsPlugin

import { Chart, Plugin } from 'chart.js'
import { resolve } from 'chart.js/helpers/helpers.esm'
import { AnyObject } from 'chart.js/types/basic'
import OutLabel from './OutLabel'
import OutLabelsContext from './OutLabelsContext'
import OutLabelsManager from './OutLabelsManager'
import OutLabelsOptions from './OutLabelsOptions'

declare type OutLabelsPlugin = Plugin<'doughnut', AnyObject>

const outLabelsManager = new OutLabelsManager()

export default {
    id: 'outlabels',
    beforeInit: function (chart) {
        outLabelsManager.set(chart.id)
    },
    afterDatasetUpdate: function (chart: Chart<'doughnut'>, args, options) {
        const config = Object.assign(new OutLabelsOptions(), options)
        const labels = chart.config.data.labels
        const dataset = chart.data.datasets[args.index]
        const elements = args.meta.data
        const ctx = chart.ctx

        ctx.save()
        for (let i = 0; i < elements.length; ++i) {
            const el = elements[i]
            let newLabel = null

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
                    newLabel = new OutLabel(ctx, i, config, context)
                } catch (e) {
                    console.warn(e)
                    newLabel = null
                }
            }

            if (newLabel) outLabelsManager.setLabel(chart.id, i, newLabel)
        }

        ctx.restore()
    },
    afterDatasetDraw: function (chart: Chart<'doughnut'>, args) {
        const ctx = chart.ctx
        const elements = args.meta.data
        ctx.save()

        const chartOutlabels = outLabelsManager.get(chart.id)
        if (!chartOutlabels) return

        chartOutlabels.forEach(label => {
            label.positionCenter(elements[label.index])
            label.updateRects()
        })

        outLabelsManager.avoidOverlap(chart)

        chartOutlabels.forEach(label => {
            label.updateRects()
            label.draw()
            label.drawLine()
        })

        ctx.restore()
    },
} as OutLabelsPlugin

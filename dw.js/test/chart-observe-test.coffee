
root._ = require 'underscore'
root.$ = require 'jquery'
vows = require 'vows'
assert = require 'assert'
dw = require '../dw-2.0.js'

chart_attrs =
    title: 'A nice title for a chart'
    type: 'line-chart'
    theme: 'default'
    metadata:
        data:
            transpose: false
        visualize:
            scale: 'log'

vows
    .describe('Testing chart observe API')
    .addBatch

        'simple title change':
            'topic': () ->
                chart = dw.chart $.extend true, {}, chart_attrs
                chart.observe @callback
                chart.set 'title', 'A new title'
                return
            'observing changes': (chart, changes) ->
                assert.equal changes.length, 1
                assert.equal changes[0].key, 'title'
                assert.equal changes[0].value, 'A new title'


        'changing title and type at the same time':
            'topic': () ->
                chart = dw.chart $.extend true, {}, chart_attrs
                chart.observe @callback
                chart.set 'title', 'A new title'
                chart.set 'type', 'bar-chart'
                return
            'observing changes': (chart, changes) ->
                assert.equal changes.length, 2
                assert.equal changes[0].key, 'title'
                assert.equal changes[0].value, 'A new title'
                assert.equal changes[1].key, 'type'
                assert.equal changes[1].value, 'bar-chart'


    .export module

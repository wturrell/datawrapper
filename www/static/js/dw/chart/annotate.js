
define([
    './annotate/highlight',
    './annotate/numberformat',
    './visualize/updateSize',
    './visualize/themes',
    './visualize/loadVisDeferred',
    './visualize/enableInlineEditing',
    './visualize/liveUpdate',
    './visualize/checkChartHeight',
    './visualize/updateVisBackground',
    // silent imports
    './visualize/colorpicker',
    'selectize'
],
function(initHighlightSeries, numberformat, updateSize, themes, loadVisDfd, enableInlineEditing, liveUpdate, checkChartHeight,
    updateVisBackground) {

    var chart = dw.backend.currentChart,
        visMetas = {},
        iframe = $('#iframe-vis'),
        visJSON,
        _themeHasChanged = false,
        __updateSizeTimer;


    function init(themesJSON, _visMetas, _visJSON) {

        themes.init(themesJSON);

        visMetas = _visMetas;
        visJSON = _visJSON;

        dw.backend.__currentVisLoaded = loadVisDfd.promise();

        chart.onSave(onChartSave);

        syncUI();

        chart.load().done(onDatasetLoaded);

        iframe.load(iframeLoaded);
        iframe.ready(iframeReady);

        // initialize some UI actions
        initChartSize();

        $('.insert-title').click(function(evt) {
            evt.preventDefault();
            chart.set('title', dw.backend.messages.insertTitleHere);
        });

        $('.insert-intro').click(function(evt) {
            evt.preventDefault();
            chart.set('metadata.describe.intro', dw.backend.messages.insertIntroHere);
        });

        $('#select-theme').selectize({});

        numberformat.init();
    }

    function iframeLoaded() {
        updateVisBackground();
        var win = $('#iframe-vis').get(0).contentWindow,
            chk;

        chk = setInterval(function() {  // wait a little more
            if (win.__dw.vis) {
                clearInterval(chk);
                liveUpdate.init(iframe);
                console.log('initializing live update');
                win.__dw.vis.rendered().done(function() {
                    checkChartHeight();
                });
            }
        }, 100);

        $(win).unload(function() {
            iframe.ready(iframeReady);
        });
    }

    function iframeReady() {
        var iframe_window = $('#iframe-vis').get(0).contentWindow;
        $(window).on('message', function(evt) {
            evt = evt.originalEvent;
            if (evt.source == iframe_window) {
                if (evt.data == 'datawrapper:vis:init') {
                    iframe_window.dw_alert = dw.backend.alert;
                    iframe_window.__dw.backend = dw.backend;
                }
                if (evt.data == 'datawrapper:vis:rendered') {
                    enableInlineEditing($('#iframe-vis'), chart);
                    if (initHighlightSeries) initHighlightSeries();
                }
                if (evt.data.slice(0, 7) == 'notify:') {
                    dw.backend.notify(evt.data.slice(7));
                }
            }
        });
    }

    function initChartSize() {
        var cw = chart.get('metadata.publish.embed-width', $('#iframe-wrapper').width()),
            ch = chart.get('metadata.publish.embed-height', $('#iframe-wrapper').height());
        $('#resize-w').val(cw);
        $('#resize-h').val(ch);
        $('.resize-chart input').change(_updateSize);
        $('#iframe-wrapper').width(cw);
        $('#iframe-wrapper').height(ch);

        $('.resize-chart a').click(function(e) {
            e.preventDefault();
            var dim = $(e.target).html().split('×');
            $('#resize-w').val(dim[0]);
            $('#resize-h').val(dim[1]);
            updateSize();
        });
    }

    function loadVis() {
        dw.backend.currentVis = dw.visualization(chart.get('type'));
        dw.backend.currentVis.chart(chart);
        dw.backend.currentVis.dataset = chart.dataset().reset();
        dw.backend.currentVis.meta = visMetas[chart.get('type')];
        loadVisDfd.resolve();
    }


    function onChartSave(chart) {
        console.log('chart saved!');

        if (_themeHasChanged) {
            loadVis();
            themes.load().done(function() {
                themes.updateUI();
            });
            iframe.one('load', updateVisBackground);
            _.some(themes.all(), function(theme) {
                if (theme.id == chart.get('theme')) {
                    var w = theme.default_width || chart.get('metadata.publish.embed-width'),
                        h = theme.default_height || chart.get('metadata.publish.embed-height');
                    updateSize(w, h);
                    return true;
                }
            });
        }

        updateTitleIntroLinks();
    }

    function updateTitleIntroLinks() {
        if (chart.get('title') === '') $('.insert-title').show();
        else $('.insert-title').hide();

        if (chart.get('metadata.describe.intro') === '') $('.insert-intro').show();
        else $('.insert-intro').hide();
    }

    function onDatasetLoaded() {
        loadVis();
        updateTitleIntroLinks();
        if (initHighlightSeries) initHighlightSeries();
        _.each(themes.all(), function(theme) {
            if (theme.id == chart.get('theme')) {
                var w = chart.get('metadata.publish.embed-width', theme.default_width || 560),
                    h = chart.get('metadata.publish.embed-height', theme.default_height || 400);
                updateSize(w, h);
                return false;
            }
        });
        themes.load();
    }

    function syncUI() {
        chart.sync('#select-theme', 'theme');
        // chart.sync('#text-title', 'title');
        // chart.sync('#text-intro', 'metadata.describe.intro');
        // chart.sync('#describe-source-name', 'metadata.describe.source-name');
        // chart.sync('#describe-source-url', 'metadata.describe.source-url');

        chart.observe(function(chart, changes) {
            _.each(changes, function(change) {
                if (change.key == 'theme') _themeHasChanged = true;
            });
            liveUpdate.update(iframe, chart.attributes());
        });
    }

    // chart resizing
    function _updateSize() {
        clearTimeout(__updateSizeTimer);
        __updateSizeTimer = setTimeout(updateSize, 300);
    }


    return {
        init: init
    };
});
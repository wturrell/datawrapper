
define([
    './visualize/themes',
    './visualize/checkChartHeight',
    './visualize/updateSize',
    './visualize/loadVisDeferred',
    './visualize/initTabNav',
    './visualize/enableInlineEditing',
    './visualize/liveUpdate',
    './visualize/options',
    './visualize/axesEditor',
    './visualize/updateVisBackground',
    'js/misc/classify',
    './visualize/colorpicker',
    'js/misc/jquery.easing',
    'selectize'],

function(themes, checkChartHeight, updateSize, loadVisDfd, initTabNav, enableInlineEditing,
    liveUpdate, options, axesEditor, updateVisBackground, classify) {

    var _typeHasChanged = false,
        _axesHaveChanged = false,
        _transposed = false,
        __thumbTimer,
        __updateSizeTimer,
        chart = dw.backend.currentChart,
        visMetas = {},
        iframe = $('#iframe-vis'),
        visJSON;

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
        initTabNav();
        initTransposeLink();
        initVisSelector();

        options.init(chart, visJSON);
        iframe.one('load', options.sync);
    }

    function onChartSave(chart) {

        if (_typeHasChanged) {
            // remove all notifications
            $("#notifications .notification").fadeOutAndRemove();
            loadOptions().done(function() {
                loadVis();
            });
        }

        if (_axesHaveChanged || _transposed) {
            loadOptions().done(function() {
                loadVis();
            });
        }

        _typeHasChanged = false;
        _axesHaveChanged = false;
        _transposed = false;

        var iframeWin = iframe.get(0).contentWindow;
        if (iframeWin.__dw && iframeWin.__dw.saved) {
            iframeWin.__dw.saved();
        }
        scheduleThumbnail();
        checkChartHeight();
    }

    function syncUI() {
        chart.sync('#select-theme', 'theme');
        chart.sync('#text-title', 'title');
        chart.sync('#text-intro', 'metadata.describe.intro');
        chart.sync('#describe-source-name', 'metadata.describe.source-name');
        chart.sync('#describe-source-url', 'metadata.describe.source-url');

        chart.observe(function(chart, changes) {
            _.each(changes, function(change) {
                if (change.key == 'type') _typeHasChanged = true;
                if (change.key.substr(0, 13) == 'metadata.axes') _axesHaveChanged = true;
                if (change.key == 'metadata.data.transpose') _transposed = true;
            });
            liveUpdate.update(iframe, chart.attributes());
        });
    }

    function iframeLoaded() {
        updateVisBackground();
        var win = $('#iframe-vis').get(0).contentWindow,
            chk;

        chk = setInterval(function() {  // wait a little more
            if (win.__dw.vis) {
                clearInterval(chk);
                liveUpdate.init(iframe);
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
                }
                if (evt.data.slice(0, 7) == 'notify:') {
                    dw.backend.notify(evt.data.slice(7));
                }
            }
        });
    }

    function loadOptions() {
        var loaded = $.Deferred();
        $('#vis-options').load(
            '/xhr/'+chart.get('id')+'/vis-options?nocache='+Math.random(),
            function() {
                loaded.resolve();
                // trigger event in order to resync options
                loadVis();
                options.sync();
                themes.updateUI();
            }
        );
        return loaded.promise();
    }

    function initTransposeLink() {
        $('#btn-transpose').click(function(e) {
            e.preventDefault();
            chart.set('metadata.data.transpose', !chart.get('metadata.data.transpose'));
            chart.load().done(onDatasetLoaded);
            setTimeout(function() {
                loadOptions();
            }, 2000);
        });
    }

    function initVisSelector() {

        $('#chart-type').selectize({
            render: {
                option: function(data, escape) {
                    return '<div class="option">'+
                        '<img style="height:25px" src="'+data.vis.__static_path+data.value+'.png" /> '+escape(data.text) +
                        '</div>';
                },
                item: function(data, escape) {
                    return '<div class="item">'+
                        '<img style="height:25px" src="'+data.vis.__static_path+data.value+'.png" /> '+escape(data.text) +
                        '</div>';
                }
            },
            onChange: function() {
                chart.set('type', this.getValue());
            }
        });

        // graphical vis selector
        /*
        var unfolded = $('.vis-selector-unfolded'),
            folded = $('.vis-selector-folded'),
            thumbs = $('.vis-thumb'),
            selVis = $('.vis-selected');
        unfolded.show().data('h', unfolded.height()).hide();
        thumbs.click(function(e) {
            var thumb = $(e.target);
            if (!thumb.hasClass('vis-thumb')) thumb = thumb.parents('.vis-thumb');
            thumbs.removeClass('active');
            thumb.addClass('active');
            selVis.html('<img src="'+thumb.data('static-path')+thumb.data('id')+'.png" width="24" />' + thumb.data('title'));
            setTimeout(function() {
                // folded.show();
                // unfolded.animate({ height: 0 }, 300, 'easeOutExpo', function() {
                //     unfolded.hide();
                // });
                chart.set('type', thumb.data('id'));
            }, 100);
        });

        folded.click(function() {
            folded.hide();
            unfolded.height(0).show().animate({ height: unfolded.data('h') }, 300);
        });

        unfolded.show();
        folded.hide();
        // */
    }


    /** Set into `dw.backend.currentVis` the edited visualization (editor side) */
    function loadVis() {
        dw.backend.currentVis = dw.visualization(chart.get('type'));
        dw.backend.currentVis.chart(chart);
        dw.backend.currentVis.dataset = chart.dataset().reset();
        dw.backend.currentVis.meta = visMetas[chart.get('type')];
        options.init(chart, visMetas[chart.get('type')]);
        loadVisDfd.resolve();
    }

    function scheduleThumbnail() {
        clearTimeout(__thumbTimer);
        __thumbTimer = setTimeout(function() {
            dw.backend.snapshot(iframe, dw.backend.currentChart.get('id'), 'm', 260, 160);
        }, 500);
    }

    function onDatasetLoaded() {
        loadVis();
        _.each(themes.all(), function(theme) {
            if (theme.id == chart.get('theme')) {
                var w = chart.get('metadata.publish.embed-width', theme.default_width || 560),
                    h = chart.get('metadata.publish.embed-height', theme.default_height || 400);
                updateSize(w, h);
                return false;
            }
        });
        themes.load();
        axesEditor.init(chart, visJSON);
    }




    return {
        init: init
    };

});
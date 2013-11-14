
define(['dragdrop'], function() {

    var _chart, _visJSON;

    jQuery.fn.outerHTML = function(s) {
        return s
            ? this.before(s).remove()
            : jQuery("<p>").append(this.eq(0).clone()).html();
    };

    return {
        init: function(chart, visJSON) {
            _chart = chart;
            _visJSON = visJSON;
        },

        initUI: function() {
            var ds = chart.dataset(),
                colDiv = $('.axes-editor .columns'),
                axesDiv = $('.axes-editor .axes'),
                axisTpl = $('.template-axis').html(),
                visAxes = dw.backend.currentVis.axes(true),
                axesCfg = dw.backend.currentVis.axes(),
                _storeTo;

            $('.column', colDiv).remove(); // remove existing columns

            ds.eachColumn(initColumn);

            _.each(_visJSON.axes, initAxis);

            initDragDrop();

            function initColumn(column) {
                var c = $('<div />')
                            .html(column.title())
                            .attr('data-id', column.name())
                            .attr('data-type', column.type())
                            .addClass('column')
                            .addClass('column-'+column.type())
                            .appendTo(colDiv);
            }

            function initAxis(axis, id) {
                var d = $('<div />').html(axisTpl)
                            .addClass('axis')
                            .data('id', id)
                            .addClass(axis.multiple ? 'multiple' : 'single')
                            .appendTo(axesDiv);

                $('.axis-title', d).html(axis.title ? axis.title : axis.id);

                // populate axes
                var columns = visAxes[id],
                    axesColDiv = $('.axis-columns', d);
                if (!_.isArray(columns)) columns = [columns];

                _.each(columns, function(col) {
                    $('<div />').addClass('column')
                        .html(col.title())
                        .attr('data-type', col.type())
                        .addClass('column-'+col.type())
                        .attr('data-id', col.name())
                        .appendTo(axesColDiv);
                });
                axesColDiv.sortable({ revert: true });
            }

            function initDragDrop() {

                $('.column', colDiv).draggable({
                    connectToSortable: '.axis-columns',
                    helper: 'clone',
                    revertDuration: 100,
                    zIndex: 10,
                    appendTo: ".axes-editor",
                    start: function(evt, ui) {
                        ui.helper.css({ 'margin-top': -$(window).scrollTop() });
                    },
                    stop: function(evt, ui) {
                        ui.helper.css({ 'margin-top': 0 });
                    }
                });

                $(".axis").each(function() {

                    var $axis = $(this);

                    $('.axis-columns', $axis).sortable({
                        connectWith: '.axis-columns',
                        revert: true,
                        scroll: true,
                        revertDuration: 100,
                        placeholder: "sortable-placeholder"
                    })

                    .droppable({
                        activeClass: 'highlight',
                        revertDuration: 100,

                        // accept: function(draggable) {
                        //     //console.log(draggable.data('type'), $axis.data('id'), _visJSON.axes[$axis.data('id')].accepts.indexOf(draggable.data('type')) >= 0);
                        //     return _visJSON.axes[$axis.data('id')].accepts.indexOf(draggable.data('type')) >= 0;
                        // },

                        over: function(evt, ui) {
                            // check if we can accept the draggable
                            var context = this,
                                $axisColumns = $(this),
                                draggedColumn = ui.draggable.data('id'),
                                accept = true;

                            if (_visJSON.axes[$axis.data('id')].accepts.indexOf(ui.draggable.data('type')) < 0) {
                                ui.draggable.addClass('not-accepted');
                                ui.helper.addClass('not-accepted');
                            } else {
                                ui.draggable.removeClass('not-accepted');
                                ui.helper.removeClass('not-accepted');
                            }

                            $('.column', $axisColumns).each(function() {
                                if (toBeRemoved(this, ui, context)) {
                                    $(this).addClass('soon-to-be-removed');
                                }
                            });
                        },

                        out: function(evt, ui) {
                            $('.column', this).removeClass('soon-to-be-removed');
                        },

                        drop: function(event, ui) {
                            var context = this,
                                $axisColumns = $(this),
                                draggedColumn = ui.draggable.data('id'),
                                newColumn = ui.draggable.hasClass('ui-draggable');

                            ui.draggable.removeClass('soon-to-be-removed');
                            if (ui.draggable.hasClass('not-accepted')) {
                                ui.draggable.remove();
                            }

                            $('.column.soon-to-be-removed', $axisColumns).remove();
                            clearTimeout(_storeTo);
                            _storeTo = setTimeout(storeConfig, 500);
                        },

                    });
                });

                // $('.axis').each(function() {
                //     var accept = _.map(_visJSON.axes[$(this).data('id')].accepts, function(t) {
                //         return '.column-' + t;
                //     });
                //     console.log($(this).data('id'), accept.join(' '));
                //     $('.axis-columns', this).droppable('option', 'accept', accept.join(' '));
                // });

                colDiv.droppable({
                    accept: '.column',
                    drop: function() {
                        console.log('drop!');
                    }
                });

                /*
                 * @el one of the existing columns
                 */
                function toBeRemoved(el, ui, context) {
                    var axis = $(context).parents('.axis').data('id'),
                        isSingle = _visJSON.axes[axis].multiple !== true,
                        dragged = ui.draggable.data('id');

                    if (el == ui.draggable.get(0)) return false;

                    if (ui.helper.hasClass('not-accepted')) return false;

                    // check if this is a single axis
                    if (isSingle) {
                        return true;
                    } else {
                        if (axesCfg[axis].indexOf(dragged) >= 0) {
                            return $(el).data('id') == dragged;
                        }
                    }
                    return false;
                }

                $('.column').disableSelection();
            }

            function storeConfig() {
                $('.axes-editor .axis').each(function() {
                    var axis = $(this);
                    if (axis.hasClass('single')) {
                        axesCfg[axis.data('id')] = $('.column', axis).data('id');
                    } else {
                        axesCfg[axis.data('id')] = [];
                        $('.column', axis).each(function() {
                            axesCfg[axis.data('id')].push($(this).data('id'));
                        });
                    }
                });
                console.log(axesCfg);
            }
        },

        load: function() {

            var ds = chart.dataset(),
                $c = $('.axes-editor'),
                columnUsed = {},
                chartAxes = chart.get('metadata.axes', {});

            _.each(visJSON.axes, initAxis);

            initDragDrop();

            function initAxis(axis, id) {
                var div = $('.axis', $c).filter(function(i, el) {
                    return $(el).data('axis') == id;
                });
                var s = $('select', div),
                    unused_index = 0;
                ds.eachColumn(function(column, i) {
                    if (_.indexOf(axis.accepts, column.type()) > -1) {
                        var selected = (!axis.multiple && chartAxes[id] == column.name()) ||
                            (axis.multiple && _.indexOf(chartAxes[id], column.name()) > -1) ||
                            (!chartAxes[id] && !columnUsed[column.name()] && (axis.multiple || unused_index===0));
                        if (selected) {
                            columnUsed[column.name()] = true;
                            unused_index++;
                        }
                        $('<option />')
                            .attr('value', column.name())
                            .text(column.title())
                            .prop('selected', selected)
                            .appendTo(s);
                    }
                });
                if (axis.multiple) {
                    s.selectize({
                        plugins: ['drag_drop'],
                        onChange: storeAxesConfig
                    });
                } else {
                    s.selectize({
                        onChange: storeAxesConfig
                    });
                }
                axis.__select = s.get(0).selectize;
            }

            function initDragDrop() {
                $(".selectize-control.multi.plugin-drag_drop", $c).droppable({
                    accept: ".item",
                    drop: function(evt, ui) {
                        var src_axis_el = ui.draggable.parents('.axis'),
                            src_sel = $('select', src_axis_el).get(0).selectize,
                            tgt_sel = $('select', $(evt.target).parents('.axis')).get(0).selectize;
                        if (src_sel != tgt_sel) {
                            //$('.ui-sortable-placeholder', src_axis_el).remove();
                            //src_sel.close();
                            src_sel.removeItem(ui.draggable.data('value'));
                            tgt_sel.addItem(ui.draggable.data('value'));
                            src_sel.blur();
                        }
                    }
                });
            }

            function storeAxesConfig() {
                chartAxes = $.extend({}, chartAxes);
                _.each(visJSON.axes, function(axis, id) {
                    chartAxes[id] = axis.__select.getValue();
                });
                chart.set('metadata.axes', chartAxes);
            }

        }
    };

});
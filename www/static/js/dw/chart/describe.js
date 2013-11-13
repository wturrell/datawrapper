
define([
    'handsontable',
    './describe/metadata',
    './describe/updateTable'
],
function(handsontable, getMetaData, updateTable) {

    var _chartLocale,
        _reload = $.Callbacks();

    function init(chartLocale, messages) {
        _chartLocale = chartLocale; // store in upper scope

        var chart = dw.backend.currentChart,
            metadata = getMetaData(chart),
            $dataPreview = $("#data-preview"),
            selectedColumns = [],
            dataset;

        updateTable = updateTable($dataPreview, chart, metadata, selectedColumns, messages); // initialize function

        _reload.add(reload);

        chart.sync('#describe-source-name', 'metadata.describe.source-name');
        chart.sync('#describe-source-url', 'metadata.describe.source-url');
        chart.sync('#transpose', 'metadata.data.transpose');
        chart.sync('#has-headers', 'metadata.data.horizontal-header');

        $('#reset-data-changes').click(function(){
            metadata.changes.revert();
        });

        // return to upload sub-step
        $('a[href=#upload]').click(function(e) {
            e.preventDefault();
            $('.dw-create-upload').removeClass('hidden');
            $('.dw-create-describe').addClass('hidden');
        });

        // add event handler for ignoring data series
        $('body').on('mousedown', bodyMouseDown);
        $('#describe-source-url').blur(storeCorrectedSourceUrl);

        // reload now
        reload();

        // reload table as soon the chart changes
        chart.observe(reload);

        // save changes before navigating to next step
        $('a[href=visualize]').click(function(evt) {
            if (chart.hasUnsavedChanges()) {
                evt.preventDefault();
                chart.onSave(function() {
                    location.href = 'visualize';
                });
                chart.save();
            }
        });

        // --- no more action below this line ---

        /*
         * triggers a reload of the table
         */
        function reload(f, changes, csvData) {
            if (_.isArray(changes)) { // triggered via chart.observe()
                chart.reload().done(reloaded);
            } else { // triggered via direct call of reload()
                // load data from remote csv
                chart.load(csvData).done(reloaded);
            }
            function reloaded(ds) {
                dataset = ds;
                updateTable(ds);
            }
        }

        function getSeriesOfIndex(index) {
            return dataset.column(index).name();
        }

        function deselectColumns() {
            selectedColumns.length = 0;
        }

        function selectColumn(index) {
            deselectColumns();
            selectedColumns[0] = index;
            $dataPreview.handsontable('render');
        }

        function selectedSeries() {
            var out = [];
            selectedColumns.forEach(function(i){
                out.push(getSeriesOfIndex(i));
            });
            return out;
        }

        function allEqual(formats, series, property) {
            if (series.length > 1) {
                for (var i = 1; i < series.length; i++) {
                    var a = formats[series[i]] && formats[series[i]][property];
                    var b = formats[series[i - 1]] && formats[series[i - 1]][property];
                    if (a !== b) {
                        return false;
                    }
                }
            }
            return true;
        }

        function fillInField(selector, property) {
            var series = selectedSeries();
            var formats = chart.get('metadata.data.column-format', {});
            var $input = $(selector);
            if(allEqual(formats, series, property)) {
                var val = formats[series[0]] && formats[series[0]][property];
                if (val === undefined && $input.is('select')) val = '-';
                $input.val(val).removeClass('unresolved');
            }
            else {
                $input.val('').addClass('unresolved');
                $input.change(function() {
                    fillInField(selector, property);
                });
            }
        }

        function syncColumnFormat(selector, property) {
            $(selector).change(function(){
                var columnNames = [];
                selectedColumns.forEach(function(i) {
                    columnNames.push(getSeriesOfIndex(i));
                });
                metadata.columnFormat.add(columnNames, property, this.value === '-' ? undefined : this.value);
            });
        }


        function storeCorrectedSourceUrl() {
            var v = $(this).val();
            if (v.substr(0,2) != '//' && v.substr(0,7) != 'http://' &&  v.substr(0,8) != 'https://') {
                $(this).val('//'+v);
                chart.set('metadata.describe.source-url', $(this).val());
            }
        }

        function bodyMouseDown() {
            if(document.activeElement.nodeName === 'INPUT') {
                document.activeElement.blur(); //save changes from currently edited sidebar field
            }
            if(selectedColumns.length) {
                deselectColumns();
                $dataPreview.handsontable('render'); // refresh all cells and column headers
            }
        }

    } // end init();

    return {
        init: init,
        reload: _reload.fire
    };

});

define(function() {

    return function($dataPreview, chart, metadata, selectedColumns, messages) {

        function getIndexOfTh(th) {
            var col = $dataPreview.handsontable('getInstance').view.wt.wtTable.getCoords(th)[1];
            return col;
        }

        /*
         * updates the Handonstable
         */
        return function(dataset) {

            var data = [],
                horzHeaders = chart.get('metadata.data.horizontal-header'),
                transpose = chart.get('metadata.data.transpose'),
                tr = buildDataArray(dataset);

            if ($dataPreview.handsontable('getInstance')) {
                $dataPreview.handsontable('loadData', data);
                $dataPreview.handsontable('render');
            } else {
                // initialize Handsontable
                $dataPreview.handsontable({
                    data: data,
                    allowHtml: true,
                    startRows: 6,
                    startCols: 8,
                    width: function() {return $dataPreview.width();},
                    // max-height is 13 rows (400px) otherwise it's the number of rows plus the table header height
                    height: function(){
                        var cell_height = $('#data-preview td').outerHeight(true) + 1;
                        return dataset.numRows() <= 13 ? dataset.numRows() * cell_height + cell_height * 2  : 400;
                    },
                    fixedRowsTop: function(){ return horzHeaders ? 1: 0; },
                    rowHeaders: true,
                    colHeaders: true,
                    fillHandle: false,
                    stretchH: 'all',
                    cells: function (row, col, prop) {
                        return {
                            renderer: cellRenderer
                        };
                    },
                    afterRender: function() {
                        renderSelectedTh(); //if HOT was scrolled horizontally, we need to rerender th.selected
                    },
                    afterChange: afterChange
                });

                $('table', $dataPreview).addClass('table table-bordered'); //Bootstrap class names
                $dataPreview.handsontable('render'); //consider Bootstrap class names in auto column size
            }

            if(metadata.changes.exist()) {
                $('#reset-data-changes').removeClass('disabled');
            }
            else {
                $('#reset-data-changes').addClass('disabled');
            }

            if (selectedColumns.length) {
                // update automatic-format checkbox
                if (dataset.column(selectedColumns[0]).type() == 'number') {
                    updateAutomaticFormat();
                }
            }
            // transpose button action
            $('thead tr th:first-child', $dataPreview).off('click').on('click', function(evt) {
                evt.preventDefault();
                chart.set('metadata.data.transpose', !chart.get('metadata.data.transpose', false));
            });

            // context menu
            $('thead tr th+th', $dataPreview).off('click').on('click', function(evt) {
                console.log('clicked column header');
                $(this).contextMenu();
                selectedColumns[0] = getIndexOfTh(this);
                $dataPreview.handsontable('render');
                evt.preventDefault();
            });

            $('thead tr', $dataPreview).contextMenu({
                selector: "th",
                callback: function(key, options) {
                    var m = "clicked: " + key;
                    console.log(m);
                },
                trigger: 'none',
                items: {
                    type: {
                        name: messages.columnType,
                        items: {
                            auto: { name: messages.auto },
                            text: { name: messages.text },
                            number: { name: messages.number },
                            date: { name: messages.date }
                        }
                    },
                    format: {
                        name: messages.inputFormat,
                        items: {
                            auto: { name: messages.auto }
                        }
                    }
                }
            });

            // --- no action below this line ---

            function buildDataArray(ds) {
                var tr = [];
                ds.eachColumn(function(column) {
                    tr.push(column.title());
                });
                data.push(tr);

                ds.eachRow(function(row) {
                    var tr = [];
                    ds.eachColumn(function(column, i) {
                        var val = column.raw(row);
                        tr.push(isNone(val) ? '' : val);
                    });
                    data.push(tr);
                });
            }

            function isNone(val) {
                return val === null || val === undefined || (_.isNumber(val) && isNaN(val));
            }

            function HtmlCellRender(instance, TD, row, col, prop, value, cellProperties) {
              var escaped = dw.utils.purifyHtml(Handsontable.helper.stringify(value));
              TD.innerHTML = escaped; //this is faster than innerHTML. See: https://github.com/warpech/jquery-handsontable/wiki/JavaScript-&-DOM-performance-tips
              if (cellProperties.readOnly) {
                instance.view.wt.wtDom.addClass(TD, 'htDimmed');
              }
              if (cellProperties.valid === false && cellProperties.invalidCellClassName) {
                instance.view.wt.wtDom.addClass(TD, cellProperties.invalidCellClassName);
              }
            }

            function cellRenderer(instance, td, row, col, prop, value, cellProperties) {
                var column = dataset.column(col);
                if (row > 0) {
                    var formatter = chart.columnFormatter(column);
                    value = formatter(column.val(row - 1), true);
                }
                HtmlCellRender.apply(this, arguments);
                if (parseInt(value, 10) < 0) { //if row contains negative number
                    td.classList.add('negative');
                }
                td.classList.add(column.type()+'Type');
                if (row === 0) {
                    td.classList.add('firstRow');
                } else {
                    td.classList.add(row % 2 ? 'oddRow' : 'evenRow');
                }
                if (metadata.columnFormat.get(column.name()).ignore) {
                    td.classList.add('ignored');
                }
                if(selectedColumns.indexOf(col) > -1) {
                    td.classList.add('area'); //add blue area background if this cell is in selected column
                }
                if (row > 0 && !column.type(true).isValid(column.val(row-1))) {
                    td.classList.add('parsingError');
                }
            }

            function afterChange(changes, source) {
                if (source !== 'loadData') {
                    changes.forEach(function(change) {
                        if (change[2] != change[3]) {
                            metadata.changes.add(change[0], change[1], change[3]);
                        }
                    });
                }
            }

            function renderSelectedTh() {
                $("thead th.selected", $dataPreview).removeClass('selected');
                selectedColumns.forEach(function(i){
                    getThOfIndex(i).classList.add('selected');
                });
                $("thead th", $dataPreview).each(function(i){
                    if(i > 0) {
                        var index = getIndexOfTh(this);
                        var serie = dataset.column(index).name();
                        if(metadata.columnFormat.get(serie).ignore) {
                            this.classList.add('ignored');
                        }
                        else {
                            this.classList.remove('ignored');
                        }
                    }
                });
            }

            function getThOfIndex(index) {
                var offsetCol = $dataPreview.handsontable('getInstance').view.wt.getSetting('offsetColumn');
                var thIndex = index + 1 * hasCorner() - offsetCol;
                return document.querySelectorAll('#data-preview thead th')[thIndex];
            }

            function hasCorner() {
                return !!$('tbody th', $dataPreview).length;
            }
        }; // end updateTable()
    };
});
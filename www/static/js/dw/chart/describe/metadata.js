
define(function() {

    return function(chart) {
        return {

            changes: {
                exist: function() {
                    return !!chart.get('metadata.data.changes', []).length;
                },
                add: function(row, column, value) {
                    var dataChanges = _.clone(chart.get('metadata.data.changes', [])); //clone is needed, otherwise chart.set does not detect this as change
                    if (chart.get('metadata.data.transpose')) {
                        dataChanges.push({row: column, column: row, value: value});
                    }
                    else {
                        dataChanges.push({row: row, column: column, value: value});
                    }
                    chart.set('metadata.data.changes', dataChanges);
                },
                revert: function() {
                    chart.set('metadata.data.changes', []);
                    chart.set('metadata.data.column-format', {});
                }
            },

            columnFormat: {
                add: function(columnNames, property, value) {
                    var columnFormats = $.extend(true, {}, chart.get('metadata.data.column-format', {})); //deep clone (_.clone is insufficient because it does a shallow clone)
                    _.each(columnNames, function(name) {
                        if (!columnFormats[name]) {
                            columnFormats[name] = {};
                        }
                        if (property) {
                            if (value === undefined) {
                                delete columnFormats[name][property];
                                if (!_.keys(columnFormats[name]).length) {
                                    delete columnFormats[name];
                                }
                            } else {
                                columnFormats[name][property] = value;
                            }
                            if (property === 'type') {
                                dataset.column(name).type(value);
                            }
                        } else {
                            if (value === undefined) delete columnFormats[name];
                            else columnFormats[name] = value;
                        }
                    });
                    chart.set('metadata.data.column-format', columnFormats);
                },
                get: function(columnName) {
                    var columnFormat = chart.get('metadata.data.column-format', {});
                    if (arguments.length) {
                        return columnFormat[columnName] || {};
                    }
                    else {
                        return columnFormat;
                    }
                }
            }
        };
    };

});
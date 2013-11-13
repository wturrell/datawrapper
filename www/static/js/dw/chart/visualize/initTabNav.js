
define(['./axesEditor'], function(axesEditor) {

    return function() {

        $('.visualize-left .axes-preview .btn-customize').click(function(evt) {
            evt.preventDefault();
            $('.visualize-left').removeClass('span2-5').addClass('span5');
            $('.visualize-right').hide();
            $('.visualize-left .chart-type-axis-preview').addClass('hide');
            $('.visualize-left .axes-editor').removeClass('hide');

            axesEditor.initUI();
        });

    };

});
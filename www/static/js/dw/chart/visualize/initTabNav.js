
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

        $('.visualize-left .axes-editor .btn-return').click(function(evt) {
            evt.preventDefault();
            $('.visualize-left').addClass('span2-5').removeClass('span5');
            $('.visualize-right').show();
            $('.visualize-left .chart-type-axis-preview').removeClass('hide');
            $('.visualize-left .axes-editor').addClass('hide');
        });

    };

});
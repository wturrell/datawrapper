
define(function() {

    function init() {
        $('.axis-format .axis .btn').click(function(evt) {
            var axis_id = $(evt.target).parents('.axis').data('axis');
            console.log(axis_id);
            $('#number-format-modal').modal();
        });
    }

    return {
        init: init
    };

});
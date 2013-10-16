
define(['./describe'], function(describe) {

    var chart;

    function init(dropCSVHereMsg, uploadCSVFileMsg) {

        chart = dw.backend.currentChart;

        $('#upload-data, .create-nav .submit').click(function(e) {
            uploadData('#describe');
            e.preventDefault();
        });

        initFileUpload();

        $('.submit').click(function(e) {
            if (txtarea.val() != txtarea.data('orig-val')) {
                e.preventDefault();
                var a = $(e.target);
                if (e.target.nodeName.toLowerCase() != "a") a = a.parents('a');
                uploadData(a.attr('href'));
            }
        });

        initDemoDatasets();
        initTextareaPasteListener();
    }

    function initFileUpload() {
        var txtarea = $('#upload-data-text');

        new qq.FileUploader({
            element: $('#upload')[0],
            action: '/api/charts/' + dw.backend.currentChart.get('id') + '/data',
            allowedExtensions: ['txt', 'csv', 'tsv'],
            template: $('.upload-template').html(),
            classes: {
                button: 'upload-button',
                drop: 'upload-drop',
                dropActive: 'upload-drop-active',
                list: 'qq-upload-list',
                file: 'qq-upload-file',
                spinner: 'qq-upload-spinner',
                size: 'qq-upload-size',
                cancel: 'qq-upload-cancel'
            },
            multiple: false,
            onComplete: function(code, filename, res) {
                if (res.status == "ok") nextPage('#describe');
                else {
                    dw.backend.logError(res.message, txtarea.parent().parent());
                }
            }
        });

        txtarea.data('orig-val', txtarea.val());

        $('.upload-drop').css({
            position: 'absolute',
            top: txtarea.offset().top - $('.navbar').height(),
            left: txtarea.offset().left+2,
            width: txtarea.width()+2,
            height: txtarea.height()+2,
            'line-height': txtarea.height()+'px'
        });
    }

    function nextPage(url, csvData) {
        if (url == '#describe') {
            $('.dw-create-upload').addClass('hidden');
            $('.dw-create-describe').removeClass('hidden');
            describe.reload(null, null, csvData);
        } else {
            location.href = url;
        }
    }

    function uploadData(url) {
        var uploadReady,
            theData = $('#upload-data-text').val();
        if ($.trim(theData) === "") {
            dw.backend.alert(dw.backend.messages.noData);
            $('.upload-form .control-group').addClass('warning');
            return false;
        }
        if (url == '#describe') nextPage(url, theData);
        uploadReady = $.ajax({
            url: '/api/charts/' + chart.get('id') + '/data',
            type: 'PUT',
            data: theData,
            processData: false,
            dataType: 'json'
        });
        if (chart.hasUnsavedChanges()) {
            $.when(uploadReady, chart.nextSavePromise()).done(proceed);
        } else {
            $.when(uploadReady).done(proceed);
        }
        function proceed(res) {
            if (_.isArray(res)) res = res[0];
            if (res.status == "ok") {
                // data is saved correctly, so proceed
                if (url != '#describe') nextPage(url);
            } else {
                alert('error: '+res.message);
            }
        }
        return false;
    }

    function initDemoDatasets() {
        $('.demo-dataset').click(function(evt) {
            evt.preventDefault();
            var a = $(evt.target);
            $('#upload-data-text').val(a.data('data'));
            if (a.data('presets')) {
                $.each(a.data('presets'), function(key, val) {
                    dw.backend.currentChart.set(key, val);
                });
            }
            uploadData('#describe');
        });
    }

    function initTextareaPasteListener() {
        var txt = $('#upload-data-text'),
            lastVal = txt.val();

        txt.on('keyup', function(evt) {
            console.log(evt.keyCode, evt.ctrlKey);
            if (evt.keyCode == 93 || evt.keyCode == 91 || evt.ctrlKey) {
                txtChanged();
            }
            lastVal = txt.val();
        }).on('click', txtChanged);

        function txtChanged() {
            if (lastVal != txt.val()) {
                if (lastVal === '' && txt.val().length > 1) {
                    uploadData('#describe');
                }
            }
            lastVal = txt.val();
        }
    }

    return {
        init: init
    };

});
// https://blog.fineuploader.com/2013/08/16/fine-uploader-s3-upload-directly-to-amazon-s3-from-your-browser/

Liberapay.s3_uploader_init = function () {

    var $form = $('#invoice-form');
    if ($form.length === 0) return;

    var base_path = $form.data('base-path');
    var uploader = new qq.s3.FineUploader({
        element: document.getElementById('fine-uploader'),
        template: document.getElementById('qq-template'),
        autoUpload: false,
        request: {
            endpoint: $form.data('s3-endpoint'),
            accessKey: $form.data('s3-access-key'),
        },
        objectProperties: {
            region: $form.data('s3-region'),
            key: function (fileId) {
                var filename = uploader.getName(fileId);
                return 'invoice_docs/' + uploader._invoice_id + '/' + filename
            },
        },
        signature: {
            endpoint: base_path + 'add-file?step=sign',
            version: 4,
            customHeaders: custom_headers,
        },
        uploadSuccess: {
            endpoint: base_path + 'add-file?step=success',
            customHeaders: custom_headers,
        },
        validation: {
            allowedExtensions: $form.data('allowed-extensions').split(', '),
            itemLimit: $form.data('item-limit'),
            sizeLimit: $form.data('max-size'),
        },
        display: {
            fileSizeOnSubmit: true,
        },
        text: {
            fileInputTitle: '',
        },
        callbacks: {
            onAllComplete: function (successes, failures) {
                if (successes.length > 0 && failures.length == 0 && uploader._invoice_id) {
                    window.location.href = base_path + uploader._invoice_id;
                }
            },
            onSubmitted: function () {
                $('#invoice-form button').filter(':not([type]), [type="submit"]').prop('disabled', false);
            },
        },
    });

    var already_uploaded = $form.data('already-uploaded');
    if (already_uploaded.length > 0) {
        uploader.addInitialFiles(already_uploaded);
    }

    function custom_headers() { return {
        'X-CSRF-TOKEN': Liberapay.getCookie('csrf_token'),
        'X-Invoice-Id': uploader._invoice_id,
    }}

    function submit(e) {
        e.preventDefault();
        var form = $form.get(0);
        if (form.reportValidity && form.reportValidity() == false) return;
        var $inputs = $form.find(':not(:disabled)').filter(function () {
            return $(this).parents('#fine-uploader').length == 0
        });
        var data = $form.serializeArray();
        $inputs.prop('disabled', true);
        jQuery.ajax({
            url: '',
            type: 'POST',
            data: data,
            dataType: 'json',
            success: function(data) {
                uploader._invoice_id = data.invoice_id;
                history.pushState(null, null, location.pathname + '?id=' + data.invoice_id);
                return upload_docs()
            },
            error: [
                function () { $inputs.prop('disabled', false); },
                Liberapay.error,
            ],
        });
    }
    $('#invoice-form').submit(submit);
    $('#invoice-form button').filter(':not([type]), [type="submit"]').click(submit);

    function upload_docs() {
        if (uploader._storedIds.length !== 0) {
            uploader.uploadStoredFiles();
        } else {
            window.location.href = base_path + uploader._invoice_id;
        }
    }

};

// v1.0.3

(function () {

    // ══════════════════════════════════════════════════════════
    // MODAL OPEN / CLOSE
    // ══════════════════════════════════════════════════════════

    window.openModal = function (id) {
        var modal = document.getElementById(id);
        if (!modal) return;
        modal.classList.add('open');
        document.body.classList.add('modal-open'); // prevent body scroll
    };

    window.closeModal = function (id) {
        var modal = document.getElementById(id);
        if (!modal) return;
        modal.classList.remove('open');
        // Only remove body lock if no other modals are open
        if (!document.querySelector('.admin-modal-overlay.open')) {
            document.body.classList.remove('modal-open');
        }
    };

    // Close on overlay backdrop click
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('admin-modal-overlay')) {
            e.target.classList.remove('open');
            if (!document.querySelector('.admin-modal-overlay.open')) {
                document.body.classList.remove('modal-open');
            }
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            var openModal = document.querySelector('.admin-modal-overlay.open');
            if (openModal) {
                openModal.classList.remove('open');
                if (!document.querySelector('.admin-modal-overlay.open')) {
                    document.body.classList.remove('modal-open');
                }
            }
        }
    });


    // ══════════════════════════════════════════════════════════
    // MODAL TABS  (rmod-tab / rmod-panel)
    // Scoped to the parent .admin-modal so multiple tabbed
    // modals on the same page never interfere with each other.
    // ══════════════════════════════════════════════════════════

    document.addEventListener('click', function (e) {
        var tab = e.target.closest('.rmod-tab');
        if (!tab) return;

        var modal = tab.closest('.admin-modal');
        if (!modal) return;

        modal.querySelectorAll('.rmod-tab').forEach(function (t) {
            t.classList.remove('active');
        });
        modal.querySelectorAll('.rmod-panel').forEach(function (p) {
            p.classList.remove('active');
        });

        tab.classList.add('active');
        var target = tab.getAttribute('data-tab');
        var panel = document.getElementById(target);
        if (panel) panel.classList.add('active');
    });


    // ══════════════════════════════════════════════════════════
    // DOCUMENT TOGGLE BUTTONS  (Approve / Pending / Reject)
    // ══════════════════════════════════════════════════════════

    document.addEventListener('click', function (e) {
        var btn = e.target.closest('.admin-modal-toggle-btn');
        if (!btn) return;

        var group = btn.closest('.admin-modal-toggle-group');
        if (!group) return;

        group.querySelectorAll('.admin-modal-toggle-btn').forEach(function (b) {
            b.classList.remove('active');
        });
        btn.classList.add('active');
    });


    // ══════════════════════════════════════════════════════════
    // DOCUMENT PREVIEW  (image / pdf)
    // ══════════════════════════════════════════════════════════

    // Fetch a signed URL for a private Supabase object, then preview it.
    // bucket is the discriminator the server maps to a real bucket ("rider" | "merchant").
    window.previewDocument = function (bucket, objectPath, title) {
        if (!objectPath) return;
        var ext  = objectPath.split('.').pop().toLowerCase();
        var type = (ext === 'pdf') ? 'pdf' : 'image';

        fetch('/Admin/DocumentUrl?bucket=' + encodeURIComponent(bucket) +
              '&path=' + encodeURIComponent(objectPath))
            .then(function (res) { return res.ok ? res.json() : Promise.reject(); })
            .then(function (data) { openDocPreview(type, data.url, title); })
            .catch(function () { alert('Unable to load document. Please try again.'); });
    };

    window.openDocPreview = function (type, src, title) {
        var titleEl = document.getElementById('doc-preview-title');
        var body    = document.getElementById('doc-preview-body');
        if (!titleEl || !body) return;

        titleEl.textContent = title || 'Document Preview';
        body.innerHTML = '';

        if (type === 'image') {
            var img = document.createElement('img');
            img.src = src;
            img.alt = title || 'Document';
            body.appendChild(img);
        } else if (type === 'pdf') {
            var iframe = document.createElement('iframe');
            iframe.src = src;
            iframe.title = title || 'PDF Document';
            body.appendChild(iframe);
        }

        openModal('doc-preview-modal');
    };

})();

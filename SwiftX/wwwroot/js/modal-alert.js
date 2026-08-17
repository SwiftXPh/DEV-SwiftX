var AlertModal = (function () {
    'use strict';

    // ── Default icons per type ────────────────────────────────
    var DEFAULT_ICONS = {
        danger: 'ph-warning-circle',
        warning: 'ph-warning',
        success: 'ph-check-circle',
        info: 'ph-info',
    };

    // ── Element refs ──────────────────────────────────────────
    function el(id) { return document.getElementById(id); }

    var currentOnClose = null;

    // ── Close ─────────────────────────────────────────────────
    function close() {
        var overlay = el('alert-modal-overlay');
        if (!overlay) return;
        overlay.classList.remove('open');
        // Clean up injected buttons so stale callbacks don't linger
        var footer = el('alert-modal-footer');
        if (footer) footer.innerHTML = '';
        
        if (typeof currentOnClose === 'function') {
            var cb = currentOnClose;
            currentOnClose = null;
            cb();
        }
    }

    // ── Show ──────────────────────────────────────────────────
    function show(opts) {
        opts = opts || {};
        currentOnClose = opts.onClose || null;

        var type = opts.type || 'warning';
        var title = opts.title || '';
        var message = opts.message || '';
        var buttons = opts.buttons || [];
        var icon = opts.icon || DEFAULT_ICONS[type] || 'ph-info';

        var overlay = el('alert-modal-overlay');
        var modal = el('alert-modal');
        var iconWrap = el('alert-modal-icon-wrap');
        var iconEl = el('alert-modal-icon');
        var titleEl = el('alert-modal-title');
        var msgEl = el('alert-modal-message');
        var footer = el('alert-modal-footer');

        if (!overlay || !modal) {
            console.warn('[AlertModal] Partial not found — add @await Html.PartialAsync("_ModalAlert") to your layout.');
            return;
        }

        // ── Apply type ────────────────────────────────────────
        // Remove old type classes
        modal.classList.remove('alert-modal--danger', 'alert-modal--warning', 'alert-modal--success', 'alert-modal--info');
        iconWrap.classList.remove('alert-modal__icon-wrap--danger', 'alert-modal__icon-wrap--warning', 'alert-modal__icon-wrap--success', 'alert-modal__icon-wrap--info');

        modal.classList.add('alert-modal--' + type);
        iconWrap.classList.add('alert-modal__icon-wrap--' + type);

        // ── Icon ──────────────────────────────────────────────
        iconEl.className = 'ph ' + icon;

        // ── Text ──────────────────────────────────────────────
        titleEl.textContent = title;
        msgEl.innerHTML = message; // innerHTML allows <strong> etc.

        // ── Buttons ───────────────────────────────────────────
        footer.innerHTML = '';

        if (buttons.length === 0) {
            // Fallback: single close button
            buttons = [{ label: 'Close', variant: 'ghost' }];
        }

        if (buttons.length >= 3) {
            // 3-button layout: first button pushed left, rest grouped right
            footer.classList.add('alert-modal__footer--3btn');

            var firstBtn = buildBtn(buttons[0]);
            footer.appendChild(firstBtn);

            var group = document.createElement('div');
            group.className = 'alert-modal__btn-group';
            for (var i = 1; i < buttons.length; i++) {
                group.appendChild(buildBtn(buttons[i]));
            }
            footer.appendChild(group);

        } else {
            // 2-button layout: both right-aligned
            footer.classList.remove('alert-modal__footer--3btn');
            for (var j = 0; j < buttons.length; j++) {
                footer.appendChild(buildBtn(buttons[j]));
            }
        }

        // ── Open ─────────────────────────────────────────────
        overlay.classList.add('open');
    }

    // ── Build a single button element ────────────────────────
    function buildBtn(btnOpts) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'admin-modal-btn admin-modal-btn--' + (btnOpts.variant || 'ghost');
        btn.textContent = btnOpts.label || 'OK';

        btn.addEventListener('click', function () {
            close();
            if (typeof btnOpts.callback === 'function') {
                // Tiny delay so modal closes before callback runs
                setTimeout(btnOpts.callback, 120);
            }
        });

        return btn;
    }

    // ── Close on overlay click ────────────────────────────────
    document.addEventListener('click', function (e) {
        var overlay = el('alert-modal-overlay');
        if (overlay && e.target === overlay) close();
    });

    // ── Close on Escape ───────────────────────────────────────
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') close();
    });

    // ── Public API ────────────────────────────────────────────
    return { show: show, close: close };

})();

/* ═══════════════════════════════════════════════════════════
USAGE EXAMPLES
(copy-paste into your page scripts, delete when done)
═══════════════════════════════════════════════════════════
 
// ── 2-button: simple confirm/cancel ──────────────────────────
AlertModal.show({
type    : 'danger',
title   : 'Cancel Order',
message : 'Are you sure you want to cancel <strong>#ORD-1248</strong>? This action cannot be undone.',
buttons : [
    { label: 'Keep Order',   variant: 'ghost'  },
    { label: 'Cancel Order', variant: 'danger', callback: function() { cancelOrder(1248); } }
]
});
 
// ── 2-button: success/info confirmation ──────────────────────
AlertModal.show({
type    : 'success',
title   : 'Mark as Delivered',
message : 'Confirm that order <strong>#ORD-1248</strong> has been delivered to the customer.',
buttons : [
    { label: 'Not Yet',      variant: 'ghost'   },
    { label: 'Mark Delivered', variant: 'success', callback: function() { markDelivered(1248); } }
]
});
 
// ── 3-button: multiple choices ───────────────────────────────
AlertModal.show({
type    : 'warning',
title   : 'Rider Unavailable',
message : '<strong>James Ocampo</strong> is currently offline. What would you like to do with this order?',
buttons : [
    { label: 'Dismiss',        variant: 'ghost'   },
    { label: 'Reassign Rider', variant: 'warning', callback: function() { openReassignModal(); } },
    { label: 'Cancel Order',   variant: 'danger',  callback: function() { cancelOrder(1247); }  }
]
});
 
// ── 3-button: approve/reject with neutral dismiss ─────────────
AlertModal.show({
type    : 'info',
title   : 'Pending Application',
message : '<strong>Carlo Mendoza</strong> has submitted a rider application. Review before making a decision.',
buttons : [
    { label: 'Review Later', variant: 'ghost'   },
    { label: 'Reject',       variant: 'danger',  callback: function() { rejectApp(99); } },
    { label: 'Accept',       variant: 'success', callback: function() { acceptApp(99); } }
]
});
 
// ── Custom icon ───────────────────────────────────────────────
AlertModal.show({
type    : 'warning',
icon    : 'ph-clock',
title   : 'Session Expiring',
message : 'Your session will expire in <strong>2 minutes</strong>. Save your work.',
buttons : [
    { label: 'Extend Session', variant: 'primary' }
]
});
 
═══════════════════════════════════════════════════════════ */
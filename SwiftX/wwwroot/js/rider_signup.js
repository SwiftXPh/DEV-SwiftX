// rider_signup.js — v3.0.0
// Single-page form. All sections always visible. One submit button.
// File inputs use a clean label+input pattern (no z-index tricks).
// Console.log dumps all field values on submit for debugging.

(function () {
    'use strict';

    var MAX_MB = 10;
    var MAX_BYTES = MAX_MB * 1024 * 1024;

    // ── Grab all inputs ───────────────────────────────────────────────────────

    var el = {
        form: document.getElementById('riderSignupForm'),

        // Section 1
        firstname: document.getElementById('inp-firstname'),
        middlename: document.getElementById('inp-middlename'),
        lastname: document.getElementById('inp-lastname'),
        address: document.getElementById('inp-address'),
        contact: document.getElementById('inp-contact'),
        dobMonth: document.getElementById('inp-dob-month'),
        dobDate: document.getElementById('inp-dob-date'),
        dobYear: document.getElementById('inp-dob-year'),

        // Section 2
        license: document.getElementById('inp-license'),
        id: document.getElementById('inp-id'),
        orcr: document.getElementById('inp-orcr'),
        agreement: document.getElementById('inp-agreement'),
        front: document.getElementById('inp-front'),
        side: document.getElementById('inp-side'),
        plate: document.getElementById('inp-plate'),
        gcash: document.getElementById('inp-gcash'),


        // Section 3
        username: document.getElementById('inp-username'),
        email: document.getElementById('inp-email'),
        password: document.getElementById('inp-password'),
        confirm: document.getElementById('inp-confirm'),
    };

    // ── Populate DOB day + year dropdowns ─────────────────────────────────────

    (function () {
        for (var d = 1; d <= 31; d++) {
            var o = document.createElement('option');
            o.value = d; o.textContent = d;
            el.dobDate.appendChild(o);
        }
        var now = new Date().getFullYear();
        for (var y = now - 15; y >= 1940; y--) {
            var o2 = document.createElement('option');
            o2.value = y; o2.textContent = y;
            el.dobYear.appendChild(o2);
        }
    })();

    // ── Error helpers ─────────────────────────────────────────────────────────

    function showErr(id, msg) {
        var span = document.getElementById('err-' + id);
        if (!span) return;
        span.textContent = msg;
        span.classList.add('visible');
    }

    function clearErr(id) {
        var span = document.getElementById('err-' + id);
        if (!span) return;
        span.textContent = '';
        span.classList.remove('visible');
    }

    function setBorder(input, isError) {
        if (!input) return;
        input.style.borderColor = isError ? '#ef4444' : '';
    }

    // ── File UI helper ────────────────────────────────────────────────────────
    // Finds the .su-file-upload wrapper by the input's id prefix,
    // then updates the visible label text and .has-file state.

    function setFileUI(inputEl, hasFile, fileName) {
        // Walk up to the .su-file-upload container
        var wrapper = inputEl.closest('.su-file-upload');
        if (!wrapper) return;

        var labelDiv = wrapper.querySelector('.su-file-label');
        if (!labelDiv) return;

        var span = labelDiv.querySelector('span');
        if (!span) return;

        // Store original text once
        if (!span.dataset.orig) span.dataset.orig = span.textContent.trim();

        if (hasFile) {
            wrapper.classList.add('has-file');
            var name = fileName || '';
            span.textContent = name.length > 24 ? name.slice(0, 21) + '…' : name;
        } else {
            wrapper.classList.remove('has-file');
            span.textContent = span.dataset.orig;
        }
    }

    // ── Individual validators ─────────────────────────────────────────────────

    function chkRequired(input, errId, label) {
        if (!input || !input.value.trim()) {
            showErr(errId, label + ' is required.');
            setBorder(input, true);
            return false;
        }
        clearErr(errId);
        setBorder(input, false);
        return true;
    }

    function chkPhone(input, errId, label) {
        if (!input || !input.value.trim()) {
            showErr(errId, label + ' is required.');
            setBorder(input, true);
            return false;
        }
        var clean = input.value.replace(/\s+/g, '');
        if (!/^09\d{9}$/.test(clean)) {
            showErr(errId, 'Enter a valid PH mobile number (09XXXXXXXXX).');
            setBorder(input, true);
            return false;
        }
        clearErr(errId);
        setBorder(input, false);
        return true;
    }

    function chkDob() {
        if (!el.dobMonth.value || !el.dobDate.value || !el.dobYear.value) {
            showErr('dob', 'Please select a complete date of birth.');
            setBorder(el.dobMonth, true);
            setBorder(el.dobDate, true);
            setBorder(el.dobYear, true);
            return false;
        }
        clearErr('dob');
        setBorder(el.dobMonth, false);
        setBorder(el.dobDate, false);
        setBorder(el.dobYear, false);
        return true;
    }

    function chkFile(input, errId, label) {
        if (!input || !input.files || input.files.length === 0) {
            showErr(errId, label + ' is required.');
            return false;
        }
        if (input.files[0].size > MAX_BYTES) {
            showErr(errId, 'File too large — max ' + MAX_MB + ' MB.');
            setFileUI(input, false, '');
            input.value = '';
            return false;
        }
        clearErr(errId);
        return true;
    }

    function chkEmail(input, errId) {
        if (!input || !input.value.trim()) {
            showErr(errId, 'Email address is required.');
            setBorder(input, true);
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) {
            showErr(errId, 'Enter a valid email address.');
            setBorder(input, true);
            return false;
        }
        clearErr(errId);
        setBorder(input, false);
        return true;
    }

    function chkPassword() {
        if (!el.password || !el.password.value) {
            showErr('password', 'Password is required.');
            setBorder(el.password, true);
            return false;
        }
        if (el.password.value.length < 8) {
            showErr('password', 'Password must be at least 8 characters.');
            setBorder(el.password, true);
            return false;
        }
        clearErr('password');
        setBorder(el.password, false);
        return true;
    }

    function chkConfirm() {
        if (!el.confirm || !el.confirm.value) {
            showErr('confirm', 'Please confirm your password.');
            setBorder(el.confirm, true);
            return false;
        }
        if (el.confirm.value !== el.password.value) {
            showErr('confirm', 'Passwords do not match.');
            setBorder(el.confirm, true);
            return false;
        }
        clearErr('confirm');
        setBorder(el.confirm, false);
        return true;
    }

    // ── Section completeness (for indicator) ──────────────────────────────────

    function fileOk(inp) {
        return inp && inp.files && inp.files.length > 0 && inp.files[0].size <= MAX_BYTES;
    }

    function sec1Complete() {
        return (
            el.firstname.value.trim() &&
            el.lastname.value.trim() &&
            el.address.value.trim() &&
            /^09\d{9}$/.test(el.contact.value.replace(/\s+/g, '')) &&
            el.dobMonth.value && el.dobDate.value && el.dobYear.value
        );
    }

    function sec2Complete() {
        return (
            fileOk(el.license) && fileOk(el.id) &&
            fileOk(el.orcr) && fileOk(el.agreement) &&
            fileOk(el.front) && fileOk(el.side) &&
            /^09\d{9}$/.test((el.gcash.value || '').replace(/\s+/g, '')) &&
            el.plate.value.trim()
        );
    }

    function sec3Complete() {
        return (
            el.username.value.trim() &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.email.value.trim()) &&
            el.password.value.length >= 8 &&
            el.confirm.value === el.password.value
        );
    }

    // ── Step indicator ────────────────────────────────────────────────────────

    function refreshIndicator() {
        var s1 = !!sec1Complete();
        var s2 = !!sec2Complete();
        var s3 = !!sec3Complete();

        applyCircle('[data-step-circle="1"]', s1);
        applyCircle('[data-step-circle="2"]', s2);
        applyCircle('[data-step-circle="3"]', s3);
        applyCircle('#card-circle-1', s1);
        applyCircle('#card-circle-2', s2);
        applyCircle('#card-circle-3', s3);

        applyLabel('[data-step-label="1"]', s1);
        applyLabel('[data-step-label="2"]', s2);
        applyLabel('[data-step-label="3"]', s3);

        applyConnector('[data-connector="1"]', s1);
        applyConnector('[data-connector="2"]', s2);
    }

    function applyCircle(sel, done) {
        var node = document.querySelector(sel);
        if (!node) return;
        node.classList.toggle('completed', done);
        node.classList.remove('active');
    }

    function applyLabel(sel, done) {
        var node = document.querySelector(sel);
        if (!node) return;
        node.classList.toggle('completed', done);
        node.classList.remove('active');
    }

    function applyConnector(sel, filled) {
        var node = document.querySelector(sel);
        if (!node) return;
        node.classList.toggle('filled', filled);
    }

    // ── Full validate (on submit) ─────────────────────────────────────────────

    function validateAll() {
        var ok = true;

        // Section 1
        if (!chkRequired(el.firstname, 'firstname', 'First name')) ok = false;
        if (!chkRequired(el.lastname, 'lastname', 'Last name')) ok = false;
        if (!chkRequired(el.address, 'address', 'Address')) ok = false;
        if (!chkPhone(el.contact, 'contact', 'Contact no.')) ok = false;
        if (!chkDob()) ok = false;

        // Section 2
        if (!chkFile(el.license, 'license', "Driver's license")) ok = false;
        if (!chkFile(el.id, 'id', 'Government ID')) ok = false;
        if (!chkFile(el.orcr, 'orcr', 'OR/CR')) ok = false;
        if (!chkFile(el.agreement, 'agreement', 'Service agreement')) ok = false;
        if (!chkFile(el.front, 'front', 'Front vehicle photo')) ok = false;
        if (!chkFile(el.side, 'side', 'Side vehicle photo')) ok = false;
        if (!chkPhone(el.gcash, 'gcash', 'GCash number')) ok = false;
        if (!chkRequired(el.plate, 'plate', 'Plate number')) ok = false;

        // Section 3
        if (!chkRequired(el.username, 'username', 'Username')) ok = false;
        if (!chkEmail(el.email, 'email')) ok = false;
        if (!chkPassword()) ok = false;
        if (!chkConfirm()) ok = false;

        return ok;
    }

    // ── Console debug dump ────────────────────────────────────────────────────

    function debugDump() {
        console.group('%c[SwiftX] Rider Signup — Form Values on Submit', 'color:#f5a623;font-weight:bold;');

        console.group('── Section 1: Basic Info');
        console.log('First Name   :', el.firstname ? el.firstname.value : '(element missing)');
        console.log('Middle Name  :', el.middlename ? el.middlename.value : '(element missing)');
        console.log('Last Name    :', el.lastname ? el.lastname.value : '(element missing)');
        console.log('Address      :', el.address ? el.address.value : '(element missing)');
        console.log('Contact No.  :', el.contact ? el.contact.value : '(element missing)');
        console.log('DOB Month    :', el.dobMonth ? el.dobMonth.value : '(element missing)');
        console.log('DOB Day      :', el.dobDate ? el.dobDate.value : '(element missing)');
        console.log('DOB Year     :', el.dobYear ? el.dobYear.value : '(element missing)');
        console.groupEnd();

        console.group('── Section 2: Documents');
        console.log('License      :', el.license ? fileInfo(el.license) : '(element missing)');
        console.log('Gov\'t ID     :', el.id ? fileInfo(el.id) : '(element missing)');
        console.log('OR/CR        :', el.orcr ? fileInfo(el.orcr) : '(element missing)');
        console.log('Agreement    :', el.agreement ? fileInfo(el.agreement) : '(element missing)');
        console.log('Front Photo  :', el.front ? fileInfo(el.front) : '(element missing)');
        console.log('Side Photo   :', el.side ? fileInfo(el.side) : '(element missing)');
        console.log('GCash No.    :', el.gcash ? el.gcash.value : '(element missing)');
        console.groupEnd();

        console.group('── Section 3: Account Setup');
        console.log('Username     :', el.username ? el.username.value : '(element missing)');
        console.log('Email        :', el.email ? el.email.value : '(element missing)');
        console.log('Password     :', el.password ? '[' + el.password.value.length + ' chars]' : '(element missing)');
        console.log('Confirm PW   :', el.confirm ? '[' + el.confirm.value.length + ' chars, match=' + (el.confirm.value === el.password.value) + ']' : '(element missing)');
        console.groupEnd();

        console.groupEnd();
    }

    function fileInfo(inp) {
        if (!inp.files || inp.files.length === 0) return '(no file selected)';
        var f = inp.files[0];
        return f.name + '  [' + (f.size / 1024).toFixed(1) + ' KB, type=' + f.type + ']';
    }

    // ── Live listeners: Section 1 ─────────────────────────────────────────────

    [el.firstname, el.lastname, el.address, el.username].forEach(function (inp) {
        if (!inp) return;
        inp.addEventListener('input', function () { setBorder(inp, false); refreshIndicator(); });
    });

    [el.contact, el.gcash].forEach(function (inp) {
        if (!inp) return;
        inp.addEventListener('input', function () { setBorder(inp, false); refreshIndicator(); });
    });
    el.plate.addEventListener('input', function () {
        this.value = this.value.toUpperCase(); // force uppercase as they type
        setBorder(el.plate, false);
        refreshIndicator();
    });

    [el.dobMonth, el.dobDate, el.dobYear].forEach(function (inp) {
        if (!inp) return;
        inp.addEventListener('change', function () {
            clearErr('dob');
            setBorder(el.dobMonth, false);
            setBorder(el.dobDate, false);
            setBorder(el.dobYear, false);
            refreshIndicator();
        });
    });

    el.email.addEventListener('input', function () { setBorder(el.email, false); refreshIndicator(); });
    el.password.addEventListener('input', function () { setBorder(el.password, false); refreshIndicator(); });
    el.confirm.addEventListener('input', function () { setBorder(el.confirm, false); refreshIndicator(); });

    // ── Live listeners: Section 2 file inputs ─────────────────────────────────
    // Using direct addEventListener on each input — the inputs are normal DOM
    // elements; the visual trick is done entirely with CSS (su-file-input covers
    // the label div), so events fire reliably without any z-index hacks.

    var fileInputs = [
        { inp: el.license, errId: 'license' },
        { inp: el.id, errId: 'id' },
        { inp: el.orcr, errId: 'orcr' },
        { inp: el.agreement, errId: 'agreement' },
        { inp: el.front, errId: 'front' },
        { inp: el.side, errId: 'side' },
    ];

    fileInputs.forEach(function (item) {
        if (!item.inp) return;
        item.inp.addEventListener('change', function () {
            var hasFile = this.files && this.files.length > 0;
            var file = hasFile ? this.files[0] : null;

            if (hasFile && file.size > MAX_BYTES) {
                showErr(item.errId, 'File too large — max ' + MAX_MB + ' MB.');
                setFileUI(this, false, '');
                this.value = '';            // clear so it won't submit
                refreshIndicator();
                return;
            }

            clearErr(item.errId);
            setFileUI(this, hasFile, hasFile ? file.name : '');
            refreshIndicator();
        });
    });

    // ── Password toggle ───────────────────────────────────────────────────────

    document.querySelectorAll('[data-toggle-pw]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var wrapper = this.closest('.password-wrapper');
            if (!wrapper) return;
            var input = wrapper.querySelector('input');
            var eyeOpen = this.querySelector('.eye-open');
            var eyeClosed = this.querySelector('.eye-closed');
            if (!input) return;

            if (input.type === 'password') {
                input.type = 'text';
                if (eyeOpen) eyeOpen.classList.add('hidden');
                if (eyeClosed) eyeClosed.classList.remove('hidden');
            } else {
                input.type = 'password';
                if (eyeOpen) eyeOpen.classList.remove('hidden');
                if (eyeClosed) eyeClosed.classList.add('hidden');
            }
        });
    });

    // ── Form submit ───────────────────────────────────────────────────────────

    el.form.addEventListener('submit', function (e) {
        // Always dump values first so you can inspect regardless of validity
        debugDump();

        var valid = validateAll();
        refreshIndicator();

        if (!valid) {
            e.preventDefault();
            // Scroll to the first visible error message
            var firstErr = el.form.querySelector('.field-error.visible');
            if (firstErr) {
                firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            console.warn('[SwiftX] Form blocked — validation failed. See errors above.');
        } else {
            console.log('%c[SwiftX] All validations passed — submitting form.', 'color:green;font-weight:bold;');
        }
    });

    // ── Init ──────────────────────────────────────────────────────────────────
    refreshIndicator();

})();
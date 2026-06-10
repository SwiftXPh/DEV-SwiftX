(function () {

        // ── Elements ──
        var form        = document.getElementById('admin-login-form');
        var btnLogin    = document.getElementById('btn-login');
        var usernameEl  = document.getElementById('login-username');
        var passwordEl  = document.getElementById('login-password');
        var errorBanner = document.getElementById('login-error-banner');
        var btnText     = document.querySelector('.btn-login-text');
        var btnLoader   = document.querySelector('.btn-login-loader');

        // ── Validation ──
        function validate() {
                var valid = usernameEl.value.trim() !== '' && passwordEl.value.trim() !== '';
                btnLogin.disabled = !valid;
        }

        usernameEl.addEventListener('input', function () {
                validate();
                hideError();
        });
        passwordEl.addEventListener('input', function () {
                validate();
                hideError();
        });

        // ── Error Banner ──
        function showError(msg) {
                errorBanner.querySelector('span').textContent = msg;
                errorBanner.classList.remove('hidden');
        }

        function hideError() {
                errorBanner.classList.add('hidden');
        }

        // ── Form Submit ──
        // Real submit to /Admin/Login. We only gate on client validation and show the
        // loading state; the browser performs the POST so the server can authenticate.
        form.addEventListener('submit', function (e) {
                var username = usernameEl.value.trim();
                var password = passwordEl.value.trim();

                if (!username || !password) {
                        e.preventDefault();
                        return;
                }

                // Show loading state, then let the form submit normally.
                btnText.classList.add('hidden');
                btnLoader.classList.remove('hidden');
                hideError();
        });

        // ── Password Show / Hide ──
        document.querySelectorAll('[data-toggle-pw]').forEach(function (btn) {
                btn.addEventListener('click', function () {
                        var wrapper   = this.closest('.password-wrapper');
                        var input     = wrapper.querySelector('input');
                        var eyeOpen   = this.querySelector('.eye-open');
                        var eyeClosed = this.querySelector('.eye-closed');
                        if (input.type === 'password') {
                                input.type = 'text';
                                eyeOpen.classList.add('hidden');
                                eyeClosed.classList.remove('hidden');
                        } else {
                                input.type = 'password';
                                eyeOpen.classList.remove('hidden');
                                eyeClosed.classList.add('hidden');
                        }
                });
        });

})();

document.addEventListener('DOMContentLoaded', () => {

    const passwordInput = document.getElementById('userPassword');
    const togglePasswordIcon = document.getElementById('togglePasswordIcon');

    if (togglePasswordIcon && passwordInput) {
        togglePasswordIcon.addEventListener('click', () => {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text'; // Ipakita ang text

                // PALITAN ANG FONTAWESOME NG PHOSPHOR ICONS:
                togglePasswordIcon.classList.remove('ph-eye-slash'); // Tinanggal ang nakapikit
                togglePasswordIcon.classList.add('ph-eye'); // Idinagdag ang nakabukas
            } else {
                passwordInput.type = 'password'; // Itago ulit ang text

                // PALITAN DIN DITO SA IBABA:
                togglePasswordIcon.classList.remove('ph-eye'); // Tinanggal ang nakabukas
                togglePasswordIcon.classList.add('ph-eye-slash'); // Ibinalik ang nakapikit
            }
        });
    }

    // =============================================================
    // 2. LOGIN FORM SUBMISSION CONTROLLER
    // (Keep UI intact. Fix only button/function behavior.)
    // =============================================================
    const loginForm = document.getElementById('loginForm');
    const signInBtn = document.querySelector('.btn-sign-in[type="submit"], .btn-sign-in');

    const getUsernamePassword = () => {
        if (!loginForm) {
            const u = document.querySelector('input[placeholder="Username"], input[type="text"], input:not([type="password"])');
            const p = document.querySelector('#userPassword, input[type="password"]');
            return {
                username: u ? u.value.trim() : '',
                password: p ? p.value : ''
            };
        }

        const usernameInput = loginForm.querySelector('input[placeholder="Username"], input[type="text"], input:not([type="password"])');
        const passwordInput = loginForm.querySelector('#userPassword, input[type="password"]');

        return {
            username: usernameInput ? usernameInput.value.trim() : '',
            password: passwordInput ? passwordInput.value : ''
        };
    };

    const handleLogin = async (e) => {
        if (e) e.preventDefault();

        const { username, password } = getUsernamePassword();
        console.log('Login inputs:', { username, password: password ? '***' : '' });

        // Validate inputs
        if (username === '' || password === '') {
            alert('Please fill in all fields.');
            return;
        }

        // Show loading state
        const submitBtn = (signInBtn && signInBtn.closest && signInBtn.closest('form')) ? signInBtn : (loginForm ? loginForm.querySelector('.btn-sign-in') : null);
        const originalText = submitBtn ? submitBtn.innerText : '';

        if (submitBtn) {
            submitBtn.innerText = 'Signing in...';
            submitBtn.disabled = true;
        }

        try {
            const result = await AuthService.login(username, password);
            console.log('AuthService.login result:', result);

            if (submitBtn) {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }

            if (result && result.success) {
                alert('Login Successful! Welcome to SwiftX, ' + result.user.name);
                window.location.href = "../index.html/home.html";
            } else {
                alert((result && result.message) ? result.message : 'Maling username o password. Subukan muli.');
            }
        } catch (err) {
            console.error('Login submission error:', err);
            if (submitBtn) {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }
            alert('Login failed. Please try again.');
        }
    };

    if (loginForm) {
        // Enter key / default submit within form
        loginForm.addEventListener('submit', handleLogin);

        // Extra safety: button click
        if (signInBtn) signInBtn.addEventListener('click', handleLogin);
    } else {
        // Fallback safety (if form not found)
        if (signInBtn) signInBtn.addEventListener('click', handleLogin);
    }

    // =============================================================
    // 3. TERMS & CONDITIONS MODAL CONTROLLER
    // =============================================================
    const modal = document.getElementById('termsModal');
    const btn = document.getElementById('openTerms');
    const closeBtn = document.querySelector('.close-button');

    if (btn && modal) {
        btn.onclick = function () {
            modal.style.display = 'block';
        };
    }

    if (closeBtn && modal) {
        closeBtn.onclick = function () {
            modal.style.display = 'none';
        };
    }

    // =============================================================
    // 4. HELP CENTER MODAL CONTROLLER (BAGO)
    // =============================================================
    const helpModal = document.getElementById('helpCenterModal');
    const openHelpLink = document.getElementById('openHelpLink');
    const closeHelpBtn = document.getElementById('closeHelpBtn');

    // Buksan ang Help Center kapag tinap ang "Need Help?" sa iyong footer links
    if (openHelpLink && helpModal) {
        openHelpLink.onclick = function (e) {
            e.preventDefault(); // Pipigilan ang '# anchor' jumping behavior
            helpModal.style.display = 'flex'; // Ginamit ang flex para laging nasa absolute center ng screen
        };
    }

    // Isara ang Help Center gamit ang sarili nitong overlay custom button (X)
    if (closeHelpBtn && helpModal) {
        closeHelpBtn.onclick = function () {
            helpModal.style.display = 'none';
        };
    }

    // =============================================================
    // GLOBAL OUTSIDE MODAL CLICK CLOSER
    // (Pinagsama ang logic para sa Terms at Help Modal)
    // =============================================================
    window.onclick = function (event) {
        // Kung iclick ang labas ng Terms Modal, isara ito
        if (event.target == modal) {
            modal.style.display = 'none';
        }
        // Kung iclick ang labas ng Help Modal, isara naman ito
        if (event.target == helpModal) {
            helpModal.style.display = 'none';
        }
    };
});
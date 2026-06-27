document.addEventListener('DOMContentLoaded', () => {

    // =============================================================
    // 1. PASSWORD SHOW/HIDE ICON CONTROLLER
    // =============================================================
    const passwordInput = document.getElementById('userPassword');
    const togglePasswordIcon = document.getElementById('togglePasswordIcon');

    if (togglePasswordIcon && passwordInput) {
        togglePasswordIcon.addEventListener('click', () => {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                togglePasswordIcon.classList.remove('ph-eye-slash');
                togglePasswordIcon.classList.add('ph-eye');
            } else {
                passwordInput.type = 'password';
                togglePasswordIcon.classList.remove('ph-eye');
                togglePasswordIcon.classList.add('ph-eye-slash');
            }
        });
    }

    // =============================================================
    // 2. LOGIN FORM SUBMISSION CONTROLLER (MVC INTEGRATED)
    // =============================================================
    const loginForm = document.getElementById('loginForm');
    const signInBtn = document.getElementById('signInBtn'); // 🎯 Tip: Give your login button this explicit ID in HTML

    const handleLogin = async (e) => {
        if (e) e.preventDefault(); // Prevents traditional page reloading loops

        // Pull inputs securely directly from our target elements
        const usernameInput = document.querySelector('input[name="Username"], input[type="text"]');
        const passwordInput = document.querySelector('input[name="Password"], input[type="password"]');

        const username = usernameInput ? usernameInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';

        // Standard validation check
        if (username === '' || password === '') {
            alert('Please fill in all fields.');
            return;
        }

        // Show loading presentation states cleanly
        const submitBtn = signInBtn || (loginForm ? loginForm.querySelector('button[type="submit"]') : null);
        const originalText = submitBtn ? submitBtn.innerText : 'Sign In';

        if (submitBtn) {
            submitBtn.innerText = 'Signing in...';
            submitBtn.disabled = true;
        }

        try {
            // 🎯 MVC BACKEND PIPELINE CONNECTION
            // Points to your dedicated authentication controller endpoint layout
            const response = await fetch('/auth/Login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ Username: username, Password: password })
            });

            const result = await response.json();

            if (submitBtn) {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }

            if (result && result.success) {
                window.location.href = result.redirectUrl || 'CustomerHome';
            } else {
                alert(result.message || 'Maling username o password. Subukan muli.');
            }
        } catch (err) {
            console.error('Backend API transmission breakdown:', err);
            if (submitBtn) {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            }
            alert('Login failed due to a server connection error. Please try again.');
        }
    };

    if (loginForm) {
        // 🎯 FIXED: We exclusively bind to the form submission. 
        // This naturally catches both button clicks and hitting "Enter" cleanly without double-posting!
        loginForm.addEventListener('submit', handleLogin);
    } else if (signInBtn) {
        // Fallback fallback if layout doesn't use standard form containers
        signInBtn.addEventListener('click', handleLogin);
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
    // 4. HELP CENTER MODAL CONTROLLER 
    // =============================================================
    const helpModal = document.getElementById('helpCenterModal');
    const openHelpLink = document.getElementById('openHelpLink');
    const closeHelpBtn = document.getElementById('closeHelpBtn');

    if (openHelpLink && helpModal) {
        openHelpLink.onclick = function (e) {
            e.preventDefault();
            helpModal.style.display = 'flex';
        };
    }

    if (closeHelpBtn && helpModal) {
        closeHelpBtn.onclick = function () {
            helpModal.style.display = 'none';
        };
    }

    // =============================================================
    // GLOBAL OUTSIDE MODAL CLICK CLOSER
    // =============================================================
    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
        if (event.target == helpModal) {
            helpModal.style.display = 'none';
        }
    };
});
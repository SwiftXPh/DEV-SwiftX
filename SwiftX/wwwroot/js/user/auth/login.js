
document.addEventListener('DOMContentLoaded', () => {

    // ══════════════════════════════════════════════════════════
    // 1. PASSWORD TOGGLE
    // Uses two-icon swap (ph-eye / ph-eye-slash) matching admin
    // pattern. Called by onclick on the toggle button, passing
    // the input ID and the button element itself.
    // ══════════════════════════════════════════════════════════

    function togglePasswordVisibility(inputId, btnElement) {
        const input = document.getElementById(inputId);
        const eyeOpen = btnElement.querySelector('.eye-open');
        const eyeClosed = btnElement.querySelector('.eye-closed');
        if (!input) return;

        if (input.type === 'password') {
            input.type = 'text';
            eyeOpen?.classList.add('hidden');
            eyeClosed?.classList.remove('hidden');
        } else {
            input.type = 'password';
            eyeOpen?.classList.remove('hidden');
            eyeClosed?.classList.add('hidden');
        }
    }

    window.togglePassword = togglePasswordVisibility;


    //LOGIN FORM SUBMISSION

    const loginForm = document.getElementById('loginForm');
    const submitBtn = document.getElementById('signInBtn')
        ?? loginForm?.querySelector('button[type="submit"]');

    const handleLogin = async (e) => {
        if (e) e.preventDefault();

        const usernameInput = document.querySelector('input[name="Username"]');
        const passwordInput = document.querySelector('input[name="Password"]');

        const username = usernameInput?.value.trim() ?? '';
        const password = passwordInput?.value ?? '';

        if (!username || !password) {
            alert('Please fill in all fields.');
            return;
        }

        const btnText = submitBtn?.querySelector('.btn-login-text');
        const btnLoader = submitBtn?.querySelector('.btn-login-loader');

        if (submitBtn) {
            submitBtn.disabled = true;
            btnText?.classList.add('hidden');
            btnLoader?.classList.remove('hidden');
        }

        try {
            const csrfToken = document.querySelector('input[name="__RequestVerificationToken"]')?.value || '';
            const response = await fetch('/Auth/Login', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'RequestVerificationToken': csrfToken
                },
                body: JSON.stringify({ Username: username, Password: password })
            });

            const result = await response.json();

            if (submitBtn) {
                submitBtn.disabled = false;
                btnText?.classList.remove('hidden');
                btnLoader?.classList.add('hidden');
            }

            if (result?.success) {
                window.location.href = result.redirectUrl || '/Customer/CustomerHome';
            } else {
                alert(result?.message || 'Maling username o password. Subukan muli.');
            }
        } catch (err) {
            console.error('Login error:', err);
            if (submitBtn) {
                submitBtn.disabled = false;
                btnText?.classList.remove('hidden');
                btnLoader?.classList.add('hidden');
            }
            alert('Login failed due to a server error. Please try again.');
        }
    };

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }


    // TERMS & CONDITIONS MODAL

    const termsModal = document.getElementById('termsModal');
    const openTerms = document.getElementById('openTerms');
    const closeTerms = document.getElementById('closeTermsBtn');

    openTerms?.addEventListener('click', (e) => {
        e.preventDefault();
        termsModal.style.display = 'flex';
    });

    closeTerms?.addEventListener('click', () => {
        termsModal.style.display = 'none';
    });


    //HELP CENTER MODAL

    const helpModal = document.getElementById('helpCenterModal');
    const openHelpLink = document.getElementById('openHelpLink');
    const closeHelpBtn = document.getElementById('closeHelpBtn');

    openHelpLink?.addEventListener('click', (e) => {
        e.preventDefault();
        helpModal.style.display = 'flex';
    });

    closeHelpBtn?.addEventListener('click', () => {
        helpModal.style.display = 'none';
    });


    // BACKDROP CLICK + ESCAPE TO CLOSE

    window.addEventListener('click', (e) => {
        if (termsModal && e.target === termsModal) termsModal.style.display = 'none';
        if (helpModal && e.target === helpModal) helpModal.style.display = 'none';
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (termsModal?.style.display === 'flex') termsModal.style.display = 'none';
        if (helpModal?.style.display === 'flex') helpModal.style.display = 'none';
    });

});


document.addEventListener('DOMContentLoaded', () => {

    // ══════════════════════════════════════════════════════════
    // 1. PASSWORD TOGGLE
    // Two-icon swap matching admin pattern (eye-open / eye-closed)
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



    // TERMS & CONDITIONS MODAL

    const termsModal = document.getElementById('termsModal');
    const openTermsLink = document.getElementById('openTermsLink');
    const closeTermsBtn = document.getElementById('closeTermsBtn');

    openTermsLink?.addEventListener('click', (e) => {
        e.preventDefault();
        termsModal.style.display = 'flex';
    });

    closeTermsBtn?.addEventListener('click', () => {
        termsModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (termsModal && e.target === termsModal) termsModal.style.display = 'none';
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && termsModal?.style.display === 'flex') {
            termsModal.style.display = 'none';
        }
    });


    //. REGISTRATION FORM SUBMISSION

    const registrationForm = document.getElementById('registrationForm');

    if (registrationForm) {
        registrationForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const username = document.getElementById('username')?.value.trim() ?? '';
            const fullName = document.getElementById('fullName')?.value.trim() ?? '';
            const phoneNumber = document.getElementById('phoneNumber')?.value.trim() ?? '';
            const email = document.getElementById('email')?.value.trim() ?? '';
            const gender = document.getElementById('gender')?.value ?? '';
            const birthdate = document.getElementById('birthdate')?.value ?? '';
            const password = document.getElementById('password')?.value ?? '';
            const confirmPassword = document.getElementById('confirmPassword')?.value ?? '';

            if (!/^[0-9]{10}$/.test(phoneNumber)) {
                alert('Please enter a valid 10-digit phone number (e.g. 9XXXXXXXXX).');
                return;
            }

            if (password !== confirmPassword) {
                alert('Passwords do not match. Please try again.');
                return;
            }

            const payload = {
                Username: username,
                FullName: fullName,
                PhoneNumber: phoneNumber,
                Email: email,
                Gender: gender,
                Birthdate: birthdate,
                Password: password,
                ConfirmPassword: confirmPassword
            };

            const submitBtn = this.querySelector('button[type="submit"]');
            const btnText = submitBtn?.querySelector('.btn-login-text');
            const btnLoader = submitBtn?.querySelector('.btn-login-loader');

            if (submitBtn) {
                submitBtn.disabled = true;
                btnText?.classList.add('hidden');
                btnLoader?.classList.remove('hidden');
            }

            try {
                const response = await fetch('/Auth/Register', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                let result;
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    result = await response.json();
                } else {
                    if (response.status === 400) {
                        throw new Error("Your session has expired or the token is invalid. Please refresh the page and try again.");
                    } else {
                        throw new Error(`Server returned unexpected status: ${response.status}`);
                    }
                }

                if (submitBtn) {
                    submitBtn.disabled = false;
                    btnText?.classList.remove('hidden');
                    btnLoader?.classList.add('hidden');
                }

                if (result?.success) {
                    alert(result.message || 'Registration successful!');
                    window.location.href = result.redirectUrl || '/Auth/Login';
                } else {
                    alert(result?.message || 'Registration failed. Please try again.');
                }
            } catch (error) {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    btnText?.classList.remove('hidden');
                    btnLoader?.classList.add('hidden');
                }
                console.error('Registration error:', error);
                alert(error.message || 'An error occurred. Please try again later.');
            }
        });
    }


    //CLOSE CARD BUTTON

    const closeBtn = document.querySelector('.reg-close-btn');

    closeBtn?.addEventListener('click', () => {
        window.location.href = '/Auth/Login';
    });

});
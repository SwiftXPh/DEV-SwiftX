// forgot-email.js — v1.0.0
// ForgotPasswordEmail.cshtml — email entry step

document.addEventListener('DOMContentLoaded', () => {

    const form    = document.getElementById('emailForm');
    const backBtn = document.getElementById('fpBackBtn');


    // ══════════════════════════════════════════════════════════
    // BACK BUTTON
    // ══════════════════════════════════════════════════════════
    backBtn?.addEventListener('click', () => {
        window.history.back();
    });


    // ══════════════════════════════════════════════════════════
    // FORM SUBMISSION
    // ══════════════════════════════════════════════════════════
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const emailInput = document.getElementById('emailInput');
        const email      = emailInput?.value.trim() ?? '';

        if (!email) {
            AlertModal.show({
                type    : 'warning',
                title   : 'Email Required',
                message : 'Please enter your email address before proceeding.',
                buttons : [{ label: 'OK', variant: 'ghost' }]
            });
            return;
        }

        // Store for the OTP page to display
        localStorage.setItem('userResetEmail', email);

        const submitBtn    = form.querySelector('.fp-btn');
        const originalText = submitBtn?.textContent ?? 'Next';

        if (submitBtn) {
            submitBtn.disabled    = true;
            submitBtn.textContent = 'Sending...';
        }

        try {
            // TODO: wire to real backend endpoint
            // const res    = await fetch('/Auth/ForgotPassword', {
            //     method  : 'POST',
            //     headers : { 'Content-Type': 'application/json' },
            //     body    : JSON.stringify({ email })
            // });
            // const result = await res.json();
            // if (!res.ok) throw new Error(result.message || 'Request failed.');

            // Redirect to OTP verification step
            window.location.href = 'ForgotPasswordOTP';

        } catch (err) {
            console.error('Forgot password request failed:', err);
            AlertModal.show({
                type    : 'danger',
                title   : 'Request Failed',
                message : err.message || 'Something went wrong. Please try again.',
                buttons : [{ label: 'OK', variant: 'danger' }]
            });
        } finally {
            if (submitBtn) {
                submitBtn.disabled    = false;
                submitBtn.textContent = originalText;
            }
        }
    });

});

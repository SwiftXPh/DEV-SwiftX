// change-password.js — v1.0.0
// ChangePassword.cshtml — post-OTP password reset step

// ══════════════════════════════════════════════════════════
// PASSWORD TOGGLE
// Single icon swap — matches onclick="togglePassword(id, this)"
// on the toggle button in the HTML.
// ══════════════════════════════════════════════════════════
function togglePassword(inputId, btnElement) {
    const input = document.getElementById(inputId);
    const icon  = btnElement.querySelector('i');
    if (!input || !icon) return;

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('ph-eye-slash', 'ph-eye');
    } else {
        input.type = 'password';
        icon.classList.replace('ph-eye', 'ph-eye-slash');
    }
}

window.togglePassword = togglePassword;


document.addEventListener('DOMContentLoaded', () => {

    const form    = document.getElementById('passwordForm');
    const backBtn = document.getElementById('cpBackBtn');


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

        const newPassword     = document.getElementById('newPassword')?.value     ?? '';
        const confirmPassword = document.getElementById('confirmPassword')?.value ?? '';

        if (!newPassword || !confirmPassword) {
            AlertModal.show({
                type    : 'warning',
                title   : 'Missing Fields',
                message : 'Please fill in both password fields before saving.',
                buttons : [{ label: 'OK', variant: 'ghost' }]
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            AlertModal.show({
                type    : 'danger',
                title   : 'Passwords Don\'t Match',
                message : 'The passwords you entered do not match. Please try again.',
                buttons : [{ label: 'OK', variant: 'danger' }]
            });
            return;
        }

        const submitBtn    = form.querySelector('.fp-btn');
        const originalText = submitBtn?.textContent ?? 'Save Password';

        if (submitBtn) {
            submitBtn.disabled    = true;
            submitBtn.textContent = 'Saving...';
        }

        try {
            const resetToken = localStorage.getItem('reset_token') ?? '';

            // TODO: wire to real backend endpoint
            // const res    = await fetch('/Auth/ResetPassword', {
            //     method  : 'POST',
            //     headers : { 'Content-Type': 'application/json' },
            //     body    : JSON.stringify({ token: resetToken, newPassword })
            // });
            // const result = await res.json();
            // if (!res.ok) throw new Error(result.message || 'Password reset failed.');

            // Housekeeping — clear reset session data
            localStorage.removeItem('reset_token');
            localStorage.removeItem('userResetEmail');

            form.reset();

            AlertModal.show({
                type    : 'success',
                title   : 'Password Changed',
                message : 'Your password has been updated successfully. Please sign in with your new password.',
                buttons : [
                    {
                        label    : 'Sign In',
                        variant  : 'success',
                        callback : () => { window.location.href = 'UserLogin'; }
                    }
                ]
            });

        } catch (err) {
            console.error('Password reset failed:', err);
            AlertModal.show({
                type    : 'danger',
                title   : 'Reset Failed',
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

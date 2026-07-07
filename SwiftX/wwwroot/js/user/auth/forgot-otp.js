// forgot-otp.js — v1.0.0
// ForgotPasswordOTP.cshtml — OTP verification step

document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('verifyForm');
    const backBtn = document.getElementById('fpBackBtn');
    const resendBtn = document.getElementById('resendBtn');
    const statusMsg = document.getElementById('otpStatusMsg');


    // ══════════════════════════════════════════════════════════
    // SHOW EMAIL IN STATUS MESSAGE
    // ══════════════════════════════════════════════════════════
    const savedEmail = localStorage.getItem('userResetEmail');
    if (savedEmail && statusMsg) {
        statusMsg.textContent = `A code was sent to ${savedEmail}`;
    }


    // ══════════════════════════════════════════════════════════
    // BACK BUTTON
    // ══════════════════════════════════════════════════════════
    backBtn?.addEventListener('click', () => {
        window.history.back();
    });


    // ══════════════════════════════════════════════════════════
    // OTP FORM SUBMISSION
    // ══════════════════════════════════════════════════════════
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const otpValue = document.getElementById('otpInput')?.value.trim() ?? '';
        const email = localStorage.getItem('userResetEmail') ?? '';

        if (otpValue.length !== 6) {
            AlertModal.show({
                type: 'warning',
                title: 'Invalid OTP',
                message: 'Please enter a complete 6-digit OTP code.',
                buttons: [{ label: 'OK', variant: 'ghost' }]
            });
            return;
        }

        if (!email) {
            AlertModal.show({
                type: 'warning',
                title: 'Missing Email',
                message: 'Your session has expired. Please go back and request a new OTP.',
                buttons: [
                    {
                        label: 'Go Back',
                        variant: 'ghost',
                        callback: () => window.history.back()
                    }
                ]
            });
            return;
        }

        const submitBtn = form.querySelector('.fp-btn');
        const originalText = submitBtn?.textContent ?? 'Verify';

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Verifying...';
        }

        try {
            // TODO: replace with real API call when backend is ready
            // const res  = await fetch(API_CONFIG.BASE_URL + '/auth/verify-email/otp/verify', {
            //     method  : 'POST',
            //     headers : { 'Content-Type': 'application/json' },
            //     body    : JSON.stringify({ otp: otpValue, email })
            // });
            // if (!res.ok) {
            //     const err = await res.json().catch(() => null);
            //     throw new Error(err?.message || 'OTP verification failed.');
            // }
            // const data = await res.json().catch(() => ({}));
            // if (data?.token || data?.resetToken) {
            //     localStorage.setItem('reset_token', data.token || data.resetToken);
            // }

            AlertModal.show({
                type: 'success',
                title: 'OTP Verified',
                message: 'Your identity has been confirmed. Please set your new password.',
                buttons: [
                    {
                        label: 'Continue',
                        variant: 'success',
                        callback: () => {
                            window.location.href = 'ChangePassword';
                        }
                    }
                ]
            });

        } catch (err) {
            console.error('OTP verification failed:', err);
            AlertModal.show({
                type: 'danger',
                title: 'Verification Failed',
                message: err.message || 'The OTP you entered is incorrect or has expired.',
                buttons: [{ label: 'OK', variant: 'danger' }]
            });
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
    });


    // ══════════════════════════════════════════════════════════
    // RESEND OTP
    // ══════════════════════════════════════════════════════════
    resendBtn?.addEventListener('click', async (e) => {
        e.preventDefault();

        const email = localStorage.getItem('userResetEmail') ?? '';

        if (!email) {
            AlertModal.show({
                type: 'warning',
                title: 'Missing Email',
                message: 'Your session has expired. Please go back and enter your email again.',
                buttons: [
                    {
                        label: 'Go Back',
                        variant: 'ghost',
                        callback: () => window.history.back()
                    }
                ]
            });
            return;
        }

        const originalText = resendBtn.textContent;
        resendBtn.disabled = true;
        resendBtn.textContent = 'Sending...';

        try {
            // TODO: replace with real API call when backend is ready
            // const res = await fetch(API_CONFIG.BASE_URL + '/auth/verify-email/otp/resend', {
            //     method  : 'POST',
            //     headers : { 'Content-Type': 'application/json' },
            //     body    : JSON.stringify({ email })
            // });
            // if (!res.ok) {
            //     const err = await res.json().catch(() => null);
            //     throw new Error(err?.message || 'Resend failed.');
            // }

            AlertModal.show({
                type: 'success',
                title: 'OTP Resent',
                message: `A fresh OTP has been sent to ${email}.`,
                buttons: [{ label: 'OK', variant: 'success' }]
            });

        } catch (err) {
            console.error('OTP resend failed:', err);
            AlertModal.show({
                type: 'danger',
                title: 'Resend Failed',
                message: err.message || 'Could not resend the OTP. Please try again.',
                buttons: [{ label: 'OK', variant: 'danger' }]
            });
        } finally {
            resendBtn.disabled = false;
            resendBtn.textContent = originalText;
        }
    });

});
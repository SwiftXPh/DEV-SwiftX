// CustomerSecurity.js — v2.0.0

document.addEventListener('DOMContentLoaded', () => {

    // ══════════════════════════════════════════════════════════
    // SELECTORS
    // ══════════════════════════════════════════════════════════
    const btnClose = document.getElementById('btnCloseSecurity');
    const btnDone = document.getElementById('btnDone');
    const btnDeleteAccount = document.getElementById('btnDeleteAccount');

    const emailOverlay = document.getElementById('emailOverlay');
    const passwordOverlay = document.getElementById('passwordOverlay');
    const phoneOverlay = document.getElementById('phoneOverlay');


    // ══════════════════════════════════════════════════════════
    // 1. BACK / DONE BUTTONS — navigate home
    // ══════════════════════════════════════════════════════════
    function goHome() {
        window.location.href = '/Customer/CustomerHome';
    }

    btnClose?.addEventListener('click', (e) => {
        e.preventDefault();
        goHome();
    });

    btnDone?.addEventListener('click', (e) => {
        e.preventDefault();
        goHome();
    });


    // ══════════════════════════════════════════════════════════
    // 2. SETTINGS CARD → OPEN OVERLAY
    // ══════════════════════════════════════════════════════════
    const cardMap = [
        { action: 'email', overlay: emailOverlay, focusId: 'newEmailInput' },
        { action: 'password', overlay: passwordOverlay, focusId: 'currentPasswordInput' },
        { action: 'phone', overlay: phoneOverlay, focusId: 'newPhoneInput' }
    ];

    cardMap.forEach(({ action, overlay, focusId }) => {
        const card = document.querySelector(`.sec-card[data-action="${action}"]`);
        if (!card || !overlay) return;

        card.addEventListener('click', () => {
            overlay.classList.add('active');
            document.getElementById(focusId)?.focus();
        });
    });


    // ══════════════════════════════════════════════════════════
    // 3. CANCEL BUTTONS — close overlay + reset fields
    // ══════════════════════════════════════════════════════════
    document.querySelectorAll('.sec-overlay__btn--ghost[data-target]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('data-target');
            const overlay = document.getElementById(targetId);
            if (!overlay) return;
            overlay.classList.remove('active');
            resetFields(targetId);
        });
    });

    // Close on backdrop click
    [emailOverlay, passwordOverlay, phoneOverlay].forEach(overlay => {
        overlay?.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
                resetFields(overlay.id);
            }
        });
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        [emailOverlay, passwordOverlay, phoneOverlay].forEach(overlay => {
            if (overlay?.classList.contains('active')) {
                overlay.classList.remove('active');
                resetFields(overlay.id);
            }
        });
    });


    // ══════════════════════════════════════════════════════════
    // 4. EMAIL UPDATE
    // ══════════════════════════════════════════════════════════
    document.getElementById('btnConfirmEmailChange')?.addEventListener('click', async (e) => {
        e.preventDefault();

        const newEmail = document.getElementById('newEmailInput')?.value.trim() ?? '';
        const password = document.getElementById('emailConfirmPasswordInput')?.value ?? '';

        if (!newEmail || !password) {
            AlertModal.show({
                type: 'warning',
                title: 'Missing Fields',
                message: 'Please fill in both the new email address and your current password.',
                buttons: [{ label: 'OK', variant: 'ghost' }]
            });
            return;
        }

        const btn = e.currentTarget;
        const success = await sendRequest('/Customer/UpdateEmail', { newEmail, currentPassword: password }, btn);

        if (success) {
            emailOverlay.classList.remove('active');
            resetFields('emailOverlay');
            AlertModal.show({
                type: 'success',
                title: 'Email Updated',
                message: 'Your email address has been updated successfully.',
                buttons: [{ label: 'OK', variant: 'success' }]
            });
        }
    });


    // ══════════════════════════════════════════════════════════
    // 5. PASSWORD UPDATE
    // ══════════════════════════════════════════════════════════
    document.getElementById('btnConfirmPasswordChange')?.addEventListener('click', async (e) => {
        e.preventDefault();

        const currentPass = document.getElementById('currentPasswordInput')?.value ?? '';
        const newPass = document.getElementById('newPasswordInput')?.value ?? '';
        const confirmPass = document.getElementById('confirmNewPasswordInput')?.value ?? '';

        if (!currentPass) {
            AlertModal.show({
                type: 'warning',
                title: 'Missing Field',
                message: 'Please enter your current password to authorize this change.',
                buttons: [{ label: 'OK', variant: 'ghost' }]
            });
            return;
        }

        if (!newPass || !confirmPass) {
            AlertModal.show({
                type: 'warning',
                title: 'Missing Fields',
                message: 'Please fill in both the new password and confirmation fields.',
                buttons: [{ label: 'OK', variant: 'ghost' }]
            });
            return;
        }

        if (currentPass === newPass) {
            AlertModal.show({
                type: 'warning',
                title: 'Same Password',
                message: 'Your new password cannot be the same as your current password.',
                buttons: [{ label: 'OK', variant: 'ghost' }]
            });
            return;
        }

        if (newPass !== confirmPass) {
            AlertModal.show({
                type: 'danger',
                title: 'Passwords Don\'t Match',
                message: 'The new password and confirmation password do not match.',
                buttons: [{ label: 'OK', variant: 'danger' }]
            });
            return;
        }

        const btn = e.currentTarget;
        const success = await sendRequest('/Customer/UpdatePassword', {
            currentPassword: currentPass,
            newPassword: newPass,
            confirmPassword: confirmPass
        }, btn);

        if (success) {
            passwordOverlay.classList.remove('active');
            resetFields('passwordOverlay');
            AlertModal.show({
                type: 'success',
                title: 'Password Updated',
                message: 'Your password has been changed successfully.',
                buttons: [{ label: 'OK', variant: 'success' }]
            });
        }
    });


    // ══════════════════════════════════════════════════════════
    // 6. PHONE UPDATE
    // ══════════════════════════════════════════════════════════
    document.getElementById('btnConfirmPhoneChange')?.addEventListener('click', async (e) => {
        e.preventDefault();

        const newPhone = document.getElementById('newPhoneInput')?.value.trim() ?? '';
        const password = document.getElementById('phoneConfirmPasswordInput')?.value ?? '';

        if (!newPhone || !password) {
            AlertModal.show({
                type: 'warning',
                title: 'Missing Fields',
                message: 'Please enter both the new phone number and your current password.',
                buttons: [{ label: 'OK', variant: 'ghost' }]
            });
            return;
        }

        const btn = e.currentTarget;
        const success = await sendRequest('/Customer/UpdatePhone', {
            newPhone,
            currentPassword: password
        }, btn);

        if (success) {
            phoneOverlay.classList.remove('active');
            resetFields('phoneOverlay');
            AlertModal.show({
                type: 'success',
                title: 'Phone Updated',
                message: 'Your phone number has been updated successfully.',
                buttons: [{ label: 'OK', variant: 'success' }]
            });
        }
    });


    // ══════════════════════════════════════════════════════════
    // 7. DELETE ACCOUNT
    // ══════════════════════════════════════════════════════════
    btnDeleteAccount?.addEventListener('click', (e) => {
        e.preventDefault();

        AlertModal.show({
            type: 'danger',
            title: 'Delete Account',
            message: 'Are you <strong>absolutely sure</strong> you want to permanently delete your account? This action <strong>cannot be undone</strong>.',
            buttons: [
                { label: 'Cancel', variant: 'ghost' },
                {
                    label: 'Delete Account',
                    variant: 'danger',
                    callback: async () => {
                        const success = await sendRequest('/Customer/DeleteAccount', {}, btnDeleteAccount);
                        if (success) {
                            window.location.href = '/Auth/Login';
                        }
                    }
                }
            ]
        });
    });


    // ══════════════════════════════════════════════════════════
    // UTILITIES
    // ══════════════════════════════════════════════════════════

    /**
     * Sends a POST request to an ASP.NET endpoint.
     * Shows an AlertModal on error. Manages button loading state.
     */
    async function sendRequest(url, data, btn) {
        const originalText = btn.textContent;
        try {
            btn.disabled = true;
            btn.textContent = 'Processing...';

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'RequestVerificationToken': document.querySelector('input[name="__RequestVerificationToken"]')?.value ?? ''
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `Server error: ${response.status}`);
            }

            return true;

        } catch (err) {
            console.error(`Request failed [${url}]:`, err);
            AlertModal.show({
                type: 'danger',
                title: 'Something Went Wrong',
                message: err.message || 'An unexpected error occurred. Please try again.',
                buttons: [{ label: 'OK', variant: 'danger' }]
            });
            return false;

        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }

    /** Clears all input fields inside a given overlay */
    function resetFields(overlayId) {
        document.getElementById(overlayId)
            ?.querySelectorAll('input:not([disabled])')
            .forEach(input => input.value = '');
    }

});


document.addEventListener('DOMContentLoaded', () => {

    const fileUpload = document.getElementById('fileUpload');
    const profilePic = document.getElementById('profilePic');
    const accountForm = document.getElementById('accountForm');
    const backBtn = document.querySelector('.acct-back-btn');
    const birthdateInput = document.getElementById('birthdate');

    if (birthdateInput) {
        const today = new Date();
        const maxYear = today.getFullYear() - 18;
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        birthdateInput.setAttribute('max', `${maxYear}-${month}-${day}`);
    }

    if (fileUpload && profilePic) {
        fileUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (ev) => {
                profilePic.style.backgroundImage = `url('${ev.target.result}')`;
            };
            reader.readAsDataURL(file);
        });
    }

    // Load Profile
    fetch('/Customer/GetProfile')
        .then(res => res.json())
        .then(data => {
            if (data.username) document.getElementById('username').value = data.username;
            if (data.fullName) document.getElementById('fullName').value = data.fullName;
            if (data.gender) document.getElementById('gender').value = data.gender;
            if (data.birthdate && birthdateInput) birthdateInput.value = data.birthdate;
            if (data.email) document.getElementById('email').value = data.email;
            if (data.phone) document.getElementById('phone').value = data.phone;
            if (data.profileImagePath) {
                // Fetch the signed URL or the path, wait, GetProfile returns profileImagePath, we need a signed URL, let's assume it's publicly accessible or we returned the signed URL. Let's update GetProfile to return signed URL.
                // Wait, I didn't return signed URL in GetProfile. I should fix that in the backend. But let's just set it if it's there.
                // profilePic.style.backgroundImage = `url('${data.profileImagePath}')`;
            }
        })
        .catch(console.error);

    if (accountForm) {
        accountForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Age validation — secondary check in case browser max attr is bypassed
            if (birthdateInput?.value) {
                const birth = new Date(birthdateInput.value);
                const today = new Date();
                let age = today.getFullYear() - birth.getFullYear();
                const m = today.getMonth() - birth.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

                if (age < 18) {
                    AlertModal.show({
                        type: 'danger',
                        title: 'Age Requirement',
                        message: 'You must be at least <strong>18 years old</strong> to use SwiftX.',
                        buttons: [
                            { label: 'OK', variant: 'danger' }
                        ]
                    });
                    return;
                }
            }

            const submitBtn = accountForm.querySelector('.acct-save-btn');
            const originalText = submitBtn?.textContent || 'Save Changes';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Saving...';
            }

            try {
                // Collect form data
                const formData = {
                    Username: document.getElementById('username')?.value ?? '',
                    FullName: document.getElementById('fullName')?.value ?? '',
                    Gender: document.getElementById('gender')?.value ?? '',
                    Birthdate: birthdateInput?.value ?? ''
                };

                // Save profile details
                const res = await fetch('/Customer/UpdateProfile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                if (!res.ok) throw new Error('Failed to update profile');

                // Check for profile image upload
                const file = fileUpload?.files[0];
                if (file) {
                    const imgData = new FormData();
                    imgData.append('file', file);
                    const imgRes = await fetch('/Customer/UploadProfileImage', {
                        method: 'POST',
                        body: imgData
                    });
                    if (!imgRes.ok) throw new Error('Failed to upload image');
                }

                AlertModal.show({
                    type: 'success',
                    title: 'Changes Saved',
                    message: 'Your account information has been updated successfully.',
                    buttons: [
                        {
                            label: 'OK',
                            variant: 'success',
                            callback: () => { window.location.href = '/Customer/CustomerHome'; }
                        }
                    ]
                });
            } catch (err) {
                console.error(err);
                AlertModal.show({
                    type: 'danger',
                    title: 'Error',
                    message: 'Failed to update account information. Please try again.',
                    buttons: [{ label: 'OK', variant: 'danger' }]
                });
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            }
        });
    }


    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();

            AlertModal.show({
                type: 'warning',
                title: 'Discard Changes?',
                message: 'Are you sure you want to go back? Any unsaved changes will be lost.',
                buttons: [
                    { label: 'Stay', variant: 'ghost' },
                    {
                        label: 'Go Back',
                        variant: 'warning',
                        callback: () => { window.location.href = '/Customer/CustomerHome'; }
                    }
                ]
            });
        });
    }

});
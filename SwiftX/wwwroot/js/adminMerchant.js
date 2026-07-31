// ==========================================
// ELEMENTS & VARIABLES
// ==========================================
const overlay = document.getElementById('merchant-add-modal');
const form = document.getElementById('merchantForm');
const editIndexInput = document.getElementById('editIndex');
const logoInput = document.getElementById('businessLogo');
const logoUpload = document.getElementById('businessLogoUpload');
const logoText = document.getElementById('businessLogoText');
const logoError = document.getElementById('businessLogoError');
const logoPreview = document.getElementById('businessLogoPreview');

const MAX_MB = 10;
const MAX_BYTES = MAX_MB * 1024 * 1024;

// Logo upload — has-file state + 10MB limit (same MAX_MB pattern as
// rider_signup.js / merchant_signup.js)
if (logoInput) {
    logoInput.addEventListener('change', () => {
        const file = logoInput.files && logoInput.files[0];

        if (file && file.size > MAX_BYTES) {
            if (logoError) {
                logoError.textContent = `File too large — max ${MAX_MB} MB.`;
                logoError.classList.add('visible');
            }
            logoInput.value = ''; // clear so the oversized file can't submit
            logoUpload.classList.remove('has-file');
            logoText.textContent = 'Upload Photo';
            if (logoPreview) logoPreview.src = '';
            return;
        }

        if (logoError) {
            logoError.textContent = '';
            logoError.classList.remove('visible');
        }
        logoUpload.classList.toggle('has-file', !!file);
        logoText.textContent = file ? file.name : 'Upload Photo';

        // Build a thumbnail preview from the picked file (image/* only,
        // enforced by the input's accept attr + this guard)
        if (file && logoPreview) {
            const reader = new FileReader();
            reader.onload = (e) => {
                logoPreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        } else if (logoPreview) {
            logoPreview.src = '';
        }
    });
}

// Function para i-toggle ang visibility ng password
function togglePassword(inputId, icon) {
    const passwordInput = document.getElementById(inputId);
    
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        // Palitan ang icon sa 'open eye'
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    } else {
        passwordInput.type = "password";
        // Ibalik sa 'slashed eye'
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    }
}

// Hintayin muna matapos mag-load ang buong DOM bago patakbuhin ang event listeners
document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. TERMS & CONDITIONS MODAL LOGIC
    // ==========================================
    const termsModal = document.getElementById('termsModal');
    const openTermsLink = document.getElementById('openTermsLink');
    const closeTermsBtn = document.getElementById('closeTermsBtn');

    // Buksan ang modal kapag cliniclick ang "Terms and Conditions" link
    if (openTermsLink && termsModal) {
        openTermsLink.addEventListener('click', (e) => {
            e.preventDefault(); // Iwasan ang pagtalon ng page sa pinakataas
            termsModal.style.display = 'block';
        });
    }

    // Isara ang modal kapag cliniclick ang close (×) button sa loob ng modal
    if (closeTermsBtn && termsModal) {
        closeTermsBtn.addEventListener('click', () => {
            termsModal.style.display = 'none';
        });
    }

    // Isara ang modal kapag pinindot ang labas (dark background overlay) nito
    window.addEventListener('click', (e) => {
        if (e.target === termsModal) {
            termsModal.style.display = 'none';
        }
    });

    // ==========================================
    // 2. REGISTRATION FORM SUBMISSION LOGIC
    // ==========================================
    const registrationForm = document.getElementById('registrationForm');
    
    if (registrationForm) {
        registrationForm.addEventListener('submit', async function(e) {
            e.preventDefault(); // Iwasan ang default form submission

            // Collect form data
            const userData = {
                username: document.getElementById('username').value,
                name: document.getElementById('fullName').value,
                phone: document.getElementById('phoneNumber').value,
                email: document.getElementById('email').value,
                gender: document.getElementById('gender').value,
                birthdate: document.getElementById('birthdate').value,
                password: document.getElementById('password').value,
                confirmPassword: document.getElementById('confirmPassword').value
            };

            // Validate phone number format
            const phoneRegex = /^[0-9]{10}$/;
            if (!phoneRegex.test(userData.phone)) {
                alert("Please enter a valid 11-digit phone number.");
                return;
            }

            // Validate password match
            if (userData.password !== userData.confirmPassword) {
                alert("Passwords do not match! Please try again.");
                return;
            }

            // Remove confirmPassword before sending to API
            delete userData.confirmPassword;

            // Show loading state sa button
            const submitBtn = this.querySelector('.register-btn');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = 'Registering...';
            submitBtn.disabled = true;

            try {
                // Call AuthService register
                const result = await AuthService.register(userData);

                // Restore button state
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;

                if (result.success) {
                    alert(result.message);
                    window.location.href = "../index.html/login.html";
                } else {
                    alert(result.message || 'Registration failed. Please try again.');
                }
            } catch (error) {
                // Panigurado sakaling magka-error sa connection para hindi ma-stuck ang button
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
                console.error("Registration error:", error);
                alert("An error occurred. Please try again later.");
            }
        });
    }

    // ==========================================
    // 3. REGISTRATION CARD CLOSE BUTTON LOGIC
    // ==========================================
    const closeBtn = document.querySelector('.close-btn');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            window.location.href = "login.html";
        });
    }
});
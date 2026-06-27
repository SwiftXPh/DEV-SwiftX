// 🎯 MOVED INSIDE SCOPE: Re-declared within the handler to eliminate global window pollution
function togglePasswordVisibility(inputId, iconElement) {
    const passwordInput = document.getElementById(inputId);

    if (passwordInput && passwordInput.type === "password") {
        passwordInput.type = "text";
        // 🔄 FIX: Swapped FontAwesome over to match your project's Phosphor Icons design
        iconElement.classList.remove("ph-eye-slash");
        iconElement.classList.add("ph-eye");
    } else if (passwordInput) {
        passwordInput.type = "password";
        iconElement.classList.remove("ph-eye");
        iconElement.classList.add("ph-eye-slash");
    }
}

// Wait for the DOM structure layer to finish parsing
document.addEventListener('DOMContentLoaded', () => {

    // Bind eye toggle triggers cleanly to the domestic scope if your HTML calls them via inline clicks
    window.togglePassword = togglePasswordVisibility;

    // ==========================================
    // 1. TERMS & CONDITIONS MODAL LOGIC
    // ==========================================
    const termsModal = document.getElementById('termsModal');
    const openTermsLink = document.getElementById('openTermsLink');
    const closeTermsBtn = document.getElementById('closeTermsBtn');

    if (openTermsLink && termsModal) {
        openTermsLink.addEventListener('click', (e) => {
            e.preventDefault();
            termsModal.style.display = 'block';
        });
    }

    if (closeTermsBtn && termsModal) {
        closeTermsBtn.addEventListener('click', () => {
            termsModal.style.display = 'none';
        });
    }

    // ==========================================
    // 2. REGISTRATION FORM SUBMISSION LOGIC
    // ==========================================
    const registrationForm = document.getElementById('registrationForm');

    if (registrationForm) {
        registrationForm.addEventListener('submit', async function (e) {
            e.preventDefault(); // Lock default postback cycles out

            // Extract values directly from target DOM controls
            const username = document.getElementById('username').value.trim();
            const fullName = document.getElementById('fullName').value.trim();
            const phoneNumber = document.getElementById('phoneNumber').value.trim();
            const email = document.getElementById('email').value.trim();
            const gender = document.getElementById('gender').value;
            const birthdate = document.getElementById('birthdate').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            // Validate phone format input structure cleanly
            // 🧠 Note: Changed regex match boundary slightly if you expect a standard PH length setup
            const phoneRegex = /^[0-9]{10,11}$/;
            if (!phoneRegex.test(phoneNumber)) {
                alert("Please enter a valid phone number.");
                return;
            }

            // Validate password match conditions before hitting data pipeline channels
            if (password !== confirmPassword) {
                alert("Passwords do not match! Please try again.");
                return;
            }

            // Map data structure properties exactly to match your C# Backend DTO / Register Model tracking bindings
            const payload = {
                Username: username,
                FullName: fullName,
                PhoneNumber: phoneNumber,
                Email: email,
                Gender: gender,
                Birthdate: birthdate,
                Password: password
            };

            // Capture button loading states cleanly
            const submitBtn = this.querySelector('.register-btn');
            const originalText = submitBtn ? submitBtn.innerText : 'Register';

            if (submitBtn) {
                submitBtn.innerText = 'Registering...';
                submitBtn.disabled = true;
            }

            try {
                // 🎯 CONNECT TO REAL MVC BACKEND ROUTE PIPELINE
                // Points directly to your Auth or Account Controller dynamic target endpoint
                const response = await fetch('/Auth/Register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                // Restore interactive user element conditions
                if (submitBtn) {
                    submitBtn.innerText = originalText;
                    submitBtn.disabled = false;
                }

                if (result && result.success) {
                    alert(result.message || 'Registration successful!');
                    // Redirects to your standard application controller identity path view 
                    window.location.href = result.redirectUrl || '/Auth/Login';
                } else {
                    alert(result.message || 'Registration failed. Please try again.');
                }
            } catch (error) {
                if (submitBtn) {
                    submitBtn.innerText = originalText;
                    submitBtn.disabled = false;
                }
                console.error("Backend transmission data exception error:", error);
                alert("An error occurred connecting to the registration services. Please try again later.");
            }
        });
    }

    // ==========================================
    // 3. REGISTRATION CARD CLOSE BUTTON LOGIC
    // ==========================================
    const closeBtn = document.querySelector('.close-btn');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            // Points to your real server login destination pathway instead of static page strings
            window.location.href = 'UserLogin';
        });
    }

    // ==========================================
    // 4. BALANCED MODAL OVERLAY CLOSER
    // ==========================================
    window.addEventListener('click', (e) => {
        // Safe check evaluation to avoid hitting elements that aren't rendered or bound
        if (termsModal && e.target === termsModal) {
            termsModal.style.display = 'none';
        }
    });
});
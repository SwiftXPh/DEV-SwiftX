document.addEventListener('DOMContentLoaded', () => {
    const fileUpload = document.getElementById('fileUpload');
    const profilePic = document.getElementById('profilePic');
    const accountForm = document.getElementById('accountForm');
    const closeBtn = document.querySelector('.close-btn');
    const birthdateInput = document.getElementById('birthdate');

    // Dynamically calculate and restrict calendar to exactly 18 years ago today
    if (birthdateInput) {
        const today = new Date();
        const maxYear = today.getFullYear() - 18;
        const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const day = String(today.getDate()).padStart(2, '0');

        // Format: YYYY-MM-DD
        const maxValidDate = `${maxYear}-${month}-${day}`;

        // Set the max attribute on the native date picker
        birthdateInput.setAttribute('max', maxValidDate);
    }

    // Handle dynamic profile picture preview
    if (fileUpload && profilePic) {
        fileUpload.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    profilePic.style.backgroundImage = `url('${e.target.result}')`;
                }
                reader.readAsDataURL(file);
            }
        });
    }

    // Handle Form Submission
    if (accountForm) {
        accountForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // 🎯 Fail-safe validation check for age calculation
            if (birthdateInput && birthdateInput.value) {
                const selectedBirthdate = new Date(birthdateInput.value);
                const today = new Date();

                let age = today.getFullYear() - selectedBirthdate.getFullYear();
                const monthDifference = today.getMonth() - selectedBirthdate.getMonth();
                const dayDifference = today.getDate() - selectedBirthdate.getDate();

                // Adjust age if the birthday hasn't occurred yet this year
                if (monthDifference < 0 || (monthDifference === 0 && dayDifference < 0)) {
                    age--;
                }

                if (age < 18) {
                    alert('Registration failed. You must be at least 18 years old to create an account.');
                    return; // Stops the submission flow entirely
                }
            }

            // Only tracking elements that exist on your current form screen
            const formData = {
                username: document.getElementById('username').value,
                fullName: document.getElementById('fullName').value,
                gender: document.getElementById('gender').value,
                birthdate: birthdateInput ? birthdateInput.value : ''
            };

            console.log('Saved Account Information:', formData);
            alert('Account information saved successfully!');
            window.location.href = 'CustomerHome';
        });
    }

    // Close button event
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            // Pigilan ang default form submission behavior ng browser
            e.preventDefault();

            if (confirm("Are you sure you want to exit? Unsaved changes might be lost.")) {
                console.log("Exit flow initiated.");
                window.location.href = 'CustomerHome';
            }
        });
    }
});
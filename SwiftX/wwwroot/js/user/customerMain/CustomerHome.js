
// ══════════════════════════════════════════════════════════
// SIDEBAR TOGGLE
// ══════════════════════════════════════════════════════════
function toggleMenu() {
    const sidebar = document.getElementById('sideMenu');
    const overlay = document.getElementById('cust-sidebar-overlay');
    if (!sidebar) return;

    const isOpen = sidebar.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active', isOpen);
    document.body.classList.toggle('cust-sidebar-open', isOpen);
}


// ══════════════════════════════════════════════════════════
// HELP CENTER & TERMS MODALS
// (sidebar links open these — available on all pages)
// ══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

    // ── Load User Profile (Hamburger Menu & Greeting) ──
    fetch('/Customer/GetProfile')
        .then(res => res.json())
        .then(data => {
            if (data.profileImageUrl) {
                const profilePics = document.querySelectorAll('.cust-profile-pic');
                profilePics.forEach(pic => pic.src = data.profileImageUrl);
            }
            if (data.fullName) {
                const sidebarName = document.getElementById('sidebarUserName');
                if (sidebarName) sidebarName.textContent = data.fullName;

                const greetingName = document.getElementById('customerName');
                if (greetingName) {
                    const firstName = data.fullName.split(' ')[0];
                    greetingName.textContent = firstName;
                }
            }
        })
        .catch(console.error);

    // ── Help Center ──
    const helpModal = document.getElementById('helpCenterModalHome');
    const openHelpBtn = document.getElementById('openHelpCenterHome');
    const closeHelpBtn = helpModal?.querySelector('.help-close-btn');

    if (helpModal) helpModal.style.display = 'none';

    openHelpBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        helpModal.style.display = 'flex';
        toggleMenu(); // close sidebar when opening modal
    });

    closeHelpBtn?.addEventListener('click', () => {
        helpModal.style.display = 'none';
    });

    // ── Terms & Conditions ──
    const termsModal = document.getElementById('termsModal');
    const openTermsBtn = document.getElementById('openTermsHome');
    const closeTermsBtn = document.getElementById('closeTermsBtn');

    if (termsModal) termsModal.style.display = 'none';

    openTermsBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        termsModal.style.display = 'flex';
        toggleMenu(); // close sidebar when opening modal
    });

    closeTermsBtn?.addEventListener('click', () => {
        termsModal.style.display = 'none';
    });

    // ── Backdrop click closes both ──
    window.addEventListener('click', (e) => {
        if (e.target === helpModal) helpModal.style.display = 'none';
        if (e.target === termsModal) termsModal.style.display = 'none';
    });

    // ── Escape key closes both ──
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (helpModal?.style.display === 'flex') helpModal.style.display = 'none';
        if (termsModal?.style.display === 'flex') termsModal.style.display = 'none';
    });

});

function selectService(element) {
    document.querySelectorAll('.service-card').forEach(card => {
        card.classList.remove('active');
    });
    element.classList.add('active');

    const serviceName = element.querySelector('p')?.innerText.trim();

    setTimeout(() => {
        switch (serviceName) {
            case 'FoodX':
                window.location.href = 'FoodXBrowse';
                break;
            case 'ItemX':
                window.location.href = '/Customer/CustomerItemXHome';
                break;
            default:
                console.log('Service not available yet:', serviceName);
                break;
        }
    }, 250);
}


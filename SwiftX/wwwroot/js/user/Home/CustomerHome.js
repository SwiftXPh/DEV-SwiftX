function toggleMenu() {
    const sideMenu = document.getElementById('sideMenu');

    if (sideMenu) {
        sideMenu.classList.toggle('active');
    }
}

// 3. Function para sa Service Redirection

function selectService(element) {
    // Visual feedback
    document.querySelectorAll('.service-card').forEach(card => {
        card.classList.remove('active');
    });
    element.classList.add('active');

    // Kunin ang text para sa redirection
    const serviceName = element.querySelector('p').innerText.trim();

    // Redirection Logic
    setTimeout(() => {
        switch (serviceName) {
            case 'FoodX':
                window.location.href = '/Customer/CustomerFoodXHome';
                break;
            case 'ItemX':
                window.location.href = '/Customer/CustomerItemXHome';
                break;
            default:
                console.log("Service not available yet.");
                break;
        }
    }, 250);
}

// =============================================================
// 4. FUNCTION PARA SA SUPPORT & LEGAL AT HELP CENTER OVERLAYS
// =============================================================
function initLegalModal() {
    // --- ELEMENTS NG TERMS & CONDITIONS ---
    const modalHome = document.getElementById('termsModalHome');
    const btnHome = document.getElementById('openTermsHome');
    const closeBtnHome = document.querySelector('.close-button-home');

    // --- ELEMENTS NG HELP CENTER ---
    const helpModal = document.getElementById('helpCenterModalHome');
    const helpBtn = document.getElementById('openHelpCenterHome');
    const closeHelpBtn = helpModal ? helpModal.querySelector('.help-close-btn') : null;

    // Siguraduhing NAKATAGO silang dalawa sa simula bago magka-click event
    if (modalHome) modalHome.style.display = 'none';
    if (helpModal) helpModal.style.display = 'none';

    // A. LOGIC PARA SA TERMS & CONDITIONS (Support & Legal)
    if (btnHome && modalHome) {
        btnHome.addEventListener('click', (e) => {
            e.preventDefault();              // Pigilan ang pagtalon ng pahina
            modalHome.style.display = 'flex'; // Sentrong-sentro sa screen gamit ang flex
        });
    }

    if (closeBtnHome && modalHome) {
        closeBtnHome.addEventListener('click', () => {
            modalHome.style.display = 'none'; // Itatago ulit ang T&C
        });
    }

    // B. LOGIC PARA SA HELP CENTER (LALABAS LANG KAPAG PININDOT)
    if (helpBtn && helpModal) {
        helpBtn.addEventListener('click', (e) => {
            e.preventDefault();              // Pigilan ang pag-refresh o pagtalon ng link (#)
            helpModal.style.display = 'flex'; // Dito lang siya magiging 'flex' para lumutang sa gitna ng screen!
        });
    }

    if (closeHelpBtn && helpModal) {
        closeHelpBtn.addEventListener('click', () => {
            helpModal.style.display = 'none'; // Itatago ulit kapag pinindot ang (X) button
        });
    }

    // C. LOGIC PARA SA OUTSIDE CLICK (Isasara ang overlay kapag pinindot ang labas ng card)
    window.addEventListener('click', (event) => {
        if (event.target === modalHome) {
            modalHome.style.display = 'none';
        }
        if (event.target === helpModal) {
            helpModal.style.display = 'none';
        }
    });
}

// =============================================================
// INITIALIZE ALL FUNCTIONS ON LOAD
// =============================================================
window.addEventListener("DOMContentLoaded", () => {
    initLegalModal();
});
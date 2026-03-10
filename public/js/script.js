(() => {
    'use strict'

    // 1. Bootstrap Validation Logic
    const forms = document.querySelectorAll('.needs-validation')

    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault()
                event.stopPropagation()
            }
            form.classList.add('was-validated')
        }, false)
    })

    // 2. Tax Toggle Logic (Wrapped in a check to prevent errors)
    let taxSwitch = document.getElementById("flexSwitchCheckDefault");
    
    // Only add the listener if the element actually exists on this page
    if (taxSwitch) {
        taxSwitch.addEventListener("click", () => {
            let taxInfo = document.getElementsByClassName("tax-info");
            for (let info of taxInfo) {
                if (info.style.display !== "inline") {
                    info.style.display = "inline";
                } else {
                    info.style.display = "none";
                }
            }
        });
    }
})()
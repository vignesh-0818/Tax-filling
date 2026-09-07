/* ==================================================
   Form Validation Logic (Phone, Email, Required)
================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Phone validation (exactly 10 digits)
    const phoneInputs = document.querySelectorAll('input[type="tel"], .phone-validation');
    
    phoneInputs.forEach(input => {
        // Prevent typing non-numbers
        input.addEventListener('keypress', function(e) {
            if (e.key < '0' || e.key > '9') {
                e.preventDefault();
            }
            if (this.value.length >= 10) {
                e.preventDefault();
            }
        });
        
        // Validate on blur or change
        input.addEventListener('blur', function() {
            validatePhone(this);
        });
    });
    
    // Contact Forms & General Forms Validation
    const validateForms = document.querySelectorAll('.needs-validation');
    
    validateForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!this.checkValidity()) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            // Extra phone check
            const pInput = this.querySelector('input[type="tel"]');
            if (pInput && !validatePhone(pInput)) {
                e.preventDefault();
                e.stopPropagation();
            }
            
            // Extra password match check for register form
            const pwd = this.querySelector('input[name="password"]');
            const confirmPwd = this.querySelector('input[name="confirm_password"]');
            
            if (pwd && confirmPwd) {
                if (pwd.value !== confirmPwd.value) {
                    e.preventDefault();
                    e.stopPropagation();
                    confirmPwd.setCustomValidity("Passwords do not match");
                    confirmPwd.classList.add('is-invalid');
                } else {
                    confirmPwd.setCustomValidity("");
                    confirmPwd.classList.remove('is-invalid');
                }
            }
            
            this.classList.add('was-validated');
            
            // If valid, prevent reload for demo purposes
            if (this.checkValidity()) {
                e.preventDefault();
                showToast("Form submitted successfully!");
                this.reset();
                this.classList.remove('was-validated');
            }
        });
    });
});

function validatePhone(input) {
    const value = input.value.trim();
    const isValid = /^\d{10}$/.test(value);
    
    if (!isValid && value !== "") {
        input.classList.add('is-invalid');
        input.setCustomValidity("Please enter exactly 10 digits");
        return false;
    } else {
        input.classList.remove('is-invalid');
        input.setCustomValidity("");
        return true;
    }
}

/* ==================================================
   Form Validation Logic (Name, Email, Phone, Required)
================================================== */

// Strict Email Validation Regex:
// Requires: local part + '@' + domain label(s) + '.' + TLD (at least 2 letters)
// Rejects incomplete domains like "test@GMAIL", "test@gmail", "test@"
// Accepts "example@gmail.com", "user@company.in", case-insensitively
const STRICT_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*)*\.[a-zA-Z]{2,}$/;

/**
 * Validates a person's full name:
 * - Must not be empty if required
 * - Must be at least 2 characters (rejects single characters like 'A')
 * - Must contain letters, spaces, hyphens, periods, apostrophes only (rejects numbers and inappropriate symbols)
 * - Must contain at least 2 alphabetic characters
 */
function validateName(input) {
    if (!input) return true;
    const value = input.value.trim();
    const feedback = input.parentElement ? input.parentElement.querySelector('.invalid-feedback') : null;
    
    if (value === "") {
        if (input.hasAttribute('required')) {
            input.setCustomValidity("Please enter your name.");
            if (feedback) feedback.textContent = "Please provide your name.";
            input.classList.add('is-invalid');
            input.classList.remove('is-valid');
            return false;
        } else {
            input.setCustomValidity("");
            input.classList.remove('is-invalid');
            input.classList.remove('is-valid');
            return true;
        }
    }
    
    if (value.length < 2) {
        input.setCustomValidity("Name must be at least 2 characters long.");
        if (feedback) feedback.textContent = "Name must be at least 2 characters long.";
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        return false;
    }
    
    // Disallow numbers and inappropriate special characters
    if (!/^[A-Za-z\s'.-]+$/.test(value)) {
        input.setCustomValidity("Name cannot contain numbers or special characters.");
        if (feedback) feedback.textContent = "Name cannot contain numbers or special characters.";
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        return false;
    }
    
    // Ensure at least 2 alphabetic letters
    const letterCount = (value.match(/[A-Za-z]/g) || []).length;
    if (letterCount < 2) {
        input.setCustomValidity("Name must contain at least 2 letters.");
        if (feedback) feedback.textContent = "Name must contain at least 2 letters.";
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        return false;
    }
    
    input.setCustomValidity("");
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    return true;
}

/**
 * Validates an email input:
 * - Domain must have a valid structure and extension
 * - Case-insensitive
 */
function validateEmailInput(input) {
    if (!input) return true;
    const value = input.value.trim();
    const feedback = input.parentElement ? input.parentElement.querySelector('.invalid-feedback') : null;
    
    if (value === "") {
        if (input.hasAttribute('required')) {
            input.setCustomValidity("Please provide your email address.");
            if (feedback) feedback.textContent = "Please provide an email address.";
            input.classList.add('is-invalid');
            input.classList.remove('is-valid');
            return false;
        } else {
            input.setCustomValidity("");
            input.classList.remove('is-invalid');
            input.classList.remove('is-valid');
            return true;
        }
    }
    
    const isValid = STRICT_EMAIL_REGEX.test(value);
    if (!isValid) {
        input.setCustomValidity("Please enter a valid email address with a complete domain (e.g., example@gmail.com).");
        if (feedback) feedback.textContent = "Please provide a valid email with a complete domain (e.g. name@example.com).";
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        return false;
    }
    
    input.setCustomValidity("");
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    return true;
}

/**
 * Validates a 10-digit phone number
 */
function validatePhone(input) {
    if (!input) return true;
    const value = input.value.trim();
    const feedback = input.parentElement ? input.parentElement.querySelector('.invalid-feedback') : null;
    const isValid = /^\d{10}$/.test(value);
    
    if (!isValid && value !== "") {
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        input.setCustomValidity("Please enter exactly 10 digits");
        if (feedback) feedback.textContent = "Please provide a valid 10-digit phone number.";
        return false;
    } else if (value === "" && input.hasAttribute('required')) {
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        input.setCustomValidity("Phone number is required");
        if (feedback) feedback.textContent = "Please provide a valid 10-digit phone number.";
        return false;
    } else {
        input.classList.remove('is-invalid');
        if (value !== "") input.classList.add('is-valid');
        input.setCustomValidity("");
        return true;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Phone inputs (exactly 10 digits)
    const phoneInputs = document.querySelectorAll('input[type="tel"], .phone-validation');
    phoneInputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key < '0' || e.key > '9') {
                e.preventDefault();
            }
            if (this.value.length >= 10) {
                e.preventDefault();
            }
        });
        
        input.addEventListener('input', function() {
            if (this.form && this.form.classList.contains('was-validated')) {
                validatePhone(this);
            }
        });

        input.addEventListener('blur', function() {
            validatePhone(this);
        });
    });

    // Name inputs
    const nameInputs = document.querySelectorAll('input[name="name"], #contactName, .name-validation');
    nameInputs.forEach(input => {
        input.addEventListener('input', function() {
            if (this.form && this.form.classList.contains('was-validated') || this.classList.contains('is-invalid')) {
                validateName(this);
            }
        });
        
        input.addEventListener('blur', function() {
            if (this.value.trim() !== "" || (this.form && this.form.classList.contains('was-validated'))) {
                validateName(this);
            }
        });
    });

    // Email inputs
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('input', function() {
            if (this.form && this.form.classList.contains('was-validated') || this.classList.contains('is-invalid')) {
                validateEmailInput(this);
            }
        });
        
        input.addEventListener('blur', function() {
            if (this.value.trim() !== "" || (this.form && this.form.classList.contains('was-validated'))) {
                validateEmailInput(this);
            }
        });
    });
    
    // Contact Forms & General Forms Validation
    const validateForms = document.querySelectorAll('.needs-validation');
    validateForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            let formValid = true;

            // 1. Name check
            const nameIn = this.querySelector('input[name="name"], #contactName, .name-validation');
            if (nameIn && !validateName(nameIn)) {
                formValid = false;
            }

            // 2. Email check
            const emails = this.querySelectorAll('input[type="email"]');
            emails.forEach(em => {
                if (!validateEmailInput(em)) {
                    formValid = false;
                }
            });
            
            // 3. Phone check
            const pInput = this.querySelector('input[type="tel"], .phone-validation');
            if (pInput && !validatePhone(pInput)) {
                formValid = false;
            }
            
            // 4. Password match check for register form
            const pwd = this.querySelector('input[name="password"]');
            const confirmPwd = this.querySelector('input[name="confirm_password"]');
            if (pwd && confirmPwd) {
                if (pwd.value !== confirmPwd.value) {
                    formValid = false;
                    confirmPwd.setCustomValidity("Passwords do not match");
                    confirmPwd.classList.add('is-invalid');
                } else {
                    confirmPwd.setCustomValidity("");
                    confirmPwd.classList.remove('is-invalid');
                }
            }

            // Standard HTML5 validity check
            if (!this.checkValidity()) {
                formValid = false;
            }
            
            if (!formValid) {
                e.preventDefault();
                e.stopPropagation();
                this.classList.add('was-validated');
                return;
            }
            
            this.classList.add('was-validated');
            
            // If valid, prevent reload for demo purposes and show success toast
            e.preventDefault();
            if (typeof showToast === 'function') {
                showToast("Form submitted successfully!");
            }
            this.reset();
            this.classList.remove('was-validated');
            this.querySelectorAll('.is-valid, .is-invalid').forEach(el => {
                el.classList.remove('is-valid', 'is-invalid');
            });
        });
    });
});

// Global helpers
window.validateName = validateName;
window.validateEmailInput = validateEmailInput;
window.validatePhone = validatePhone;
window.STRICT_EMAIL_REGEX = STRICT_EMAIL_REGEX;

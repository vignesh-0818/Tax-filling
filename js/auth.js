/* ==================================================
   TaxCore Central Authentication & Profile System
================================================== */

(function () {
  'use strict';

  // Seed default registered users if not present
  function initSeedUsers() {
    var stored = localStorage.getItem('taxcoreUsers');
    if (!stored) {
      var seed = [
        {
          name: "Vignesh R",
          email: "vi@gmail.com",
          phone: "9876543210",
          password: "password123",
          role: "customer"
        },
        {
          name: "Vignesh R",
          email: "admin@taxcore.com",
          phone: "9876543210",
          password: "password123",
          role: "admin"
        }
      ];
      localStorage.setItem('taxcoreUsers', JSON.stringify(seed));
    }
  }

  initSeedUsers();

  window.TaxCoreAuth = {
    // 1. Get all registered accounts
    getUsers: function () {
      try {
        return JSON.parse(localStorage.getItem('taxcoreUsers') || '[]');
      } catch (e) {
        return [];
      }
    },

    // 2. Register or update a user
    saveUser: function (user) {
      if (!user || !user.email) return null;
      var users = this.getUsers();
      var normalizedEmail = user.email.trim().toLowerCase();
      var index = users.findIndex(function (u) {
        return u.email.trim().toLowerCase() === normalizedEmail;
      });

      var cleanUser = {
        name: user.name ? user.name.trim() : 'User',
        email: normalizedEmail,
        phone: user.phone ? user.phone.trim() : '',
        password: user.password || (index >= 0 ? users[index].password : ''),
        role: user.role === 'admin' ? 'admin' : 'customer',
        company: user.company || '',
        timezone: user.timezone || '',
        filingEntity: user.filingEntity || '',
        state: user.state || '',
        address: user.address || ''
      };

      if (index >= 0) {
        users[index] = cleanUser;
      } else {
        users.push(cleanUser);
      }

      localStorage.setItem('taxcoreUsers', JSON.stringify(users));

      // If updating the active user session, keep currentUser synchronized
      var current = this.getCurrentUser();
      if (current && current.email.toLowerCase() === normalizedEmail) {
        this.setCurrentUser(cleanUser);
      }

      return cleanUser;
    },

    // 3. Current user session management
    getCurrentUser: function () {
      try {
        var raw = localStorage.getItem('currentUser');
        if (raw) return JSON.parse(raw);
        var prof = localStorage.getItem('taxcore_customer_profile');
        if (prof) return JSON.parse(prof);
        return null;
      } catch (e) {
        return null;
      }
    },

    setCurrentUser: function (user) {
      if (!user) {
        this.clearCurrentUser();
        return;
      }
      var sessionUser = {
        name: user.name ? user.name.trim() : 'User',
        email: user.email ? user.email.trim().toLowerCase() : '',
        phone: user.phone ? user.phone.trim() : '',
        role: user.role === 'admin' ? 'admin' : 'customer',
        company: user.company || '',
        timezone: user.timezone || '',
        filingEntity: user.filingEntity || '',
        state: user.state || '',
        address: user.address || ''
      };
      localStorage.setItem('currentUser', JSON.stringify(sessionUser));
      localStorage.setItem('taxcore_customer_profile', JSON.stringify(sessionUser));
      if (sessionUser.role === 'admin') {
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.removeItem('customerLoggedIn');
      } else {
        localStorage.setItem('customerLoggedIn', 'true');
        localStorage.removeItem('adminLoggedIn');
      }
    },

    clearCurrentUser: function () {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('adminLoggedIn');
      localStorage.removeItem('customerLoggedIn');
    },

    // 4. Initials generator
    getInitials: function (name) {
      if (!name) return 'U';
      var parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    },

    // 5. Page protection & role enforcement
    protectPage: function (requiredRole) {
      var user = this.getCurrentUser();
      if (!user) {
        window.location.href = 'login.html';
        return false;
      }

      if (requiredRole === 'admin' && user.role !== 'admin') {
        window.location.href = 'dashboard.html';
        return false;
      }

      if (requiredRole === 'customer' && user.role !== 'customer') {
        window.location.href = 'admin-dashboard.html';
        return false;
      }

      return true;
    },

    // 6. Update all dynamic navbar, dropdown, avatar, and profile fields
    updateNavbarUI: function () {
      var user = this.getCurrentUser();
      if (!user) return;

      var name = user.name || (user.role === 'admin' ? 'Admin' : 'Customer');
      var roleText = user.role === 'admin' ? 'Admin' : 'Customer';
      var fullRoleText = user.role === 'admin' ? 'Administrator' : 'Customer';
      var initials = this.getInitials(name);
      var email = user.email || '';
      var phone = user.phone || '';

      // Text elements
      document.querySelectorAll('.nav-user-name, #navUserName, .p-name').forEach(function (el) {
        el.textContent = name;
      });

      document.querySelectorAll('.nav-user-role, #navUserRole, .p-role, .user-role-display').forEach(function (el) {
        el.textContent = roleText;
      });

      document.querySelectorAll('.nav-user-email, #navUserEmail, .drop-user-email, .p-email').forEach(function (el) {
        el.textContent = email;
      });

      document.querySelectorAll('.drop-user-name').forEach(function (el) {
        el.textContent = name;
      });

      document.querySelectorAll('.drop-user-role').forEach(function (el) {
        el.textContent = roleText;
      });

      // Welcome banners
      document.querySelectorAll('.welcome-user-name, #welcomeCustomerName').forEach(function (el) {
        el.textContent = name;
      });
      document.querySelectorAll('.welcome-user-header').forEach(function (el) {
        el.textContent = 'Welcome back, ' + name + '!';
      });

      // Circular initials avatar
      document.querySelectorAll('.user-avatar-circle, #navUserAvatar, #dropUserAvatar, .profile-avatar, #profAvatarLarge').forEach(function (el) {
        el.textContent = initials;
      });

      // Sidebar user box in admin dashboard
      var sidebarUserInitial = document.querySelector('.sidebar-user > div:first-child');
      if (sidebarUserInitial) {
        sidebarUserInitial.textContent = initials;
      }
      var sidebarUserName = document.querySelector('.sidebar-user .name');
      if (sidebarUserName) {
        sidebarUserName.textContent = name;
      }
      var sidebarUserRole = document.querySelector('.sidebar-user .role');
      if (sidebarUserRole) {
        sidebarUserRole.textContent = fullRoleText;
      }

      // Customer Profile Page fields (profile.html)
      var profFullName = document.getElementById('profFullName');
      if (profFullName && user.name) { profFullName.value = user.name; }
      var profEmail = document.getElementById('profEmail');
      if (profEmail && user.email) { profEmail.value = user.email; }
      var profPhone = document.getElementById('profPhone');
      if (profPhone && user.phone) { profPhone.value = user.phone; }
      var profRole = document.getElementById('profRole');
      if (profRole) { profRole.value = roleText; }
      var profDisplayName = document.getElementById('profDisplayName');
      if (profDisplayName) { profDisplayName.textContent = name; }
      var profDisplayRole = document.getElementById('profDisplayRole');
      if (profDisplayRole) { profDisplayRole.textContent = roleText; }

      var profCompany = document.getElementById('profCompany');
      if (profCompany && user.company !== undefined) { profCompany.value = user.company; }
      var profTimezone = document.getElementById('profTimezone');
      if (profTimezone && user.timezone) { profTimezone.value = user.timezone; }
      var profFilingEntity = document.getElementById('profFilingEntity');
      if (profFilingEntity && user.filingEntity) { profFilingEntity.value = user.filingEntity; }
      var profState = document.getElementById('profState');
      if (profState && user.state !== undefined) { profState.value = user.state; }
      var profAddress = document.getElementById('profAddress');
      if (profAddress && user.address !== undefined) { profAddress.value = user.address; }

      // Admin Profile Page fields (admin-dashboard.html -> Settings)
      var adminProfFullName = document.getElementById('adminProfFullName');
      if (adminProfFullName) { adminProfFullName.value = name; }
      var adminProfEmail = document.getElementById('adminProfEmail');
      if (adminProfEmail) { adminProfEmail.value = email; }
      var adminProfPhone = document.getElementById('adminProfPhone');
      if (adminProfPhone) { adminProfPhone.value = phone; }
      var adminProfRole = document.getElementById('adminProfRole');
      if (adminProfRole) { adminProfRole.value = fullRoleText; }
    },

    // 7. Logout handler
    logout: function (e) {
      if (e && e.preventDefault) e.preventDefault();
      this.clearCurrentUser();
      window.location.href = 'login.html';
    }
  };

  // Global helper functions
  window.logoutCustomer = function (e) {
    TaxCoreAuth.logout(e);
  };
  window.logoutAdmin = function (e) {
    TaxCoreAuth.logout(e);
  };

  // Global Customer Profile save handler
  window.saveCustomerProfile = function (e) {
    if (e && e.preventDefault) e.preventDefault();
    var nameInput = document.getElementById('profFullName');
    var phoneInput = document.getElementById('profPhone');
    var emailInput = document.getElementById('profEmail');
    var companyInput = document.getElementById('profCompany');
    var timezoneSelect = document.getElementById('profTimezone');
    var filingEntitySelect = document.getElementById('profFilingEntity');
    var stateInput = document.getElementById('profState');
    var addressInput = document.getElementById('profAddress');

    if (!nameInput || !nameInput.value.trim()) {
      if (typeof showCustomerToast === 'function') {
        showCustomerToast('Please enter your full name.', 'error');
      } else {
        alert('Please enter your full name.');
      }
      return;
    }

    var current = TaxCoreAuth.getCurrentUser();
    if (!current) {
      try {
        current = JSON.parse(localStorage.getItem('currentUser') || 'null');
      } catch (err) {}
    }
    if (!current) {
      current = {
        name: nameInput.value.trim(),
        email: (emailInput && emailInput.value) ? emailInput.value.trim() : 'vigneshjr03@gmail.com',
        phone: (phoneInput && phoneInput.value) ? phoneInput.value.trim() : '8919368787',
        role: 'customer'
      };
    }

    current.name = nameInput.value.trim();
    if (phoneInput) current.phone = phoneInput.value.trim();
    if (companyInput) current.company = companyInput.value.trim();
    if (timezoneSelect) current.timezone = timezoneSelect.value;
    if (filingEntitySelect) current.filingEntity = filingEntitySelect.value;
    if (stateInput) current.state = stateInput.value.trim();
    if (addressInput) current.address = addressInput.value.trim();

    TaxCoreAuth.saveUser(current);
    localStorage.setItem('currentUser', JSON.stringify(current));
    localStorage.setItem('taxcore_customer_profile', JSON.stringify(current));
    TaxCoreAuth.updateNavbarUI();

    if (typeof showCustomerToast === 'function') {
      showCustomerToast('Profile changes saved successfully!', 'success');
    } else {
      alert('Profile updated successfully!');
    }
  };

  // Global Admin Profile save handler
  window.saveAdminProfile = function (e) {
    if (e && e.preventDefault) e.preventDefault();
    var current = TaxCoreAuth.getCurrentUser();
    if (!current) return;
    var nameInput = document.getElementById('adminProfFullName');
    var phoneInput = document.getElementById('adminProfPhone');
    if (!nameInput || !nameInput.value.trim()) {
      alert('Please enter your full name.');
      return;
    }
    current.name = nameInput.value.trim();
    if (phoneInput) current.phone = phoneInput.value.trim();
    TaxCoreAuth.saveUser(current);
    TaxCoreAuth.updateNavbarUI();
    alert('Admin profile updated successfully!');
  };

  // Run navbar and profile update automatically on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', function () {
    TaxCoreAuth.updateNavbarUI();
  });
})();

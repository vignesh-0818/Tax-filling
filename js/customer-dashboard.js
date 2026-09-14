/* ==================================================
   TaxCore Customer Dashboard Controller
================================================== */

// ---- AUTH GUARD & ROLE ENFORCEMENT ----
if (window.TaxCoreAuth) {
  TaxCoreAuth.protectPage('customer');
} else {
  var rawUser = localStorage.getItem('currentUser');
  var parsedUser = rawUser ? JSON.parse(rawUser) : null;
  if (!parsedUser) {
    parsedUser = { name: "Vignesh R", email: "customer@taxcore.com", role: "customer" };
    localStorage.setItem('currentUser', JSON.stringify(parsedUser));
  }
}

// ---- LOGOUT FUNCTION ----
window.logoutCustomer = function (e) {
  if (window.TaxCoreAuth) {
    TaxCoreAuth.logout(e);
  } else {
    if (e && e.preventDefault) e.preventDefault();
    localStorage.removeItem('currentUser');
    localStorage.removeItem('customerLoggedIn');
    try {
      localStorage.removeItem('tcRememberEmail');
      localStorage.removeItem('rememberEmail');
      sessionStorage.removeItem('tcRememberEmail');
    } catch (err) {}
    window.location.href = 'login.html';
  }
};

// ---- TAB SWITCHING HELPER ----
window.showCustomerTab = function (tabId) {
  var target = document.getElementById(tabId);
  if (!target) return;
  document.querySelectorAll('.tab-pane').forEach(function (pane) {
    pane.classList.remove('show', 'active');
  });
  target.classList.add('show', 'active');
};

// ---- THEME & RTL ON LOAD ----
(function initThemeRtl() {
  if (localStorage.getItem('tcDarkMode') === 'true' || localStorage.getItem('taxcoreTheme') === 'dark') {
    document.body.classList.add('dark-mode');
  }
  if (localStorage.getItem('tcRtl') === 'true') {
    document.documentElement.setAttribute('dir', 'rtl');
  }
})();

document.addEventListener('DOMContentLoaded', function () {
  // ---- SIDEBAR MOBILE ----
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebarOverlay');
  var toggleBtn = document.getElementById('sidebarToggle');
  var closeBtn = document.getElementById('sidebarClose');

  function openSidebar() {
    if (sidebar) {
      sidebar.classList.add('show');
      sidebar.classList.add('open');
    }
    if (overlay) {
      overlay.classList.add('show');
      overlay.classList.add('active');
    }
  }

  function closeSidebar() {
    if (sidebar) {
      sidebar.classList.remove('show');
      sidebar.classList.remove('open');
    }
    if (overlay) {
      overlay.classList.remove('show');
      overlay.classList.remove('active');
    }
  }

  if (toggleBtn) toggleBtn.addEventListener('click', openSidebar);
  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
  if (overlay) overlay.addEventListener('click', closeSidebar);

  // Close sidebar on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeSidebar();
    }
  });

  // ---- ACTIVE LINK HIGHLIGHT ----
  var currentFile = window.location.pathname.split('/').pop() || 'dashboard.html';
  var navLinks = document.querySelectorAll('.customer-sidebar-nav a.nav-link');
  
  navLinks.forEach(function(link) {
    var href = link.getAttribute('href');
    if (href === currentFile) {
      link.classList.add('active', 'text-primary-brand', 'bg-primary', 'bg-opacity-10');
      link.classList.remove('text-secondary');
    } else if (href && href !== '#' && !href.startsWith('#')) {
      link.classList.remove('active', 'text-primary-brand', 'bg-primary', 'bg-opacity-10');
      link.classList.add('text-secondary');
    }
  });

  // ---- INITIALIZE PAGE-SPECIFIC CONTROLLERS ----
  if (document.getElementById('paymentMethodsContainer')) {
    renderPaymentMethods();
  }

  if (document.getElementById('customerProfileForm')) {
    try {
      var prof = JSON.parse(localStorage.getItem('taxcore_customer_profile') || localStorage.getItem('currentUser') || 'null');
      if (prof) {
        if (document.getElementById('profFullName') && prof.name) document.getElementById('profFullName').value = prof.name;
        if (document.getElementById('profEmail') && prof.email) document.getElementById('profEmail').value = prof.email;
        if (document.getElementById('profPhone') && prof.phone) document.getElementById('profPhone').value = prof.phone;
        if (document.getElementById('profCompany') && prof.company !== undefined) document.getElementById('profCompany').value = prof.company;
        if (document.getElementById('profTimezone') && prof.timezone) document.getElementById('profTimezone').value = prof.timezone;
        if (document.getElementById('profFilingEntity') && prof.filingEntity) document.getElementById('profFilingEntity').value = prof.filingEntity;
        if (document.getElementById('profState') && prof.state !== undefined) document.getElementById('profState').value = prof.state;
        if (document.getElementById('profAddress') && prof.address !== undefined) document.getElementById('profAddress').value = prof.address;
        if (document.getElementById('profDisplayName') && prof.name) document.getElementById('profDisplayName').textContent = prof.name;
      }
    } catch (err) {}
  }

  // ---- SMOOTH SCROLL & HIGHLIGHT FOR ANCHOR LINKS (e.g. #active-return, #deadlines, #notices, #past-filings) ----
  function handleHashNavigation() {
    if (window.location.hash) {
      try {
        var hash = window.location.hash;
        var targetEl = document.querySelector(hash);
        if (targetEl) {
          setTimeout(function () {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            targetEl.classList.add('highlight-section-target');
            setTimeout(function () {
              targetEl.classList.remove('highlight-section-target');
            }, 2200);
          }, 180);
        }
      } catch (err) {}
    }
  }

  handleHashNavigation();
  window.addEventListener('hashchange', handleHashNavigation);
});

// ---- TOAST NOTIFICATION HELPER ----
window.showCustomerToast = function (message, type) {
  var container = document.querySelector('.customer-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'customer-toast-container';
    document.body.appendChild(container);
  }
  var toast = document.createElement('div');
  toast.className = 'customer-toast' + (type === 'error' ? ' toast-error' : (type === 'info' ? ' toast-info' : ''));
  var icon = type === 'error' ? 'bi-exclamation-circle-fill text-danger' : (type === 'info' ? 'bi-info-circle-fill text-primary' : 'bi-check-circle-fill text-success');
  toast.innerHTML = '<i class="bi ' + icon + ' fs-5"></i><span>' + String(message || '') + '</span>';
  container.appendChild(toast);

  setTimeout(function () {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(30px)';
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3500);
};

// ---- PAYMENT METHODS CONTROLLER (orders-billing.html) ----
function getStoredPaymentMethods() {
  try {
    var raw = localStorage.getItem('taxcore_payment_methods');
    if (raw) {
      var parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  
  var defaultUser = 'vignesh';
  try {
    var u = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (u && u.name) defaultUser = u.name;
  } catch (err) {}

  var seedCards = [
    {
      id: 'card_default_4242',
      brand: 'Visa',
      last4: '4242',
      expiry: '12/2028',
      cardholder: defaultUser,
      isDefault: true
    }
  ];
  localStorage.setItem('taxcore_payment_methods', JSON.stringify(seedCards));
  return seedCards;
}

function savePaymentMethods(cards) {
  try {
    localStorage.setItem('taxcore_payment_methods', JSON.stringify(cards));
  } catch (e) {
    console.warn('Could not save payment methods', e);
  }
}

function getCardBrandIconHtml(brand) {
  var b = (brand || '').toLowerCase();
  if (b.indexOf('master') !== -1) {
    return '<i class="bi bi-credit-card-fill fs-2" style="color:#f59e0b;"></i>';
  } else if (b.indexOf('amex') !== -1 || b.indexOf('american') !== -1) {
    return '<i class="bi bi-credit-card-2-front-fill fs-2" style="color:#06b6d4;"></i>';
  } else if (b.indexOf('discover') !== -1) {
    return '<i class="bi bi-credit-card-fill fs-2" style="color:#f97316;"></i>';
  }
  return '<i class="bi bi-credit-card fs-2 text-primary"></i>';
}

window.renderPaymentMethods = function () {
  var container = document.getElementById('paymentMethodsContainer');
  if (!container) return;

  var cards = getStoredPaymentMethods();
  if (!cards || cards.length === 0) {
    container.innerHTML = '<div class="text-secondary text-center p-4 border rounded">No payment methods found. Click "+ Add Card" above to add one.</div>';
    return;
  }

  var html = '';
  cards.forEach(function (card) {
    var iconHtml = getCardBrandIconHtml(card.brand);
    var defaultBadge = card.isDefault ? '<span class="badge bg-primary bg-opacity-10 text-primary-brand ms-2">Default</span>' : '';
    var makeDefaultBtn = !card.isDefault ? '<button type="button" class="btn btn-sm btn-outline-secondary" onclick="setDefaultCard(\'' + card.id + '\')">Make Default</button>' : '';
    var deleteBtn = cards.length > 1 ? '<button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteCard(\'' + card.id + '\')" title="Remove card"><i class="bi bi-trash"></i></button>' : '';

    html +=
      '<div class="d-flex align-items-center justify-content-between p-3 border rounded flex-wrap gap-2 card-theme">' +
        '<div class="d-flex align-items-center gap-3">' +
          iconHtml +
          '<div>' +
            '<div class="fw-bold">' + (card.brand || 'Card') + ' ending in ' + card.last4 + ' ' + defaultBadge + '</div>' +
            '<small class="text-secondary">Expires ' + card.expiry + ' &bull; Cardholder: <span class="cardholder-name-display">' + (card.cardholder || 'Cardholder') + '</span></small>' +
          '</div>' +
        '</div>' +
        '<div class="d-flex gap-2 align-items-center">' +
          makeDefaultBtn +
          '<button type="button" class="btn btn-sm btn-light border" onclick="openEditCardModal(\'' + card.id + '\')"><i class="bi bi-pencil me-1"></i> Edit</button>' +
          deleteBtn +
        '</div>' +
      '</div>';
  });

  container.innerHTML = html;
};

// Modal helpers that work with Bootstrap 5 or fallback
function showBootstrapOrVanillaModal(modalId) {
  var el = document.getElementById(modalId);
  if (!el) return;
  if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
    var instance = bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
    instance.show();
  } else {
    el.classList.add('show');
    el.style.display = 'block';
    el.removeAttribute('aria-hidden');
    el.setAttribute('aria-modal', 'true');
    var backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop fade show custom-vanilla-backdrop';
    document.body.appendChild(backdrop);
  }
}

function hideBootstrapOrVanillaModal(modalId) {
  var el = document.getElementById(modalId);
  if (!el) return;
  if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
    var instance = bootstrap.Modal.getInstance(el);
    if (instance) instance.hide();
  }
  el.classList.remove('show');
  el.style.display = 'none';
  el.setAttribute('aria-hidden', 'true');
  document.querySelectorAll('.custom-vanilla-backdrop').forEach(function (b) {
    if (b.parentNode) b.parentNode.removeChild(b);
  });
}

// Add Card Modal
window.openAddCardModal = function () {
  var currentName = 'Vignesh';
  try {
    var u = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (u && u.name) currentName = u.name;
  } catch (e) {}

  var nameInput = document.getElementById('newCardholderName');
  if (nameInput) nameInput.value = currentName;

  var numInput = document.getElementById('newCardNumber');
  if (numInput) numInput.value = '';

  var expInput = document.getElementById('newCardExpiry');
  if (expInput) expInput.value = '';

  var cvvInput = document.getElementById('newCardCvv');
  if (cvvInput) cvvInput.value = '';

  var errCard = document.getElementById('err_new_card');
  if (errCard) errCard.style.display = 'none';

  var errExp = document.getElementById('err_new_expiry');
  if (errExp) errExp.style.display = 'none';

  showBootstrapOrVanillaModal('addCardModal');
};

window.formatCardNumberInput = function (input, iconId) {
  var v = input.value.replace(/\D/g, '').substring(0, 16);
  var formatted = v.match(/.{1,4}/g);
  input.value = formatted ? formatted.join(' ') : v;

  if (iconId) {
    var iconBox = document.getElementById(iconId);
    if (iconBox) {
      if (v.startsWith('4')) {
        iconBox.innerHTML = '<i class="bi bi-credit-card fs-5 text-primary"></i>';
      } else if (v.startsWith('5')) {
        iconBox.innerHTML = '<i class="bi bi-credit-card-fill fs-5" style="color:#f59e0b;"></i>';
      } else if (v.startsWith('3')) {
        iconBox.innerHTML = '<i class="bi bi-credit-card-2-front-fill fs-5" style="color:#06b6d4;"></i>';
      } else {
        iconBox.innerHTML = '<i class="bi bi-credit-card fs-5"></i>';
      }
    }
  }
};

window.formatCardExpiryInput = function (input) {
  var v = input.value.replace(/\D/g, '').substring(0, 4);
  if (v.length >= 2) {
    input.value = v.substring(0, 2) + '/' + v.substring(2);
  } else {
    input.value = v;
  }
};

window.submitAddCard = function (event) {
  if (event && event.preventDefault) event.preventDefault();

  var name = (document.getElementById('newCardholderName').value || '').trim();
  var rawNumber = document.getElementById('newCardNumber').value.replace(/\s+/g, '');
  var expiry = (document.getElementById('newCardExpiry').value || '').trim();
  var cvv = (document.getElementById('newCardCvv').value || '').trim();
  var isDefault = document.getElementById('newCardDefault').checked;

  var errCard = document.getElementById('err_new_card');
  var errExp = document.getElementById('err_new_expiry');

  var valid = true;
  if (rawNumber.length < 15 || rawNumber.length > 16) {
    if (errCard) errCard.style.display = 'block';
    valid = false;
  } else if (errCard) {
    errCard.style.display = 'none';
  }

  if (!/^\d{2}\/\d{2}$/.test(expiry)) {
    if (errExp) errExp.style.display = 'block';
    valid = false;
  } else if (errExp) {
    errExp.style.display = 'none';
  }

  if (!name || cvv.length < 3) {
    valid = false;
  }

  if (!valid) return;

  var brand = 'Visa';
  if (rawNumber.startsWith('5')) brand = 'Mastercard';
  else if (rawNumber.startsWith('3')) brand = 'Amex';
  else if (rawNumber.startsWith('6')) brand = 'Discover';

  var cards = getStoredPaymentMethods();
  if (isDefault) {
    cards.forEach(function (c) { c.isDefault = false; });
  }

  var newCard = {
    id: 'card_' + Date.now(),
    brand: brand,
    last4: rawNumber.slice(-4),
    expiry: expiry.length === 5 ? (expiry.slice(0, 3) + '20' + expiry.slice(3)) : expiry,
    cardholder: name,
    isDefault: isDefault || cards.length === 0
  };

  cards.push(newCard);
  savePaymentMethods(cards);
  renderPaymentMethods();
  hideBootstrapOrVanillaModal('addCardModal');
  showCustomerToast(brand + ' ending in ' + newCard.last4 + ' added successfully!', 'success');
};

// Edit Card Modal
window.openEditCardModal = function (cardId) {
  var cards = getStoredPaymentMethods();
  var card = cards.find(function (c) { return c.id === cardId; });
  if (!card) return;

  document.getElementById('editCardId').value = card.id;
  document.getElementById('editCardNumberDisplay').value = (card.brand || 'Card') + ' ending in ' + card.last4;
  document.getElementById('editCardholderName').value = card.cardholder || '';
  
  var expDisplay = card.expiry || '';
  if (expDisplay.indexOf('/') !== -1) {
    var parts = expDisplay.split('/');
    if (parts[1] && parts[1].length === 4) {
      expDisplay = parts[0] + '/' + parts[1].slice(-2);
    }
  }
  document.getElementById('editCardExpiry').value = expDisplay;
  document.getElementById('editCardDefault').checked = !!card.isDefault;

  var errExp = document.getElementById('err_edit_expiry');
  if (errExp) errExp.style.display = 'none';

  showBootstrapOrVanillaModal('editCardModal');
};

window.submitEditCard = function (event) {
  if (event && event.preventDefault) event.preventDefault();

  var cardId = document.getElementById('editCardId').value;
  var name = (document.getElementById('editCardholderName').value || '').trim();
  var expiry = (document.getElementById('editCardExpiry').value || '').trim();
  var isDefault = document.getElementById('editCardDefault').checked;

  var errExp = document.getElementById('err_edit_expiry');
  if (!/^\d{2}\/\d{2}$/.test(expiry)) {
    if (errExp) errExp.style.display = 'block';
    return;
  } else if (errExp) {
    errExp.style.display = 'none';
  }

  if (!name) return;

  var cards = getStoredPaymentMethods();
  var card = cards.find(function (c) { return c.id === cardId; });
  if (!card) return;

  if (isDefault) {
    cards.forEach(function (c) { c.isDefault = false; });
  }

  card.cardholder = name;
  card.expiry = expiry.length === 5 ? (expiry.slice(0, 3) + '20' + expiry.slice(3)) : expiry;
  card.isDefault = isDefault;

  savePaymentMethods(cards);
  renderPaymentMethods();
  hideBootstrapOrVanillaModal('editCardModal');
  showCustomerToast('Payment card updated successfully!', 'success');
};

window.deleteCard = function (cardId) {
  if (!confirm('Are you sure you want to remove this payment card?')) return;
  var cards = getStoredPaymentMethods();
  var filtered = cards.filter(function (c) { return c.id !== cardId; });
  if (filtered.length > 0 && !filtered.some(function (c) { return c.isDefault; })) {
    filtered[0].isDefault = true;
  }
  savePaymentMethods(filtered);
  renderPaymentMethods();
  showCustomerToast('Payment card removed.', 'info');
};

window.setDefaultCard = function (cardId) {
  var cards = getStoredPaymentMethods();
  cards.forEach(function (c) {
    c.isDefault = (c.id === cardId);
  });
  savePaymentMethods(cards);
  renderPaymentMethods();
  showCustomerToast('Default payment method updated.', 'success');
};

// ---- TAX RETURN PREVIEW & PDF DOWNLOAD (filing-status.html) ----
window.openReturnPreviewModal = function (filingId) {
  showBootstrapOrVanillaModal('returnPreviewModal');
};

window.downloadReturnPdf = function (year) {
  var y = year || '2023';
  var content = 'TaxCore Form 1040 Tax Return Summary (' + y + ')\n====================================\nFiling ID: #TXC-' + y + '-F01\nStatus: Under Review\nEstimated Refund: $2,480.00\nAssigned CPA: Elena Rostova, CPA\nGenerated on: ' + new Date().toLocaleDateString() + '\n\nThank you for choosing TaxCore!';
  var link = document.createElement('a');
  link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
  link.download = 'TaxReturn_' + y + '_Form1040.txt';
  link.click();
  showCustomerToast('Draft Tax Return transcript downloaded!', 'success');
};


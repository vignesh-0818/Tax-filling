/* ==================================================
   TaxCore Admin Dashboard - Complete Controller
================================================== */

// ---- AUTH GUARD & ROLE ENFORCEMENT ----
if (window.TaxCoreAuth) {
  TaxCoreAuth.protectPage('admin');
} else {
  var rawUser = localStorage.getItem('currentUser');
  var parsedUser = rawUser ? JSON.parse(rawUser) : null;
  if (!parsedUser) {
    window.location.href = 'login.html';
  } else if (parsedUser.role !== 'admin') {
    window.location.href = 'dashboard.html';
  }
}

// ---- THEME & RTL ON LOAD ----
(function initThemeRtl() {
  if (localStorage.getItem('tcDarkMode') === 'true') {
    document.body.classList.add('dark-mode');
    document.documentElement.classList.add('dark-mode');
  }
  if (localStorage.getItem('tcRtl') === 'true') {
    document.documentElement.setAttribute('dir', 'rtl');
  }
})();

document.addEventListener('DOMContentLoaded', function () {

  // ---- SECTION NAVIGATION ----
  var sectionTitles = {
    'section-overview': 'Dashboard',
    'section-clients': 'Clients',
    'section-filings': 'Tax Filings',
    'section-documents': 'Documents',
    'section-notices': 'Tax Notices',
    'section-payments': 'Payments',
    'section-services': 'Services',
    'section-plans': 'Pricing Plans',
    'section-calendar': 'Tax Calendar',
    'section-messages': 'Messages',
    'section-reports': 'Reports',
    'section-settings': 'Settings'
  };

  window.switchSection = function (id) {
    document.querySelectorAll('.dash-section').forEach(function (s) { s.classList.remove('active'); });
    document.querySelectorAll('.sidebar-nav-link').forEach(function (l) { l.classList.remove('active'); });
    var sec = document.getElementById(id);
    if (sec) sec.classList.add('active');
    var link = document.querySelector('[data-section="' + id + '"]');
    if (link) link.classList.add('active');
    var title = document.getElementById('adminPageTitle');
    if (title) title.textContent = sectionTitles[id] || id;
    closeSidebar();
    if (id === 'section-calendar') renderCalendar();
    window.dispatchEvent(new Event('resize'));
  };

  window.openAdminProfile = function () {
    switchSection('section-settings');
    var profTabBtn = document.querySelector('.settings-tab-btn[data-tab="tab-profile"]');
    if (profTabBtn) {
      profTabBtn.click();
    }
  };

  document.querySelectorAll('.sidebar-nav-link[data-section]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      switchSection(this.getAttribute('data-section'));
    });
    link.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); switchSection(this.getAttribute('data-section')); }
    });
  });

  // ---- SIDEBAR MOBILE ----
  var sidebar = document.getElementById('dashSidebar');
  var overlay = document.getElementById('sidebarOverlay');
  var toggleBtn = document.getElementById('sidebarToggleBtn');

  function openSidebar() { if (sidebar) sidebar.classList.add('open'); if (overlay) overlay.classList.add('active'); }
  function closeSidebar() { if (sidebar) sidebar.classList.remove('open'); if (overlay) overlay.classList.remove('active'); }
  window.closeSidebar = closeSidebar;

  if (toggleBtn) toggleBtn.addEventListener('click', openSidebar);
  if (overlay) overlay.addEventListener('click', closeSidebar);

  // ---- MODALS ----
  function openModal(id) {
    if (id === 'uploadDocModal' && typeof syncDocClientsList === 'function') {
      syncDocClientsList();
    }
    var m = document.getElementById(id);
    if (m) m.classList.add('show');
  }
  window.openModal = openModal;

  function closeModal(id) {
    var m = document.getElementById(id);
    if (m) m.classList.remove('show');
  }
  window.closeModal = closeModal;

  // Close modal on backdrop click
  document.querySelectorAll('.modal-backdrop-custom').forEach(function (bd) {
    bd.addEventListener('click', function (e) {
      if (e.target === bd) bd.classList.remove('show');
    });
  });

  // Escape key closes modals
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop-custom.show').forEach(function (m) { m.classList.remove('show'); });
      closeDropdowns();
    }
  });

  // ---- DELETE MODAL ----
  var pendingDeleteRow = null;
  var pendingDeleteLabel = '';

  window.openDeleteModal = function (btn, label) {
    pendingDeleteRow = btn.closest('tr');
    pendingDeleteLabel = label;
    document.getElementById('deleteTitleText').textContent = 'Delete ' + label + '?';
    document.getElementById('deleteBodyText').textContent = 'Are you sure you want to delete "' + label + '"? This action cannot be undone.';
    openModal('deleteModal');
  };

  var confirmDeleteBtn = document.getElementById('deleteConfirmBtn');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', function () {
      if (pendingDeleteRow) {
        var rowId = pendingDeleteRow.getAttribute('data-id');
        if (rowId) {
          try {
            if (rowId.indexOf('pl_') === 0) {
              var plans = JSON.parse(localStorage.getItem('taxcore_admin_custom_plans') || '[]');
              plans = plans.filter(function (p) { return p.id !== rowId; });
              localStorage.setItem('taxcore_admin_custom_plans', JSON.stringify(plans));
            } else if (rowId.indexOf('s_') === 0) {
              var services = JSON.parse(localStorage.getItem('taxcore_admin_custom_services') || '[]');
              services = services.filter(function (s) { return s.id !== rowId; });
              localStorage.setItem('taxcore_admin_custom_services', JSON.stringify(services));
            } else if (rowId.indexOf('doc_') === 0) {
              var docs = JSON.parse(localStorage.getItem('taxcore_admin_custom_docs') || '[]');
              docs = docs.filter(function (d) { return d.id !== rowId; });
              localStorage.setItem('taxcore_admin_custom_docs', JSON.stringify(docs));
            } else if (rowId.indexOf('f_') === 0) {
              var filings = JSON.parse(localStorage.getItem('taxcore_admin_custom_filings') || '[]');
              filings = filings.filter(function (f) { return f.id !== rowId; });
              localStorage.setItem('taxcore_admin_custom_filings', JSON.stringify(filings));
            }
          } catch (e) {}
        }
        pendingDeleteRow.style.transition = 'opacity 0.3s';
        pendingDeleteRow.style.opacity = '0';
        setTimeout(function () {
          if (pendingDeleteRow) {
            var table = pendingDeleteRow.closest('table');
            pendingDeleteRow.remove();
            if (table && table.id === 'filingsTable' && window.filterFilingsTable) {
              window.filterFilingsTable();
            }
          }
          pendingDeleteRow = null;
        }, 300);
      }
      closeModal('deleteModal');
      showToast(pendingDeleteLabel + ' deleted successfully!', 'success');
      pendingDeleteLabel = '';
    });
  }

  // ---- UTILITY HELPERS FOR MODALS & ROW DATA ----
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeJsString(str) {
    if (!str) return '';
    return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
  }

  function getBadgeClassForStatus(status) {
    var s = (status || '').toLowerCase().trim();
    if (s === 'inactive') return 'badge-gray';
    if (['active', 'completed', 'verified', 'paid'].indexOf(s) !== -1) return 'badge-success';
    if (['pending', 'under review', 'medium'].indexOf(s) !== -1) return 'badge-warning';
    if (['in progress', 'responded', 'on request'].indexOf(s) !== -1) return 'badge-primary';
    if (['rejected', 'high'].indexOf(s) !== -1) return 'badge-danger';
    return 'badge-gray';
  }

  function formatValueAsBadgeIfNeeded(val) {
    var v = String(val).trim();
    var lower = v.toLowerCase();
    var badgeClass = '';
    if (lower === 'inactive') badgeClass = 'badge-gray';
    else if (['active', 'completed', 'verified', 'paid'].indexOf(lower) !== -1) badgeClass = 'badge-success';
    else if (['pending', 'under review', 'medium'].indexOf(lower) !== -1) badgeClass = 'badge-warning';
    else if (['in progress', 'responded', 'on request'].indexOf(lower) !== -1) badgeClass = 'badge-primary';
    else if (['rejected', 'high'].indexOf(lower) !== -1) badgeClass = 'badge-danger';

    if (badgeClass) {
      return '<span class="status-badge ' + badgeClass + '">' + escapeHtml(v) + '</span>';
    }
    return escapeHtml(v);
  }

  function findStatusBadgeInRow(row) {
    if (!row) return null;
    var table = row.closest('table');
    if (table) {
      var ths = Array.from(table.querySelectorAll('thead th'));
      var statusIdx = ths.findIndex(function (th) {
        return th.textContent.trim().toLowerCase() === 'status';
      });
      if (statusIdx !== -1 && row.cells[statusIdx]) {
        var b = row.cells[statusIdx].querySelector('.status-badge');
        if (b) return b;
      }
    }
    // Fallback: the last .status-badge in the row (e.g. notices have priority first then status)
    var badges = row.querySelectorAll('.status-badge');
    if (badges.length > 0) {
      return badges[badges.length - 1];
    }
    return null;
  }

  function saveRowUpdateToStorage(id, data) {
    try {
      var current = JSON.parse(localStorage.getItem('taxcore_admin_row_updates') || '{}');
      current[id] = data;
      localStorage.setItem('taxcore_admin_row_updates', JSON.stringify(current));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }

  function restoreRowUpdatesFromStorage() {
    try {
      var raw = localStorage.getItem('taxcore_admin_row_updates');
      if (!raw) return;
      var updates = JSON.parse(raw);
      Object.keys(updates).forEach(function (id) {
        var row = document.querySelector('tr[data-id="' + id + '"]');
        if (!row) return;
        var data = updates[id];
        if (data && data.status) {
          row.setAttribute('data-status', data.status);
          var badge = findStatusBadgeInRow(row);
          if (badge) {
            badge.textContent = data.status;
            badge.className = 'status-badge ' + (data.badgeClass || getBadgeClassForStatus(data.status));
          } else {
            var table = row.closest('table');
            if (table) {
              var ths = Array.from(table.querySelectorAll('thead th'));
              var statusIdx = ths.findIndex(function (th) { return th.textContent.trim().toLowerCase() === 'status'; });
              if (statusIdx !== -1 && row.cells[statusIdx]) {
                row.cells[statusIdx].innerHTML = '<span class="status-badge ' + (data.badgeClass || getBadgeClassForStatus(data.status)) + '">' + escapeHtml(data.status) + '</span>';
              }
            }
          }
        }
        if (data && data.name) {
          var primaryCell = row.querySelector('.cell-primary');
          if (primaryCell) {
            var icon = primaryCell.querySelector('i');
            if (icon) {
              primaryCell.innerHTML = icon.outerHTML + ' ' + escapeHtml(data.name);
            } else {
              primaryCell.textContent = data.name;
            }
          }
        }
      });
    } catch (e) {
      console.warn('Could not restore from localStorage', e);
    }
  }

  // Restore any persisted updates on load
  restoreCustomPlansFromStorage();
  restoreCustomServicesFromStorage();
  restoreCustomFilingsFromStorage();
  restoreRowUpdatesFromStorage();
  restoreCustomDocsFromStorage();
  syncDocClientsList();
  if (window.filterFilingsTable) {
    window.filterFilingsTable();
  }

  // ---- VIEW MODAL ----
  window.openViewModal = function () {
    var args = Array.from(arguments);
    var labels = [];
    var row = null;

    // Detect triggering row if event is present
    if (typeof window !== 'undefined' && window.event) {
      var target = window.event.target;
      if (target) {
        row = target.closest('tr');
      }
    }

    if (row) {
      var table = row.closest('table');
      if (table) {
        var ths = table.querySelectorAll('thead th');
        ths.forEach(function (th) {
          var txt = th.textContent.trim();
          if (txt && txt.toLowerCase() !== 'action' && txt.toLowerCase() !== 'actions') {
            labels.push(txt);
          }
        });
      }
    }

    // Default column labels fallback if table headers were unavailable
    if (labels.length === 0) {
      labels = ['Item Name', 'Category / Type', 'Date', 'Due Date', 'Priority', 'Status', 'Amount'];
    }

    var displayPairs = [];

    if (row) {
      var cells = Array.from(row.cells);
      var headerIndex = 0;
      cells.forEach(function (cell) {
        // Skip action button column
        if (cell.classList.contains('action-btns') || cell.querySelector('.action-btns') || cell.querySelector('.btn-action')) {
          return;
        }
        var label = labels[headerIndex] || ('Field ' + (headerIndex + 1));
        var badge = cell.querySelector('.status-badge');
        var valHtml = '';
        var rawText = cell.textContent.trim();

        if (badge) {
          valHtml = badge.outerHTML;
        } else {
          var inlineStyle = cell.getAttribute('style');
          if (inlineStyle) {
            valHtml = '<span style="' + inlineStyle + '">' + escapeHtml(rawText) + '</span>';
          } else {
            valHtml = escapeHtml(rawText);
          }
        }

        if (rawText) {
          displayPairs.push({ label: label, valueHtml: valHtml, rawText: rawText });
        }
        headerIndex++;
      });
    }

    // If row wasn't accessible, use passed arguments mapped to headers
    if (displayPairs.length === 0) {
      args.forEach(function (v, i) {
        if (v !== undefined && v !== null && v !== '') {
          var label = labels[i] || ('Field ' + (i + 1));
          var valHtml = formatValueAsBadgeIfNeeded(v);
          displayPairs.push({ label: label, valueHtml: valHtml, rawText: String(v) });
        }
      });
    }

    var html = '<div class="view-details-container">';
    displayPairs.forEach(function (pair) {
      var isLong = pair.rawText.length > 35;
      html += '<div class="view-detail-card' + (isLong ? ' full-width' : '') + '">' +
        '<span class="view-detail-label">' + escapeHtml(pair.label) + '</span>' +
        '<span class="view-detail-value">' + pair.valueHtml + '</span>' +
        '</div>';
    });
    html += '</div>';

    var title = (displayPairs.length > 0 ? displayPairs[0].rawText : (args[0] || ''));
    document.getElementById('viewModalTitle').textContent = 'Details: ' + title;
    document.getElementById('viewModalBody').innerHTML = html;
    var footerEl = document.getElementById('viewModalFooter');
    if (footerEl) {
      footerEl.innerHTML = '<button type="button" class="btn-secondary-dash" onclick="closeModal(\'viewModal\')">Close</button>';
    }
    openModal('viewModal');
  };

  // ---- EDIT MODAL ----
  window.currentEditingId = null;

  window.openEditModal = function (id, label) {
    window.currentEditingId = id;
    var row = document.querySelector('tr[data-id="' + id + '"]');
    var currentStatus = '';
    var currentName = label || '';

    if (row) {
      var statusBadge = findStatusBadgeInRow(row);
      if (statusBadge) {
        currentStatus = statusBadge.textContent.trim();
      }
      var primaryCell = row.querySelector('.cell-primary');
      if (primaryCell) {
        var rawCellText = primaryCell.textContent.trim();
        if (!currentName) currentName = rawCellText;
      }
    }

    // Clean up label prefix if it starts with "Notice "
    var displayName = currentName;
    if (displayName.indexOf('Notice ') === 0) {
      displayName = displayName.substring(7);
    }

    document.getElementById('editModalTitle').textContent = 'Edit: ' + (displayName || label || id);

    var statuses = [
      'Active',
      'Inactive',
      'Pending',
      'Under Review',
      'In Progress',
      'Completed',
      'Responded',
      'Verified',
      'Paid',
      'Rejected',
      'On Request'
    ];

    // If currentStatus exists and is not in list, add it
    if (currentStatus && !statuses.some(function(s) { return s.toLowerCase() === currentStatus.toLowerCase(); })) {
      statuses.unshift(currentStatus);
    }

    var optionsHtml = '';
    statuses.forEach(function (st) {
      var isSel = currentStatus && (st.toLowerCase() === currentStatus.toLowerCase());
      optionsHtml += '<option value="' + escapeHtml(st) + '"' + (isSel ? ' selected' : '') + '>' + escapeHtml(st) + '</option>';
    });

    document.getElementById('editModalBody').innerHTML =
      '<form id="dashEditForm" onsubmit="event.preventDefault(); saveEdit();" style="width:100%;box-sizing:border-box;">' +
        '<div class="form-group" style="margin-bottom:18px;">' +
          '<label class="form-label" for="editItemName" style="font-weight:600;margin-bottom:6px;display:block;">Name / Title</label>' +
          '<input type="text" id="editItemName" class="dash-form-control" style="width:100%;box-sizing:border-box;" value="' + escapeHtml(displayName) + '" placeholder="Enter item name or title" required>' +
        '</div>' +
        '<div class="form-group" style="margin-bottom:18px;">' +
          '<label class="form-label" for="editItemStatus" style="font-weight:600;margin-bottom:6px;display:block;">Status</label>' +
          '<select id="editItemStatus" class="dash-form-control" style="width:100%;box-sizing:border-box;">' +
            optionsHtml +
          '</select>' +
        '</div>' +
        '<div class="form-group" style="margin-bottom:6px;">' +
          '<label class="form-label" for="editItemNotes" style="font-weight:600;margin-bottom:6px;display:block;">Notes / Remarks</label>' +
          '<textarea id="editItemNotes" class="dash-form-control" rows="3" style="width:100%;box-sizing:border-box;resize:vertical;" placeholder="Enter internal notes or comments..."></textarea>' +
        '</div>' +
      '</form>';

    openModal('editModal');
  };

  window.saveEdit = function () {
    var id = window.currentEditingId;
    if (!id) {
      closeModal('editModal');
      return;
    }

    var nameInput = document.getElementById('editItemName');
    var statusInput = document.getElementById('editItemStatus');
    var notesInput = document.getElementById('editItemNotes');

    var newName = nameInput ? nameInput.value.trim() : '';
    var newStatus = statusInput ? statusInput.value.trim() : 'Active';
    var newNotes = notesInput ? notesInput.value.trim() : '';

    var row = document.querySelector('tr[data-id="' + id + '"]');
    if (row) {
      // 1. Update Status Badge
      var badge = findStatusBadgeInRow(row);
      var badgeClass = getBadgeClassForStatus(newStatus);

      if (badge) {
        badge.textContent = newStatus;
        badge.className = 'status-badge ' + badgeClass;
      } else {
        // Find status column from table header
        var table = row.closest('table');
        if (table) {
          var ths = Array.from(table.querySelectorAll('thead th'));
          var statusIdx = ths.findIndex(function (th) { return th.textContent.trim().toLowerCase() === 'status'; });
          if (statusIdx !== -1 && row.cells[statusIdx]) {
            row.cells[statusIdx].innerHTML = '<span class="status-badge ' + badgeClass + '">' + escapeHtml(newStatus) + '</span>';
          }
        }
      }

      // 2. Update Name in row if modified
      if (newName) {
        var primaryCell = row.querySelector('.cell-primary');
        if (primaryCell) {
          var icon = primaryCell.querySelector('i');
          if (icon) {
            primaryCell.innerHTML = icon.outerHTML + ' ' + escapeHtml(newName);
          } else {
            primaryCell.textContent = newName;
          }
        }
      }

      // 3. Persist update in localStorage
      saveRowUpdateToStorage(id, {
        name: newName,
        status: newStatus,
        notes: newNotes,
        badgeClass: badgeClass
      });

      row.setAttribute('data-status', newStatus);
      if (row.closest('#filingsTable') && window.filterFilingsTable) {
        window.filterFilingsTable();
      }
    }

    closeModal('editModal');
    showToast('Status updated to "' + newStatus + '" successfully!', 'success');
  };

  // ---- ADD CLIENT FORM ----
  window.submitAddClient = function () {
    var nameEl = document.getElementById('cf_name');
    var emailEl = document.getElementById('cf_email');
    var phoneEl = document.getElementById('cf_phone');
    var serviceEl = document.getElementById('cf_service');
    var ok = true;

    function setErr(el, errId, show) {
      el.classList.toggle('is-invalid', show);
      var e = document.getElementById(errId);
      if (e) e.classList.toggle('show', show);
      if (show) ok = false;
    }

    setErr(nameEl, 'err_cf_name', !nameEl.value.trim());
    setErr(emailEl, 'err_cf_email', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value));
    setErr(phoneEl, 'err_cf_phone', !/^\d{10}$/.test(phoneEl.value));
    setErr(serviceEl, 'err_cf_service', !serviceEl.value);

    if (!ok) return;

    // Add row to clients table
    var tbody = document.querySelector('#clientsTable tbody');
    if (tbody) {
      var row = document.createElement('tr');
      var company = document.getElementById('cf_company').value || '-';
      var newId = 'c_' + Date.now();
      row.setAttribute('data-id', newId);
      row.innerHTML = '<td><div class="cell-primary">' + escapeHtml(nameEl.value) + '</div></td><td>' + escapeHtml(emailEl.value) + '</td><td>' + escapeHtml(phoneEl.value) + '</td><td>' + escapeHtml(company) + '</td><td>' + escapeHtml(serviceEl.value) + '</td><td><span class="status-badge badge-warning">Pending</span></td><td class="action-btns"><button type="button" class="btn-action btn-view" onclick="openViewModal(\'' + escapeJsString(nameEl.value) + '\',\'' + escapeJsString(emailEl.value) + '\',\'' + escapeJsString(phoneEl.value) + '\',\'' + escapeJsString(company) + '\',\'' + escapeJsString(serviceEl.value) + '\',\'Pending\')"><i class="bi bi-eye"></i></button><button type="button" class="btn-action btn-edit" onclick="openEditModal(\'' + newId + '\',\'' + escapeJsString(nameEl.value) + '\')"><i class="bi bi-pencil"></i></button><button type="button" class="btn-action btn-delete" onclick="openDeleteModal(this,\'Client: ' + escapeJsString(nameEl.value) + '\')"><i class="bi bi-trash"></i></button></td>';
      tbody.appendChild(row);
    }

    // Reset
    document.getElementById('addClientForm').reset();
    document.querySelectorAll('#addClientForm .is-invalid').forEach(function (el) { el.classList.remove('is-invalid'); });
    document.querySelectorAll('#addClientForm .form-error').forEach(function (el) { el.classList.remove('show'); });

    closeModal('addClientModal');
    showToast('Client added successfully!', 'success');
    syncDocClientsList();
  };

  // ---- DOCUMENT HELPERS & UPLOAD ----
  function getDocFileIcon(filename) {
    var ext = (filename || '').split('.').pop().toLowerCase();
    if (ext === 'pdf') {
      return { icon: 'bi-file-pdf-fill', color: '#ef4444', iconBoxClass: 'icon-pdf' };
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].indexOf(ext) !== -1) {
      return { icon: 'bi-file-image-fill', color: '#3b82f6', iconBoxClass: 'icon-img' };
    } else if (['txt', 'log', 'md', 'json'].indexOf(ext) !== -1) {
      return { icon: 'bi-file-earmark-text-fill', color: '#8b5cf6', iconBoxClass: 'icon-txt' };
    } else if (['doc', 'docx'].indexOf(ext) !== -1) {
      return { icon: 'bi-file-word-fill', color: '#2563eb', iconBoxClass: 'icon-doc' };
    } else if (['xls', 'xlsx', 'csv'].indexOf(ext) !== -1) {
      return { icon: 'bi-file-excel-fill', color: '#10b981', iconBoxClass: 'icon-sheet' };
    }
    return { icon: 'bi-file-earmark-fill', color: '#64748b', iconBoxClass: '' };
  }

  function formatFileSize(bytes) {
    if (!bytes || isNaN(bytes) || bytes <= 0) return '45.0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function getDocFormatDescription(filename) {
    var ext = (filename || '').split('.').pop().toUpperCase();
    if (ext === 'PDF') return 'Adobe PDF Document (.pdf)';
    if (['JPG', 'JPEG'].indexOf(ext) !== -1) return 'JPEG Image (.jpg)';
    if (ext === 'PNG') return 'Portable Network Graphics (.png)';
    if (ext === 'TXT') return 'Plain Text Document (.txt)';
    if (['DOC', 'DOCX'].indexOf(ext) !== -1) return 'Microsoft Word Document (.' + ext.toLowerCase() + ')';
    if (['XLS', 'XLSX'].indexOf(ext) !== -1) return 'Microsoft Excel Spreadsheet (.' + ext.toLowerCase() + ')';
    if (ext === 'CSV') return 'Comma Separated Values (.csv)';
    return (ext ? ext + ' File' : 'Electronic Document');
  }

  function formatUploadDate(dateObj) {
    var d = dateObj || new Date();
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var day = ('0' + d.getDate()).slice(-2);
    var month = months[d.getMonth()];
    var year = d.getFullYear();
    return day + ' ' + month + ' ' + year;
  }

  function formatUploadTime(dateObj) {
    var d = dateObj || new Date();
    var hours = d.getHours();
    var minutes = ('0' + d.getMinutes()).slice(-2);
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return ('0' + hours).slice(-2) + ':' + minutes + ' ' + ampm;
  }

  function syncDocClientsList() {
    var select = document.getElementById('docClientSelect');
    if (!select) return;
    var clientCells = document.querySelectorAll('#clientsTable tbody tr td.cell-primary, #clientsTable tbody tr td div.cell-primary');
    var existingValues = Array.from(select.options).map(function (o) { return o.value; });
    clientCells.forEach(function (cell) {
      var name = cell.textContent.trim();
      if (name && existingValues.indexOf(name) === -1) {
        var opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
        existingValues.push(name);
      }
    });
  }

  window.downloadUploadedDoc = function (id, filename) {
    try {
      var docs = JSON.parse(localStorage.getItem('taxcore_admin_custom_docs') || '[]');
      var match = docs.find(function (d) { return d.id === id; });
      if (match && match.dataUrl) {
        var link = document.createElement('a');
        link.href = match.dataUrl;
        link.download = filename || match.name || 'document';
        link.click();
        showToast('Downloading ' + (filename || match.name) + '...', 'info');
        return;
      }
    } catch (e) {}
    downloadDemo(filename || 'document.pdf');
  };

  window.openDocViewModal = function (docId, docName, client, type, date, status, size, time, format) {
    var id = docId || 'doc_demo';
    var name = docName || 'Document.pdf';
    var clientName = client || 'Client';
    var docType = type || 'Tax Document';
    var uploadDate = date || formatUploadDate();
    var uploadTime = time || '11:30 AM';
    var docSize = size || '45.0 KB';
    var docStatus = status || 'Verified';
    var formatDesc = format || getDocFormatDescription(name);
    var iconInfo = getDocFileIcon(name);
    var badgeClass = getBadgeClassForStatus(docStatus);

    var titleEl = document.getElementById('viewModalTitle');
    var bodyEl = document.getElementById('viewModalBody');
    var footerEl = document.getElementById('viewModalFooter');

    if (titleEl) {
      titleEl.textContent = 'Document Details: ' + name;
    }

    if (bodyEl) {
      bodyEl.innerHTML =
        '<div class="doc-view-header-banner">' +
          '<div class="doc-view-icon-badge" style="color:' + iconInfo.color + ';"><i class="bi ' + iconInfo.icon + '"></i></div>' +
          '<div class="doc-view-header-content">' +
            '<h4 class="doc-view-file-name">' + escapeHtml(name) + '</h4>' +
            '<div class="doc-view-header-sub">' +
              '<span class="doc-view-client"><i class="bi bi-person me-1"></i>' + escapeHtml(clientName) + '</span>' +
              '<span class="doc-view-divider">&bull;</span>' +
              '<span class="doc-view-type-badge">' + escapeHtml(docType) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="doc-view-verified-pill"><i class="bi bi-shield-check"></i> Verified Clean</div>' +
        '</div>' +
        '<div class="view-details-container">' +
          '<div class="view-detail-card">' +
            '<span class="view-detail-label">Document Name</span>' +
            '<span class="view-detail-value">' + escapeHtml(name) + '</span>' +
          '</div>' +
          '<div class="view-detail-card">' +
            '<span class="view-detail-label">Client</span>' +
            '<span class="view-detail-value cell-primary">' + escapeHtml(clientName) + '</span>' +
          '</div>' +
          '<div class="view-detail-card">' +
            '<span class="view-detail-label">Document Type</span>' +
            '<span class="view-detail-value">' + escapeHtml(docType) + '</span>' +
          '</div>' +
          '<div class="view-detail-card">' +
            '<span class="view-detail-label">Uploaded Date & Time</span>' +
            '<span class="view-detail-value">' + escapeHtml(uploadDate + (uploadTime ? ' · ' + uploadTime : '')) + '</span>' +
          '</div>' +
          '<div class="view-detail-card">' +
            '<span class="view-detail-label">File Size</span>' +
            '<span class="view-detail-value">' + escapeHtml(docSize) + '</span>' +
          '</div>' +
          '<div class="view-detail-card">' +
            '<span class="view-detail-label">Format / MIME</span>' +
            '<span class="view-detail-value">' + escapeHtml(formatDesc) + '</span>' +
          '</div>' +
          '<div class="view-detail-card">' +
            '<span class="view-detail-label">Verification Status</span>' +
            '<span class="view-detail-value"><span class="status-badge ' + badgeClass + '">' + escapeHtml(docStatus) + '</span></span>' +
          '</div>' +
          '<div class="view-detail-card">' +
            '<span class="view-detail-label">Security & Encryption</span>' +
            '<span class="view-detail-value" style="color:#22c55e;"><i class="bi bi-shield-lock-fill me-1"></i> 256-bit AES Encrypted</span>' +
          '</div>' +
          '<div class="view-detail-card full-width">' +
            '<span class="view-detail-label">Storage Location</span>' +
            '<span class="view-detail-value" style="font-family:monospace;font-size:0.85rem;color:#64748b;"><i class="bi bi-cloud-check me-1"></i>vault://taxcore-secure-storage/documents/' + escapeHtml(id) + '/' + escapeHtml(name) + '</span>' +
          '</div>' +
        '</div>';
    }

    if (footerEl) {
      footerEl.innerHTML =
        '<button type="button" class="btn-secondary-dash" onclick="closeModal(\'viewModal\')">Close</button>' +
        '<button type="button" class="btn-primary-brand" onclick="downloadUploadedDoc(\'' + escapeJsString(id) + '\',\'' + escapeJsString(name) + '\')"><i class="bi bi-download"></i> Download Document</button>';
    }

    openModal('viewModal');
  };

  function appendDocRow(doc, prepend) {
    var tbody = document.querySelector('#docsTable tbody');
    if (!tbody) return null;
    var row = document.createElement('tr');
    row.setAttribute('data-id', doc.id);
    var iconInfo = getDocFileIcon(doc.name);
    var badgeClass = getBadgeClassForStatus(doc.status || 'Verified');

    row.innerHTML =
      '<td><i class="bi ' + iconInfo.icon + '" style="color:' + iconInfo.color + ';margin-right:6px;"></i>' + escapeHtml(doc.name) + '</td>' +
      '<td class="cell-primary">' + escapeHtml(doc.client) + '</td>' +
      '<td>' + escapeHtml(doc.type) + '</td>' +
      '<td>' + escapeHtml(doc.date) + '</td>' +
      '<td><span class="status-badge ' + badgeClass + '">' + escapeHtml(doc.status || 'Verified') + '</span></td>' +
      '<td class="action-btns">' +
        '<button type="button" class="btn-action btn-view" onclick="openDocViewModal(\'' + escapeJsString(doc.id) + '\',\'' + escapeJsString(doc.name) + '\',\'' + escapeJsString(doc.client) + '\',\'' + escapeJsString(doc.type) + '\',\'' + escapeJsString(doc.date) + '\',\'' + escapeJsString(doc.status) + '\',\'' + escapeJsString(doc.size) + '\',\'' + escapeJsString(doc.time || '') + '\',\'' + escapeJsString(doc.format || '') + '\')"><i class="bi bi-eye"></i> View</button>' +
        '<button type="button" class="btn-action" onclick="downloadUploadedDoc(\'' + escapeJsString(doc.id) + '\',\'' + escapeJsString(doc.name) + '\')"><i class="bi bi-download"></i> Download</button>' +
        '<button type="button" class="btn-action btn-delete" onclick="openDeleteModal(this,\'Document: ' + escapeJsString(doc.name) + '\')"><i class="bi bi-trash"></i></button>' +
      '</td>';

    if (prepend && tbody.firstChild) {
      tbody.insertBefore(row, tbody.firstChild);
    } else {
      tbody.appendChild(row);
    }
    return row;
  }

  function saveCustomDocToStorage(doc) {
    try {
      var docs = JSON.parse(localStorage.getItem('taxcore_admin_custom_docs') || '[]');
      var docToSave = Object.assign({}, doc);
      if (docToSave.dataUrl && docToSave.dataUrl.length > 2000000) {
        delete docToSave.dataUrl;
      }
      docs.unshift(docToSave);
      localStorage.setItem('taxcore_admin_custom_docs', JSON.stringify(docs));
    } catch (e) {
      console.warn('Could not save document to localStorage', e);
    }
  }

  function restoreCustomDocsFromStorage() {
    try {
      var raw = localStorage.getItem('taxcore_admin_custom_docs');
      if (!raw) return;
      var docs = JSON.parse(raw);
      if (Array.isArray(docs)) {
        docs.slice().reverse().forEach(function (doc) {
          if (!document.querySelector('tr[data-id="' + doc.id + '"]')) {
            appendDocRow(doc, true);
          }
        });
      }
    } catch (e) {
      console.warn('Could not restore documents from localStorage', e);
    }
  }

  // Setup Document File input live preview
  var docFileInput = document.getElementById('docFileInput');
  var docFilePreview = document.getElementById('docFileDetailsPreview');
  var docFileError = document.getElementById('err_doc_file');

  if (docFileInput) {
    docFileInput.addEventListener('change', function () {
      if (docFileInput.files && docFileInput.files[0]) {
        var file = docFileInput.files[0];
        var iconInfo = getDocFileIcon(file.name);
        var sizeStr = formatFileSize(file.size);
        var formatDesc = getDocFormatDescription(file.name);

        var nameEl = document.getElementById('previewDocName');
        var sizeEl = document.getElementById('previewDocSize');
        var typeEl = document.getElementById('previewDocType');
        var iconBox = document.getElementById('previewDocIconBox');
        var iconEl = document.getElementById('previewDocIcon');

        if (nameEl) nameEl.textContent = file.name;
        if (sizeEl) sizeEl.textContent = sizeStr;
        if (typeEl) typeEl.textContent = formatDesc.split('(')[0].trim();
        if (iconBox) {
          iconBox.className = 'doc-file-preview-icon ' + iconInfo.iconBoxClass;
          iconBox.style.color = iconInfo.color;
        }
        if (iconEl) {
          iconEl.className = 'bi ' + iconInfo.icon;
        }

        if (docFilePreview) docFilePreview.style.display = 'flex';
        if (docFileError) docFileError.classList.remove('show');
        docFileInput.classList.remove('is-invalid');
      } else {
        if (docFilePreview) docFilePreview.style.display = 'none';
      }
    });
  }

  // ---- UPLOAD DOCUMENT ----
  window.submitUpload = function () {
    var fileInput = document.getElementById('docFileInput');
    var clientSelect = document.getElementById('docClientSelect');
    var typeSelect = document.getElementById('docTypeSelect');
    var errEl = document.getElementById('err_doc_file');

    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      if (fileInput) fileInput.classList.add('is-invalid');
      if (errEl) errEl.classList.add('show');
      return;
    }

    var file = fileInput.files[0];
    var docName = file.name;
    var docSize = formatFileSize(file.size);
    var docClient = clientSelect ? clientSelect.value : 'Priya Sharma';
    var docType = typeSelect ? typeSelect.value : 'PAN Card';
    var docDate = formatUploadDate(new Date());
    var docTime = formatUploadTime(new Date());
    var docFormat = getDocFormatDescription(docName);
    var docId = 'doc_' + Date.now();

    function finalizeUpload(dataUrl) {
      var doc = {
        id: docId,
        name: docName,
        client: docClient,
        type: docType,
        date: docDate,
        time: docTime,
        size: docSize,
        format: docFormat,
        status: 'Verified',
        dataUrl: dataUrl || ''
      };

      // Save to localStorage
      saveCustomDocToStorage(doc);

      // Append row to Documents table
      var newRow = appendDocRow(doc, true);
      if (newRow) {
        newRow.classList.add('doc-row-highlight');
        setTimeout(function () {
          newRow.classList.remove('doc-row-highlight');
        }, 3000);
      }

      // Add to searchData index
      if (typeof searchData !== 'undefined' && Array.isArray(searchData)) {
        var iconInfo = getDocFileIcon(docName);
        searchData.push({
          label: docName,
          section: 'section-documents',
          tag: 'Document',
          icon: iconInfo.icon,
          keywords: (docName + ' ' + docClient + ' ' + docType + ' document upload').toLowerCase()
        });
      }

      // Reset form & preview
      var form = document.getElementById('uploadDocForm');
      if (form) form.reset();
      var preview = document.getElementById('docFileDetailsPreview');
      if (preview) preview.style.display = 'none';
      if (errEl) errEl.classList.remove('show');
      if (fileInput) fileInput.classList.remove('is-invalid');

      // Close upload modal
      closeModal('uploadDocModal');

      // Switch to documents section
      switchSection('section-documents');

      // Show toast
      showToast('Document "' + docName + '" uploaded successfully!', 'success');

      // Immediately open document details modal so user sees document name and all details!
      openDocViewModal(doc.id, doc.name, doc.client, doc.type, doc.date, doc.status, doc.size, doc.time, doc.format);
    }

    // Read file dataUrl if file size < 4MB
    if (file.size < 4000000 && typeof FileReader !== 'undefined') {
      var reader = new FileReader();
      reader.onload = function (e) {
        finalizeUpload(e.target.result);
      };
      reader.onerror = function () {
        finalizeUpload('');
      };
      reader.readAsDataURL(file);
    } else {
      finalizeUpload('');
    }
  };

  // ---- ADD FILING ----
  function saveCustomFilingToStorage(filing) {
    try {
      var filings = JSON.parse(localStorage.getItem('taxcore_admin_custom_filings') || '[]');
      filings.push(filing);
      localStorage.setItem('taxcore_admin_custom_filings', JSON.stringify(filings));
    } catch (e) {
      console.warn('Could not save filing to localStorage', e);
    }
  }

  function appendFilingRow(filing) {
    var tbody = document.querySelector('#filingsTable tbody');
    if (!tbody) return;
    var row = document.createElement('tr');
    row.setAttribute('data-id', filing.id);
    row.setAttribute('data-client', filing.client);
    row.setAttribute('data-type', filing.type);
    row.setAttribute('data-status', filing.status);

    var badgeClass = getBadgeClassForStatus(filing.status);
    row.innerHTML =
      '<td class="cell-primary">' + escapeHtml(filing.client) + '</td>' +
      '<td>' + escapeHtml(filing.type) + '</td>' +
      '<td>' + escapeHtml(filing.subType) + '</td>' +
      '<td>' + escapeHtml(filing.dueDate) + '</td>' +
      '<td><span class="status-badge ' + badgeClass + '">' + escapeHtml(filing.status) + '</span></td>' +
      '<td>' + escapeHtml(filing.amount) + '</td>' +
      '<td class="action-btns">' +
        '<button type="button" class="btn-action btn-view" onclick="openViewModal(\'' + escapeJsString(filing.client) + '\',\'' + escapeJsString(filing.type) + '\',\'' + escapeJsString(filing.subType) + '\',\'' + escapeJsString(filing.dueDate) + '\',\'' + escapeJsString(filing.status) + '\',\'' + escapeJsString(filing.amount) + '\')"><i class="bi bi-eye"></i></button>' +
        '<button type="button" class="btn-action btn-edit" onclick="openEditModal(\'' + filing.id + '\',\'' + escapeJsString(filing.client) + ' ' + escapeJsString(filing.type) + '\')"><i class="bi bi-pencil"></i></button>' +
        '<button type="button" class="btn-action btn-delete" onclick="openDeleteModal(this,\'Filing: ' + escapeJsString(filing.client) + ' ' + escapeJsString(filing.type) + '\')"><i class="bi bi-trash"></i></button>' +
      '</td>';

    var noRow = document.getElementById('noFilingsRow');
    if (noRow) {
      tbody.insertBefore(row, noRow);
    } else {
      tbody.appendChild(row);
    }
  }

  function restoreCustomFilingsFromStorage() {
    try {
      var raw = localStorage.getItem('taxcore_admin_custom_filings');
      if (!raw) return;
      var filings = JSON.parse(raw);
      filings.forEach(function (filing) {
        appendFilingRow(filing);
      });
    } catch (e) {
      console.warn('Could not restore custom filings from localStorage', e);
    }
  }

  window.submitFiling = function () {
    var clientEl = document.getElementById('addFilingClient');
    var typeEl = document.getElementById('addFilingType');
    var subTypeEl = document.getElementById('addFilingSubType');
    var statusEl = document.getElementById('addFilingStatus');
    var dateEl = document.getElementById('addFilingDate');
    var amountEl = document.getElementById('addFilingAmount');

    var client = clientEl ? clientEl.value : 'Client';
    var type = typeEl ? typeEl.value : 'Income Tax';
    var subType = subTypeEl && subTypeEl.value.trim() ? subTypeEl.value.trim() : (type === 'Income Tax' ? 'Individual ITR' : 'Standard');
    var status = statusEl ? statusEl.value : 'In Progress';
    var rawDate = dateEl ? dateEl.value : '';
    var dueDate = rawDate ? new Date(rawDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '15 Oct 2026';
    var rawAmount = amountEl ? amountEl.value.trim() : '';
    var amount = rawAmount ? 'Rs.' + Number(rawAmount).toLocaleString('en-IN') : 'Rs.5,000';

    var newFiling = {
      id: 'f_' + Date.now(),
      client: client,
      type: type,
      subType: subType,
      dueDate: dueDate,
      status: status,
      amount: amount
    };

    appendFilingRow(newFiling);
    saveCustomFilingToStorage(newFiling);

    if (subTypeEl) subTypeEl.value = '';
    if (dateEl) dateEl.value = '';
    if (amountEl) amountEl.value = '';

    closeModal('addFilingModal');
    showToast('Tax filing added successfully!', 'success');
    if (window.filterFilingsTable) {
      window.filterFilingsTable();
    }
  };

  // ---- ADD PRICING PLAN ----
  function saveCustomPlanToStorage(plan) {
    try {
      var plans = JSON.parse(localStorage.getItem('taxcore_admin_custom_plans') || '[]');
      plans.push(plan);
      localStorage.setItem('taxcore_admin_custom_plans', JSON.stringify(plans));
    } catch (e) {
      console.warn('Could not save plan to localStorage', e);
    }
  }

  function appendPlanRow(plan) {
    var tbody = document.querySelector('#plansTable tbody');
    if (!tbody) return;
    var row = document.createElement('tr');
    row.setAttribute('data-id', plan.id);
    var badgeClass = getBadgeClassForStatus(plan.status);
    row.innerHTML =
      '<td class="cell-primary">' + escapeHtml(plan.name) + '</td>' +
      '<td>' + escapeHtml(plan.price) + '</td>' +
      '<td>' + escapeHtml(plan.billing) + '</td>' +
      '<td>' + escapeHtml(plan.features) + '</td>' +
      '<td>' + escapeHtml(plan.subscribers) + '</td>' +
      '<td><span class="status-badge ' + badgeClass + '">' + escapeHtml(plan.status) + '</span></td>' +
      '<td class="action-btns">' +
        '<button type="button" class="btn-action btn-view" onclick="openViewModal(\'' + escapeJsString(plan.name) + '\',\'' + escapeJsString(plan.price) + '\',\'' + escapeJsString(plan.billing) + '\',\'' + escapeJsString(plan.features) + '\',\'' + escapeJsString(plan.subscribers) + '\',\'' + escapeJsString(plan.status) + '\')"><i class="bi bi-eye"></i></button>' +
        '<button type="button" class="btn-action btn-edit" onclick="openEditModal(\'' + plan.id + '\',\'' + escapeJsString(plan.name) + ' Plan\')"><i class="bi bi-pencil"></i></button>' +
        '<button type="button" class="btn-action btn-delete" onclick="openDeleteModal(this,\'Plan: ' + escapeJsString(plan.name) + '\')"><i class="bi bi-trash"></i></button>' +
      '</td>';
    tbody.appendChild(row);
  }

  function restoreCustomPlansFromStorage() {
    try {
      var raw = localStorage.getItem('taxcore_admin_custom_plans');
      if (!raw) return;
      var plans = JSON.parse(raw);
      if (Array.isArray(plans)) {
        plans.forEach(function (plan) {
          if (!document.querySelector('tr[data-id="' + plan.id + '"]')) {
            appendPlanRow(plan);
          }
        });
      }
    } catch (e) {
      console.warn('Could not restore plans from localStorage', e);
    }
  }

  window.submitAddPlan = function () {
    var nameEl = document.getElementById('pl_name');
    var priceEl = document.getElementById('pl_price');
    var billingEl = document.getElementById('pl_billing');
    var featuresEl = document.getElementById('pl_features');
    var subsEl = document.getElementById('pl_subscribers');
    var statusEl = document.getElementById('pl_status');

    var ok = true;
    function setErr(el, errId, show) {
      if (el) el.classList.toggle('is-invalid', show);
      var e = document.getElementById(errId);
      if (e) e.classList.toggle('show', show);
      if (show) ok = false;
    }

    setErr(nameEl, 'err_pl_name', !nameEl || !nameEl.value.trim());
    setErr(priceEl, 'err_pl_price', !priceEl || !priceEl.value.trim());
    setErr(featuresEl, 'err_pl_features', !featuresEl || !featuresEl.value.trim());

    if (!ok) return;

    var planPrice = priceEl.value.trim();
    if (!/^Rs\./i.test(planPrice) && planPrice.toLowerCase() !== 'custom' && /^\d/.test(planPrice)) {
      planPrice = 'Rs.' + planPrice;
    }

    var plan = {
      id: 'pl_' + Date.now(),
      name: nameEl.value.trim(),
      price: planPrice,
      billing: billingEl ? billingEl.value : 'Monthly',
      features: featuresEl.value.trim(),
      subscribers: (subsEl && subsEl.value.trim()) ? subsEl.value.trim() : '0',
      status: statusEl ? statusEl.value : 'Active'
    };

    appendPlanRow(plan);
    saveCustomPlanToStorage(plan);

    // Reset & close
    var form = document.getElementById('addPlanForm');
    if (form) form.reset();
    document.querySelectorAll('#addPlanForm .is-invalid').forEach(function (el) { el.classList.remove('is-invalid'); });
    document.querySelectorAll('#addPlanForm .form-error').forEach(function (el) { el.classList.remove('show'); });

    closeModal('addPlanModal');
    showToast('Plan "' + plan.name + '" added successfully!', 'success');
  };

  // ---- ADD SERVICE ----
  function saveCustomServiceToStorage(service) {
    try {
      var services = JSON.parse(localStorage.getItem('taxcore_admin_custom_services') || '[]');
      services.push(service);
      localStorage.setItem('taxcore_admin_custom_services', JSON.stringify(services));
    } catch (e) {
      console.warn('Could not save service to localStorage', e);
    }
  }

  function appendServiceRow(service) {
    var tbody = document.querySelector('#servicesTable tbody');
    if (!tbody) return;
    var row = document.createElement('tr');
    row.setAttribute('data-id', service.id);
    var badgeClass = getBadgeClassForStatus(service.status);
    row.innerHTML =
      '<td class="cell-primary"><i class="bi ' + escapeHtml(service.icon || 'bi-briefcase-fill') + ' me-2" style="color:#22c55e;"></i>' + escapeHtml(service.name) + '</td>' +
      '<td>' + escapeHtml(service.desc) + '</td>' +
      '<td>' + escapeHtml(service.price) + '</td>' +
      '<td><span class="status-badge ' + badgeClass + '">' + escapeHtml(service.status) + '</span></td>' +
      '<td class="action-btns">' +
        '<button type="button" class="btn-action btn-view" onclick="openViewModal(\'' + escapeJsString(service.name) + '\',\'' + escapeJsString(service.desc) + '\',\'' + escapeJsString(service.price) + '\',\'\',\'\',\'' + escapeJsString(service.status) + '\')"><i class="bi bi-eye"></i></button>' +
        '<button type="button" class="btn-action btn-edit" onclick="openEditModal(\'' + service.id + '\',\'' + escapeJsString(service.name) + '\')"><i class="bi bi-pencil"></i></button>' +
        '<button type="button" class="btn-action btn-delete" onclick="openDeleteModal(this,\'Service: ' + escapeJsString(service.name) + '\')"><i class="bi bi-trash"></i></button>' +
      '</td>';
    tbody.appendChild(row);
  }

  function restoreCustomServicesFromStorage() {
    try {
      var raw = localStorage.getItem('taxcore_admin_custom_services');
      if (!raw) return;
      var services = JSON.parse(raw);
      if (Array.isArray(services)) {
        services.forEach(function (service) {
          if (!document.querySelector('tr[data-id="' + service.id + '"]')) {
            appendServiceRow(service);
          }
        });
      }
    } catch (e) {
      console.warn('Could not restore services from localStorage', e);
    }
  }

  window.submitAddService = function () {
    var nameEl = document.getElementById('sv_name');
    var priceEl = document.getElementById('sv_price');
    var iconEl = document.getElementById('sv_icon');
    var statusEl = document.getElementById('sv_status');
    var descEl = document.getElementById('sv_desc');

    var ok = true;
    function setErr(el, errId, show) {
      if (el) el.classList.toggle('is-invalid', show);
      var e = document.getElementById(errId);
      if (e) e.classList.toggle('show', show);
      if (show) ok = false;
    }

    setErr(nameEl, 'err_sv_name', !nameEl || !nameEl.value.trim());
    setErr(priceEl, 'err_sv_price', !priceEl || !priceEl.value.trim());
    setErr(descEl, 'err_sv_desc', !descEl || !descEl.value.trim());

    if (!ok) return;

    var sPrice = priceEl.value.trim();
    if (!/^Rs\./i.test(sPrice) && /^\d/.test(sPrice)) {
      sPrice = 'Rs.' + sPrice;
    }

    var service = {
      id: 's_' + Date.now(),
      name: nameEl.value.trim(),
      desc: descEl.value.trim(),
      price: sPrice,
      icon: iconEl ? iconEl.value : 'bi-briefcase-fill',
      status: statusEl ? statusEl.value : 'Active'
    };

    appendServiceRow(service);
    saveCustomServiceToStorage(service);

    // Reset & close
    var form = document.getElementById('addServiceForm');
    if (form) form.reset();
    document.querySelectorAll('#addServiceForm .is-invalid').forEach(function (el) { el.classList.remove('is-invalid'); });
    document.querySelectorAll('#addServiceForm .form-error').forEach(function (el) { el.classList.remove('show'); });

    closeModal('addServiceModal');
    showToast('Service "' + service.name + '" added successfully!', 'success');
  };

  // ---- RESPOND TO TAX NOTICE ----
  window.openRespondNoticeModal = function (id, client, noticeType, noticeDate, deadline) {
    var row = document.querySelector('tr[data-id="' + id + '"]');
    if (!client && row) {
      var primaryCell = row.querySelector('.cell-primary');
      if (primaryCell) client = primaryCell.textContent.trim();
      if (row.cells[1]) noticeType = row.cells[1].textContent.trim();
      if (row.cells[2]) noticeDate = row.cells[2].textContent.trim();
      if (row.cells[3]) deadline = row.cells[3].textContent.trim();
    }

    var idEl = document.getElementById('resp_notice_id');
    var clientEl = document.getElementById('resp_client_name');
    var typeEl = document.getElementById('resp_notice_type');
    var dateEl = document.getElementById('resp_notice_date');
    var deadlineEl = document.getElementById('resp_notice_deadline');
    var refEl = document.getElementById('resp_ref_no');
    var remarksEl = document.getElementById('resp_remarks');
    var statusEl = document.getElementById('resp_status');

    if (idEl) idEl.value = id || '';
    if (clientEl) clientEl.value = client || '';
    if (typeEl) typeEl.value = noticeType || '';
    if (dateEl) dateEl.value = noticeDate || '';
    if (deadlineEl) deadlineEl.value = deadline || '';

    // Auto-generate reference number placeholder if empty
    if (refEl) {
      refEl.value = 'ACK-NOT-' + Math.floor(100000 + Math.random() * 900000);
      refEl.classList.remove('is-invalid');
    }
    if (remarksEl) {
      remarksEl.value = '';
      remarksEl.classList.remove('is-invalid');
    }
    if (statusEl) statusEl.value = 'Responded';

    document.querySelectorAll('#respondNoticeForm .form-error').forEach(function (el) { el.classList.remove('show'); });

    openModal('respondNoticeModal');
  };

  window.submitNoticeResponse = function () {
    var idEl = document.getElementById('resp_notice_id');
    var clientEl = document.getElementById('resp_client_name');
    var actionEl = document.getElementById('resp_action_type');
    var statusEl = document.getElementById('resp_status');
    var refEl = document.getElementById('resp_ref_no');
    var remarksEl = document.getElementById('resp_remarks');

    var ok = true;
    function setErr(el, errId, show) {
      if (el) el.classList.toggle('is-invalid', show);
      var e = document.getElementById(errId);
      if (e) e.classList.toggle('show', show);
      if (show) ok = false;
    }

    setErr(refEl, 'err_resp_ref_no', !refEl || !refEl.value.trim());
    setErr(remarksEl, 'err_resp_remarks', !remarksEl || !remarksEl.value.trim());

    if (!ok) return;

    var id = idEl ? idEl.value : '';
    var client = clientEl ? clientEl.value : 'Client';
    var actionType = actionEl ? actionEl.value : 'Response Submitted';
    var newStatus = statusEl ? statusEl.value : 'Responded';
    var refNo = refEl ? refEl.value.trim() : '';
    var remarks = remarksEl ? remarksEl.value.trim() : '';

    var row = document.querySelector('tr[data-id="' + id + '"]');
    if (row) {
      var badge = findStatusBadgeInRow(row);
      var badgeClass = getBadgeClassForStatus(newStatus);
      if (badge) {
        badge.textContent = newStatus;
        badge.className = 'status-badge ' + badgeClass;
      }
      saveRowUpdateToStorage(id, {
        status: newStatus,
        actionType: actionType,
        ackRef: refNo,
        remarks: remarks,
        badgeClass: badgeClass
      });
    }

    closeModal('respondNoticeModal');
    showToast('Response submitted for ' + client + ' (Ref: ' + refNo + ')!', 'success');
  };

  // ---- TOAST ----
  function showToast(msg, type) {
    type = type || 'success';
    var area = document.getElementById('toastArea');
    if (!area) return;
    var icons = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', info: 'bi-info-circle-fill' };
    var id = 'toast-' + Date.now();
    var el = document.createElement('div');
    el.className = 'toast-item toast-' + type;
    el.id = id;
    el.innerHTML = '<i class="bi ' + (icons[type] || icons.success) + '"></i> ' + msg;
    area.appendChild(el);
    setTimeout(function () {
      el.style.opacity = '0';
      el.style.transform = 'translateX(40px)';
      el.style.transition = 'all 0.3s';
      setTimeout(function () { el.remove(); }, 300);
    }, 3500);
  }
  window.showToast = showToast;

  // ---- LOGOUT ----
  window.doLogout = function () {
    if (window.TaxCoreAuth) {
      TaxCoreAuth.clearCurrentUser();
    } else {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('taxcoreAdminLoggedIn');
    }
    try {
      localStorage.removeItem('tcRememberEmail');
      localStorage.removeItem('rememberEmail');
      sessionStorage.removeItem('tcRememberEmail');
    } catch (e) {}
    showToast('Logged out successfully!', 'success');
    setTimeout(function () { window.location.href = 'login.html'; }, 800);
  };

  // ---- DROPDOWNS ----
  window.closeDropdowns = function () {
    var nd = document.getElementById('notifDropdown');
    var pd = document.getElementById('profileDropdown');
    var sd = document.getElementById('searchDropdown');
    if (nd) nd.classList.remove('show');
    if (pd) pd.classList.remove('show');
    if (sd) sd.classList.remove('show');
  };

  var notifBtnEl = document.getElementById('notifBtn');
  if (notifBtnEl) {
    notifBtnEl.addEventListener('click', function (e) {
      e.stopPropagation();
      var d = document.getElementById('notifDropdown');
      if (!d) return;
      var wasOpen = d.classList.contains('show');
      closeDropdowns();
      if (!wasOpen) d.classList.add('show');
    });
  }

  var profileBtnEl = document.getElementById('profileBtn');
  if (profileBtnEl) {
    profileBtnEl.addEventListener('click', function (e) {
      e.stopPropagation();
      var d = document.getElementById('profileDropdown');
      if (!d) return;
      var wasOpen = d.classList.contains('show');
      closeDropdowns();
      if (!wasOpen) d.classList.add('show');
    });

    profileBtnEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') this.click();
    });
  }

  document.addEventListener('click', function () { closeDropdowns(); });

  // ---- MARK ALL READ ----
  window.markAllRead = function () {
    document.querySelectorAll('.notif-item.unread').forEach(function (el) { el.classList.remove('unread'); });
    var badge = document.getElementById('notifBadge');
    if (badge) badge.style.display = 'none';
    showToast('All notifications marked as read.', 'info');
  };

  // ---- THEME TOGGLE ----
  var themeBtn = document.getElementById('themeToggleBtn');
  var themeIcon = document.getElementById('themeIcon');

  function applyTheme(dark) {
    if (dark) {
      document.body.classList.add('dark-mode');
      document.documentElement.classList.add('dark-mode');
      if (themeIcon) { themeIcon.classList.remove('bi-moon-stars-fill'); themeIcon.classList.add('bi-sun-fill'); }
      localStorage.setItem('tcDarkMode', 'true');
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.classList.remove('dark-mode');
      if (themeIcon) { themeIcon.classList.remove('bi-sun-fill'); themeIcon.classList.add('bi-moon-stars-fill'); }
      localStorage.setItem('tcDarkMode', 'false');
    }
    var appearDark = document.getElementById('appearanceDarkToggle');
    if (appearDark) appearDark.classList.toggle('on', dark);
    // Re-init charts for theme colors
    setTimeout(reinitCharts, 100);
  }

  // Init icon
  if (localStorage.getItem('tcDarkMode') === 'true') {
    if (themeIcon) { themeIcon.classList.remove('bi-moon-stars-fill'); themeIcon.classList.add('bi-sun-fill'); }
    var ad = document.getElementById('appearanceDarkToggle');
    if (ad) ad.classList.add('on');
  }

  if (themeBtn) themeBtn.addEventListener('click', function () {
    applyTheme(!document.body.classList.contains('dark-mode'));
  });

  window.toggleDarkFromSettings = function () {
    applyTheme(!document.body.classList.contains('dark-mode'));
  };

  // ---- RTL TOGGLE ----
  var rtlBtn = document.getElementById('rtlToggleBtn');

  function applyRtl(rtl) {
    if (rtl) {
      document.documentElement.setAttribute('dir', 'rtl');
      localStorage.setItem('tcRtl', 'true');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      localStorage.setItem('tcRtl', 'false');
    }
    var appearRtl = document.getElementById('appearanceRtlToggle');
    if (appearRtl) appearRtl.classList.toggle('on', rtl);
  }

  if (localStorage.getItem('tcRtl') === 'true') {
    var ar = document.getElementById('appearanceRtlToggle');
    if (ar) ar.classList.add('on');
  }

  if (rtlBtn) rtlBtn.addEventListener('click', function () {
    applyRtl(document.documentElement.getAttribute('dir') !== 'rtl');
  });

  window.toggleRtlFromSettings = function () {
    applyRtl(document.documentElement.getAttribute('dir') !== 'rtl');
  };

  // ---- SETTINGS TABS ----
  document.querySelectorAll('.settings-tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var tabId = this.getAttribute('data-tab');
      document.querySelectorAll('.settings-tab-btn').forEach(function (b) { b.classList.remove('active'); });
      document.querySelectorAll('.settings-tab-content').forEach(function (c) { c.classList.remove('active'); });
      this.classList.add('active');
      var tab = document.getElementById(tabId);
      if (tab) tab.classList.add('active');
    });
  });

  // ---- SAVE SETTINGS ----
  window.saveSettings = function (msg) {
    showToast(msg || 'Settings saved successfully!', 'success');
  };

  // ---- TOGGLE SWITCH ----
  window.toggleSwitch = function (el) {
    el.classList.toggle('on');
  };

  // ---- HTML ESCAPE UTILITY ----
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ---- GLOBAL SEARCH ----
  var searchData = [
    // Navigation / Sections
    { label: 'Dashboard Overview', section: 'section-overview', tag: 'Section', icon: 'bi-speedometer2', keywords: 'home overview analytics stats metrics summary' },
    { label: 'Clients Management', section: 'section-clients', tag: 'Section', icon: 'bi-people-fill', keywords: 'clients users customers taxpayers accounts individuals' },
    { label: 'Tax Filings', section: 'section-filings', tag: 'Section', icon: 'bi-file-earmark-text-fill', keywords: 'filings itr gst corporate returns tax submission' },
    { label: 'Documents & Vault', section: 'section-documents', tag: 'Section', icon: 'bi-folder2-open', keywords: 'documents files uploads pan aadhaar statement bills certificates' },
    { label: 'Tax Notices & Scrutiny', section: 'section-notices', tag: 'Section', icon: 'bi-exclamation-triangle-fill', keywords: 'notices scrutiny demand audit 143(1) department' },
    { label: 'Payments & Transactions', section: 'section-payments', tag: 'Section', icon: 'bi-credit-card-fill', keywords: 'payments invoices transactions billing fees receipts revenue' },
    { label: 'Services Catalog', section: 'section-services', tag: 'Section', icon: 'bi-briefcase-fill', keywords: 'services offerings packages bookkeeping gst filing audit' },
    { label: 'Pricing Plans', section: 'section-plans', tag: 'Section', icon: 'bi-tags-fill', keywords: 'pricing plans subscriptions tiers cost packages' },
    { label: 'Tax Calendar & Deadlines', section: 'section-calendar', tag: 'Section', icon: 'bi-calendar3', keywords: 'calendar dates deadlines advance tax due dates' },
    { label: 'Messages & Support Chat', section: 'section-messages', tag: 'Section', icon: 'bi-chat-dots-fill', keywords: 'messages chat conversations inbox support inquiries contact' },
    { label: 'Reports & Analytics', section: 'section-reports', tag: 'Section', icon: 'bi-bar-chart-fill', keywords: 'reports export revenue csv print financial statements' },
    { label: 'Settings & Appearance', section: 'section-settings', tag: 'Section', icon: 'bi-gear-fill', keywords: 'settings profile dark mode rtl configuration preferences' },

    // Quick Actions
    { label: 'Add New Client', section: 'section-clients', actionType: 'modal', modalId: 'addClientModal', tag: 'Action', icon: 'bi-person-plus-fill', keywords: 'create new client register taxpayer' },
    { label: 'Add Tax Filing', section: 'section-filings', actionType: 'modal', modalId: 'addFilingModal', tag: 'Action', icon: 'bi-plus-circle-fill', keywords: 'create filing submit return new filing' },
    { label: 'Upload Document', section: 'section-documents', actionType: 'modal', modalId: 'uploadDocModal', tag: 'Action', icon: 'bi-cloud-arrow-up-fill', keywords: 'upload attach document pdf file' },
    { label: 'Add Pricing Plan', section: 'section-plans', actionType: 'modal', modalId: 'addPlanModal', tag: 'Action', icon: 'bi-tag-fill', keywords: 'new pricing plan subscription tier' },
    { label: 'Add New Service', section: 'section-services', actionType: 'modal', modalId: 'addServiceModal', tag: 'Action', icon: 'bi-briefcase-fill', keywords: 'new service offering package' },

    // Direct Contact Conversations (navigates directly to Messages & opens client chat!)
    { label: 'Raj Kumar (Chat)', section: 'section-messages', convoName: 'Raj Kumar', tag: 'Message', icon: 'bi-chat-left-text-fill', keywords: 'raj kumar chat conversation message bank statements upload' },
    { label: 'Priya Sharma (Chat)', section: 'section-messages', convoName: 'Priya Sharma', tag: 'Message', icon: 'bi-chat-left-text-fill', keywords: 'priya sharma chat conversation message gst update acknowledgment' },
    { label: 'Arun Kumar (Chat)', section: 'section-messages', convoName: 'Arun Kumar', tag: 'Message', icon: 'bi-chat-left-text-fill', keywords: 'arun kumar chat conversation message itr filed status' },
    { label: 'Meena Patel (Chat)', section: 'section-messages', convoName: 'Meena Patel', tag: 'Message', icon: 'bi-chat-left-text-fill', keywords: 'meena patel chat conversation message check documents corporate tax' },

    // Client records in Clients section
    { label: 'Raj Kumar (Client Profile)', section: 'section-clients', filterText: 'Raj Kumar', tag: 'Client', icon: 'bi-person-fill', keywords: 'raj kumar individual itr client profile' },
    { label: 'Priya Sharma (Client Profile)', section: 'section-clients', filterText: 'Priya Sharma', tag: 'Client', icon: 'bi-person-fill', keywords: 'priya sharma business client profile' },
    { label: 'Arun Kumar (Client Profile)', section: 'section-clients', filterText: 'Arun Kumar', tag: 'Client', icon: 'bi-person-fill', keywords: 'arun kumar freelancer client profile' },
    { label: 'Meena Patel (Client Profile)', section: 'section-clients', filterText: 'Meena Patel', tag: 'Client', icon: 'bi-person-fill', keywords: 'meena patel enterprise corporate client profile' },

    // Filings / Documents / Notices / Payments / Reports
    { label: 'Income Tax Return (ITR-1/2/4)', section: 'section-filings', filterText: 'Income Tax', tag: 'Filing', icon: 'bi-file-earmark-text', keywords: 'income tax filing individual return itr' },
    { label: 'GST Monthly Return (GSTR-3B)', section: 'section-filings', filterText: 'GST', tag: 'Filing', icon: 'bi-receipt', keywords: 'gst return gstr-1 gstr-3b tax invoice' },
    { label: 'Corporate Income Tax Filing', section: 'section-filings', filterText: 'Corporate Tax', tag: 'Filing', icon: 'bi-building', keywords: 'corporate tax company filing private limited' },
    { label: 'TDS Quarterly Filing', section: 'section-filings', filterText: 'TDS', tag: 'Filing', icon: 'bi-percent', keywords: 'tds filing tax deducted at source 26q 24q' },
    { label: 'PAN_Card_Raj.pdf', section: 'section-documents', tag: 'Document', icon: 'bi-file-earmark-pdf-fill', keywords: 'pan card document raj identification' },
    { label: 'Bank_Statement_Priya.pdf', section: 'section-documents', tag: 'Document', icon: 'bi-file-earmark-pdf-fill', keywords: 'bank statement priya hdfc sbi icici' },
    { label: 'Section 143(1) Intimation Notice', section: 'section-notices', tag: 'Notice', icon: 'bi-exclamation-triangle-fill', keywords: 'section 143(1) notice tax demand intimation' },
    { label: 'GST Scrutiny Notice ASMT-10', section: 'section-notices', tag: 'Notice', icon: 'bi-exclamation-triangle-fill', keywords: 'gst notice scrutiny asmt-10 audit' },
    { label: 'TXN-88492 (Paid Rs. 4,500)', section: 'section-payments', tag: 'Payment', icon: 'bi-credit-card-2-front-fill', keywords: 'payment transaction receipt txn-88492' },
    { label: 'Revenue & Financial Report', section: 'section-reports', tag: 'Report', icon: 'bi-graph-up-arrow', keywords: 'revenue report income earnings profit' }
  ];

  var searchInput = document.getElementById('globalSearch');
  var searchDropdown = document.getElementById('searchDropdown');
  var globalSearchBtn = document.getElementById('globalSearchBtn');
  var globalSearchClear = document.getElementById('globalSearchClear');

  window.executeSearchResult = function (item) {
    if (!item) return;
    if (searchInput) searchInput.value = '';
    if (globalSearchClear) globalSearchClear.style.display = 'none';
    if (searchDropdown) searchDropdown.classList.remove('show');

    if (item.section) {
      switchSection(item.section);
    }

    if (item.actionType === 'modal' && item.modalId) {
      setTimeout(function () {
        openModal(item.modalId);
      }, 120);
    } else if (item.convoName) {
      setTimeout(function () {
        openConvoByName(item.convoName);
      }, 120);
    } else if (item.filterText && item.section === 'section-clients') {
      var clientSearch = document.querySelector('#section-clients .table-search-box input');
      if (clientSearch) {
        clientSearch.value = item.filterText;
        filterTable('clientsTable', item.filterText);
      }
    } else if (item.filterText && item.section === 'section-filings') {
      var filingSearch = document.querySelector('#section-filings .table-search-box input');
      if (filingSearch) {
        filingSearch.value = item.filterText;
        filterTable('filingsTable', item.filterText);
      }
    }
  };

  function renderQuickLinks() {
    if (!searchDropdown) return;
    var quickItems = [
      { label: 'Messages & Support Chat', section: 'section-messages', tag: 'Quick Link', icon: 'bi-chat-dots-fill' },
      { label: 'Clients Management', section: 'section-clients', tag: 'Quick Link', icon: 'bi-people-fill' },
      { label: 'Tax Filings', section: 'section-filings', tag: 'Quick Link', icon: 'bi-file-earmark-text-fill' },
      { label: 'Documents Vault', section: 'section-documents', tag: 'Quick Link', icon: 'bi-folder2-open' },
      { label: 'Add New Client', section: 'section-clients', actionType: 'modal', modalId: 'addClientModal', tag: 'Action', icon: 'bi-person-plus-fill' },
      { label: 'Settings & Appearance', section: 'section-settings', tag: 'Quick Link', icon: 'bi-gear-fill' }
    ];
    var html = '<div class="search-header-group"><i class="bi bi-stars text-green me-1"></i> Quick Links & Shortcuts</div>';
    html += quickItems.map(function (item, idx) {
      return '<div class="search-result-item" data-idx="' + idx + '">' +
        '<i class="bi ' + item.icon + '"></i>' +
        '<span class="result-label">' + item.label + '</span>' +
        '<span class="result-tag">' + item.tag + '</span>' +
      '</div>';
    }).join('');
    searchDropdown.innerHTML = html;
    searchDropdown.querySelectorAll('.search-result-item').forEach(function (el, idx) {
      el.addEventListener('click', function () {
        executeSearchResult(quickItems[idx]);
      });
    });
    searchDropdown.classList.add('show');
  }

  function renderGlobalSearchResults(q) {
    if (!searchDropdown) return;
    var cleanQ = (q || '').toLowerCase().trim();
    if (globalSearchClear) globalSearchClear.style.display = cleanQ ? 'flex' : 'none';
    if (!cleanQ) {
      searchDropdown.classList.remove('show');
      return;
    }

    var results = searchData.filter(function (d) {
      var labelMatch = d.label.toLowerCase().includes(cleanQ);
      var tagMatch = d.tag && d.tag.toLowerCase().includes(cleanQ);
      var keywordMatch = d.keywords && d.keywords.toLowerCase().includes(cleanQ);
      return labelMatch || tagMatch || keywordMatch;
    });

    if (!results.length) {
      searchDropdown.innerHTML = '<div class="search-no-results">' +
        '<i class="bi bi-search"></i>' +
        '<div style="font-weight:600;color:inherit;">No results found for "' + escapeHtml(cleanQ) + '"</div>' +
        '<div class="search-hint">Try searching for Messages, Clients, Filings, Documents, or Settings</div>' +
      '</div>';
      searchDropdown.classList.add('show');
      return;
    }

    var html = '<div class="search-header-group">Search Results (' + results.length + ')</div>';
    html += results.map(function (r, idx) {
      return '<div class="search-result-item' + (idx === 0 ? ' highlighted' : '') + '" data-idx="' + idx + '">' +
        '<i class="bi ' + (r.icon || 'bi-arrow-right-circle') + '"></i>' +
        '<span class="result-label">' + r.label + '</span>' +
        '<span class="result-tag">' + r.tag + '</span>' +
      '</div>';
    }).join('');

    searchDropdown.innerHTML = html;
    searchDropdown.querySelectorAll('.search-result-item').forEach(function (el, idx) {
      el.addEventListener('click', function () {
        executeSearchResult(results[idx]);
      });
      el.addEventListener('mouseenter', function () {
        searchDropdown.querySelectorAll('.search-result-item').forEach(function (node) { node.classList.remove('highlighted'); });
        el.classList.add('highlighted');
      });
    });
    searchDropdown.classList.add('show');
  }

  if (searchInput) {
    searchInput.addEventListener('input', function () {
      renderGlobalSearchResults(this.value);
    });

    searchInput.addEventListener('keydown', function (e) {
      var items = searchDropdown ? searchDropdown.querySelectorAll('.search-result-item') : [];
      if (!items.length || !searchDropdown.classList.contains('show')) {
        if (e.key === 'Enter') {
          e.preventDefault();
          renderGlobalSearchResults(this.value);
        }
        return;
      }

      var highlighted = searchDropdown.querySelector('.search-result-item.highlighted');
      var currentIdx = -1;
      items.forEach(function (item, index) {
        if (item === highlighted) currentIdx = index;
      });

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        var nextIdx = (currentIdx + 1) % items.length;
        items.forEach(function (it) { it.classList.remove('highlighted'); });
        items[nextIdx].classList.add('highlighted');
        items[nextIdx].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        var prevIdx = (currentIdx - 1 + items.length) % items.length;
        items.forEach(function (it) { it.classList.remove('highlighted'); });
        items[prevIdx].classList.add('highlighted');
        items[prevIdx].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        var target = highlighted || items[0];
        if (target) target.click();
      } else if (e.key === 'Escape') {
        searchDropdown.classList.remove('show');
      }
    });

    searchInput.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!this.value.trim()) {
        renderQuickLinks();
      } else {
        renderGlobalSearchResults(this.value);
      }
    });
  }

  if (globalSearchBtn) {
    globalSearchBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var q = searchInput ? searchInput.value.trim() : '';
      if (q) {
        renderGlobalSearchResults(q);
      } else {
        renderQuickLinks();
        if (searchInput) searchInput.focus();
      }
    });
  }

  if (globalSearchClear) {
    globalSearchClear.addEventListener('click', function (e) {
      e.stopPropagation();
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      this.style.display = 'none';
      if (searchDropdown) searchDropdown.classList.remove('show');
    });
  }

  // ---- TABLE FILTER ----
  window.filterTable = function (tableId, q) {
    if (tableId === 'filingsTable') {
      var searchInput = document.getElementById('filingSearchInput');
      if (searchInput && q !== undefined) {
        searchInput.value = q;
      }
      if (window.filterFilingsTable) {
        window.filterFilingsTable();
        return;
      }
    }
    var table = document.getElementById(tableId);
    if (!table) return;
    q = (q || '').toLowerCase();
    Array.from(table.tBodies[0].rows).forEach(function (row) {
      if (row.classList.contains('no-records-row')) return;
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  };

  window.filterTableByCol = function (tableId, colIdx, q) {
    if (tableId === 'filingsTable') {
      if (colIdx === 1) {
        var typeSelect = document.getElementById('filingTypeFilter');
        if (typeSelect) typeSelect.value = q || '';
      } else if (colIdx === 4) {
        var statusSelect = document.getElementById('filingStatusFilter');
        if (statusSelect) statusSelect.value = q || '';
      }
      if (window.filterFilingsTable) {
        window.filterFilingsTable();
        return;
      }
    }
    var table = document.getElementById(tableId);
    if (!table) return;
    q = (q || '').toLowerCase();
    Array.from(table.tBodies[0].rows).forEach(function (row) {
      if (row.classList.contains('no-records-row')) return;
      var cell = row.cells[colIdx];
      row.style.display = (!q || (cell && cell.textContent.toLowerCase().includes(q))) ? '' : 'none';
    });
  };

  // ---- TAX FILINGS FILTER (TYPE + STATUS AND SEARCH) ----
  window.filterFilingsTable = function () {
    var table = document.getElementById('filingsTable');
    if (!table || !table.tBodies[0]) return;

    var searchInput = document.getElementById('filingSearchInput');
    var typeSelect = document.getElementById('filingTypeFilter');
    var statusSelect = document.getElementById('filingStatusFilter');

    var query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    var selectedType = typeSelect ? typeSelect.value.trim().toLowerCase() : '';
    var selectedStatus = statusSelect ? statusSelect.value.trim().toLowerCase() : '';

    var rows = Array.from(table.tBodies[0].rows);
    var visibleCount = 0;
    var noFilingsRow = document.getElementById('noFilingsRow');

    rows.forEach(function (row) {
      if (row.id === 'noFilingsRow' || row.classList.contains('no-records-row')) {
        return;
      }

      // 1. Extract Type from data-type attribute or column 1 cell
      var rowType = row.getAttribute('data-type');
      if (!rowType && row.cells.length > 1) {
        rowType = row.cells[1].textContent.trim();
      }
      rowType = (rowType || '').trim().toLowerCase();

      // 2. Extract Status from data-status attribute or badge or column 4 cell
      var rowStatus = row.getAttribute('data-status');
      if (!rowStatus) {
        var badge = row.querySelector('.status-badge');
        if (badge) {
          rowStatus = badge.textContent.trim();
        } else if (row.cells.length > 4) {
          rowStatus = row.cells[4].textContent.trim();
        }
      }
      rowStatus = (rowStatus || '').trim().toLowerCase();

      // Check conditions
      // Exact match for Type if filter is selected
      var typeMatch = !selectedType || (rowType === selectedType);

      // Exact match for Status if filter is selected
      var statusMatch = !selectedStatus || (rowStatus === selectedStatus);

      // Search match across row text (client, type, sub-type, due date, status, amount)
      var searchMatch = true;
      if (query) {
        var textParts = [];
        for (var i = 0; i < Math.min(row.cells.length, 6); i++) {
          textParts.push(row.cells[i].textContent.trim());
        }
        var searchStr = textParts.join(' ').toLowerCase();
        var queryTokens = query.split(/\s+/).filter(Boolean);
        searchMatch = queryTokens.every(function (token) {
          return searchStr.indexOf(token) !== -1;
        });
      }

      // Main rule: TYPE FILTER + STATUS FILTER = AND condition (together with search)
      var matches = typeMatch && statusMatch && searchMatch;

      if (matches) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });

    if (noFilingsRow) {
      noFilingsRow.style.display = visibleCount === 0 ? '' : 'none';
    }
  };

  // ---- CONVERSATION SEARCH (MESSAGES) ----
  var convoSearchInput = document.getElementById('convoSearchInput');
  var convoSearchBtn = document.getElementById('convoSearchBtn');
  var convoSearchClearBtn = document.getElementById('convoSearchClearBtn');
  var convoNoResults = document.getElementById('convoNoResults');

  function filterConversations(query) {
    query = (query || '').toLowerCase().trim();
    var convoItems = document.querySelectorAll('.convo-list .convo-item');
    var matchCount = 0;

    if (convoSearchClearBtn) {
      convoSearchClearBtn.style.display = query ? 'flex' : 'none';
    }

    convoItems.forEach(function (item) {
      var nameEl = item.querySelector('.c-name');
      var prevEl = item.querySelector('.c-preview');
      var nameText = nameEl ? nameEl.textContent.toLowerCase() : '';
      var prevText = prevEl ? prevEl.textContent.toLowerCase() : '';

      if (!query || nameText.includes(query) || prevText.includes(query)) {
        item.style.display = '';
        matchCount++;
      } else {
        item.style.display = 'none';
      }
    });

    if (convoNoResults) {
      convoNoResults.style.display = (matchCount === 0 && query) ? 'block' : 'none';
      var queryDisplay = document.getElementById('convoQueryDisplay');
      if (queryDisplay) queryDisplay.textContent = query;
    }
  }

  window.clearConvoSearch = function () {
    if (convoSearchInput) {
      convoSearchInput.value = '';
      convoSearchInput.focus();
    }
    filterConversations('');
  };

  if (convoSearchInput) {
    convoSearchInput.addEventListener('input', function () {
      filterConversations(this.value);
    });

    convoSearchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        filterConversations(this.value);
      } else if (e.key === 'Escape') {
        clearConvoSearch();
      }
    });
  }

  if (convoSearchBtn) {
    convoSearchBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (convoSearchInput) {
        filterConversations(convoSearchInput.value);
        convoSearchInput.focus();
      }
    });
  }

  if (convoSearchClearBtn) {
    convoSearchClearBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      clearConvoSearch();
    });
  }

  window.openConvoByName = function (name) {
    var items = document.querySelectorAll('.convo-list .convo-item');
    for (var i = 0; i < items.length; i++) {
      var nameEl = items[i].querySelector('.c-name');
      if (nameEl && nameEl.textContent.trim().toLowerCase() === name.trim().toLowerCase()) {
        items[i].style.display = '';
        items[i].click();
        items[i].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return true;
      }
    }
    return false;
  };

  // ---- MESSAGES & CHAT ENGINE ----
  var convoHistories = {
    'Raj Kumar': [
      { sender: 'incoming', text: 'Hi, I need to upload my bank statements. Where do I send them?', time: '10:30 AM' },
      { sender: 'outgoing', text: 'Hello! You can upload them securely in the Documents section of your portal.', time: '10:35 AM' }
    ],
    'Priya Sharma': [
      { sender: 'incoming', text: 'Thanks for the quick update! When will my GST acknowledgment be ready?', time: 'Yesterday 3:15 PM' },
      { sender: 'outgoing', text: 'Hi Priya! Your GST return has been verified and the official acknowledgment is ready in your portal.', time: 'Yesterday 3:30 PM' }
    ],
    'Arun Kumar': [
      { sender: 'incoming', text: 'When will my ITR be filed?', time: '2 days ago' },
      { sender: 'outgoing', text: 'Hi Arun! Our tax team is preparing your deduction statement under 80C. It will be filed tomorrow.', time: '2 days ago' }
    ],
    'Meena Patel': [
      { sender: 'incoming', text: 'Please check the documents I sent.', time: '3 days ago' },
      { sender: 'outgoing', text: 'Hello Meena! We reviewed your balance sheet and profit & loss statements. All looks in order.', time: '3 days ago' }
    ]
  };

  var currentChatClient = 'Raj Kumar';

  window.openConvo = function (el, name, time) {
    currentChatClient = name;
    document.querySelectorAll('.convo-item').forEach(function (c) { c.classList.remove('active'); });
    if (el) el.classList.add('active');
    var nameEl = document.getElementById('chatClientName');
    if (nameEl) nameEl.textContent = name;
    var msgs = document.getElementById('chatMessages');
    if (msgs) {
      var history = convoHistories[name];
      if (history && history.length) {
        msgs.innerHTML = history.map(function (m) {
          return '<div><div class="msg-bubble msg-' + m.sender + '">' + escapeHtml(m.text) + '<div class="msg-time">' + m.time + '</div></div></div>';
        }).join('');
      } else {
        msgs.innerHTML = '<div><div class="msg-bubble msg-incoming">Hello, I need help with my tax filing.<div class="msg-time">' + (time || '10:00 AM') + '</div></div></div><div><div class="msg-bubble msg-outgoing">Hi ' + escapeHtml(name) + '! I\'m here to help. What can I assist you with today?<div class="msg-time">Just now</div></div></div>';
      }
      msgs.scrollTop = msgs.scrollHeight;
    }
  };

  window.sendMessage = function () {
    var input = document.getElementById('chatInput');
    var msgs = document.getElementById('chatMessages');
    var msg = input ? input.value.trim() : '';
    if (!msg || !msgs) return;
    var time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    var div = document.createElement('div');
    div.innerHTML = '<div class="msg-bubble msg-outgoing">' + escapeHtml(msg) + '<div class="msg-time">' + time + '</div></div>';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;

    if (!convoHistories[currentChatClient]) convoHistories[currentChatClient] = [];
    convoHistories[currentChatClient].push({ sender: 'outgoing', text: msg, time: time });

    // Update snippet in convo item list
    var items = document.querySelectorAll('.convo-list .convo-item');
    items.forEach(function (item) {
      var n = item.querySelector('.c-name');
      if (n && n.textContent.trim() === currentChatClient) {
        var prev = item.querySelector('.c-preview');
        var t = item.querySelector('.c-time');
        if (prev) prev.textContent = 'You: ' + msg;
        if (t) t.textContent = time;
      }
    });

    input.value = '';
  };

  var chatInputEl = document.getElementById('chatInput');
  if (chatInputEl) {
    chatInputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') sendMessage();
    });
  }

  // ---- CALENDAR ----
  var calDate = new Date(2026, 8, 1); // Sep 2026

  var calEvents = {
    '2026-09-07': [{ label: 'TDS Filing', color: 'blue' }],
    '2026-09-10': [{ label: 'Tax Notice Deadline', color: 'red' }],
    '2026-09-15': [{ label: 'Advance Tax', color: 'orange' }],
    '2026-09-20': [{ label: 'GST Return Due', color: '' }],
    '2026-09-25': [{ label: 'ITR Filing', color: '' }],
    '2026-09-30': [{ label: 'Corporate Tax', color: 'red' }]
  };

  var calView = 'month';

  function renderCalendar() {
    var viewEl = document.getElementById('calendarView');
    var titleEl = document.getElementById('calendarTitle');
    if (!viewEl) return;
    var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    if (titleEl) titleEl.textContent = months[calDate.getMonth()] + ' ' + calDate.getFullYear();

    if (calView === 'list') {
      var listHtml = '<div style="display:flex;flex-direction:column;gap:10px;">';
      Object.keys(calEvents).sort().forEach(function (d) {
        calEvents[d].forEach(function (ev) {
          listHtml += '<div class="cal-list-item" onclick="openCalEvent(\'' + ev.label + '\',\'' + d + '\')">' +
            '<div style="font-size:0.8rem;color:#64748b;min-width:90px;">' + d + '</div>' +
            '<div class="cal-event ' + (ev.color || '') + '" style="position:static;margin:0;">' + ev.label + '</div></div>';
        });
      });
      listHtml += '</div>';
      viewEl.innerHTML = listHtml;
      return;
    }

    var year = calDate.getFullYear(), month = calDate.getMonth();
    var firstDay = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var today = new Date();

    var html = '<div class="cal-grid">';
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(function (d) { html += '<div class="cal-day-header">' + d + '</div>'; });

    for (var i = 0; i < firstDay; i++) html += '<div class="cal-day other-month"></div>';

    for (var day = 1; day <= daysInMonth; day++) {
      var isToday = (today.getFullYear() === year && today.getMonth() === month && today.getDate() === day);
      var dateKey = year + '-' + String(month + 1).padStart(2,'0') + '-' + String(day).padStart(2,'0');
      var evs = calEvents[dateKey] || [];
      html += '<div class="cal-day' + (isToday ? ' today' : '') + '"><div class="day-num">' + day + '</div>';
      evs.forEach(function (ev) {
        html += '<div class="cal-event ' + (ev.color || '') + '" onclick="openCalEvent(\'' + ev.label + '\',\'' + dateKey + '\')">' + ev.label + '</div>';
      });
      html += '</div>';
    }
    html += '</div>';
    viewEl.innerHTML = html;
  }
  window.renderCalendar = renderCalendar;

  window.openCalEvent = function (label, date) {
    document.getElementById('calEventTitle').textContent = label;
    document.getElementById('calEventBody').innerHTML =
      '<div class="form-group"><label class="form-label">Event</label><div style="font-weight:600;">' + label + '</div></div>' +
      '<div class="form-group"><label class="form-label">Date</label><div style="font-weight:600;">' + date + '</div></div>' +
      '<div class="form-group"><label class="form-label">Description</label><div style="color:#64748b;">Ensure all required documents are submitted before this deadline. Contact your tax advisor for assistance.</div></div>';
    openModal('calEventModal');
  };

  var prevBtn = document.getElementById('prevMonthBtn');
  var nextBtn = document.getElementById('nextMonthBtn');
  var todayBtn = document.getElementById('todayBtn');
  var listBtn = document.getElementById('calListViewBtn');
  var monthBtn = document.getElementById('calMonthViewBtn');

  if (prevBtn) prevBtn.addEventListener('click', function () { calDate.setMonth(calDate.getMonth() - 1); renderCalendar(); });
  if (nextBtn) nextBtn.addEventListener('click', function () { calDate.setMonth(calDate.getMonth() + 1); renderCalendar(); });
  if (todayBtn) todayBtn.addEventListener('click', function () { calDate = new Date(); renderCalendar(); });
  if (listBtn) listBtn.addEventListener('click', function () {
    calView = 'list';
    if (listBtn) listBtn.classList.add('active');
    if (monthBtn) monthBtn.classList.remove('active');
    renderCalendar();
  });
  if (monthBtn) monthBtn.addEventListener('click', function () {
    calView = 'month';
    if (monthBtn) monthBtn.classList.add('active');
    if (listBtn) listBtn.classList.remove('active');
    renderCalendar();
  });

  renderCalendar();

  // ---- DOWNLOAD ----
  window.downloadDemo = function (filename) {
    var link = document.createElement('a');
    link.href = 'data:text/plain;charset=utf-8,TaxCore Demo Document: ' + filename;
    link.download = filename;
    link.click();
    showToast('Downloading ' + filename + '...', 'info');
  };

  window.downloadReceipt = function (txnId) {
    var content = 'TaxCore Receipt\n================\nTransaction ID: ' + txnId + '\nDate: ' + new Date().toLocaleDateString() + '\nCompany: TaxCore Solutions\nThank you for your payment!';
    var link = document.createElement('a');
    link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
    link.download = 'Receipt_' + txnId + '.txt';
    link.click();
    showToast('Receipt downloaded!', 'success');
  };

  window.exportCSV = function (type) {
    var headers = { clients: 'Name,Email,Phone,Company,Service,Status', filings: 'Client,Type,SubType,DueDate,Status,Amount', revenue: 'Month,Revenue', payments: 'TxnID,Client,Amount,Date,Method,Status', notices: 'Client,NoticeType,Date,Deadline,Priority,Status' };
    var rows = { clients: 'Raj Kumar,raj@example.com,9876543210,Kumar Enterprises,Income Tax Filing,Active\nPriya Sharma,priya@example.com,9988776655,Sharma and Co.,GST Returns,Active', filings: 'Raj Kumar,Income Tax,Individual ITR,15 Sep 2026,Completed,Rs.4500\nPriya Sharma,GST Return,Monthly GST,20 Sep 2026,In Progress,Rs.3500', revenue: 'Jan,1200000\nFeb,1900000\nMar,2200000', payments: '#TXN-88492,Arun Kumar,6000,01 Sep 2026,UPI,Paid', notices: 'TaxCore Inc.,Section 143(1),25 Aug 2026,10 Sep 2026,High,Under Review' };
    var h = headers[type] || 'Column1,Column2';
    var r = rows[type] || '';
    var csv = h + '\n' + r;
    var link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    link.download = type + '_export.csv';
    link.click();
    showToast(type + ' CSV exported!', 'success');
  };

  // ---- REPORTS ----
  window.generateReport = function (type) {
    var output = document.getElementById('reportOutput');
    var title = document.getElementById('reportOutputTitle');
    var body = document.getElementById('reportOutputBody');
    if (!output) return;
    output.style.display = 'block';
    title.textContent = type + ' Report - ' + new Date().toLocaleDateString();
    var data = {
      Revenue: '<table class="dash-table"><thead><tr><th>Month</th><th>Revenue</th><th>Growth</th></tr></thead><tbody><tr><td>July 2026</td><td>Rs.2,800,000</td><td>+8%</td></tr><tr><td>Aug 2026</td><td>Rs.3,500,000</td><td>+25%</td></tr><tr><td>Sep 2026</td><td>Rs.3,200,000</td><td>-8%</td></tr></tbody></table>',
      Client: '<table class="dash-table"><thead><tr><th>Month</th><th>New Clients</th><th>Total</th></tr></thead><tbody><tr><td>July 2026</td><td>80</td><td>1,100</td></tr><tr><td>Aug 2026</td><td>110</td><td>1,210</td></tr><tr><td>Sep 2026</td><td>38</td><td>1,248</td></tr></tbody></table>',
      'Tax Filing': '<table class="dash-table"><thead><tr><th>Type</th><th>Count</th><th>Completed</th><th>Pending</th></tr></thead><tbody><tr><td>Income Tax</td><td>156</td><td>120</td><td>36</td></tr><tr><td>GST Return</td><td>98</td><td>72</td><td>26</td></tr><tr><td>Corporate Tax</td><td>42</td><td>28</td><td>14</td></tr></tbody></table>',
      Payment: '<table class="dash-table"><thead><tr><th>Method</th><th>Transactions</th><th>Total</th></tr></thead><tbody><tr><td>UPI</td><td>284</td><td>Rs.5,200,000</td></tr><tr><td>Net Banking</td><td>156</td><td>Rs.4,800,000</td></tr><tr><td>Card</td><td>98</td><td>Rs.2,800,000</td></tr></tbody></table>',
      'Tax Notice': '<table class="dash-table"><thead><tr><th>Priority</th><th>Count</th><th>Responded</th><th>Pending</th></tr></thead><tbody><tr><td>High</td><td>8</td><td>6</td><td>2</td></tr><tr><td>Medium</td><td>7</td><td>5</td><td>2</td></tr><tr><td>Low</td><td>3</td><td>3</td><td>0</td></tr></tbody></table>'
    };
    body.innerHTML = '<div class="dash-table-wrapper">' + (data[type] || '<p>Report data available.</p>') + '</div>';
    output.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast(type + ' report generated!', 'success');
  };

  // ---- CHARTS ----
  var revenueChartInst = null, filingChartInst = null, growthChartInst = null;

  function isDark() { return document.body.classList.contains('dark-mode'); }
  function gridColor() { return isDark() ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'; }
  function tickColor() { return isDark() ? '#94a3b8' : '#64748b'; }

  function initCharts() {
    var revCtx = document.getElementById('revenueChart');
    if (revCtx) {
      if (revenueChartInst) revenueChartInst.destroy();
      revenueChartInst = new Chart(revCtx, {
        type: 'line',
        data: {
          labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
          datasets: [{
            label: 'Revenue (Rs.)',
            data: [1200000,1900000,1500000,2500000,2200000,3000000,2800000,3500000,3200000,null,null,null],
            borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.08)',
            borderWidth: 2.5, fill: true, tension: 0.4,
            pointBackgroundColor: '#22c55e', pointRadius: 4
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: false, grid: { color: gridColor() }, ticks: { color: tickColor(), callback: function(v) { return 'Rs.' + (v/100000).toFixed(1) + 'L'; } } },
            x: { grid: { display: false }, ticks: { color: tickColor() } }
          }
        }
      });
    }

    var filCtx = document.getElementById('filingStatusChart');
    if (filCtx) {
      if (filingChartInst) filingChartInst.destroy();
      filingChartInst = new Chart(filCtx, {
        type: 'doughnut',
        data: {
          labels: ['Completed','In Progress','Pending','Rejected'],
          datasets: [{ data: [52,25,18,5], backgroundColor: ['#22c55e','#3b82f6','#f59e0b','#ef4444'], borderWidth: 0 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '72%',
          plugins: {
            legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true, pointStyle: 'circle', color: tickColor(), font: { size: 12 } } }
          }
        }
      });
    }

    var growCtx = document.getElementById('clientGrowthChart');
    if (growCtx) {
      if (growthChartInst) growthChartInst.destroy();
      growthChartInst = new Chart(growCtx, {
        type: 'line',
        data: {
          labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
          datasets: [{
            label: 'New Clients',
            data: [45,60,55,80,72,90,80,110,38,null,null,null],
            borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.08)',
            borderWidth: 2, fill: true, tension: 0.4,
            pointBackgroundColor: '#3b82f6', pointRadius: 3
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: gridColor() }, ticks: { color: tickColor() } },
            x: { grid: { display: false }, ticks: { color: tickColor() } }
          }
        }
      });
    }
  }

  window.reinitCharts = function () { initCharts(); };
  initCharts();

}); // end DOMContentLoaded

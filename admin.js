/**
 * ADMIN PANEL — Quản trị Gia Phả Họ Hà
 * Tính năng: CRUD thành viên, Export/Import JSON, localStorage
 */

(function () {
  'use strict';

  // ============ Cấu hình ============
  const ADMIN_PASSWORD = 'hoha2024';
  const STORAGE_KEY = 'familyData';

  // ============ State ============
  let familyData = null;
  let membersMap = {};
  let editingId = null; // null = thêm mới, string = đang sửa

  // ============ Init ============
  document.addEventListener('DOMContentLoaded', () => {
    initLogin();
  });

  // ============ ĐĂNG NHẬP ============
  function initLogin() {
    // Kiểm tra đã đăng nhập chưa (session)
    if (sessionStorage.getItem('admin_logged_in') === '1') {
      showAdminPanel();
      return;
    }

    const form = document.getElementById('login-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const pw = document.getElementById('login-password').value;
      if (pw === ADMIN_PASSWORD) {
        sessionStorage.setItem('admin_logged_in', '1');
        showAdminPanel();
      } else {
        document.getElementById('login-error').textContent = '❌ Sai mật khẩu!';
        document.getElementById('login-password').value = '';
        document.getElementById('login-password').focus();
      }
    });
  }

  function showAdminPanel() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    loadData();
  }

  // ============ LOAD DATA ============
  async function loadData() {
    try {
      // Ưu tiên localStorage
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        familyData = JSON.parse(saved);
      } else {
        const res = await fetch('data/family.json');
        familyData = await res.json();
      }
    } catch (e) {
      console.error('Lỗi tải dữ liệu:', e);
      familyData = { members: [] };
    }

    rebuildMap();
    renderTable();
    initAdminControls();
  }

  function rebuildMap() {
    membersMap = {};
    familyData.members.forEach(m => { membersMap[m.id] = m; });
  }

  function saveToLocalStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(familyData));
  }

  // ============ RENDER TABLE ============
  function renderTable(filter = '') {
    const tbody = document.getElementById('members-tbody');
    const term = filter.toLowerCase();

    let filtered = familyData.members;
    if (term) {
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(term) ||
        m.id.toLowerCase().includes(term) ||
        (m.hometown || '').toLowerCase().includes(term)
      );
    }

    // Sắp xếp theo tên
    filtered.sort((a, b) => a.name.localeCompare(b.name, 'vi'));

    tbody.innerHTML = filtered.map(m => {
      const father = membersMap[m.fatherId];
      const mother = membersMap[m.motherId];
      const spouse = membersMap[m.spouseId];
      const birth = m.birthDate ? new Date(m.birthDate).getFullYear() : (m.birthYear || '');
      const gender = m.gender === 'Male' ? '👨 Nam' : '👩 Nữ';

      return `
        <tr class="${m.isDeceased ? 'row-deceased' : ''}">
          <td><code>${m.id}</code></td>
          <td><strong>${m.name}</strong></td>
          <td>${gender}</td>
          <td>${birth}</td>
          <td>${m.deathYear || ''}</td>
          <td>${father ? father.name : ''}</td>
          <td>${mother ? mother.name : ''}</td>
          <td>${spouse ? spouse.name : ''}</td>
          <td>${m.hometown || ''}</td>
          <td class="actions-cell">
            <button class="abtn abtn-sm" onclick="adminEdit('${m.id}')">✏️</button>
            <button class="abtn abtn-sm abtn-danger" onclick="adminDelete('${m.id}')">🗑️</button>
          </td>
        </tr>
      `;
    }).join('');

    // Cập nhật stats
    const total = familyData.members.length;
    const living = familyData.members.filter(m => !m.isDeceased).length;
    document.getElementById('admin-stats').textContent =
      `Tổng: ${total} | Còn sống: ${living} | Đã mất: ${total - living}`;
  }

  // ============ ADMIN CONTROLS ============
  function initAdminControls() {
    // Tìm kiếm
    document.getElementById('admin-search').addEventListener('input', (e) => {
      renderTable(e.target.value);
    });

    // Thêm thành viên
    document.getElementById('btn-add').addEventListener('click', () => {
      editingId = null;
      openMemberModal();
    });

    // Export JSON
    document.getElementById('btn-export').addEventListener('click', exportJSON);

    // Import JSON
    document.getElementById('btn-import').addEventListener('click', () => {
      document.getElementById('import-file').click();
    });
    document.getElementById('import-file').addEventListener('change', importJSON);

    // Logout
    document.getElementById('btn-logout').addEventListener('click', () => {
      sessionStorage.removeItem('admin_logged_in');
      location.reload();
    });

    // Modal controls
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('form-cancel').addEventListener('click', closeModal);
    document.getElementById('member-modal').addEventListener('click', (e) => {
      if (e.target === document.getElementById('member-modal')) closeModal();
    });

    // Form submit
    document.getElementById('member-form').addEventListener('submit', (e) => {
      e.preventDefault();
      saveMember();
    });
  }

  // ============ MODAL ============
  function openMemberModal() {
    const modal = document.getElementById('member-modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('member-form');
    const idField = document.getElementById('f-id');

    // Populate select options
    populateSelects();

    if (editingId) {
      // Chế độ sửa
      title.textContent = '✏️ Sửa thành viên';
      idField.readOnly = true;
      idField.style.opacity = '0.6';

      const m = membersMap[editingId];
      if (!m) return;

      document.getElementById('f-id').value = m.id;
      document.getElementById('f-name').value = m.name || '';
      document.getElementById('f-gender').value = m.gender || 'Male';
      document.getElementById('f-birthYear').value = m.birthDate
        ? new Date(m.birthDate).getFullYear()
        : (m.birthYear || '');
      document.getElementById('f-deathYear').value = m.deathYear || '';
      document.getElementById('f-fatherId').value = m.fatherId || '';
      document.getElementById('f-motherId').value = m.motherId || '';
      document.getElementById('f-spouseId').value = m.spouseId || '';
      document.getElementById('f-hometown').value = m.hometown || '';
      document.getElementById('f-photoUrl').value = m.photoUrl || '';
      document.getElementById('f-bio').value = m.bio || '';
      document.getElementById('f-isDeceased').checked = !!m.isDeceased;
    } else {
      // Chế độ thêm mới
      title.textContent = '➕ Thêm thành viên mới';
      idField.readOnly = false;
      idField.style.opacity = '1';
      form.reset();
    }

    modal.style.display = 'flex';
  }

  function closeModal() {
    document.getElementById('member-modal').style.display = 'none';
    editingId = null;
  }

  /** Nạp danh sách thành viên vào các select cha/mẹ/vợ chồng */
  function populateSelects() {
    const males = familyData.members
      .filter(m => m.gender === 'Male')
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    const females = familyData.members
      .filter(m => m.gender === 'Female')
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    const all = familyData.members
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'));

    const fatherSel = document.getElementById('f-fatherId');
    const motherSel = document.getElementById('f-motherId');
    const spouseSel = document.getElementById('f-spouseId');

    fatherSel.innerHTML = '<option value="">— Không —</option>' +
      males.map(m => `<option value="${m.id}">${m.name}</option>`).join('');

    motherSel.innerHTML = '<option value="">— Không —</option>' +
      females.map(m => `<option value="${m.id}">${m.name}</option>`).join('');

    spouseSel.innerHTML = '<option value="">— Không —</option>' +
      all.map(m => `<option value="${m.id}">${m.name} (${m.gender === 'Male' ? 'Nam' : 'Nữ'})</option>`).join('');
  }

  // ============ SAVE MEMBER ============
  function saveMember() {
    const id = document.getElementById('f-id').value.trim();
    const name = document.getElementById('f-name').value.trim();

    if (!id || !name) {
      alert('Vui lòng nhập ID và Tên.');
      return;
    }

    // Kiểm tra ID trùng khi thêm mới
    if (!editingId && membersMap[id]) {
      alert(`ID "${id}" đã tồn tại. Vui lòng chọn ID khác.`);
      return;
    }

    const birthYearVal = document.getElementById('f-birthYear').value.trim();
    const deathYearVal = document.getElementById('f-deathYear').value.trim();

    const memberData = {
      id: id,
      name: name,
      gender: document.getElementById('f-gender').value,
      fatherId: document.getElementById('f-fatherId').value || undefined,
      motherId: document.getElementById('f-motherId').value || undefined,
      spouseId: document.getElementById('f-spouseId').value || undefined,
      hometown: document.getElementById('f-hometown').value.trim() || undefined,
      photoUrl: document.getElementById('f-photoUrl').value.trim() || undefined,
      bio: document.getElementById('f-bio').value.trim() || undefined,
      isDeceased: document.getElementById('f-isDeceased').checked,
      status: 'approved',
    };

    // Năm sinh: lưu dạng birthYear (số)
    if (birthYearVal) {
      memberData.birthYear = birthYearVal;
    }

    // Năm mất
    if (deathYearVal) {
      memberData.deathYear = deathYearVal;
      memberData.isDeceased = true;
    }

    if (editingId) {
      // Cập nhật member hiện tại
      const idx = familyData.members.findIndex(m => m.id === editingId);
      if (idx >= 0) {
        // Giữ lại các field cũ không có trong form (vd: birthDate)
        const old = familyData.members[idx];
        if (old.birthDate && !memberData.birthDate) {
          memberData.birthDate = old.birthDate;
        }
        familyData.members[idx] = { ...old, ...memberData };
      }
    } else {
      // Thêm mới
      familyData.members.push(memberData);
    }

    // Cập nhật spouseId hai chiều
    if (memberData.spouseId) {
      const spouse = membersMap[memberData.spouseId];
      if (spouse && spouse.spouseId !== id) {
        spouse.spouseId = id;
      }
    }

    saveToLocalStorage();
    rebuildMap();
    renderTable(document.getElementById('admin-search').value);
    closeModal();
  }

  // ============ DELETE MEMBER ============
  window.adminDelete = function (id) {
    const member = membersMap[id];
    if (!member) return;

    if (!confirm(`Bạn có chắc muốn xóa "${member.name}" (${id})?\n\nLưu ý: Các liên kết cha/mẹ/vợ chồng liên quan sẽ bị xóa.`)) {
      return;
    }

    // Xóa liên kết spouse
    if (member.spouseId && membersMap[member.spouseId]) {
      if (membersMap[member.spouseId].spouseId === id) {
        membersMap[member.spouseId].spouseId = undefined;
      }
    }

    // Xóa liên kết cha/mẹ ở con
    familyData.members.forEach(m => {
      if (m.fatherId === id) m.fatherId = undefined;
      if (m.motherId === id) m.motherId = undefined;
    });

    // Xóa member
    familyData.members = familyData.members.filter(m => m.id !== id);

    saveToLocalStorage();
    rebuildMap();
    renderTable(document.getElementById('admin-search').value);
  };

  // ============ EDIT MEMBER ============
  window.adminEdit = function (id) {
    editingId = id;
    openMemberModal();
  };

  // ============ EXPORT JSON ============
  function exportJSON() {
    // Clean up undefined values
    const cleaned = {
      members: familyData.members.map(m => {
        const obj = {};
        for (const [key, val] of Object.entries(m)) {
          if (val !== undefined && val !== null && val !== '') {
            obj[key] = val;
          }
        }
        return obj;
      })
    };

    const blob = new Blob(
      [JSON.stringify(cleaned, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'family.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ============ IMPORT JSON ============
  function importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (!data.members || !Array.isArray(data.members)) {
          alert('File không hợp lệ — cần có trường "members" là mảng.');
          return;
        }

        if (!confirm(`Import ${data.members.length} thành viên?\nDữ liệu hiện tại sẽ bị thay thế.`)) {
          return;
        }

        familyData = data;
        saveToLocalStorage();
        rebuildMap();
        renderTable();
        alert('✅ Import thành công!');
      } catch (err) {
        alert('Lỗi đọc file JSON: ' + err.message);
      }
    };
    reader.readAsText(file);

    // Reset file input
    e.target.value = '';
  }

})();

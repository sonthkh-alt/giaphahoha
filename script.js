/**
 * GIA PHẢ DÒNG HỌ HÀ - YÊN BÁI, YÊN ĐỊNH, THANH HÓA
 * Cây gia phả tương tác — Vanilla JS
 * 
 * Tính năng:
 *  - Hiển thị cây phả hệ dạng đồ thị (CSS connectors)
 *  - Zoom / Pan (chuột + cảm ứng)
 *  - Collapse / Expand nhánh
 *  - Tìm kiếm thành viên
 *  - Modal chi tiết khi click
 */

(function () {
  'use strict';

  // ============ State ============
  let familyData = null;
  let membersMap = {};
  let currentFilter = 'all';

  // Zoom / Pan state
  let scale = 0.7;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let startX = 0;
  let startY = 0;

  // ============ Init ============
  document.addEventListener('DOMContentLoaded', async () => {
    await loadFamilyData();
    initNavigation();
    initScrollEffects();
    initContactForm();
    renderFamilyTree();
    initTreeControls();
    initZoomPan();
  });

  // ============ Load Data ============
  async function loadFamilyData() {
    try {
      // Ưu tiên dữ liệu từ localStorage (admin đã chỉnh sửa)
      const saved = localStorage.getItem('familyData');
      if (saved) {
        familyData = JSON.parse(saved);
      } else {
        const response = await fetch('data/family.json');
        familyData = await response.json();
      }
    } catch (e) {
      console.error('Không tải được dữ liệu gia phả:', e);
      return;
    }

    // Xây bảng tra cứu thành viên theo id
    membersMap = {};
    familyData.members.forEach(m => {
      membersMap[m.id] = m;
    });

    updateStats();
  }

  function updateStats() {
    if (!familyData) return;
    const total = familyData.members.length;
    const deceased = familyData.members.filter(m => m.isDeceased).length;
    const living = total - deceased;
    const gens = calculateGenerations();

    const statEls = document.querySelectorAll('.stat-number');
    if (statEls.length >= 3) {
      animateNumber(statEls[0], total);
      animateNumber(statEls[1], gens);
      animateNumber(statEls[2], living);
    }
  }

  /** Tính số đời (thế hệ) bằng BFS từ cụ tổ */
  function calculateGenerations() {
    const depths = {};
    function walk(id, depth) {
      if (!id || depths[id] !== undefined) return;
      depths[id] = depth;
      const children = familyData.members.filter(m =>
        m.fatherId === id || m.motherId === id
      );
      children.forEach(c => walk(c.id, depth + 1));
    }
    walk('quan', 1);
    return Math.max(1, ...Object.values(depths));
  }

  function animateNumber(el, target) {
    let current = 0;
    const step = Math.ceil(target / 50);
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = current;
    }, 25);
  }

  // ============ Navigation ============
  function initNavigation() {
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    if (toggle && links) {
      toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        links.classList.toggle('open');
      });
      links.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          toggle.classList.remove('active');
          links.classList.remove('open');
        });
      });
    }

    // Active link theo scroll
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY + 100;
      sections.forEach(section => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        const id = section.getAttribute('id');
        const link = document.querySelector(`.nav-links a[href="#${id}"]`);
        if (link) {
          if (scrollY >= top && scrollY < top + height) {
            document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
          }
        }
      });

      // Back to top button
      const btn = document.querySelector('.back-to-top');
      if (btn) {
        btn.classList.toggle('visible', window.scrollY > 400);
      }
    });

    // Back to top click
    const backBtn = document.querySelector('.back-to-top');
    if (backBtn) {
      backBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }
  }

  // ============ Scroll Effects ============
  function initScrollEffects() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }

  // ============ CÂY GIA PHẢ ============

  /**
   * Tìm tất cả con của một người (hoặc cặp vợ chồng).
   * Con = member có fatherId hoặc motherId trỏ tới personId.
   */
  function getChildren(personId) {
    return familyData.members.filter(m =>
      m.fatherId === personId || m.motherId === personId
    );
  }

  /**
   * Kiểm tra member có con không (tính cả con qua spouse)
   */
  function hasDescendants(personId) {
    return getChildren(personId).length > 0;
  }

  /**
   * Render toàn bộ cây gia phả
   */
  function renderFamilyTree() {
    if (!familyData) return;
    const container = document.getElementById('family-tree-container');
    if (!container) return;

    const quan = membersMap['quan'];
    const ngac = membersMap['ngac'];

    if (!quan) {
      container.innerHTML = '<p style="text-align:center;padding:2rem;">Không tìm thấy dữ liệu gia phả.</p>';
      return;
    }

    // Đánh dấu đã render để tránh vòng lặp
    const rendered = new Set();

    container.innerHTML = buildNodeHTML(quan, ngac, rendered, 0);

    // Gắn sự kiện click vào thẻ thành viên
    container.querySelectorAll('.ftree-card').forEach(card => {
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        showMemberDetails(card.dataset.id);
      });
    });

    // Gắn sự kiện collapse/expand
    container.querySelectorAll('.ftree-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const node = btn.closest('.ftree-node');
        node.classList.toggle('collapsed');
        btn.textContent = node.classList.contains('collapsed') ? '+' : '−';
      });
    });

    // Mặc định: thu gọn từ đời thứ 4 trở đi
    container.querySelectorAll('.ftree-node').forEach(node => {
      const depth = parseInt(node.dataset.depth || '0');
      if (depth >= 3) {
        node.classList.add('collapsed');
        const toggle = node.querySelector(':scope > .ftree-couple > .ftree-toggle');
        if (toggle) toggle.textContent = '+';
      }
    });

    // Canh giữa cây trong viewport
    centerTree();
  }

  /**
   * Xây HTML cho một nút gia phả (đệ quy).
   * Mỗi nút = cặp vợ chồng + các con bên dưới.
   */
  function buildNodeHTML(person, spouse, rendered, depth) {
    if (!person || rendered.has(person.id)) return '';
    rendered.add(person.id);
    if (spouse) rendered.add(spouse.id);

    // Tìm con của cặp này
    const children = getChildren(person.id).filter(c => !rendered.has(c.id));
    // Sắp xếp con theo năm sinh
    children.sort((a, b) => {
      const ya = a.birthDate ? new Date(a.birthDate).getFullYear() : (a.birthYear || 9999);
      const yb = b.birthDate ? new Date(b.birthDate).getFullYear() : (b.birthYear || 9999);
      return ya - yb;
    });

    const hasKids = children.length > 0;

    let html = `<div class="ftree-node ${hasKids ? 'has-children' : ''}" data-depth="${depth}" data-id="${person.id}">`;

    // --- Cặp vợ chồng ---
    html += '<div class="ftree-couple">';
    html += buildCardHTML(person);
    if (spouse) {
      html += '<div class="ftree-spouse-link"></div>';
      html += buildCardHTML(spouse);
    }
    // Nút collapse/expand nếu có con
    if (hasKids) {
      html += '<button class="ftree-toggle" title="Thu gọn/Mở rộng">−</button>';
    }
    html += '</div>'; // .ftree-couple

    // --- Con cái ---
    if (hasKids) {
      html += '<div class="ftree-children">';
      children.forEach(child => {
        rendered.add(child.id);
        const childSpouse = child.spouseId ? membersMap[child.spouseId] : null;
        if (childSpouse) rendered.add(childSpouse.id);

        // Kiểm tra xem child có con không
        const grandchildren = getChildren(child.id).filter(gc => !rendered.has(gc.id));
        const childHasKids = grandchildren.length > 0;

        // Nếu child cũng có con → đệ quy
        // Phải "un-render" để đệ quy chạy đúng
        rendered.delete(child.id);
        if (childSpouse) rendered.delete(childSpouse.id);
        grandchildren.forEach(gc => rendered.delete(gc.id));

        html += buildNodeHTML(child, childSpouse, rendered, depth + 1);
      });
      html += '</div>'; // .ftree-children
    }

    html += '</div>'; // .ftree-node
    return html;
  }

  /**
   * Tạo HTML cho 1 thẻ thành viên
   */
  function buildCardHTML(member) {
    if (!member) return '';
    const gender = member.gender === 'Male' ? 'male' : 'female';
    const deceased = member.isDeceased ? 'deceased' : 'living';
    const birthInfo = formatBirthDeath(member);
    const icon = gender === 'male' ? '👨' : '👩';

    return `
      <div class="ftree-card ${gender} ${deceased}" data-id="${member.id}">
        <div class="ftree-avatar">
          ${member.photoUrl
            ? `<img src="${member.photoUrl}" alt="${member.name}">`
            : `<span class="ftree-avatar-icon">${icon}</span>`
          }
        </div>
        <div class="ftree-name">${member.name}</div>
        ${birthInfo ? `<div class="ftree-dates">${birthInfo}</div>` : ''}
        ${member.isDeceased ? '<div class="ftree-deceased-mark">🕊️</div>' : ''}
      </div>
    `;
  }

  function formatBirthDeath(member) {
    const birth = member.birthDate ? new Date(member.birthDate).getFullYear() : member.birthYear;
    const death = member.deathYear;
    if (birth && death) return `${birth} – ${death}`;
    if (birth) return `${birth}`;
    if (death) return `✝ ${death}`;
    return '';
  }

  // ============ ZOOM / PAN ============

  function initZoomPan() {
    const viewport = document.getElementById('tree-viewport');
    const canvas = document.getElementById('tree-canvas');
    if (!viewport || !canvas) return;

    applyTransform();

    // --- Cuộn chuột để zoom ---
    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      const newScale = Math.max(0.15, Math.min(2.5, scale + delta));

      // Zoom hướng vào con trỏ chuột
      const rect = viewport.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      panX -= (mx - panX) * (newScale / scale - 1);
      panY -= (my - panY) * (newScale / scale - 1);

      scale = newScale;
      applyTransform();
    }, { passive: false });

    // --- Kéo chuột để pan ---
    viewport.addEventListener('mousedown', (e) => {
      if (e.target.closest('.ftree-card') || e.target.closest('.ftree-toggle')) return;
      isPanning = true;
      startX = e.clientX - panX;
      startY = e.clientY - panY;
      viewport.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isPanning) return;
      panX = e.clientX - startX;
      panY = e.clientY - startY;
      applyTransform();
    });

    window.addEventListener('mouseup', () => {
      isPanning = false;
      const vp = document.getElementById('tree-viewport');
      if (vp) vp.style.cursor = 'grab';
    });

    // --- Cảm ứng: pinch-to-zoom + pan ---
    let lastTouchDist = 0;
    let lastTouchCenter = null;

    viewport.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        lastTouchDist = getTouchDist(e.touches);
        lastTouchCenter = getTouchCenter(e.touches);
      } else if (e.touches.length === 1) {
        if (e.target.closest('.ftree-card') || e.target.closest('.ftree-toggle')) return;
        isPanning = true;
        startX = e.touches[0].clientX - panX;
        startY = e.touches[0].clientY - panY;
      }
    }, { passive: true });

    viewport.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = getTouchDist(e.touches);
        const center = getTouchCenter(e.touches);
        const ratio = dist / lastTouchDist;
        const newScale = Math.max(0.15, Math.min(2.5, scale * ratio));

        const rect = viewport.getBoundingClientRect();
        const cx = center.x - rect.left;
        const cy = center.y - rect.top;
        panX -= (cx - panX) * (newScale / scale - 1);
        panY -= (cy - panY) * (newScale / scale - 1);

        // Pan theo di chuyển trung tâm
        panX += center.x - lastTouchCenter.x;
        panY += center.y - lastTouchCenter.y;

        scale = newScale;
        lastTouchDist = dist;
        lastTouchCenter = center;
        applyTransform();
      } else if (e.touches.length === 1 && isPanning) {
        panX = e.touches[0].clientX - startX;
        panY = e.touches[0].clientY - startY;
        applyTransform();
      }
    }, { passive: false });

    viewport.addEventListener('touchend', () => {
      isPanning = false;
      lastTouchDist = 0;
    });

    // --- Nút zoom ---
    document.getElementById('zoom-in')?.addEventListener('click', () => {
      scale = Math.min(2.5, scale + 0.15);
      applyTransform();
    });
    document.getElementById('zoom-out')?.addEventListener('click', () => {
      scale = Math.max(0.15, scale - 0.15);
      applyTransform();
    });
    document.getElementById('zoom-reset')?.addEventListener('click', () => {
      centerTree();
    });

    // --- Nút mở/thu gọn tất cả ---
    document.getElementById('expand-all')?.addEventListener('click', () => {
      document.querySelectorAll('.ftree-node.collapsed').forEach(n => {
        n.classList.remove('collapsed');
        const t = n.querySelector(':scope > .ftree-couple > .ftree-toggle');
        if (t) t.textContent = '−';
      });
    });
    document.getElementById('collapse-all')?.addEventListener('click', () => {
      document.querySelectorAll('.ftree-node.has-children').forEach(n => {
        const depth = parseInt(n.dataset.depth || '0');
        if (depth >= 1) {
          n.classList.add('collapsed');
          const t = n.querySelector(':scope > .ftree-couple > .ftree-toggle');
          if (t) t.textContent = '+';
        }
      });
    });
  }

  function applyTransform() {
    const canvas = document.getElementById('tree-canvas');
    if (canvas) {
      canvas.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    }
  }

  /** Canh giữa cây trong viewport */
  function centerTree() {
    const viewport = document.getElementById('tree-viewport');
    const canvas = document.getElementById('tree-canvas');
    if (!viewport || !canvas) return;

    scale = 0.6;
    // Để cây hiện ra trước rồi tính kích thước
    canvas.style.transform = 'scale(1)';
    const cw = canvas.scrollWidth;
    const ch = canvas.scrollHeight;
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;

    // Chọn scale phù hợp để vừa viewport (tối đa 0.9, tối thiểu 0.2)
    const sx = vw / cw;
    const sy = vh / ch;
    scale = Math.max(0.2, Math.min(0.9, Math.min(sx, sy) * 0.85));

    panX = (vw - cw * scale) / 2;
    panY = 20;

    applyTransform();
  }

  function getTouchDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function getTouchCenter(touches) {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  }

  // ============ MODAL CHI TIẾT ============

  function showMemberDetails(memberId) {
    const member = membersMap[memberId];
    if (!member) return;

    const spouse = member.spouseId ? membersMap[member.spouseId] : null;
    const father = member.fatherId ? membersMap[member.fatherId] : null;
    const mother = member.motherId ? membersMap[member.motherId] : null;
    const children = familyData.members.filter(m =>
      m.fatherId === memberId || m.motherId === memberId
    );

    const modalHTML = `
      <div class="modal-overlay active" id="member-modal">
        <div class="modal-content">
          <button class="modal-close">&times;</button>
          <div class="member-detail">
            <div class="member-header">
              <div class="member-photo-large">
                ${member.photoUrl
                  ? `<img src="${member.photoUrl}" alt="${member.name}">`
                  : `<div class="photo-placeholder-large">${member.gender === 'Male' ? '👨' : '👩'}</div>`
                }
              </div>
              <div class="member-title">
                <h2>${member.name}</h2>
                <p class="gender">${member.gender === 'Male' ? '👨 Nam' : '👩 Nữ'}</p>
                ${member.isDeceased
                  ? '<span class="deceased-badge">🕊️ Đã mất</span>'
                  : '<span class="living-badge">🌱 Còn sống</span>'}
              </div>
            </div>

            <div class="member-details-grid">
              ${formatBirthDeath(member) ? `
                <div class="detail-item">
                  <strong>📅 Năm sinh — mất:</strong>
                  <span>${formatBirthDeath(member)}</span>
                </div>
              ` : ''}

              ${member.hometown ? `
                <div class="detail-item">
                  <strong>📍 Quê quán:</strong>
                  <span>${member.hometown}</span>
                </div>
              ` : ''}

              ${spouse ? `
                <div class="detail-item">
                  <strong>💑 Vợ/Chồng:</strong>
                  <span class="clickable-member" data-member-id="${spouse.id}">${spouse.name}</span>
                </div>
              ` : ''}

              ${father || mother ? `
                <div class="detail-item">
                  <strong>👪 Cha mẹ:</strong>
                  <span>
                    ${father ? `<span class="clickable-member" data-member-id="${father.id}">${father.name}</span>` : ''}
                    ${father && mother ? ' & ' : ''}
                    ${mother ? `<span class="clickable-member" data-member-id="${mother.id}">${mother.name}</span>` : ''}
                  </span>
                </div>
              ` : ''}

              ${children.length > 0 ? `
                <div class="detail-item">
                  <strong>👶 Con cái (${children.length}):</strong>
                  <div class="children-list">
                    ${children.map(c =>
                      `<span class="clickable-member" data-member-id="${c.id}">${c.name}</span>`
                    ).join(', ')}
                  </div>
                </div>
              ` : ''}
            </div>

            ${member.bio ? `
              <div class="member-bio">
                <strong>📝 Tiểu sử:</strong>
                <p>${member.bio}</p>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    // Xóa modal cũ nếu có
    document.getElementById('member-modal')?.remove();

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('member-modal');

    // Đóng modal
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    // Click vào thành viên liên quan → mở modal mới
    modal.querySelectorAll('.clickable-member').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        modal.remove();
        setTimeout(() => showMemberDetails(el.dataset.memberId), 100);
      });
    });
  }

  // ============ TÌM KIẾM & LỌC ============

  function initTreeControls() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        applyFilters();
      });
    });

    // Tìm kiếm
    const searchInput = document.getElementById('member-search');
    const searchResults = document.getElementById('search-results');
    if (searchInput && searchResults) {
      searchInput.addEventListener('input', () => {
        const term = searchInput.value.trim().toLowerCase();
        if (term.length < 2) {
          searchResults.innerHTML = '';
          searchResults.style.display = 'none';
          applyFilters();
          return;
        }

        const matches = familyData.members.filter(m =>
          m.name.toLowerCase().includes(term)
        ).slice(0, 8);

        if (matches.length === 0) {
          searchResults.innerHTML = '<div class="sr-item">Không tìm thấy</div>';
        } else {
          searchResults.innerHTML = matches.map(m => `
            <div class="sr-item" data-id="${m.id}">
              <span>${m.gender === 'Male' ? '👨' : '👩'}</span>
              <span>${m.name}</span>
              <span class="sr-dates">${formatBirthDeath(m)}</span>
            </div>
          `).join('');
        }
        searchResults.style.display = 'block';

        // Click vào kết quả → highlight + mở modal
        searchResults.querySelectorAll('.sr-item[data-id]').forEach(item => {
          item.addEventListener('click', () => {
            const id = item.dataset.id;
            searchResults.style.display = 'none';
            searchInput.value = '';
            highlightMember(id);
            showMemberDetails(id);
          });
        });

        applyFilters();
      });

      // Ẩn dropdown khi click ngoài
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
          searchResults.style.display = 'none';
        }
      });
    }
  }

  /** Highlight thành viên trên cây (mở nhánh + cuộn đến) */
  function highlightMember(id) {
    // Bỏ highlight cũ
    document.querySelectorAll('.ftree-card.highlighted').forEach(c => c.classList.remove('highlighted'));

    const card = document.querySelector(`.ftree-card[data-id="${id}"]`);
    if (!card) return;

    // Mở tất cả nhánh cha để thẻ hiện ra
    let parent = card.closest('.ftree-node');
    while (parent) {
      parent.classList.remove('collapsed');
      const toggle = parent.querySelector(':scope > .ftree-couple > .ftree-toggle');
      if (toggle) toggle.textContent = '−';
      parent = parent.parentElement?.closest('.ftree-node');
    }

    card.classList.add('highlighted');

    // Cuộn viewport đến thẻ
    setTimeout(() => {
      const viewport = document.getElementById('tree-viewport');
      const canvas = document.getElementById('tree-canvas');
      if (!viewport || !canvas) return;

      const cardRect = card.getBoundingClientRect();
      const vpRect = viewport.getBoundingClientRect();

      // Tính offset để card nằm giữa viewport
      const targetX = vpRect.left + vpRect.width / 2 - cardRect.left - cardRect.width / 2;
      const targetY = vpRect.top + vpRect.height / 2 - cardRect.top - cardRect.height / 2;

      panX += targetX;
      panY += targetY;
      applyTransform();
    }, 50);

    // Bỏ highlight sau 3 giây
    setTimeout(() => card.classList.remove('highlighted'), 3000);
  }

  function applyFilters() {
    const searchTerm = document.getElementById('member-search')?.value.toLowerCase() || '';
    document.querySelectorAll('.ftree-card').forEach(card => {
      const member = membersMap[card.dataset.id];
      if (!member) return;

      let show = true;
      if (currentFilter === 'living' && member.isDeceased) show = false;
      if (currentFilter === 'deceased' && !member.isDeceased) show = false;
      if (searchTerm.length >= 2 && !member.name.toLowerCase().includes(searchTerm)) {
        card.classList.add('dimmed');
      } else {
        card.classList.remove('dimmed');
      }
      card.style.display = show ? '' : 'none';
    });
  }

  // ============ Contact Form ============
  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      if (!fd.get('name') || !fd.get('email') || !fd.get('message')) {
        alert('Vui lòng điền đầy đủ thông tin.');
        return;
      }
      alert('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.');
      form.reset();
    });
  }

})();

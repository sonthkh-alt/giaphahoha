/**
 * GIA PHẢ DÒNG HỌ HÀ - YÊN BÁI, YÊN ĐỊNH, THANH HÓA
 * Interactive Family Genealogy Website
 */

(function () {
  'use strict';

  // ============ State ============
  let familyData = null;
  let membersMap = {};
  let currentFilter = 'all';

  // ============ Init ============
  document.addEventListener('DOMContentLoaded', async () => {
    await loadFamilyData();
    initNavigation();
    initScrollEffects();
    initContactForm();
    renderFamilyTree();
    initTreeControls();
  });

  // ============ Load Data ============
  async function loadFamilyData() {
    try {
      const response = await fetch('data/family.json');
      familyData = await response.json();
    } catch (e) {
      console.error('Could not load family data:', e);
      return;
    }
    
    // Build members map
    familyData.members.forEach(m => {
      membersMap[m.id] = m;
    });

    // Update stats
    updateStats();
  }

  function updateStats() {
    const total = familyData.members.length;
    const deceased = familyData.members.filter(m => m.isDeceased).length;
    const living = total - deceased;
    
    const statEls = document.querySelectorAll('.stat-number');
    if (statEls.length >= 3) {
      animateNumber(statEls[0], total);
      animateNumber(statEls[1], calculateGenerations());
      animateNumber(statEls[2], living);
    }
  }

  function calculateGenerations() {
    // Calculate generations from root ancestors
    const visited = new Set();
    const generations = {};
    
    function calculateDepth(memberId, depth = 1) {
      if (visited.has(memberId)) return;
      visited.add(memberId);
      
      const member = membersMap[memberId];
      if (!member) return;
      
      generations[memberId] = depth;
      
      // Find children
      const children = familyData.members.filter(m => 
        m.fatherId === memberId || m.motherId === memberId
      );
      
      children.forEach(child => {
        calculateDepth(child.id, depth + 1);
      });
    }
    
    // Start from root ancestors
    calculateDepth('quan', 1);
    calculateDepth('ngac', 1);
    
    return Math.max(...Object.values(generations)) || 1;
  }

  function animateNumber(el, target) {
    let current = 0;
    const duration = 1500;
    const step = Math.ceil(target / (duration / 30));
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = current;
    }, 30);
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

      // Close on link click
      links.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          toggle.classList.remove('active');
          links.classList.remove('open');
        });
      });
    }

    // Active nav link on scroll
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
    });
  }

  // ============ Scroll Effects ============
  function initScrollEffects() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.reveal').forEach((el) => {
      observer.observe(el);
    });

    // Parallax for hero
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      const hero = document.querySelector('.hero');
      if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.3}px)`;
      }
    });
  }

  // ============ Family Tree ============
  function renderFamilyTree() {
    if (!familyData) return;

    const treeContainer = document.getElementById('family-tree-container');
    if (!treeContainer) return;

    // Find root ancestors
    const rootAncestors = familyData.members.filter(m => 
      m.id === 'quan' || m.id === 'ngac'
    );

    if (rootAncestors.length === 0) {
      treeContainer.innerHTML = '<p>Không tìm thấy dữ liệu gia phả.</p>';
      return;
    }

    const treeHTML = buildFamilyTreeHTML();
    treeContainer.innerHTML = treeHTML;

    // Add click listeners to member cards
    document.querySelectorAll('.member-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const memberId = card.dataset.memberId;
        showMemberDetails(memberId);
      });
    });
  }

  function buildFamilyTreeHTML() {
    const visited = new Set();
    let html = '<div class="tree-root">';
    
    // Start with root couple
    const quan = membersMap['quan'];
    const ngac = membersMap['ngac'];
    
    html += '<div class="generation">';
    html += '<div class="couple-container">';
    html += createMemberCard(quan);
    html += createMemberCard(ngac);
    html += '</div>';
    html += '</div>';
    
    visited.add('quan');
    visited.add('ngac');
    
    // Build generations
    html += buildChildrenHTML('quan', 'ngac', visited, 1);
    
    html += '</div>';
    return html;
  }

  function buildChildrenHTML(parentId, spouseId, visited, generation) {
    // Find children where either parent matches
    const children = familyData.members.filter(m => 
      (m.fatherId === parentId || m.motherId === parentId ||
       (spouseId && (m.fatherId === spouseId || m.motherId === spouseId)))
      && !visited.has(m.id)
    );

    if (children.length === 0) return '';

    let html = '<div class="generation" data-generation="' + generation + '">';
    
    children.forEach(child => {
      if (visited.has(child.id)) return; // Skip if already processed
      
      visited.add(child.id);
      const spouse = child.spouseId ? membersMap[child.spouseId] : null;
      
      html += '<div class="family-unit">';
      html += '<div class="couple-container">';
      html += createMemberCard(child);
      
      if (spouse && !visited.has(spouse.id)) {
        visited.add(spouse.id);
        html += createMemberCard(spouse);
      }
      
      html += '</div>';
      
      // Recursively add their children
      const childrenHTML = buildChildrenHTML(child.id, child.spouseId, visited, generation + 1);
      if (childrenHTML) {
        html += childrenHTML;
      }
      
      html += '</div>';
    });
    
    html += '</div>';
    return html;
  }

  function createMemberCard(member) {
    if (!member) return '';

    const isDeceased = member.isDeceased;
    const birthInfo = formatBirthDeathInfo(member);
    const gender = member.gender === 'Male' ? 'male' : 'female';

    return `
      <div class="member-card ${gender} ${isDeceased ? 'deceased' : 'living'}" 
           data-member-id="${member.id}">
        <div class="member-photo">
          ${member.photoUrl ? 
            `<img src="${member.photoUrl}" alt="${member.name}">` : 
            `<div class="photo-placeholder">${gender === 'male' ? '👨' : '👩'}</div>`
          }
        </div>
        <div class="member-info">
          <h3>${member.name}</h3>
          ${birthInfo ? `<p class="birth-death">${birthInfo}</p>` : ''}
          ${member.hometown ? `<p class="hometown">📍 ${member.hometown}</p>` : ''}
        </div>
        ${isDeceased ? '<div class="deceased-marker">🕊️</div>' : ''}
      </div>
    `;
  }

  function formatBirthDeathInfo(member) {
    const birth = member.birthDate ? new Date(member.birthDate).getFullYear() : member.birthYear;
    const death = member.deathYear;
    
    if (birth && death) {
      return `${birth} - ${death}`;
    } else if (birth) {
      return `${birth}`;
    } else if (death) {
      return `- ${death}`;
    }
    return '';
  }

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
      <div class="modal-overlay" id="member-modal">
        <div class="modal-content">
          <button class="modal-close">&times;</button>
          <div class="member-detail">
            <div class="member-header">
              <div class="member-photo-large">
                ${member.photoUrl ? 
                  `<img src="${member.photoUrl}" alt="${member.name}">` : 
                  `<div class="photo-placeholder-large">${member.gender === 'Male' ? '👨' : '👩'}</div>`
                }
              </div>
              <div class="member-title">
                <h2>${member.name}</h2>
                <p class="gender">${member.gender === 'Male' ? 'Nam' : 'Nữ'}</p>
                ${member.isDeceased ? '<span class="deceased-badge">🕊️ Đã mất</span>' : '<span class="living-badge">🌱 Còn sống</span>'}
              </div>
            </div>
            
            <div class="member-details-grid">
              ${formatBirthDeathInfo(member) ? `
                <div class="detail-item">
                  <strong>Năm sinh - mất:</strong>
                  <span>${formatBirthDeathInfo(member)}</span>
                </div>
              ` : ''}
              
              ${member.hometown ? `
                <div class="detail-item">
                  <strong>Quê quán:</strong>
                  <span>${member.hometown}</span>
                </div>
              ` : ''}
              
              ${spouse ? `
                <div class="detail-item">
                  <strong>Vợ/Chồng:</strong>
                  <span class="clickable-member" data-member-id="${spouse.id}">${spouse.name}</span>
                </div>
              ` : ''}
              
              ${father || mother ? `
                <div class="detail-item">
                  <strong>Cha mẹ:</strong>
                  <span>
                    ${father ? `<span class="clickable-member" data-member-id="${father.id}">${father.name}</span>` : ''}
                    ${father && mother ? ' & ' : ''}
                    ${mother ? `<span class="clickable-member" data-member-id="${mother.id}">${mother.name}</span>` : ''}
                  </span>
                </div>
              ` : ''}
              
              ${children.length > 0 ? `
                <div class="detail-item">
                  <strong>Con cái:</strong>
                  <div class="children-list">
                    ${children.map(child => 
                      `<span class="clickable-member" data-member-id="${child.id}">${child.name}</span>`
                    ).join(', ')}
                  </div>
                </div>
              ` : ''}
            </div>
            
            ${member.bio ? `
              <div class="member-bio">
                <strong>Tiểu sử:</strong>
                <p>${member.bio}</p>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    // Remove existing modal
    const existingModal = document.getElementById('member-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // Add new modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('member-modal');
    const closeBtn = modal.querySelector('.modal-close');

    // Event listeners
    closeBtn.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    // Add click listeners to related members
    modal.querySelectorAll('.clickable-member').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const relatedMemberId = el.dataset.memberId;
        modal.remove();
        setTimeout(() => showMemberDetails(relatedMemberId), 100);
      });
    });
  }

  // ============ Tree Controls ============
  function initTreeControls() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('member-search');

    // Filter buttons
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        applyFilters();
      });
    });

    // Search functionality
    if (searchInput) {
      searchInput.addEventListener('input', applyFilters);
    }
  }

  function applyFilters() {
    const searchTerm = document.getElementById('member-search')?.value.toLowerCase() || '';
    const cards = document.querySelectorAll('.member-card');

    cards.forEach(card => {
      const memberId = card.dataset.memberId;
      const member = membersMap[memberId];
      
      let show = true;

      // Filter by status
      if (currentFilter === 'living' && member.isDeceased) {
        show = false;
      } else if (currentFilter === 'deceased' && !member.isDeceased) {
        show = false;
      }

      // Filter by search term
      if (searchTerm && !member.name.toLowerCase().includes(searchTerm)) {
        show = false;
      }

      card.style.display = show ? 'block' : 'none';
    });
  }

  // ============ Contact Form ============
  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const name = formData.get('name');
      const email = formData.get('email');
      const message = formData.get('message');

      // Simple validation
      if (!name || !email || !message) {
        alert('Vui lòng điền đầy đủ thông tin.');
        return;
      }

      // Simulate form submission
      alert('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.');
      form.reset();
    });
  }

  // ============ Utility Functions ============
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

})();
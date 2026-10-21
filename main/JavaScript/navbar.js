window.AAIRNavbar = (() => {
  let currentUser = null;
  let host = null;

  const roleConfigs = {
    ADMIN: {
      brandHref: 'Dashboard.html',
      tabs: [
        { label: 'Dashboard', href: 'Dashboard.html' },
        { label: 'Manager Management', href: 'ManagerManagement.html' },
        { label: 'Permission Management', href: 'PermissionManagement.html' },
        { label: 'System Monitoring', href: 'SystemMonitoring.html' },
        { label: 'Audit Logs', href: 'LogView.html' },
      ],
    },
    MANAGER: {
      brandHref: 'Dashboard.html',
      tabs: [
        { label: 'Dashboard', href: 'Dashboard.html' },
        { label: 'User Management', href: 'UserManagement.html' },
        { label: 'Document Management', href: 'DocumentManagement.html' },
        { label: 'Session', href: 'Session.html' },
        { label: 'Statistics', href: 'Statistics.html' },
      ],
    },
    AI_LABELER: {
      brandHref: 'Dashboard.html',
      tabs: [
        { label: 'Dashboard', href: 'Dashboard.html' },
        { label: 'View ALL', href: 'ViewAll.html' },
        { label: 'Session', href: 'Task.html' },
        { label: 'Prompt', href: 'Prompt.html' },
      ],
    },
    MANUAL_LABELER: {
      brandHref: 'Dashboard.html',
      tabs: [
        { label: 'Dashboard', href: 'Dashboard.html' },
        { label: 'View ALL', href: 'ViewAll.html' },
        { label: 'Session', href: 'Task.html' },
      ],
    },
    REVIEWER: {
      brandHref: 'Dashboard.html',
      tabs: [
        { label: 'Dashboard', href: 'Dashboard.html' },
        { label: 'View ALL', href: 'ViewAll.html' },
        { label: 'Review', href: 'Task.html' },
      ],
    },
    RESULT_ANALYST: {
      brandHref: 'Dashboard.html',
      tabs: [
        { label: 'Dashboard', href: 'Dashboard.html' },
        { label: 'View ALL', href: 'ViewAll.html' },
        { label: 'Analyst', href: 'Task.html' },
      ],
    },
    TERMINOLOGY: {
      brandHref: 'Dashboard.html',
      tabs: [
        { label: 'Dashboard', href: 'Dashboard.html' },
        { label: 'Terminology Base', href: 'BaseManagement.html' },
      ],
    },
  };

  const defaultConfig = roleConfigs.RESULT_ANALYST;

  function detectRole() {
    const path = location.pathname;
    if (path.includes('/Admin/')) return 'ADMIN';
    if (path.includes('/Manager/')) return 'MANAGER';
    if (path.includes('/AILabeling/')) return 'AI_LABELER';
    if (path.includes('/ManualLabeling/')) return 'MANUAL_LABELER';
    if (path.includes('/ManualReview/')) return 'REVIEWER';
    if (path.includes('/ResultAnalysis/')) return 'RESULT_ANALYST';
    if (path.includes('/Terminology/')) return 'TERMINOLOGY';
    return currentUser?.role || 'RESULT_ANALYST';
  }

  const roleLabels = {
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    AI_LABELER: 'AI Labeler',
    MANUAL_LABELER: 'Manual Labeler',
    REVIEWER: 'Reviewer',
    RESULT_ANALYST: 'Analyst',
    TERMINOLOGY: 'Terminology',
  };

  const roleLabel = role => roleLabels[role] || (role === 'RESULT_ANALYST' ? 'Analyst' : String(role || '')
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || 'User');

  function pageConfig() {
    const role = detectRole();
    const config = window.AAIRNavbarConfig || {};
    const fallback = roleConfigs[role] || defaultConfig;
    return { ...fallback, ...config, tabs: config.tabs || fallback.tabs };
  }

  function paint(user) {
    if (!host || !user) return;
    currentUser = user;
    const username = user.username || user.email || 'User';
    const role = roleLabel(user.role);
    const initials = username.slice(0, 2).toUpperCase();

    host.querySelectorAll('[data-aa-username], [data-manual-username], #raUsername').forEach(node => {
      node.textContent = username;
    });
    host.querySelectorAll('[data-aa-role], [data-manual-role], #raRole').forEach(node => {
      node.textContent = role;
    });
    host.querySelectorAll('[data-aa-avatar], [data-manual-avatar], #raAvatar, .review-avatar').forEach(node => {
      node.textContent = initials;
    });

    const reviewerName = document.getElementById('reviewerName');
    if (reviewerName && reviewerName !== host.querySelector('#reviewerName')) {
      reviewerName.textContent = username;
    }
  }

  function applyConfig() {
    const config = pageConfig();
    const brand = host.querySelector('.aair-navbar__brand');
    if (brand) {
      brand.href = config.brandHref || defaultConfig.brandHref;
      const brandName = brand.querySelector('strong');
      if (brandName && config.brandName) brandName.textContent = config.brandName;
    }
    const nav = host.querySelector('.aair-navbar__nav');
    if (!nav) return;
    nav.replaceChildren(...config.tabs.map(tab => {
      const link = document.createElement('a');
      link.href = tab.href;
      link.dataset.page = tab.page || tab.href.split('/').pop().split('?')[0];
      const label = document.createElement('span');
      label.textContent = tab.label;
      link.append(label);
      return link;
    }));
  }

  function bind() {
    const page = location.pathname.split('/').pop() || 'Dashboard.html';
    host.querySelectorAll('[data-page]').forEach(link => {
      const active = link.dataset.page === page || (page === '' && link.dataset.page === 'Dashboard.html');
      link.classList.toggle('is-active', active);
    });
    const menu = host.querySelector('.aair-navbar__menu');
    if (menu) {
      menu.addEventListener('click', () => {
        const open = host.classList.toggle('is-menu-open');
        menu.setAttribute('aria-expanded', String(open));
      });
    }
    host.querySelectorAll('.aair-navbar__nav a').forEach(link => link.addEventListener('click', () => host.classList.remove('is-menu-open')));
    host.querySelectorAll('#raLogout, #logoutButton, [data-manual-logout], .aair-navbar__logout').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Are you sure you want to log out?')) window.AAIR?.logout();
      });
    });
  }

  const inlineTemplate = `
<header class="aair-navbar" data-aair-navbar>
  <a class="aair-navbar__brand" href="Dashboard.html" aria-label="AAIR Lab - Dashboard">
    <img src="/resource/icon/logo_remove_BG.png" alt="">
    <strong>AAIR Lab</strong>
  </a>
  <button class="aair-navbar__menu" type="button" aria-label="Open navigation" aria-expanded="false">Menu</button>
  <nav class="aair-navbar__nav" aria-label="Main navigation"></nav>
  <div class="aair-navbar__account aa-account ra-account review-account">
    <span class="aair-navbar__avatar review-avatar" id="raAvatar" data-aa-avatar data-manual-avatar aria-hidden="true">--</span>
    <div class="aair-navbar__identity">
      <b id="raUsername" data-aa-username data-manual-username>Loading...</b>
      <small id="raRole" data-aa-role data-manual-role>User</small>
    </div>
    <button class="aair-navbar__logout outline-button" id="raLogout" data-manual-logout type="button" title="Log out of the system">
      <span>Log out</span>
    </button>
  </div>
</header>`;

  async function loadTemplate() {
    try {
      const scriptSrc = document.currentScript?.src;
      const source = scriptSrc
        ? new URL('../HTML/User/ResultAnalysis/navbar.html', scriptSrc)
        : '/main/HTML/User/ResultAnalysis/navbar.html';
      const response = await fetch(source);
      if (response.ok) return await response.text();
    } catch {
      /* Fallback to inline template when running offline, file://, or across origin */
    }
    return inlineTemplate;
  }

  async function init() {
    host = document.querySelector('[data-aair-navbar]');
    if (!host) {
      const mount = document.querySelector('[data-aair-navbar-mount], [data-manual-navbar-mount]');
      if (!mount) return;
      mount.innerHTML = await loadTemplate();
      host = mount.querySelector('[data-aair-navbar]');
    }
    if (!host) return;
    applyConfig();
    bind();
    if (currentUser) paint(currentUser);
    window.AAIRGuidelineModal?.init();
    if (!currentUser && window.AAIR?.guard) {
      try { paint(await window.AAIR.guard()); } catch { /* guard handles redirect and API errors */ }
    }
  }

  const ready = init();
  function mount(user) { currentUser = user; return ready.then(() => paint(user)); }
  return { mount, ready, roleLabel };
})();

// Compatibility for workspace.js while it migrates to the shared navbar name.
window.AAIRSharedHeader = { mount: user => window.AAIRNavbar.mount(user) };

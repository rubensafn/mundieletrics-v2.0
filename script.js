const menuButton = document.querySelector('[data-menu-button]');
const nav = document.querySelector('.nav');

menuButton.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
});

nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Abrir menu');
}));

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    entry.target.classList.toggle('visible', entry.isIntersecting);
  });
}, { threshold: 0.14 });

document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));

const countObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) {
      entry.target.textContent = '0';
      entry.target.dataset.counting = 'false';
      return;
    }
    if (entry.target.dataset.counting === 'true') return;
    entry.target.dataset.counting = 'true';
    const target = Number(entry.target.dataset.count);
    const duration = 1400;
    const start = performance.now();
    const tick = now => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      entry.target.textContent = Math.floor(target * eased).toLocaleString('pt-BR');
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}, { threshold: 0.7 });

document.querySelectorAll('[data-count]').forEach(element => countObserver.observe(element));

document.querySelectorAll('[data-feature]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-feature]').forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', String(active));
    });
  });
});

const partDetails = {
  led: {
    index: '01 / 03',
    title: 'Iluminação em LED',
    copy: 'Mais presença e visibilidade para acompanhar seus trajetos de dia ou à noite.'
  },
  battery: {
    index: '02 / 03',
    title: 'Bateria removível',
    copy: 'Praticidade para recarregar a energia em casa, no trabalho ou onde sua rotina levar.'
  },
  motor: {
    index: '03 / 03',
    title: 'Motor elétrico',
    copy: 'Resposta direta e condução silenciosa para transformar o deslocamento urbano.'
  }
};

const partPanel = document.querySelector('[data-part-panel]');
const partButtons = document.querySelectorAll('[data-part]');

function closePartPanel() {
  partPanel.classList.remove('open');
  partButtons.forEach(button => {
    button.classList.remove('active');
    button.setAttribute('aria-expanded', 'false');
  });
}

partButtons.forEach(button => button.addEventListener('click', () => {
  const detail = partDetails[button.dataset.part];
  const wasOpen = button.classList.contains('active');
  closePartPanel();
  if (wasOpen) return;
  partPanel.querySelector('[data-part-index]').textContent = detail.index;
  partPanel.querySelector('[data-part-title]').textContent = detail.title;
  partPanel.querySelector('[data-part-copy]').textContent = detail.copy;
  button.classList.add('active');
  button.setAttribute('aria-expanded', 'true');
  partPanel.classList.add('open');
}));

document.querySelector('[data-part-close]').addEventListener('click', closePartPanel);

const componentButtons = [...document.querySelectorAll('[data-component]')];
const componentPopover = document.querySelector('[data-component-popover]');
const componentClose = componentPopover?.querySelector('[data-component-close]');
let activeComponent = null;
let componentHideTimer = null;

componentButtons.forEach(button => {
  button.setAttribute('aria-controls', 'component-popover');
  button.setAttribute('aria-expanded', 'false');
});

function closeComponent({ restoreFocus = true } = {}) {
  if (!componentPopover || componentPopover.hidden) return;
  componentPopover.classList.remove('open');
  if (activeComponent) activeComponent.setAttribute('aria-expanded', 'false');
  const previous = activeComponent;
  activeComponent = null;
  window.clearTimeout(componentHideTimer);
  componentHideTimer = window.setTimeout(() => { componentPopover.hidden = true; }, 280);
  if (restoreFocus) previous?.focus();
}

function openComponent(button) {
  if (!componentPopover) return;
  if (activeComponent === button && !componentPopover.hidden) {
    closeComponent();
    return;
  }
  if (activeComponent) activeComponent.setAttribute('aria-expanded', 'false');
  window.clearTimeout(componentHideTimer);
  activeComponent = button;
  button.setAttribute('aria-expanded', 'true');
  componentPopover.querySelector('[data-component-title]').textContent = button.dataset.component;
  componentPopover.querySelector('[data-component-copy]').textContent = button.dataset.description;
  componentPopover.hidden = false;
  requestAnimationFrame(() => componentPopover.classList.add('open'));
  componentClose?.focus({ preventScroll: true });
}

componentButtons.forEach(button => button.addEventListener('click', () => openComponent(button)));
componentClose?.addEventListener('click', () => closeComponent());

document.addEventListener('pointerdown', event => {
  if (componentPopover?.hidden || componentPopover.contains(event.target) || event.target.closest('[data-component]')) return;
  closeComponent({ restoreFocus: false });
});

const explodedSection = document.querySelector('[data-exploded]');
if (explodedSection) {
  new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) closeComponent({ restoreFocus: false });
  }).observe(explodedSection);
}

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (!componentPopover?.hidden) closeComponent();
  if (nav.classList.contains('open')) {
    nav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Abrir menu');
    menuButton.focus();
  }
});

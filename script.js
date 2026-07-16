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

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGsap = Boolean(window.gsap && window.ScrollTrigger);
const header = document.querySelector('[data-header]');
const journeyStage = document.querySelector('[data-journey-stage]');
const journeyMounted = document.querySelector('[data-journey-mounted]');
const journeyPieces = document.querySelector('[data-journey-pieces]');
const pieceNodes = [...document.querySelectorAll('[data-piece]')];
const journeyHotspots = document.querySelector('[data-journey-hotspots]');
const journeyName = document.querySelector('[data-journey-name]');
const journeyState = document.querySelector('[data-journey-state]');
const heroProduct = document.querySelector('.product-image');
const featureProduct = document.querySelector('.feature-media img');
const labProduct = document.querySelector('[data-lab-product]');
const labModel = document.querySelector('[data-lab-model]');
const progressBar = document.querySelector('[data-scroll-progress]');
const progressPercent = document.querySelector('[data-scroll-percent]');
const componentButtons = [...document.querySelectorAll('[data-journey-component]')];

const models = {
  black: { name: 'Mundi Black', mounted: 'assets/models/black-mounted.png' },
  green: { name: 'Mundi Green', mounted: 'assets/models/green-mounted.png' },
  blue: { name: 'Mundi Blue', mounted: 'assets/models/blue-mounted.png' },
  orange: { name: 'Mundi Orange', mounted: 'assets/models/orange-mounted.png' }
};
const modelAssetCache = new Map();

const focusPoints = {
  handlebar: ['50%', '10%'], seat: ['73%', '19%'], frame: ['49%', '42%'],
  battery: ['40%', '59%'], controller: ['58%', '66%'], wheel: ['19%', '75%']
};

let selectedModel = 'black';
let modelRequestId = 0;
let activeComponent = null;
let componentsInteractive = false;
let lastScrollY = window.scrollY;
let scrollTicking = false;

function updateScrollUI() {
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const progress = Math.min(1, Math.max(0, scrollY / max));
  document.documentElement.style.setProperty('--scroll-progress', progress.toFixed(4));
  if (progressBar) progressBar.style.setProperty('--scroll-progress', progress.toFixed(4));
  if (progressPercent) progressPercent.textContent = String(Math.round(progress * 100)).padStart(2, '0');
  header?.classList.toggle('scrolled', scrollY > 42);

  const velocity = Math.min(1, Math.abs(scrollY - lastScrollY) / 56);
  journeyStage?.style.setProperty('--velocity', velocity.toFixed(3));
  lastScrollY = scrollY;
  scrollTicking = false;
}

window.addEventListener('scroll', () => {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(updateScrollUI);
}, { passive: true });
updateScrollUI();

function setComponentsInteractive(interactive) {
  if (componentsInteractive === interactive) return;
  componentsInteractive = interactive;
  journeyHotspots?.setAttribute('aria-hidden', String(!interactive));
  componentButtons.forEach(button => {
    button.classList.toggle('interactive', interactive);
    button.tabIndex = interactive ? 0 : -1;
    button.setAttribute('aria-hidden', String(!interactive));
  });
  if (!interactive && activeComponent) closeComponent({ restoreFocus: false });
}

function preloadModelAssets(modelKey) {
  if (modelAssetCache.has(modelKey)) return modelAssetCache.get(modelKey);
  const model = models[modelKey];
  const urls = [model.mounted, ...pieceNodes.map(piece => `assets/models/parts/${modelKey}-${piece.dataset.piece}.png`)];
  const request = Promise.all(urls.map(url => new Promise(resolve => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = async () => {
      try { await image.decode?.(); } catch (_) { /* The loaded bitmap is still usable. */ }
      resolve(true);
    };
    image.onerror = () => resolve(false);
    image.src = url;
  }))).then(results => results.every(Boolean));
  modelAssetCache.set(modelKey, request);
  return request;
}

async function applyModel(modelKey, sourceElement) {
  const model = models[modelKey];
  if (!model || modelKey === selectedModel && sourceElement?.classList.contains('active')) return;
  const previousModel = selectedModel;
  const requestId = ++modelRequestId;
  selectedModel = modelKey;
  if (activeComponent) closeComponent({ restoreFocus: false });

  document.documentElement.classList.add('model-loading');
  document.querySelectorAll('[data-model-choice][aria-busy], [data-model-card][aria-busy]').forEach(element => element.removeAttribute('aria-busy'));
  sourceElement?.setAttribute('aria-busy', 'true');
  const loaded = await preloadModelAssets(modelKey);
  if (requestId !== modelRequestId) return;
  document.documentElement.classList.remove('model-loading');
  sourceElement?.removeAttribute('aria-busy');
  if (!loaded) {
    selectedModel = previousModel;
    return;
  }

  document.querySelectorAll('[data-model-choice]').forEach(button => {
    const active = button.dataset.modelChoice === modelKey;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.querySelectorAll('[data-model-card]').forEach(card => card.classList.toggle('active', card.dataset.model === modelKey));

  const swapImages = () => {
    journeyMounted.src = model.mounted;
    journeyMounted.alt = `${model.name} montada`;
    pieceNodes.forEach(piece => { piece.src = `assets/models/parts/${modelKey}-${piece.dataset.piece}.png`; });
    if (heroProduct) { heroProduct.src = model.mounted; heroProduct.alt = `${model.name} montada`; }
    if (featureProduct) { featureProduct.src = model.mounted; featureProduct.alt = `Detalhes da ${model.name}`; }
    if (labProduct) { labProduct.src = model.mounted; labProduct.alt = `${model.name} em exposição interativa`; }
    if (labModel) labModel.textContent = model.name;
    if (journeyName) journeyName.textContent = model.name;
  };

  if (!hasGsap || reduceMotion) {
    swapImages();
    return;
  }
  const mountedTargets = [journeyMounted, heroProduct].filter(Boolean);
  const mountedOpacities = mountedTargets.map(target => Number(gsap.getProperty(target, 'opacity')) || 0);
  const pieceOpacities = pieceNodes.map(piece => Number(gsap.getProperty(piece, 'opacity')) || 0);
  gsap.timeline({ defaults: { overwrite: false } })
    .to(mountedTargets, { autoAlpha: 0, duration: .2, ease: 'power2.in' }, 0)
    .to(pieceNodes, { autoAlpha: 0, duration: .18, ease: 'power2.in' }, 0)
    .call(swapImages, null, .2)
    .to(mountedTargets, { autoAlpha: index => mountedOpacities[index], duration: .48, ease: 'power3.out' }, .2)
    .to(pieceNodes, { autoAlpha: index => pieceOpacities[index], duration: .38, ease: 'power3.out' }, .2);
}

document.querySelectorAll('[data-model-choice]').forEach(button => button.addEventListener('click', () => applyModel(button.dataset.modelChoice, button)));

const modelViewport = document.querySelector('[data-model-viewport]');
const modelCards = [...document.querySelectorAll('[data-model-card]')];
document.querySelector('[data-model-prev]')?.addEventListener('click', () => modelViewport.scrollBy({ left: -modelViewport.clientWidth * .78, behavior: reduceMotion ? 'auto' : 'smooth' }));
document.querySelector('[data-model-next]')?.addEventListener('click', () => modelViewport.scrollBy({ left: modelViewport.clientWidth * .78, behavior: reduceMotion ? 'auto' : 'smooth' }));
document.querySelectorAll('[data-model-select]').forEach(button => button.addEventListener('click', () => {
  const card = button.closest('[data-model-card]');
  applyModel(card.dataset.model, card);
  card.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
}));

const componentPopover = document.querySelector('[data-component-popover]');
const componentClose = componentPopover?.querySelector('[data-component-close]');
const componentLayer = document.querySelector('[data-component-layer]');
const componentBackdrop = document.querySelector('[data-component-backdrop]');
const componentFocusVisual = document.querySelector('.component-focus-visual');
const componentFocusImage = document.querySelector('[data-component-focus-image]');

componentButtons.forEach(button => {
  button.setAttribute('aria-controls', 'component-popover');
  button.setAttribute('aria-expanded', 'false');
  button.tabIndex = -1;
});

function closeComponent({ restoreFocus = true } = {}) {
  if (!componentLayer?.classList.contains('active') || !activeComponent) return;
  const previous = activeComponent;
  const targetRect = previous.getBoundingClientRect();
  const visualWidth = componentFocusVisual.offsetWidth || 360;
  const destinationX = targetRect.left + targetRect.width / 2 - innerWidth * (innerWidth <= 900 ? .5 : .4);
  const destinationY = targetRect.top + targetRect.height / 2 - innerHeight * (innerWidth <= 900 ? .31 : .5);
  const destinationScale = Math.max(.05, targetRect.width / visualWidth);
  previous.setAttribute('aria-expanded', 'false');
  activeComponent = null;

  const finish = () => {
    componentLayer.classList.remove('active');
    componentLayer.setAttribute('aria-hidden', 'true');
    if (hasGsap) gsap.set(componentFocusImage, { clearProps: 'scale,transformOrigin' });
    if (restoreFocus && componentsInteractive) previous.focus();
  };
  if (!hasGsap || reduceMotion) return finish();

  gsap.timeline({ defaults: { overwrite: true }, onComplete: finish })
    .to(componentPopover, { x: 42, autoAlpha: 0, duration: .25, ease: 'power2.in' }, 0)
    .to(componentBackdrop, { opacity: 0, duration: .3, ease: 'power2.inOut' }, 0)
    .to(componentFocusImage, { scale: 1, duration: .32, ease: 'power2.inOut' }, 0)
    .to(componentFocusVisual, { x: destinationX, y: destinationY, scale: destinationScale, rotation: 0, autoAlpha: 0, duration: .48, ease: 'power3.inOut' }, 0);
}

function openComponent(button) {
  if (!componentPopover || !componentLayer || !componentsInteractive) return;
  if (activeComponent === button) return closeComponent();
  if (activeComponent) {
    activeComponent.setAttribute('aria-expanded', 'false');
  }
  activeComponent = button;
  button.setAttribute('aria-expanded', 'true');
  componentPopover.querySelector('[data-component-title]').textContent = button.dataset.journeyComponent;
  componentPopover.querySelector('[data-component-copy]').textContent = button.dataset.description;
  const sourceRect = button.getBoundingClientRect();
  const [focusX, focusY] = focusPoints[button.dataset.partKey] || ['50%', '50%'];
  const focusPieceKey = button.dataset.partKey === 'wheel' ? 'front-wheel' : button.dataset.partKey;
  const focusPiece = pieceNodes.find(piece => piece.dataset.piece === focusPieceKey);
  componentFocusImage.src = focusPiece?.currentSrc || focusPiece?.src || models[selectedModel].mounted;
  componentFocusImage.alt = `${button.dataset.journeyComponent} da ${models[selectedModel].name}`;
  componentFocusVisual.style.setProperty('--focus-x', focusX);
  componentFocusVisual.style.setProperty('--focus-y', focusY);
  componentLayer.classList.add('active');
  componentLayer.setAttribute('aria-hidden', 'false');

  if (!hasGsap || reduceMotion) {
    componentClose?.focus({ preventScroll: true });
    return;
  }
  const targetWidth = componentFocusVisual.offsetWidth || 360;
  const startX = sourceRect.left + sourceRect.width / 2 - innerWidth * (innerWidth <= 900 ? .5 : .4);
  const startY = sourceRect.top + sourceRect.height / 2 - innerHeight * (innerWidth <= 900 ? .31 : .5);
  const startScale = Math.max(.05, sourceRect.width / targetWidth);

  gsap.killTweensOf([componentBackdrop, componentFocusVisual, componentFocusImage, componentPopover]);
  gsap.set(componentBackdrop, { opacity: 0 });
  gsap.set(componentFocusImage, { transformOrigin: `${focusX} ${focusY}`, scale: 1 });
  gsap.set(componentFocusVisual, { xPercent: -50, yPercent: -50, x: startX, y: startY, scale: startScale, rotation: 0, autoAlpha: 1 });
  gsap.set(componentPopover, { x: 46, autoAlpha: 0 });
  gsap.timeline({ onComplete: () => componentClose?.focus({ preventScroll: true }) })
    .to(componentBackdrop, { opacity: 1, duration: .42, ease: 'power2.out' }, 0)
    .to(componentFocusVisual, { x: 0, y: 0, scale: 1, rotation: -1.5, duration: .72, ease: 'power3.out' }, 0)
    .to(componentFocusImage, { scale: 1.12, duration: .78, ease: 'power3.out' }, .04)
    .to(componentPopover, { x: 0, autoAlpha: 1, duration: .5, ease: 'power3.out' }, .18);
}

componentButtons.forEach(button => button.addEventListener('click', () => openComponent(button)));
componentClose?.addEventListener('click', () => closeComponent());
componentBackdrop?.addEventListener('click', () => closeComponent({ restoreFocus: false }));

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (componentLayer?.classList.contains('active')) closeComponent();
    if (nav.classList.contains('open')) {
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Abrir menu');
      menuButton.focus();
    }
  }
  if (event.key !== 'Tab' || !componentLayer?.classList.contains('active')) return;
  const focusable = [...componentPopover.querySelectorAll('button, a[href]')];
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

function setupJourney() {
  if (!journeyStage) return;
  if (!hasGsap || reduceMotion) {
    const engineering = document.querySelector('[data-exploded]');
    const top = engineering
      ? engineering.offsetTop + Math.max(0, engineering.offsetHeight * .42 - innerHeight / 2)
      : innerHeight;
    Object.assign(journeyStage.style, {
      position: 'absolute',
      inset: 'auto 0 auto 0',
      top: `${top}px`,
      height: `${innerHeight}px`,
      visibility: 'visible',
      opacity: '1'
    });
    Object.assign(journeyMounted.style, {
      left: '50%',
      top: '50%',
      transform: 'translate(-50%,-50%)',
      opacity: '1'
    });
    document.querySelector('.journey-caption')?.style.setProperty('opacity', '1');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  const isMobile = innerWidth <= 900;
  const baseScale = isMobile ? .88 : .82;
  const assembled = {
    handlebar: ['-3vw','-20vh',.82,0], seat: ['16vw','-5vh',.84,0], frame: ['0vw','5vh',.82,0],
    fork: ['-16vw','-1vh',.84,0], battery: ['8vw','7vh',.8,0], controller: ['2vw','12vh',.76,0],
    'front-wheel': ['-18vw','13vh',.9,0], 'rear-wheel': ['19vw','13vh',.86,0]
  };
  const spread = isMobile ? {
    handlebar: ['-17vw','-25vh',.9,-5], seat: ['21vw','-21vh',.92,4], frame: ['0vw','-1vh',.78,0],
    fork: ['-27vw','-5vh',.88,-7], battery: ['-18vw','22vh',.9,3], controller: ['7vw','25vh',.9,-4],
    'front-wheel': ['-29vw','12vh',.92,-6], 'rear-wheel': ['29vw','12vh',.92,5]
  } : {
    handlebar: ['-12vw','-27vh',1,-6], seat: ['12vw','-23vh',1,5], frame: ['0vw','-2vh',.9,0],
    fork: ['-14vw','-5vh',1,-8], battery: ['-10vw','24vh',1,4], controller: ['7vw','27vh',1,-4],
    'front-wheel': ['-14vw','13vh',1,-7], 'rear-wheel': ['14vw','13vh',1,6]
  };

  gsap.set(journeyStage, { autoAlpha: 0, transformOrigin: '50% 50%' });
  gsap.set(journeyMounted, { xPercent: -50, yPercent: -50, transformOrigin: '50% 50%' });
  gsap.set(journeyPieces, { xPercent: -50, yPercent: -50 });
  pieceNodes.forEach(piece => {
    const [x,y,scale,rotation] = assembled[piece.dataset.piece];
    gsap.set(piece, { xPercent:-50, yPercent:-50, x, y, scale, rotation, autoAlpha:0, transformOrigin:'50% 50%' });
  });
  gsap.set(journeyHotspots, { xPercent: -50, yPercent: -50, autoAlpha: 0 });
  gsap.set(componentButtons, { autoAlpha: 0, scale: .65 });
  gsap.set('.exploded-outro', { autoAlpha: 0 });

  const tilt = gsap.quickTo(journeyStage, 'rotation', { duration: .45, ease: 'power2.out' });
  const timeline = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '.manifesto',
      endTrigger: '.product-lab',
      start: 'top 82%',
      end: 'top 20%',
      scrub: 1.08,
      invalidateOnRefresh: true,
      onUpdate: self => {
        const interactive = self.progress >= .39 && self.progress <= .67;
        setComponentsInteractive(interactive);
        journeyState.textContent = interactive ? 'Toque para explorar' : self.progress < .39 ? 'Em movimento' : 'Remontando';
        const velocity = self.getVelocity();
        tilt(gsap.utils.clamp(-1.8, 1.8, velocity / 900));
      }
    }
  });

  timeline
    .to(journeyStage, { autoAlpha: 1, duration: .035 }, 0)
    .fromTo(journeyMounted, { x: 0, y: '10vh', scale: baseScale, autoAlpha: 0 }, { x: 0, y: 0, scale: 1, autoAlpha: 1, duration: .11 }, .01)
    .to('.journey-caption', { autoAlpha: 1, duration: .07 }, .04)
    .to(journeyMounted, { y: '-2vh', scale: .94, rotation: -1.1, duration: .14 }, .15)
    .to(journeyMounted, { y: '1vh', scale: .98, rotation: .8, duration: .12 }, .29)
    .to(journeyMounted, { autoAlpha: .12, scale: .84, rotation: 0, duration: .11 }, .37)
    .to('.exploded-intro', { autoAlpha: 0, y: -24, duration: .055 }, .315)
    .to(journeyHotspots, { x: 0, y: 0, autoAlpha: 1, duration: .08 }, .44)
    .to(componentButtons, { autoAlpha: 1, scale: 1, stagger: .008, duration: .08 }, .46)
    .to(componentButtons, { autoAlpha: 0, scale: .72, stagger: .006, duration: .06 }, .64)
    .to(journeyHotspots, { autoAlpha: 0, duration: .05 }, .65)
    .fromTo(journeyMounted, { y: '4vh', scale: .82, autoAlpha: .12 }, { y: 0, scale: .96, autoAlpha: 1, duration: .12 }, .68)
    .to('.exploded-outro', { autoAlpha: 1, y: 0, duration: .075 }, .72)
    .to(journeyMounted, { y: '-1vh', scale: .9, rotation: 1, duration: .12 }, .79)
    .to(journeyMounted, { y: 0, scale: .96, rotation: 0, duration: .1 }, .9)
    .to([journeyMounted, '.journey-caption'], { autoAlpha: 0, duration: .06 }, .965)
    .to(journeyStage, { autoAlpha: 0, duration: .035 }, .965);

  pieceNodes.forEach((piece, index) => {
    const [sx,sy,ss,sr] = spread[piece.dataset.piece];
    const [ax,ay,as,ar] = assembled[piece.dataset.piece];
    timeline
      .to(piece, { x:sx, y:sy, scale:ss, rotation:sr, autoAlpha:1, duration:.13 }, .37 + index * .006)
      .to(piece, { x:ax, y:ay, scale:as, rotation:ar, duration:.12 }, .64 + index * .004)
      .to(piece, { autoAlpha:0, duration:.045 }, .715 + index * .003);
  });

  componentButtons.forEach((button, index) => {
    gsap.to(button, { y: index % 2 ? 5 : -5, rotation: index % 2 ? 1.4 : -1.2, duration: 2.4 + index * .22, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  });
}

if (hasGsap && !reduceMotion) {
  document.querySelectorAll('.model-card').forEach(card => {
    card.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch') return;
      const rect = card.getBoundingClientRect();
      gsap.to(card.querySelector('img'), { x: (event.clientX - rect.left - rect.width / 2) * .018, y: (event.clientY - rect.top - rect.height / 2) * .018, rotation: (event.clientX - rect.left - rect.width / 2) * .002, duration: .45, ease: 'power2.out' });
    });
    card.addEventListener('pointerleave', () => gsap.to(card.querySelector('img'), { x: 0, y: 0, rotation: 0, duration: .6, ease: 'power3.out' }));
  });
}

const productLab = document.querySelector('[data-product-lab]');
const labScene = document.querySelector('[data-lab-scene]');
const labDetail = document.querySelector('[data-lab-detail]');
const labPoints = [...document.querySelectorAll('[data-lab-feature]')];
const labModes = [...document.querySelectorAll('[data-lab-mode]')];

labPoints.forEach(point => point.addEventListener('click', () => {
  const alreadyActive = point.classList.contains('active');
  labPoints.forEach(item => item.classList.remove('active'));
  if (alreadyActive) return labDetail?.classList.remove('open');
  point.classList.add('active');
  labDetail.querySelector('[data-lab-title]').textContent = point.dataset.labFeature;
  labDetail.querySelector('[data-lab-copy]').textContent = point.dataset.labCopy;
  labDetail.classList.add('open');
}));

labModes.forEach(button => button.addEventListener('click', () => {
  const spin = button.dataset.labMode === 'spin';
  labModes.forEach(item => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-selected', String(active));
  });
  productLab?.classList.toggle('spin-mode', spin);
  labDetail?.classList.remove('open');
  labPoints.forEach(item => item.classList.remove('active'));
  if (!spin && hasGsap) gsap.to(labProduct, { x:0, rotationY:0, rotation:0, scale:1, duration:.7, ease:'power3.out' });
}));

if (labScene && labProduct) {
  let dragging = false;
  let dragStart = 0;
  let dragValue = 0;
  labScene.addEventListener('pointerdown', event => {
    if (!productLab?.classList.contains('spin-mode')) return;
    dragging = true;
    dragStart = event.clientX - dragValue;
    labScene.setPointerCapture?.(event.pointerId);
  });
  labScene.addEventListener('pointermove', event => {
    if (!dragging) return;
    dragValue = Math.max(-180, Math.min(180, event.clientX - dragStart));
    if (hasGsap) gsap.to(labProduct, { x:dragValue * .16, rotationY:dragValue * .075, rotation:dragValue * .008, scale:1.02, duration:.18, overwrite:true, ease:'power1.out' });
  });
  const releaseLab = () => {
    if (!dragging) return;
    dragging = false;
    dragValue = 0;
    if (hasGsap) gsap.to(labProduct, { x:0, rotationY:0, rotation:0, scale:1, duration:.9, ease:'elastic.out(1,.55)' });
  };
  labScene.addEventListener('pointerup', releaseLab);
  labScene.addEventListener('pointercancel', releaseLab);
}

if (hasGsap && !reduceMotion && productLab && labProduct) {
  gsap.fromTo(labProduct, { y:'8vh', scale:1.13, rotationY:-4 }, {
    y:0, scale:1, rotationY:0, ease:'none',
    scrollTrigger:{ trigger:productLab, start:'top bottom', end:'top 15%', scrub:1 }
  });
}

setupJourney();

const menuButton = document.querySelector('[data-menu-button]');
const nav = document.querySelector('.nav');

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

menuButton.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  if (open) nav.querySelector('a')?.focus({ preventScroll: true });
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
      item.setAttribute('aria-pressed', String(active));
    });
    const xrayPoints = { '01': [32, 38], '02': [57, 57], '03': [76, 67] };
    const point = xrayPoints[button.dataset.feature];
    if (point) setXrayPosition(point[0], point[1]);
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
const loader = document.querySelector('[data-loader]');
const loaderCount = document.querySelector('[data-loader-count]');
const loaderBar = document.querySelector('[data-loader-bar]');
const backToTop = document.querySelector('[data-back-to-top]');
const modelDock = document.querySelector('[data-model-dock]');
const dockName = document.querySelector('[data-dock-name]');
const hero = document.querySelector('.hero');
const main = document.querySelector('main');
const heroProductAnchor = document.querySelector('[data-hero-product-anchor]');
const journeyStage = document.querySelector('[data-journey-stage]');
const journeyVisual = document.querySelector('[data-journey-visual]');
const journeyMounted = document.querySelector('[data-journey-mounted]');
const journeyPieces = document.querySelector('[data-journey-pieces]');
const pieceNodes = [...document.querySelectorAll('[data-piece]')];
const journeyHotspots = document.querySelector('[data-journey-hotspots]');
const journeyName = document.querySelector('[data-journey-name]');
const journeyState = document.querySelector('[data-journey-state]');
const featureProduct = document.querySelector('[data-xray-product]');
const xrayStage = document.querySelector('[data-xray-stage]');
const xrayOverlay = document.querySelector('[data-xray-overlay]');
const xrayCanvas = document.querySelector('[data-xray-canvas]');
const xrayRange = document.querySelector('[data-xray-range]');
const labProduct = document.querySelector('[data-lab-product]');
const labModel = document.querySelector('[data-lab-model]');
const progressBar = document.querySelector('[data-scroll-progress]');
const progressPercent = document.querySelector('[data-scroll-percent]');
const componentButtons = [...document.querySelectorAll('[data-journey-component]')];

const models = {
  black: { name: 'Mundi Black', shortName: 'Black', mounted: 'assets/models/black-mounted.png', edge: [49,215,255] },
  green: { name: 'Mundi Green', shortName: 'Green', mounted: 'assets/models/green-mounted.png', edge: [90,227,157] },
  blue: { name: 'Mundi Blue', shortName: 'Blue', mounted: 'assets/models/blue-mounted.png', edge: [74,157,255] },
  orange: { name: 'Mundi Orange', shortName: 'Orange', mounted: 'assets/models/orange-mounted.png', edge: [255,155,69] }
};
const modelAssetCache = new Map();
const xrayCache = new Map();

const focusPoints = {
  handlebar: ['50%', '10%'], seat: ['73%', '19%'], frame: ['49%', '42%'],
  battery: ['40%', '59%'], controller: ['58%', '66%'], wheel: ['19%', '75%']
};

let selectedModel = 'black';
let modelRequestId = 0;
let activeComponent = null;
let componentsInteractive = false;
let journeyTimeline = null;
let hotspotFloatTweens = [];
let modelSwapTimeline = null;
let journeyInteractiveRange = [.7, .8];

function updateScrollUI(progress = 0, velocity = 0) {
  document.documentElement.style.setProperty('--scroll-progress', progress.toFixed(4));
  if (progressBar) progressBar.style.setProperty('--scroll-progress', progress.toFixed(4));
  if (progressPercent) progressPercent.textContent = String(Math.round(progress * 100)).padStart(2, '0');
  header?.classList.toggle('scrolled', scrollY > 42);
  const showBackToTop = scrollY > innerHeight * .72 && !activeComponent;
  backToTop?.classList.toggle('visible', showBackToTop);
  if (backToTop) backToTop.disabled = !showBackToTop;
  journeyStage?.style.setProperty('--velocity', Math.min(1, Math.abs(velocity) / 1400).toFixed(3));
}

function setupGlobalScrollUI() {
  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: self => updateScrollUI(self.progress, self.getVelocity())
    });
    updateScrollUI(scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight), 0);
    return;
  }
  const heroObserver = new IntersectionObserver(([entry]) => {
    header?.classList.toggle('scrolled', !entry.isIntersecting);
    backToTop?.classList.toggle('visible', !entry.isIntersecting);
    if (backToTop) backToTop.disabled = entry.isIntersecting;
  }, { threshold: .2 });
  if (hero) heroObserver.observe(hero);
}

backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

function setComponentsInteractive(interactive) {
  if (componentsInteractive === interactive) return;
  componentsInteractive = interactive;
  journeyHotspots?.setAttribute('aria-hidden', String(!interactive));
  componentButtons.forEach(button => {
    button.classList.toggle('interactive', interactive);
    button.tabIndex = interactive ? 0 : -1;
    button.setAttribute('aria-hidden', String(!interactive));
  });
  hotspotFloatTweens.forEach(tween => interactive ? tween.play() : tween.pause());
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
  const wasInteractive = componentsInteractive;
  setComponentsInteractive(false);
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
    setComponentsInteractive(wasInteractive);
    return;
  }
  selectedModel = modelKey;

  document.querySelectorAll('[data-model-choice]').forEach(button => {
    const active = button.dataset.modelChoice === modelKey;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  document.querySelectorAll('[data-model-card]').forEach(card => card.classList.toggle('active', card.dataset.model === modelKey));

  const swapImages = () => {
    document.documentElement.dataset.model = modelKey;
    journeyMounted.src = model.mounted;
    journeyMounted.alt = `${model.name} montada`;
    pieceNodes.forEach(piece => { piece.src = `assets/models/parts/${modelKey}-${piece.dataset.piece}.png`; });
    if (featureProduct) { featureProduct.src = model.mounted; featureProduct.alt = `Detalhes da ${model.name}`; }
    if (labProduct) { labProduct.src = model.mounted; labProduct.alt = `${model.name} em exposição interativa`; }
    if (labModel) labModel.textContent = model.name;
    if (journeyName) journeyName.textContent = model.name;
    if (dockName) dockName.textContent = model.shortName;
    renderXray(modelKey);
  };

  if (!hasGsap || reduceMotion) {
    swapImages();
    setComponentsInteractive(wasInteractive);
    return;
  }
  modelSwapTimeline?.kill();
  modelSwapTimeline = gsap.timeline({ defaults: { overwrite: 'auto' }, onComplete: () => {
    const progress = journeyTimeline?.progress() || 0;
    setComponentsInteractive(progress >= journeyInteractiveRange[0] && progress <= journeyInteractiveRange[1]);
  } })
    .to(journeyVisual, { autoAlpha: .12, duration: .2, ease: 'power2.in' }, 0)
    .call(swapImages, null, .2)
    .to(journeyVisual, { autoAlpha:1, duration: .42, ease: 'power3.out' }, .2);
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
const componentContactLink = componentPopover?.querySelector('a[href="#contato"]');

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
    document.body.classList.remove('component-open');
    if (main) main.inert = false;
    if (header) header.inert = false;
    if (modelDock) modelDock.inert = false;
    if (journeyStage) journeyStage.inert = false;
    if (hasGsap) requestAnimationFrame(() => ScrollTrigger.refresh());
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
  document.body.classList.add('component-open');
  if (main) main.inert = true;
  if (header) header.inert = true;
  if (modelDock) modelDock.inert = true;
  if (journeyStage) journeyStage.inert = true;
  if (backToTop) backToTop.disabled = true;
  componentClose?.focus({ preventScroll: true });

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
  gsap.timeline()
    .to(componentBackdrop, { opacity: 1, duration: .42, ease: 'power2.out' }, 0)
    .to(componentFocusVisual, { x: 0, y: 0, scale: 1, rotation: -1.5, duration: .72, ease: 'power3.out' }, 0)
    .to(componentFocusImage, { scale: 1.12, duration: .78, ease: 'power3.out' }, .04)
    .to(componentPopover, { x: 0, autoAlpha: 1, duration: .5, ease: 'power3.out' }, .18);
}

componentButtons.forEach(button => button.addEventListener('click', () => openComponent(button)));
componentClose?.addEventListener('click', () => closeComponent());
componentBackdrop?.addEventListener('click', () => closeComponent());
componentContactLink?.addEventListener('click', event => {
  event.preventDefault();
  closeComponent({ restoreFocus:false });
  setTimeout(() => document.querySelector('#contato')?.scrollIntoView({ behavior:reduceMotion ? 'auto' : 'smooth' }), reduceMotion ? 0 : 520);
});

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
    Object.assign(journeyStage.style, { position:'absolute', inset:'0', height:'100dvh', visibility:'visible', opacity:'1' });
    Object.assign(journeyMounted.style, {
      left: '50%',
      top: '50%',
      transform: 'translate(-50%,-50%)',
      opacity: '1'
    });
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  const isMobile = innerWidth <= 900;
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

  const getHeroState = () => {
    const rect = heroProductAnchor?.getBoundingClientRect();
    if (!rect) return { x:0, y:0, scale:1 };
    const documentLeft = rect.left + scrollX;
    const documentTop = rect.top + scrollY;
    const scale = Math.min(rect.width / Math.max(1, journeyMounted.offsetWidth), rect.height / Math.max(1, journeyMounted.offsetHeight)) * (isMobile ? .82 : .9);
    return {
      x: documentLeft + rect.width / 2 - innerWidth / 2,
      y: documentTop + rect.height / 2 - innerHeight / 2,
      scale: gsap.utils.clamp(.78, 1.55, scale)
    };
  };
  const heroState = getHeroState();
  const explodedSection = document.querySelector('.exploded');
  const modelsSection = document.querySelector('#modelos');
  const journeyDistance = Math.max(1, (modelsSection?.offsetTop || document.documentElement.scrollHeight) - innerHeight * .92);
  const openStart = gsap.utils.clamp(.48, .62, ((explodedSection?.offsetTop || journeyDistance * .6) - innerHeight * .35) / journeyDistance);
  const spreadStart = openStart + .045;
  const exploreStart = Math.min(.7, spreadStart + .085);
  const exploreEnd = Math.min(.76, exploreStart + .09);
  const reassembleStart = exploreEnd;
  const mountedReturn = .87;
  journeyInteractiveRange = [exploreStart, exploreEnd];

  gsap.set(journeyStage, { autoAlpha: 1, transformOrigin: '50% 50%' });
  gsap.set(journeyMounted, { xPercent:-50, yPercent:-50, x:heroState.x, y:heroState.y, scale:heroState.scale, autoAlpha:1, transformOrigin:'50% 50%' });
  gsap.set(journeyPieces, { xPercent: -50, yPercent: -50 });
  pieceNodes.forEach(piece => {
    const [x,y,scale,rotation] = assembled[piece.dataset.piece];
    gsap.set(piece, { xPercent:-50, yPercent:-50, x, y, scale, rotation, autoAlpha:0, transformOrigin:'50% 50%' });
  });
  gsap.set(journeyHotspots, { xPercent: -50, yPercent: -50, autoAlpha: 0 });
  gsap.set(componentButtons, { autoAlpha: 0, scale: .65 });
  gsap.set('.journey-caption', { autoAlpha: 0 });
  gsap.set('.exploded-intro', { autoAlpha:1, y:0 });
  gsap.set('.exploded-outro', { autoAlpha: 0 });

  hotspotFloatTweens.forEach(tween => tween.kill());
  hotspotFloatTweens = [];
  gsap.killTweensOf(journeyVisual, 'rotation');
  const tilt = gsap.quickTo(journeyVisual, 'rotation', { duration: .45, ease: 'power2.out' });
  journeyTimeline?.scrollTrigger?.kill();
  journeyTimeline?.kill();
  journeyTimeline = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '.hero',
      endTrigger: '#modelos',
      start: 'top top',
      end: 'top 92%',
      scrub: 1.12,
      invalidateOnRefresh: true,
      onUpdate: self => {
        const velocity = self.getVelocity();
        tilt(gsap.utils.clamp(-1.8, 1.8, velocity / 900));
      },
      onScrubComplete: () => tilt(0)
    }
  });

  journeyTimeline
    .fromTo(journeyMounted,
      { x:() => getHeroState().x, y:() => getHeroState().y, scale:() => getHeroState().scale, rotation:0, autoAlpha:1 },
      { x:0, y:0, scale:1, rotation:0, autoAlpha:1, duration:.17 }, 0)
    .to(journeyVisual, { x:isMobile ? '28vw' : '13vw', y:isMobile ? '12vh' : 0, scale:isMobile ? .5 : .9, duration:.1 }, .17)
    .to('.journey-caption', { autoAlpha:1, duration:.055 }, .12)
    .to(journeyVisual, { x:0, y:0, scale:1, duration:.1 }, openStart - .1)
    .to(journeyMounted, { y:0, scale:.92, rotation:0, autoAlpha:.1, duration:.09 }, openStart - .02)
    .to('.exploded-intro', { autoAlpha:0, y:-22, duration:.055 }, openStart)
    .to(journeyHotspots, { x:0, y:0, autoAlpha:1, duration:.055 }, exploreStart - .02)
    .to(componentButtons, { autoAlpha:1, scale:1, stagger:.006, duration:.06 }, exploreStart)
    .to(componentButtons, { autoAlpha:0, scale:.72, stagger:.005, duration:.05 }, exploreEnd - .015)
    .to(journeyHotspots, { autoAlpha:0, duration:.04 }, exploreEnd)
    .to(journeyMounted, { y:0, scale:1, rotation:0, autoAlpha:1, duration:.06 }, mountedReturn)
    .to('.exploded-outro', { autoAlpha:1, y:0, duration:.065 }, mountedReturn)
    .to(journeyMounted, { y:'-5vh', scale:.86, autoAlpha:0, duration:.04 }, .95)
    .to(['.journey-caption',journeyStage], { autoAlpha:0, duration:.03 }, .97);

  pieceNodes.forEach((piece, index) => {
    const [sx,sy,ss,sr] = spread[piece.dataset.piece];
    const [ax,ay,as,ar] = assembled[piece.dataset.piece];
    journeyTimeline
      .to(piece, { x:ax, y:ay, scale:as, rotation:ar, autoAlpha:1, duration:.09 }, openStart - .025 + index * .003)
      .to(piece, { x:sx, y:sy, scale:ss, rotation:sr, autoAlpha:1, duration:.12 }, spreadStart + index * .004)
      .to(piece, { x:ax, y:ay, scale:as, rotation:ar, duration:.075 }, reassembleStart + index * .003)
      .to(piece, { autoAlpha:0, duration:.035 }, .86 + index * .002);
  });

  journeyTimeline.eventCallback('onUpdate', () => {
    const progress = journeyTimeline.progress();
    const interactive = progress >= exploreStart && progress <= exploreEnd;
    setComponentsInteractive(interactive);
    if (journeyState) journeyState.textContent = interactive ? 'Toque para explorar' : progress < openStart ? 'Em movimento' : progress < exploreStart ? 'Abrindo engenharia' : 'Remontando';
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

if (reduceMotion) {
  const spinMode = labModes.find(button => button.dataset.labMode === 'spin');
  if (spinMode) {
    spinMode.disabled = true;
    spinMode.setAttribute('aria-disabled', 'true');
    spinMode.title = 'Desativado pela preferência de movimento reduzido';
  }
}

labPoints.forEach(point => point.addEventListener('click', () => {
  const alreadyActive = point.classList.contains('active');
  labPoints.forEach(item => {
    item.classList.remove('active');
    item.setAttribute('aria-expanded', 'false');
  });
  if (alreadyActive) return labDetail?.classList.remove('open');
  point.classList.add('active');
  point.setAttribute('aria-expanded', 'true');
  labDetail.querySelector('[data-lab-title]').textContent = point.dataset.labFeature;
  labDetail.querySelector('[data-lab-copy]').textContent = point.dataset.labCopy;
  labDetail.classList.add('open');
}));

labModes.forEach(button => button.addEventListener('click', () => {
  if (reduceMotion && button.dataset.labMode === 'spin') return;
  const spin = button.dataset.labMode === 'spin';
  labModes.forEach(item => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  productLab?.classList.toggle('spin-mode', spin);
  labDetail?.classList.remove('open');
  labPoints.forEach(item => {
    item.classList.remove('active');
    item.setAttribute('aria-expanded', 'false');
  });
  if (!spin && hasGsap) gsap.to(labProduct, { x:0, rotationY:0, rotation:0, scale:1, duration:.7, ease:'power3.out' });
}));

if (labScene && labProduct) {
  let dragging = false;
  let dragStart = 0;
  let dragValue = 0;
  labScene.addEventListener('pointerdown', event => {
    if (reduceMotion || !productLab?.classList.contains('spin-mode')) return;
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
  labScene.addEventListener('keydown', event => {
    if (reduceMotion || !productLab?.classList.contains('spin-mode') || !['ArrowLeft','ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    dragValue = Math.max(-180, Math.min(180, dragValue + direction * 24));
    if (hasGsap) gsap.to(labProduct, { x:dragValue * .16, rotationY:dragValue * .075, rotation:dragValue * .008, scale:1.02, duration:.3, overwrite:true, ease:'power2.out' });
  });
}

if (hasGsap && !reduceMotion && productLab && labProduct) {
  gsap.fromTo(labProduct, { y:'8vh', scale:1.13, rotationY:-4 }, {
    y:0, scale:1, rotationY:0, ease:'none',
    scrollTrigger:{ trigger:productLab, start:'top bottom', end:'top 15%', scrub:1 }
  });
}

function waitForImage(image) {
  if (!image) return Promise.resolve(false);
  if (image.complete) {
    if (!image.naturalWidth) return Promise.resolve(false);
    return image.decode?.().then(() => true).catch(() => true) || Promise.resolve(true);
  }
  return new Promise(resolve => {
    const finish = result => {
      image.removeEventListener('load', loaded);
      image.removeEventListener('error', failed);
      resolve(result);
    };
    const loaded = () => image.decode?.().then(() => finish(true)).catch(() => finish(true));
    const failed = () => finish(false);
    image.addEventListener('load', loaded, { once: true });
    image.addEventListener('error', failed, { once: true });
  });
}

function setXrayPosition(x, y = 50) {
  if (!xrayStage) return;
  const safeX = Math.max(7, Math.min(93, Number(x)));
  const safeY = Math.max(13, Math.min(87, Number(y)));
  xrayStage.style.setProperty('--xray-x', `${safeX}%`);
  xrayStage.style.setProperty('--xray-y', `${safeY}%`);
  if (xrayRange) xrayRange.value = String(Math.round(safeX));
}

async function renderXray(modelKey = selectedModel) {
  if (!featureProduct || !xrayCanvas || !models[modelKey]) return;
  const expectedSource = new URL(models[modelKey].mounted, document.baseURI).href;
  await waitForImage(featureProduct);
  if (modelKey !== selectedModel || featureProduct.currentSrc && featureProduct.currentSrc !== expectedSource && featureProduct.src !== expectedSource) return;

  const cached = xrayCache.get(modelKey);
  const context = xrayCanvas.getContext('2d');
  if (!context) return;
  if (cached) {
    xrayCanvas.width = cached.width;
    xrayCanvas.height = cached.height;
    context.putImageData(cached.image, 0, 0);
    xrayOverlay?.classList.remove('fallback');
    return;
  }

  try {
    const naturalWidth = featureProduct.naturalWidth || 1200;
    const naturalHeight = featureProduct.naturalHeight || 800;
    const width = Math.min(960, naturalWidth);
    const height = Math.max(1, Math.round(width * naturalHeight / naturalWidth));
    const source = document.createElement('canvas');
    source.width = width;
    source.height = height;
    const sourceContext = source.getContext('2d', { willReadFrequently: true });
    sourceContext.drawImage(featureProduct, 0, 0, width, height);
    const sourcePixels = sourceContext.getImageData(0, 0, width, height);
    const grayscale = new Uint8ClampedArray(width * height);
    const output = sourceContext.createImageData(width, height);
    const [red, green, blue] = models[modelKey].edge;

    for (let index = 0, pixel = 0; index < sourcePixels.data.length; index += 4, pixel += 1) {
      grayscale[pixel] = sourcePixels.data[index] * .2126 + sourcePixels.data[index + 1] * .7152 + sourcePixels.data[index + 2] * .0722;
    }
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const index = y * width + x;
        const gx = -grayscale[index - width - 1] + grayscale[index - width + 1]
          - 2 * grayscale[index - 1] + 2 * grayscale[index + 1]
          - grayscale[index + width - 1] + grayscale[index + width + 1];
        const gy = -grayscale[index - width - 1] - 2 * grayscale[index - width] - grayscale[index - width + 1]
          + grayscale[index + width - 1] + 2 * grayscale[index + width] + grayscale[index + width + 1];
        const magnitude = Math.min(255, Math.hypot(gx, gy));
        if (magnitude < 25) continue;
        const outputIndex = index * 4;
        output.data[outputIndex] = red;
        output.data[outputIndex + 1] = green;
        output.data[outputIndex + 2] = blue;
        output.data[outputIndex + 3] = Math.min(245, 50 + magnitude * 1.25);
      }
    }

    xrayCanvas.width = width;
    xrayCanvas.height = height;
    context.putImageData(output, 0, 0);
    xrayCache.set(modelKey, { width, height, image: output });
    xrayOverlay?.classList.remove('fallback');
  } catch (_) {
    xrayOverlay?.style.setProperty('--xray-source', `url("${models[modelKey].mounted}")`);
    xrayOverlay?.classList.add('fallback');
  }
}

if (xrayStage) {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchAxis = null;
  const moveLens = event => {
    const rect = xrayStage.getBoundingClientRect();
    setXrayPosition((event.clientX - rect.left) / rect.width * 100, (event.clientY - rect.top) / rect.height * 100);
  };
  xrayStage.addEventListener('pointermove', event => {
    if (event.pointerType !== 'touch') return moveLens(event);
    if (!xrayStage.hasPointerCapture?.(event.pointerId)) return;
    const dx = Math.abs(event.clientX - touchStartX);
    const dy = Math.abs(event.clientY - touchStartY);
    if (!touchAxis && Math.max(dx, dy) > 10) touchAxis = dx > dy ? 'x' : 'y';
    if (touchAxis !== 'x') return;
    event.preventDefault();
    moveLens(event);
  });
  xrayStage.addEventListener('pointerdown', event => {
    if (event.target === xrayRange) return;
    if (event.pointerType !== 'touch') return moveLens(event);
    touchStartX = event.clientX;
    touchStartY = event.clientY;
    touchAxis = null;
    xrayStage.setPointerCapture?.(event.pointerId);
  });
  xrayStage.addEventListener('pointerup', event => xrayStage.releasePointerCapture?.(event.pointerId));
  xrayStage.addEventListener('pointercancel', event => xrayStage.releasePointerCapture?.(event.pointerId));
  xrayRange?.addEventListener('input', event => setXrayPosition(event.target.value, 52));
}

function setLoaderProgress(value) {
  const progress = Math.max(0, Math.min(100, Math.round(value)));
  loader?.style.setProperty('--loader-progress', String(progress / 100));
  loaderBar?.style.setProperty('--loader-progress', String(progress / 100));
  if (loaderCount) loaderCount.textContent = String(progress).padStart(2, '0');
}

async function runLoader() {
  const tasks = [
    preloadModelAssets(selectedModel),
    waitForImage(journeyMounted),
    document.fonts?.ready || Promise.resolve(true)
  ];
  let completed = 0;
  setLoaderProgress(4);
  const tracked = tasks.map(task => Promise.resolve(task).finally(() => {
    completed += 1;
    setLoaderProgress(8 + completed / tasks.length * 82);
  }));
  await Promise.race([
    Promise.allSettled(tracked),
    new Promise(resolve => setTimeout(resolve, 4800))
  ]);
  await Promise.race([
    renderXray(selectedModel),
    new Promise(resolve => setTimeout(resolve, 1600))
  ]);
  setLoaderProgress(100);
  setupJourney();
  setupGlobalScrollUI();
  if (hasGsap) ScrollTrigger.refresh();

  const revealSite = () => {
    document.body.classList.remove('is-loading');
    loader?.classList.add('ready');
    loader?.setAttribute('aria-hidden', 'true');
    modelDock?.classList.add('visible');
    if (main) main.inert = false;
    if (header) header.inert = false;
    if (modelDock) modelDock.inert = false;
    updateScrollUI(0, 0);
    if (hasGsap) requestAnimationFrame(() => requestAnimationFrame(() => {
      ScrollTrigger.refresh(true);
      ScrollTrigger.update();
    }));
  };
  if (!loader || !hasGsap || reduceMotion) return revealSite();

  document.body.classList.remove('is-loading');
  gsap.timeline({ defaults: { overwrite: true }, onComplete: revealSite })
    .to('.loader-status', { autoAlpha: 0, y: 18, duration: .25, ease: 'power2.in' }, .18)
    .to('.loader-brand', { xPercent: 8, autoAlpha: 0, duration: .5, ease: 'power2.in' }, .22)
    .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: .78, ease: 'power4.inOut' }, .32);
}

let journeyLayout = innerWidth <= 900 ? 'mobile' : 'desktop';
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    journeyLayout = innerWidth <= 900 ? 'mobile' : 'desktop';
    if (hasGsap && !reduceMotion) setupJourney();
    if (hasGsap) ScrollTrigger.refresh(true);
  }, 180);
});

runLoader();

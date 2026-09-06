// ---------- Reset scroll position on reload ----------
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

const navigationEntry = performance.getEntriesByType('navigation')[0];
if (navigationEntry?.type === 'reload') {
  history.replaceState(null, '', `${location.pathname}${location.search}`);
  window.scrollTo(0, 0);
}

// ---------- Navbar scroll state ----------
const navbar = document.getElementById('navbar');
const progressBar = document.getElementById('progressBar');
const heroPin = document.getElementById('heroPin');
const heroVideo = document.querySelector('.hero-video');
const heroContent = document.getElementById('heroContent');
const heroOverlayScroll = document.getElementById('heroOverlayScroll');
const heroFrost = document.getElementById('heroFrost');
const petalField = document.getElementById('petalField');
const scrollCue = document.getElementById('scrollCue');
const heroStory = document.getElementById('heroStory');
const petalDepths = [
  document.getElementById('petalDepth1'),
  document.getElementById('petalDepth2'),
  document.getElementById('petalDepth3'),
];

const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
// maps a global progress value into a local 0..1 range for a staged animation
const stage = (p, start, end) => clamp01((p - start) / (end - start));

const storyTag = heroStory?.querySelector('[data-anim="tag"]');
const storyLines = heroStory ? [...heroStory.querySelectorAll('[data-anim="line"] i')] : [];
const storyNumber = heroStory?.querySelector('[data-anim="number"]');
const storyHeading = heroStory?.querySelector('[data-anim="heading"]');
const storyParagraph = heroStory?.querySelector('[data-anim="words"]');
let storyWords = [];

// split the chapter paragraph into words so they can reveal one by one
if (storyParagraph) {
  storyParagraph.innerHTML = storyParagraph.textContent
    .trim()
    .split(/\s+/)
    .map(w => `<span class="word">${w}</span>`)
    .join(' ');
  storyWords = [...storyParagraph.querySelectorAll('.word')];
}

function renderHeroStory(p) {
  const sp = stage(p, 0.62, 0.98);

  if (storyTag) {
    const t = stage(sp, 0, 0.12);
    storyTag.style.opacity = t;
    storyTag.style.transform = `translateY(${(1 - t) * 20}px)`;
  }

  storyLines.forEach((line, i) => {
    const t = stage(sp, 0.05 + i * 0.07, 0.22 + i * 0.07);
    line.style.transform = `translateY(${(1 - t) * 110}%)`;
  });

  if (storyNumber) {
    const t = stage(sp, 0.26, 0.38);
    storyNumber.style.opacity = t;
    storyNumber.style.transform = `translateY(${(1 - t) * 24}px)`;
  }

  if (storyHeading) {
    const t = stage(sp, 0.32, 0.44);
    storyHeading.style.opacity = t;
    storyHeading.style.transform = `translateY(${(1 - t) * 24}px)`;
  }

  const wordSpan = 0.42 / Math.max(storyWords.length, 1);
  storyWords.forEach((word, i) => {
    const t = stage(sp, 0.44 + i * wordSpan, 0.44 + i * wordSpan + 0.1);
    word.style.opacity = t;
    word.style.transform = `translateY(${(1 - t) * 14}px)`;
  });
}

function onScroll() {
  navbar.classList.toggle('scrolled', window.scrollY > 40);

  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = progress + '%';

  // scroll-driven hero animation while the hero stays pinned
  if (heroPin && heroVideo) {
    const pinRange = heroPin.offsetHeight - window.innerHeight;
    const heroProgress = pinRange > 0 ? clamp01(scrollTop / pinRange) : 0;

    const fade = stage(heroProgress, 0.12, 0.5);
    heroVideo.style.transform = `scale(${1 + fade * 0.55}) translateY(${fade * -40}px)`;
    // partial, so the zoomed frame still reads behind the frost
    heroOverlayScroll.style.opacity = String(fade * 0.55);
    heroContent.style.setProperty('--scroll-y', `${fade * -120}px`);
    heroContent.style.opacity = String(1 - stage(heroProgress, 0.04, 0.26));
    scrollCue.style.opacity = String(1 - stage(heroProgress, 0, 0.1));

    // the zoom settles, then the frost turns it into a backdrop for the story
    if (heroFrost) heroFrost.style.opacity = String(stage(heroProgress, 0.44, 0.6));

    petalField.style.opacity = String(1 - stage(heroProgress, 0.3, 0.56));

    renderHeroStory(heroProgress);

    // flower petals drift at different depths as the video scrolls past
    const depthFactors = [220, 140, 70];
    petalDepths.forEach((layer, i) => {
      if (layer) layer.style.transform = `translateY(${heroProgress * depthFactors[i]}px) rotate(${heroProgress * 8}deg)`;
    });
  }
}

let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    onScroll();
    ticking = false;
  });
}, { passive: true });
onScroll();

// ---------- Floating flower petals ----------
function createPetals() {
  const counts = [3, 4, 5]; // foreground -> background
  const sizes = [[16, 24], [11, 17], [7, 12]];
  const opacities = [0.6, 0.42, 0.24];
  const durations = [[9, 14], [13, 19], [17, 25]];
  const palette = [
    ['#f7d3e0', '#e58caa'],
    ['#f6c6d6', '#d97193'],
    ['#f9dbe6', '#eda6c0'],
  ];

  petalDepths.forEach((layer, depth) => {
    if (!layer) return;
    for (let i = 0; i < counts[depth]; i++) {
      const petal = document.createElement('div');
      petal.className = 'petal';
      const size = sizes[depth][0] + Math.random() * (sizes[depth][1] - sizes[depth][0]);
      const duration = durations[depth][0] + Math.random() * (durations[depth][1] - durations[depth][0]);
      const [colorA, colorB] = palette[depth];
      petal.style.left = `${Math.random() * 100}%`;
      petal.style.width = `${size}px`;
      petal.style.height = `${size * 0.8}px`;
      petal.style.opacity = String(opacities[depth]);
      petal.style.setProperty('--petal-a', colorA);
      petal.style.setProperty('--petal-b', colorB);
      petal.style.setProperty('--sway', `${(Math.random() - 0.5) * 160}px`);
      petal.style.animationDuration = `${duration}s`;
      petal.style.animationDelay = `-${Math.random() * duration}s`;
      layer.appendChild(petal);
    }
  });
}
createPetals();

// slow, faint petals drifting through the lower sections to carry the hero's atmosphere
document.querySelectorAll('[data-ambient]').forEach(layer => {
  const count = Number(layer.dataset.ambient);
  for (let i = 0; i < count; i++) {
    const petal = document.createElement('div');
    petal.className = 'petal';
    const size = 8 + Math.random() * 12;
    const duration = 22 + Math.random() * 16;
    petal.style.left = `${Math.random() * 100}%`;
    petal.style.width = `${size}px`;
    petal.style.height = `${size * 0.8}px`;
    petal.style.opacity = String(0.11 + Math.random() * 0.1);
    petal.style.setProperty('--petal-a', '#e8c3d3');
    petal.style.setProperty('--petal-b', '#c98da4');
    petal.style.setProperty('--sway', `${(Math.random() - 0.5) * 140}px`);
    petal.style.animationDuration = `${duration}s`;
    petal.style.animationDelay = `-${Math.random() * duration}s`;
    layer.appendChild(petal);
  }
});

// ---------- Hero video autoplay ----------
// iOS only honours autoplay when muted is set as a property, and low-power mode still blocks it
if (heroVideo) {
  heroVideo.muted = true;
  heroVideo.defaultMuted = true;

  const startHeroVideo = () => heroVideo.play().catch(() => {});
  startHeroVideo();
  heroVideo.addEventListener('loadeddata', startHeroVideo, { once: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) startHeroVideo();
  });

  // last resort for browsers that refuse until the user interacts
  ['touchstart', 'pointerdown'].forEach(evt => {
    document.addEventListener(evt, startHeroVideo, { once: true, passive: true });
  });
}

// ---------- Custom cursor ----------
const cursorDot = document.getElementById('cursorDot');
const cursorRing = document.getElementById('cursorRing');
let ringX = 0, ringY = 0, targetX = 0, targetY = 0;

window.addEventListener('mousemove', (e) => {
  targetX = e.clientX;
  targetY = e.clientY;
  cursorDot.style.left = targetX + 'px';
  cursorDot.style.top = targetY + 'px';
});

function animateRing() {
  ringX += (targetX - ringX) * 0.18;
  ringY += (targetY - ringY) * 0.18;
  cursorRing.style.left = ringX + 'px';
  cursorRing.style.top = ringY + 'px';
  requestAnimationFrame(animateRing);
}
animateRing();

document.querySelectorAll('a, button, .work-card').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursorRing.classList.add('hovering');
    cursorRing.setAttribute('data-label', el.dataset.cursor || '');
  });
  el.addEventListener('mouseleave', () => cursorRing.classList.remove('hovering'));
});

// ---------- Mobile nav toggle ----------
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

[...navLinks.children].forEach((li, i) => li.style.setProperty('--i', i));

function setMenu(open) {
  navLinks.classList.toggle('open', open);
  navToggle.classList.toggle('active', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  document.body.style.overflow = open ? 'hidden' : '';
}

navToggle?.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => setMenu(false));
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') setMenu(false);
});

// ---------- Active section highlight ----------
const navItems = [...document.querySelectorAll('[data-nav]')];
const sectionFor = (link) => document.querySelector(link.getAttribute('href'));

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const link = navItems.find(l => sectionFor(l) === entry.target);
    if (link) link.classList.toggle('is-active', entry.isIntersecting);
  });
}, { rootMargin: '-45% 0px -45% 0px' });

navItems.forEach(link => {
  const section = sectionFor(link);
  if (section) sectionObserver.observe(section);
});

// ---------- Scroll reveal ----------
const revealTargets = document.querySelectorAll('.reveal-up, .chapter');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.2, rootMargin: '0px 0px -60px 0px' });

revealTargets.forEach(el => revealObserver.observe(el));

// stagger cards within the same grid so they cascade instead of popping together
document.querySelectorAll('.work-grid, .caps-grid, .stats').forEach(grid => {
  [...grid.children].forEach((card, i) => card.style.setProperty('--d', `${i * 0.09}s`));
});

// ---------- 3D tilt + spotlight cards ----------
document.querySelectorAll('[data-tilt]').forEach(card => {
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    card.classList.add('tilting');
    card.style.setProperty('--ry', `${(px - 0.5) * 11}deg`);
    card.style.setProperty('--rx', `${(0.5 - py) * 9}deg`);
    card.style.setProperty('--ty', '-6px');
    card.style.setProperty('--mx', `${px * 100}%`);
    card.style.setProperty('--my', `${py * 100}%`);
  });

  card.addEventListener('pointerleave', () => {
    card.classList.remove('tilting');
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
    card.style.setProperty('--ty', '0px');
  });
});

// ---------- Magnetic button ----------
document.querySelectorAll('[data-magnetic]').forEach(btn => {
  btn.addEventListener('pointermove', (e) => {
    const r = btn.getBoundingClientRect();
    btn.style.setProperty('--mgx', `${(e.clientX - (r.left + r.width / 2)) * 0.25}px`);
    btn.style.setProperty('--mgy', `${(e.clientY - (r.top + r.height / 2)) * 0.35}px`);
  });
  btn.addEventListener('pointerleave', () => {
    btn.style.setProperty('--mgx', '0px');
    btn.style.setProperty('--mgy', '0px');
  });
});

// ---------- Animated stat counters ----------
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const start = performance.now();

    const tick = (now) => {
      const t = Math.min((now - start) / 1400, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased) + (t === 1 ? suffix : '');
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    counterObserver.unobserve(el);
  });
}, { threshold: 0.6 });

document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));

// trigger hero reveal immediately on load
window.addEventListener('load', () => {
  document.querySelectorAll('.hero .reveal-up').forEach(el => el.classList.add('is-visible'));
});

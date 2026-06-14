const PET_CONFIG = {
  size: 128,
  bobPixels: 4,
  bobSpeed: 0.006,
  idleFrameMs: 700,
  grabFrameMs: 240,
  blinkFrameMs: 120,
  earFrameMs: 130,
  tailFrameMs: 170,
  mouthFrameMs: 150,
  idleMotionMinMs: 3500,
  idleMotionMaxMs: 8500
};

const PetState = Object.freeze({
  IDLE: 'idle',
  GRAB: 'grab',
  BLINK: 'blink',
  EAR: 'ear',
  TAIL: 'tail'
});

const PetFrames = Object.freeze({
  [PetState.IDLE]: [
    '../assets/pet-idle-1.png',
    '../assets/pet-idle-2.png'
  ],
  [PetState.GRAB]: [
    '../assets/pet-grab-1.png'
  ],
  [PetState.BLINK]: [
    '../assets/pet-idle-1.png',
    '../assets/pet-blink-1.png',
    '../assets/pet-blink-2.png',
    '../assets/pet-blink-1.png',
    '../assets/pet-idle-1.png'
  ],
  [PetState.EAR]: [
    '../assets/pet-idle-1.png',
    '../assets/pet-ear-fold.png',
    '../assets/pet-idle-1.png',
    '../assets/pet-ear-1.png',
    '../assets/pet-idle-1.png'
  ],
  [PetState.TAIL]: [
    '../assets/pet-idle-1.png',
    '../assets/pet-tail-1.png',
    '../assets/pet-idle-1.png',
    '../assets/pet-tail-2.png',
    '../assets/pet-idle-1.png'
  ]
});

const pet = document.getElementById('pet');
const petWrap = document.getElementById('pet-wrap');
const mouth = document.getElementById('mouth');
const bubble = document.getElementById('bubble');

let state = PetState.IDLE;
let frameIndex = 0;
let lastFrameTime = performance.now();
let currentFrameSource = '';
let nextIdleMotionTime = performance.now();
let hasSpeech = false;

function setBubbleText(text) {
  const message = text.trim();
  bubble.textContent = message;
  bubble.hidden = message.length === 0;
  hasSpeech = message.length > 0;

  if (!hasSpeech) {
    mouth.style.opacity = '0';
  }
}

window.desktopPet?.onStatusText(setBubbleText);
window.desktopPet?.onPetState((nextState) => {
  if (Object.values(PetState).includes(nextState)) {
    setState(nextState);
  }
});

function setState(nextState) {
  if (state === nextState) {
    return;
  }

  state = nextState;
  frameIndex = 0;
  lastFrameTime = performance.now();

  if (nextState === PetState.IDLE) {
    scheduleNextIdleMotion(performance.now());
  }
}

function getFrameDuration() {
  if (state === PetState.GRAB) {
    return PET_CONFIG.grabFrameMs;
  }

  if (state === PetState.BLINK) {
    return PET_CONFIG.blinkFrameMs;
  }

  if (state === PetState.EAR) {
    return PET_CONFIG.earFrameMs;
  }

  if (state === PetState.TAIL) {
    return PET_CONFIG.tailFrameMs;
  }

  return PET_CONFIG.idleFrameMs;
}

function updateFrame(currentTime) {
  const frames = PetFrames[state];
  if (currentTime - lastFrameTime >= getFrameDuration()) {
    frameIndex += 1;
    lastFrameTime = currentTime;

    if ((state === PetState.BLINK || state === PetState.EAR || state === PetState.TAIL) && frameIndex >= frames.length) {
      setState(PetState.IDLE);
      return;
    }

    frameIndex %= frames.length;
  }

  const nextSource = frames[frameIndex];
  if (currentFrameSource !== nextSource) {
    pet.src = nextSource;
    currentFrameSource = nextSource;
  }
}

function getRandomDelay() {
  const range = PET_CONFIG.idleMotionMaxMs - PET_CONFIG.idleMotionMinMs;
  return PET_CONFIG.idleMotionMinMs + Math.random() * range;
}

function scheduleNextIdleMotion(currentTime) {
  nextIdleMotionTime = currentTime + getRandomDelay();
}

function triggerRandomIdleMotion() {
  const roll = Math.random();

  if (roll < 0.5) {
    setState(PetState.BLINK);
  } else if (roll < 0.75) {
    setState(PetState.EAR);
  } else {
    setState(PetState.TAIL);
  }
}

function updatePetStyle(currentTime) {
  const bob = Math.sin(currentTime * PET_CONFIG.bobSpeed) * PET_CONFIG.bobPixels;
  const canLipSync = hasSpeech && state !== PetState.GRAB;
  const mouthOpen = canLipSync && Math.floor(currentTime / PET_CONFIG.mouthFrameMs) % 2 === 0;

  if (state === PetState.IDLE && currentTime >= nextIdleMotionTime) {
    triggerRandomIdleMotion();
  }

  updateFrame(currentTime);
  petWrap.style.width = `${PET_CONFIG.size}px`;
  petWrap.style.height = `${PET_CONFIG.size}px`;
  petWrap.style.transform = `translateY(${bob}px)`;
  mouth.style.opacity = mouthOpen ? '1' : '0';
  pet.dataset.state = state;
}

function tick(currentTime) {
  updatePetStyle(currentTime);
  requestAnimationFrame(tick);
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    window.desktopPet?.quit();
  }
});

window.addEventListener('mousedown', (event) => {
  if (event.button === 0) {
    setState(PetState.GRAB);
  }
});

window.addEventListener('mouseup', () => {
  setState(PetState.IDLE);
});

window.addEventListener('mouseleave', () => {
  setState(PetState.IDLE);
});

setBubbleText('');
scheduleNextIdleMotion(performance.now());
requestAnimationFrame(tick);

/* -------------------------
    BATYR — Canvas Game (со звуком)
    Разместите ресурсы:
      - assets/music.mp3
      - assets/sprites.png
      - assets/bg.png
    ------------------------- */

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// === НАСТРОЙКА АУДИО ===
let audioCtx = null;
let soundEnabled = true; 
function ensureAudioContext() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      audioCtx = null;
      console.warn('WebAudio не поддерживается:', e);
    }
  }
}

// Фоновая музыка
const bgMusic = new Audio('assets/music.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.55; 

// Воспроизведение фоновой музыки
function tryPlayBackgroundMusic() {
  if (!soundEnabled) return; 
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(()=>{/*пропустить*/});
  }
  bgMusic.play().catch(err => {
    console.warn('Ошибка воспроизведения bgMusic', err);
  });
}

// Генерация звуковых эффектов 
function playShootSound() {
  if (!soundEnabled) return; 
  ensureAudioContext();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.exponentialRampToValueAtTime(350, now + 0.12);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.6, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.2);
}

function playDeathSound() {
  if (!soundEnabled) return; 
  ensureAudioContext();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;

  const thump = audioCtx.createOscillator();
  const thGain = audioCtx.createGain();
  thump.type = 'sine';
  thump.frequency.setValueAtTime(120, now);
  thump.frequency.exponentialRampToValueAtTime(40, now + 0.2);
  thGain.gain.setValueAtTime(0.0001, now);
  thGain.gain.exponentialRampToValueAtTime(0.7, now + 0.01);
  thGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
  thump.connect(thGain);
  thGain.connect(audioCtx.destination);
  thump.start(now);
  thump.stop(now + 0.4);

  const noiseBuf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.03, audioCtx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const noise = audioCtx.createBufferSource();
  const noiseGain = audioCtx.createGain();
  noise.buffer = noiseBuf;
  noiseGain.gain.setValueAtTime(0.6, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
  noise.connect(noiseGain);
  noiseGain.connect(audioCtx.destination);
  noise.start(now);
  noise.stop(now + 0.03);
}

function playClickSound() {
  if (!soundEnabled) return; 
  ensureAudioContext();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(1200, now + 0.06);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.35, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.15);
}

// === УРОВНИ ===
const LEVEL_UP_SCORE = 1000; 
let currentLevel = 1; 

// === ДАННЫЕ ЯЗЫКА ===
const LANGUAGE_DATA = {
  'ru': {
    TITLE: "БАТЫР", CONTROLS: "Управление:", 
    MOVE: "← / → / A / D : Движение", 
    JUMP: "Пробел : Прыжок", 
    SHOOT: "H: Вверх (45°), J: Прямо (0°), K: Вниз (30°)", 
    START_PROMPT: "Нажмите Пробел, чтобы начать!", 
    GOAL: "Наберите 1000 очков и защищайте золото", SCORE: "Очки",
    LEVEL: "Уровень", 
    ARROWS: "Стрелы", GAME_OVER: "ИГРА ОКОНЧЕНА", HERO_DEFEATED: "Герой пал. Нажмите Пробел.",
    GOLD_STOLEN: "Золото украдено! Нажмите Пробел.", GAME_WIN: (level) => `УРОВЕНЬ ${level} ПРОЙДЕН!`, 
    WIN_MESSAGE: "Нажмите Пробел, чтобы перейти на следующий уровень.", 
    FINAL_SCORE: "Набранные очки", 
    LANG_SWITCH: "Язык: РУС (L)", 
    SOUND_SWITCH: (on) => `Звук (M): ${on ? 'ВКЛ' : 'ВЫКЛ'}`,
    EXIT_PROMPT: "ESC: Главный экран" 
  },
  'en': {
    TITLE: "BATYR", CONTROLS: "Controls:", 
    MOVE: "← / → / A / D : Move", 
    JUMP: "Space : Jump", 
    SHOOT: "H: Up (45°), J: Straight (0°), K: Down (30°)",
    START_PROMPT: "Press Space to Start!", GOAL: "Get 1000 score and Defend the Gold", SCORE: "Score",
    LEVEL: "Level", 
    ARROWS: "Arrows", GAME_OVER: "GAME OVER", HERO_DEFEATED: "Hero defeated. Press Space.",
    GOLD_STOLEN: "Gold stolen! Press Space.", GAME_WIN: (level) => `LEVEL ${level} COMPLETE!`, 
    WIN_MESSAGE: "Press Space to continue to the next level.", 
    FINAL_SCORE: "Total Score", 
    LANG_SWITCH: "Language: ENG (L)", 
    SOUND_SWITCH: (on) => `Sound (M): ${on ? 'ON' : 'OFF'}`,
    EXIT_PROMPT: "ESC: Main Menu" 
  },
  'ba': {
    TITLE: "БАТЫР", CONTROLS: "Идара итеү:", 
    MOVE: "← / → / A / D : Хәрәкәт", 
    JUMP: "Пробел : Һикереү", 
    SHOOT: "H: Өҫкә (45°), J: Туп-тура (0°), K: Аҫҡа (30°)",
    START_PROMPT: "Башлар өсөн Пробелға баҫығыҙ!", GOAL: "1000 мәрәй йыйығыҙ һәм алтынды һаҡлағыҙ", SCORE: "Мәрәй",
    LEVEL: "Кимәл", 
    ARROWS: "Уҡтар", GAME_OVER: "УЙЫН ТАМАМ", HERO_DEFEATED: "Батыр еңелде. Пробелға баҫығыҙ.",
    GOLD_STOLEN: "Алтын урланған! Пробелға баҫығыҙ.", GAME_WIN: (level) => `${level}-се КИМӘЛ ҮТЕЛДЕ!`, 
    WIN_MESSAGE: "Киләһе кимәлгә күсеү өсөн Пробелға баҫығыҙ.", 
    FINAL_SCORE: "Йыйылған мәрәй", 
    LANG_SWITCH: "Тел: БАШ (L)", 
    SOUND_SWITCH: (on) => `Тауыш (M): ${on ? 'ҠУШ' : 'ҺҮНД'}`,
    EXIT_PROMPT: "ESC: Төп экран" 
  }
};
const langKeys = ['ru','ba','en'];
let langIndex = 1; 
let currentLanguage = langKeys[langIndex];
let gameState = 'START_SCREEN';
function getText(key, param = null) {
  const text = LANGUAGE_DATA[currentLanguage][key] || LANGUAGE_DATA['ru'][key];
  return typeof text === 'function' ? text(param) : text;
}

// === ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ СОСТОЯНИЯ / КОНСТАНТЫ ===
const ARROW_GRAVITY = 0.2;
const INITIAL_ARROW_SPEED = 10; 
const INVULNERABILITY_TIME = 2000;
const BASE_ENEMY_SPEED = 1.5; // 💡 Новая константа для базовой скорости врагов

let score = 0;
let timeSinceLastScore = 0;
const SCORE_INTERVAL = 1000;
const SCORE_PER_INTERVAL = 10;
let lastHumaySpawnTime = 0;
const HUMAY_SPAWN_COOLDOWN = 15000;
let invulnerabilityTimer = 0;
let humayDefeated = false; 

// Переменные для управляемого спавна врагов
let lastEnemySpawnTime = 0; 
const ENEMY_SPAWN_INTERVAL = 3000; 

// камера и тайминги
let cameraX = 0;
let animationId;
let lastTime = 0; 

// === СБРОС ИГРЫ ===
function resetGame(newLevel = 1) { 
  score = 0;
  player.lives = 3;
  player.arrowCount = 10;
  
  // Сброс уровня для контроля скорости врагов
  currentLevel = newLevel; // 💡 Сброс или установка нового уровня
  generateLandscape(currentLevel); 

  // Сброс позиций и состояний
  player.x = 150;
  player.y = getGroundY(player.x); 
  player.vy = 0;
  player.onGround = true;
  player.invulnerable = false;
  enemies.length = 0;
  droppedArrows.length = 0;
  player.arrows.length = 0;
  
  goldBag.carriedBy = null;
  goldBag.x = mapWidth / 2;
  goldBag.y = getGroundY(goldBag.x);
  
  timeSinceLastScore = 0;
  lastHumaySpawnTime = 0;
  humayDefeated = false; 
  
  // Сброс таймера врагов для немедленного спавна после старта
  lastEnemySpawnTime = performance.now(); 
  
  // Сброс состояния птицы
  humayBird.active = false;
  humayBird.hit = false;
  humayBird.vy = 0;
  
  // Сброс состояния нажатых клавиш
  for (const key in keys) {
      keys[key] = false;
  }
  
  if (animationId) cancelAnimationFrame(animationId);
  lastTime = 0;

  console.log(`Начат Уровень ${currentLevel} с новым ландшафтом.`);
}

// спрайты и ресурсы 
const SPRITES = {
  player: { x: 0, y: 0, width: 128, height: 128, frames: 4, speed: 0.1 },
  enemy_shakal_frame0: { x: 0, y: 128, width: 128, height: 128 },
  enemy_shakal_frame1: { x: 128, y: 128, width: 128, height: 128 },
  enemy_shakal_frame2: { x: 256, y: 128, width: 128, height: 128 },
  enemy_shurale_grey_frame0: { x: 0, y: 256, width: 128, height: 128 },
  enemy_shurale_grey_frame1: { x: 128, y: 256, width: 128, height: 128 },
  enemy_shurale_grey_frame2: { x: 256, y: 256, width: 128, height: 128 },
  arrow: { x: 256, y: 384, width: 128, height: 128 },
  gold: { x: 0, y: 384, width: 128, height: 128 },
  lifeIcon: { x: 128, y: 384, width: 128, height: 128 },
  dropped_arrow: { x: 256, y: 384, width: 128, height: 128 },
  hud_arrow: { x: 256, y: 384, width: 128, height: 128 },
  humay_bird: { x: 384, y: 384, width: 128, height: 128, frames: 2, speed: 0.15 },
};
const ENEMY_SPRITES_MAP = [
  SPRITES.enemy_shakal_frame0, SPRITES.enemy_shakal_frame1, SPRITES.enemy_shakal_frame2,
  SPRITES.enemy_shurale_grey_frame0, SPRITES.enemy_shurale_grey_frame1, SPRITES.enemy_shurale_grey_frame2
];
const ENEMY_FRAME_COUNT = 3;
const ENEMY_SPEED = 0.08;

const assets = { spriteAtlas: new Image(), bg: new Image() };
assets.spriteAtlas.src = 'assets/sprites.png';
assets.bg.src = 'assets/bg.png';
let assetsLoadedCount = 0;
const totalAssets = 2;
function startGameAssetsLoaded() {
  assetsLoadedCount++;
  if (assetsLoadedCount === totalAssets) {
    console.log("Все ресурсы загружены!");
  }
}
assets.spriteAtlas.onload = startGameAssetsLoaded;
assets.bg.onload = startGameAssetsLoaded;

function drawSprite(spriteKeyOrObject, dx, dy, dWidth, dHeight, currentFrame = 0, flip = false, angle = 0, alpha = 1) {
  let s;
  let frameX = 0;
  if (typeof spriteKeyOrObject === 'string') {
    s = SPRITES[spriteKeyOrObject];
    if (!s) return;
    frameX = s.x + currentFrame * s.width;
  } else {
    s = spriteKeyOrObject;
    if (!s) return;
    frameX = s.x;
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(dx + dWidth / 2, dy + dHeight / 2);
  if (angle !== 0) { ctx.rotate(angle); }
  if (flip) { ctx.scale(-1, 1); }
  ctx.drawImage(assets.spriteAtlas, frameX, s.y, s.width, s.height, -dWidth / 2, -dHeight / 2, dWidth, dHeight);
  ctx.restore();
}

// ландшафт 
const hills = [];
const mapWidth = 2500;
const step = 20;

function generateLandscape(level) {
  hills.length = 0;
  const seed = level * 1337 + 42; 
  const baseHeight = HEIGHT - 100;
  const amp1 = 80 + level * 5; 
  const freq1 = 0.01 + level * 0.0005; 
  const amp2 = 40 + level * 3;
  const freq2 = 0.02 + level * 0.001;
  const amp3 = 15 + level * 2;
  const freq3 = 0.05 + level * 0.002;
  
  for (let x = 0; x <= mapWidth; x += step) {
    const y = baseHeight 
      - Math.sin(x * freq1 + seed) * amp1 
      - Math.cos(x * freq2 + seed * 2) * amp2 
      + Math.sin(x * freq3) * amp3;
      
    hills.push({ x, y });
  }
}

generateLandscape(currentLevel); 

function getGroundY(x) {
  if (x < 0) return hills[0].y;
  if (x >= hills[hills.length - 1].x) return hills[hills.length - 1].y;
  
  const i = Math.floor(x / step);
  if (i >= hills.length - 1) return hills[hills.length - 1].y;
  
  const a = hills[i];
  const b = hills[i + 1];
  
  const t = (x - a.x) / step;
  return a.y + (b.y - a.y) * t;
}

// игрок 
const player = {
  x: 150, y: 0, vy: 0, onGround: false, direction: 1, arrows: [], lives: 3, arrowCount: 10, maxArrows: 15,
  frame: 0, isMoving: false, invulnerable: false,
  draw() {
    let currentFrame = 0;
    if (this.isMoving && this.onGround) {
      this.frame = (this.frame + SPRITES.player.speed) % SPRITES.player.frames;
      currentFrame = Math.floor(this.frame);
    } else if (!this.onGround) {
      currentFrame = 1;
    } else {
      currentFrame = 0;
    }
    const DRAW_SIZE = 64;
    let alpha = 1;
    if (this.invulnerable && Math.floor(Date.now() / 100) % 2) alpha = 0.4;
    drawSprite('player', this.x - cameraX - DRAW_SIZE / 2, this.y - DRAW_SIZE, DRAW_SIZE, DRAW_SIZE, currentFrame, this.direction === -1, 0, alpha);
    this.isMoving = false;
  },
  shoot(angleDeg, time) {
    if (this.arrowCount > 0) {
      const angleRad = angleDeg * (Math.PI / 180); 
      
      const vx = INITIAL_ARROW_SPEED * Math.cos(angleRad) * this.direction;
      const vy = INITIAL_ARROW_SPEED * Math.sin(angleRad);
      
      this.arrows.push({ 
        x: this.x + 20 * this.direction, 
        y: this.y - 30, 
        vx: vx, 
        vy: vy, 
        isStuck: false, 
        angle: Math.atan2(vy, vx)
      });
      this.arrowCount--;
      playShootSound();
    }
  },
  takeDamage(time) {
    if (this.invulnerable) return;
    this.lives--;
    console.log(`Получен урон! Осталось жизней: ${this.lives}`);
    this.invulnerable = true;
    invulnerabilityTimer = time + INVULNERABILITY_TIME;
    playDeathSound(); 
    if (this.lives <= 0) {
      gameState = 'GAME_OVER';
    }
  }
};

// мешок с золотом 
const goldBag = { x: mapWidth / 2, y: getGroundY(mapWidth / 2), carriedBy: null,
  draw() { if (this.carriedBy) return; const DRAW_SIZE = 32; drawSprite('gold', this.x - cameraX - DRAW_SIZE / 2, this.y - DRAW_SIZE, DRAW_SIZE, DRAW_SIZE); },
  isLost() { if (this.carriedBy && (this.carriedBy.x < -200 || this.carriedBy.x > mapWidth + 200)) { gameState = 'GAME_OVER'; console.log("Золото потеряно! Игра окончена!"); } }
};

// птица хумай 
const humayBird = { 
  x: -100, y:100, vx:3, frame:0, active:false,
  hit: false, 
  vy: 0, 
  
  spawn(time) {
    if (humayDefeated) return; 
    
    if (time - lastHumaySpawnTime > HUMAY_SPAWN_COOLDOWN && Math.random() < 0.3) {
      this.active = true;
      this.hit = false; 
      this.vy = 0; 
      this.x = Math.random() < 0.5 ? -100 : mapWidth + 100;
      this.vx = this.x < 0 ? 3 : -3;
      this.y = 50 + Math.random() * 100;
      lastHumaySpawnTime = time;
    }
  },
  update() {
    if (!this.active) return;
    
    if (this.hit) {
        this.vx = this.vx * 0.95; 
        this.vy += 0.5; 
        this.y += this.vy;
        
        const groundY = getGroundY(this.x);
        
        if (this.y >= groundY) {
            this.active = false;
            humayDefeated = true; 
            playDeathSound(); 
        }
    } else {
        // Обычное движение
        this.x += this.vx;
        this.frame = (this.frame + SPRITES.humay_bird.speed) % SPRITES.humay_bird.frames;
        if (Math.abs(this.x - player.x) < 5 && Math.random() < 0.8) {
          droppedArrows.push({ x: this.x, y: this.y + 10, vy: 0 });
        }
        if (this.x < -200 || this.x > mapWidth + 200) this.active = false;
    }
  },
  draw() { 
      if (!this.active) return; 
      let currentFrame = Math.floor(this.frame); 
      const DRAW_SIZE = 64; 
      let angle = this.hit ? Math.atan2(this.vy, this.vx) : 0; 
      drawSprite('humay_bird', this.x - cameraX - DRAW_SIZE / 2, this.y - DRAW_SIZE / 2, DRAW_SIZE, DRAW_SIZE, currentFrame, this.vx < 0, angle); 
  }
};

// враги и добыча 
const enemies = [];
const droppedArrows = [];
function spawnEnemy() {
  const side = Math.random() < 0.5 ? -1 : 1;
  const x = side < 0 ? -100 : mapWidth + 100;
  
  // Скорость врагов зависит от currentLevel
  const speedMultiplier = 1 + currentLevel * 0.2; 
  
  enemies.push({ 
    x, 
    y: getGroundY(x), 
    vx: -BASE_ENEMY_SPEED * side * speedMultiplier, // 💡 Использование константы BASE_ENEMY_SPEED
    hasGold: false, 
    frame: Math.random() * ENEMY_FRAME_COUNT, 
    type: Math.random() < 0.5 ? 0 : 1 
  });
}

function applyGravityToDroppedArrows() {
  const GRAVITY = 0.5;
  for (let i = droppedArrows.length - 1; i >= 0; i--) {
    const arrow = droppedArrows[i];
    arrow.vy += GRAVITY;
    arrow.y += arrow.vy;
    const groundY = getGroundY(arrow.x);
    if (arrow.y > groundY) { arrow.y = groundY; arrow.vy = 0; }
    if (player.arrowCount < player.maxArrows && Math.abs(arrow.x - player.x) < 40 && Math.abs(arrow.y - player.y) < 60) {
      player.arrowCount = Math.min(player.maxArrows, player.arrowCount + 1);
      droppedArrows.splice(i, 1);
      continue;
    }
    const DRAW_SIZE = 32;
    drawSprite('dropped_arrow', arrow.x - cameraX - DRAW_SIZE / 2, arrow.y - DRAW_SIZE, DRAW_SIZE, DRAW_SIZE);
  }
}

// ввод 
const keys = {};

window.addEventListener('keydown', e => {
  keys[e.code] = true;
  
  if (e.code === 'KeyL') { 
    langIndex = (langIndex + 1) % langKeys.length;
    currentLanguage = langKeys[langIndex];
    
    keys['KeyL'] = false; 
    playClickSound();
    
    if (gameState === 'START_SCREEN') {
      drawStartScreen();
    } 
  }
  
  if (e.code === 'KeyM') {
    soundEnabled = !soundEnabled;
    if (!soundEnabled) bgMusic.pause();
    else tryPlayBackgroundMusic();
    playClickSound();
  }
  
  // ESC для перехода в стартовый экран
  if (e.code === 'Escape') {
    if (gameState !== 'START_SCREEN') {
      gameState = 'START_SCREEN';
      bgMusic.pause();
      playClickSound();
      for (const key in keys) {
        keys[key] = false;
      }
      drawStartScreen(); 
    }
    keys['Escape'] = false;
    return;
  }
  
  if (gameState === 'PLAYING') {
    let shootAngle = null;
    if (e.code === 'KeyJ') { 
      shootAngle = 0;
      keys['KeyJ'] = false; 
    } else if (e.code === 'KeyH') { 
      shootAngle = -45; 
      keys['KeyH'] = false;
    } else if (e.code === 'KeyK') { 
      shootAngle = 30; 
      keys['KeyK'] = false;
    }

    if (shootAngle !== null) {
      player.shoot(shootAngle, Date.now());
    }
  }

  if (e.code === 'Space') {
    if (gameState === 'START_SCREEN') {
      ensureAudioContext();
      tryPlayBackgroundMusic();
      playClickSound();
      if (assetsLoadedCount === totalAssets) {
        resetGame(1); // 💡 ИСПРАВЛЕНИЕ: Сброс currentLevel до 1 при старте
        loop(performance.now());
      }
      gameState = 'PLAYING';
    } else if (gameState === 'GAME_OVER') {
      resetGame(1); // 💡 ИСПРАВЛЕНИЕ: Сброс currentLevel до 1 после поражения
      if (animationId) cancelAnimationFrame(animationId);
      animationId = requestAnimationFrame(loop);
      gameState = 'PLAYING';
      tryPlayBackgroundMusic();
    } else if (gameState === 'WIN') { 
      currentLevel++; 
      resetGame(currentLevel); // Здесь мы действительно переходим на новый уровень
      if (animationId) cancelAnimationFrame(animationId);
      animationId = requestAnimationFrame(loop);
      gameState = 'PLAYING';
      tryPlayBackgroundMusic();
      playClickSound();
      keys['Space'] = false; 
    }
    
    if (gameState === 'PLAYING' && player.onGround) {
      player.vy = -10;
      player.onGround = false;
    }
  }
});
window.addEventListener('keyup', e => { 
    if (e.code !== 'KeyH' && e.code !== 'KeyJ' && e.code !== 'KeyK' && e.code !== 'KeyL') {
      keys[e.code] = false;
    }
});

// UI экраны 
function drawStartScreen() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT); 
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillRect(0,0,WIDTH,HEIGHT);
  ctx.fillStyle = '#FFD700';
  ctx.font = '72px Arial Black';
  ctx.textAlign = 'center';
  ctx.fillText(getText('TITLE'), WIDTH/2, HEIGHT/4);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '28px Arial';
  ctx.fillText(getText('CONTROLS'), WIDTH/2, HEIGHT/2 - 40); 
  ctx.font = '24px Arial';
  ctx.fillText(getText('MOVE'), WIDTH/2, HEIGHT/2);
  ctx.fillText(getText('JUMP'), WIDTH/2, HEIGHT/2 + 40);
  ctx.fillText(getText('SHOOT'), WIDTH/2, HEIGHT/2 + 80); 
  ctx.fillStyle = '#00FF00';
  ctx.font = '36px Arial Bold';
  ctx.fillText(getText('START_PROMPT'), WIDTH/2, HEIGHT/4*3);
  ctx.fillStyle = '#bdab0bff';
  ctx.font = '24px Arial Bold';
  ctx.fillText(getText('GOAL'), WIDTH/2, HEIGHT/4*3 + 50);
  ctx.fillStyle = '#AAAAAA';
  ctx.font = '16px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(getText('LANG_SWITCH'), WIDTH - 10, HEIGHT - 30); 
  ctx.fillText(getText('SOUND_SWITCH', soundEnabled), WIDTH - 10, HEIGHT - 10); 
}

function drawHUD() {
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '20px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`${getText('SCORE')}: ${score}`, 10, 28);
  ctx.fillText(`${getText('ARROWS')}: ${player.arrowCount} / ${player.maxArrows}`, 10, 54);
  ctx.fillText(`${getText('LEVEL')}: ${currentLevel}`, 10, 80); 
  
  const HUD_ICON_SIZE = 22;
  for (let i = 0; i < player.lives; i++) {
    drawSprite('lifeIcon', WIDTH - 110 + i * 35, 10, 30, 30);
  }
  
  ctx.textAlign = 'right'; 
  ctx.fillStyle = '#AAAAAA'; 
  ctx.font = '16px Arial'; 
  ctx.fillText(getText('EXIT_PROMPT'), WIDTH - 10, HEIGHT - 10);
}

function drawGameOver(message) {
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0,0,WIDTH,HEIGHT);
  ctx.fillStyle = '#FF4500';
  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(getText('GAME_OVER'), WIDTH/2, HEIGHT/2 - 120);
  ctx.font = '28px Arial';
  ctx.fillText(message, WIDTH/2, HEIGHT/2 - 70);
  ctx.font = '22px Arial';
  ctx.fillStyle = '#FFFFFF';
}

function drawWinScreen() {
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0,0,WIDTH,HEIGHT);
  ctx.fillStyle = '#00FF00';
  ctx.font = '60px Arial Black';
  ctx.textAlign = 'center';
  ctx.fillText(getText('GAME_WIN', currentLevel), WIDTH/2, HEIGHT/2 - 120); 
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '30px Arial';
  ctx.fillText(getText('WIN_MESSAGE'), WIDTH/2, HEIGHT/2 - 70);
  ctx.font = '22px Arial';
  ctx.fillText(`${getText('FINAL_SCORE')}: ${score}`, WIDTH/2, HEIGHT/2 - 20); 
}

// ГЛАВНЫЙ ЦИКЛ
function loop(timestamp) {
  animationId = requestAnimationFrame(loop);
  
  // Корректный расчет deltaTime
  const deltaTime = lastTime === 0 ? 0 : timestamp - lastTime;
  lastTime = timestamp;

  if (gameState !== 'GAME_OVER' && gameState !== 'WIN' && gameState !== 'START_SCREEN') {
    ctx.clearRect(0,0,WIDTH,HEIGHT);
  }

  if (gameState === 'START_SCREEN') { 
    drawStartScreen(); 
    return; 
  }
  if (gameState === 'GAME_OVER') { 
      drawGameOver(player.lives <= 0 ? getText('HERO_DEFEATED') : getText('GOLD_STOLEN')); 
      return; 
  }
  if (gameState === 'WIN') { drawWinScreen(); return; }

  if (score >= LEVEL_UP_SCORE * currentLevel) { 
    gameState = 'WIN'; 
    return; 
  }

  if (player.invulnerable && timestamp > invulnerabilityTimer) player.invulnerable = false;

  // Управляемый спавн врагов в цикле
  if (timestamp - lastEnemySpawnTime > ENEMY_SPAWN_INTERVAL) {
      spawnEnemy();
      lastEnemySpawnTime = timestamp;
  }

  if (goldBag.carriedBy === null) {
    timeSinceLastScore += deltaTime;
    if (timeSinceLastScore >= SCORE_INTERVAL) {
      score += SCORE_PER_INTERVAL * Math.floor(timeSinceLastScore / SCORE_INTERVAL);
      timeSinceLastScore %= SCORE_INTERVAL;
    }
  } else {
    timeSinceLastScore = 0;
  }

  // хумай (обновление)
  humayBird.spawn(timestamp); 
  humayBird.update();

  // отрисовка фона
  try {
    ctx.drawImage(assets.bg, -cameraX * 0.2, 0, WIDTH * 1.5, HEIGHT);
  } catch (e) {
    ctx.fillStyle = '#0a2a0a';
    ctx.fillRect(0,0,WIDTH,HEIGHT);
  }

  // отрисовка земли
  ctx.beginPath();
  ctx.moveTo(0, HEIGHT);
  let startIndex = Math.max(0, Math.floor(cameraX / step) - 1);
  let endIndex = Math.min(hills.length - 1, Math.floor((cameraX + WIDTH) / step) + 1);
  for (let i = startIndex; i <= endIndex; i++) {
    const p = hills[i];
    if (i === startIndex) ctx.lineTo(p.x - cameraX, p.y);
    else ctx.lineTo(p.x - cameraX, p.y);
  }
  ctx.lineTo(WIDTH, HEIGHT);
  ctx.closePath();
  ctx.fillStyle = '#3a7d44';
  ctx.fill();

  // управление игроком и физика
  if (keys['ArrowLeft'] || keys['KeyA']) { player.x -= 3; player.direction = -1; player.isMoving = true; } 
  if (keys['ArrowRight'] || keys['KeyD']) { player.x += 3; player.direction = 1; player.isMoving = true; } 
  
  if (player.x < 0) player.x = 0;
  if (player.x > mapWidth) player.x = mapWidth;

  player.vy += 0.5;
  player.y += player.vy;
  const groundY = getGroundY(player.x);
  if (player.y > groundY) { player.y = groundY; player.vy = 0; player.onGround = true; }

  // золото и хумай
  goldBag.draw();
  goldBag.isLost();
  humayBird.draw();
  
  // Проверка столкновения стрелы с Humay Bird
  if (humayBird.active && !humayBird.hit) {
      for (let j = player.arrows.length - 1; j >= 0; j--) {
          const arrow = player.arrows[j];
          if (!arrow.isStuck && Math.abs(arrow.x - humayBird.x) < 30 && Math.abs(arrow.y - humayBird.y) < 40) {
              humayBird.hit = true;
              player.arrows.splice(j, 1);
              score += 200; 
              break; 
          }
      }
  }

  // стрелы игрока
  for (let i = player.arrows.length - 1; i >= 0; i--) { 
    const arrow = player.arrows[i];
    if (!arrow.isStuck) {
      arrow.x += arrow.vx;
      arrow.vy += ARROW_GRAVITY;
      arrow.y += arrow.vy;
      arrow.angle = Math.atan2(arrow.vy, arrow.vx);
      const gY = getGroundY(arrow.x);
      if (arrow.y >= gY) {
        arrow.y = gY;
        arrow.isStuck = true;
        arrow.vx = 0;
        arrow.vy = 0;
        arrow.angle = Math.abs(arrow.angle) < Math.PI/2 ? (player.direction === 1 ? 0 : Math.PI) : arrow.angle;
      }
    }
    const DRAW_WIDTH = 32;
    const DRAW_HEIGHT = 8;
    drawSprite('arrow', arrow.x - cameraX - DRAW_WIDTH / 2, arrow.y - DRAW_HEIGHT / 2, DRAW_WIDTH, DRAW_HEIGHT, 0, false, arrow.angle);
    if (arrow.x < -100 || arrow.x > mapWidth + 100) player.arrows.splice(i,1);
  }

  // брошенные стрелы (добыча)
  applyGravityToDroppedArrows();

  // враги
  for (let i = enemies.length - 1; i >= 0; i--) { 
    const enemy = enemies[i];
    enemy.x += enemy.vx;
    enemy.y = getGroundY(enemy.x);
    enemy.frame = (enemy.frame + ENEMY_SPEED) % ENEMY_FRAME_COUNT;
    let currentFrameIndex = Math.floor(enemy.frame);
    let spriteMapIndex = enemy.type * ENEMY_FRAME_COUNT + currentFrameIndex;
    const currentEnemySprite = ENEMY_SPRITES_MAP[spriteMapIndex];
    const DRAW_SIZE = 64;
    if (enemy.x > cameraX - 100 && enemy.x < cameraX + WIDTH + 100) {
      drawSprite(currentEnemySprite, enemy.x - cameraX - DRAW_SIZE / 2, enemy.y - DRAW_SIZE, DRAW_SIZE, DRAW_SIZE, 0, enemy.vx > 0);
    }

    if (enemy.hasGold) {
      goldBag.x = enemy.x;
      goldBag.y = enemy.y;
      const GOLD_SIZE = 32;
      drawSprite('gold', enemy.x - cameraX - GOLD_SIZE / 2, enemy.y - GOLD_SIZE - 20, GOLD_SIZE, GOLD_SIZE);
    }

    if (!goldBag.carriedBy && Math.abs(enemy.x - goldBag.x) < 30 && Math.abs(enemy.y - goldBag.y) < 40) {
      enemy.hasGold = true;
      goldBag.carriedBy = enemy;
      // 💡 ИСПРАВЛЕНИЕ: Используем BASE_ENEMY_SPEED при подборе золота
      const speedMultiplier = 1 + currentLevel * 0.2; 
      enemy.vx = enemy.x < mapWidth/2 ? -BASE_ENEMY_SPEED * speedMultiplier : BASE_ENEMY_SPEED * speedMultiplier;
    }

    // столкновение с игроком
    if (Math.abs(player.x - enemy.x) < 40 && Math.abs(player.y - enemy.y) < 60) {
      player.takeDamage(timestamp);
      if (enemy.hasGold) {
        goldBag.carriedBy = null;
        enemy.hasGold = false;
        goldBag.y = getGroundY(goldBag.x);
      }
      enemies.splice(i,1);
      continue;
    }
    if (enemy.x < -200 || enemy.x > mapWidth + 200) { enemies.splice(i,1); continue; }

    // столкновение со стрелами
    for (let j = player.arrows.length - 1; j >= 0; j--) {
      const arrow = player.arrows[j];
      if (!arrow.isStuck && Math.abs(arrow.x - enemy.x) < 30 && Math.abs(arrow.y - enemy.y) < 40) {
        if (Math.random() < 0.5) {
          droppedArrows.push({ x: enemy.x, y: enemy.y, vy: 0 });
        }
        if (enemy.hasGold) {
          goldBag.carriedBy = null;
          enemy.hasGold = false;
          goldBag.y = getGroundY(goldBag.x);
        }
        enemies.splice(i,1);
        player.arrows.splice(j,1);
        score += 50; 
        playDeathSound();
        break;
      }
    }
  }

  // отрисовка игрока
  player.draw();

  // следование камеры
  cameraX = player.x - WIDTH / 2;
  if (cameraX < 0) cameraX = 0;
  if (cameraX > mapWidth - WIDTH) cameraX = mapWidth - WIDTH;

  // HUD
  drawHUD();
}

// начальная отрисовка
drawStartScreen();

// отладка
window._BATYR = { player, enemies, score, currentLevel, generateLandscape }; 

// возобновление аудио
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
});

// Запуск при первом нажатии
window.addEventListener('pointerdown', () => {
  ensureAudioContext();
}, { once: true });
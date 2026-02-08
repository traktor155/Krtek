const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#87CEEB', // nebe
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      debug: false
    }
  },
  scene: {
    preload,
    create,
    update
  }
};

const game = new Phaser.Game(config);

// Přizpůsobit velikost canvase při změně okna
window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});

let player;
let platforms;
let cursors;
let debugText;
let fpsText;
let wasOnGround = false;
let winPlatform;
let winShown = false;
let winGroup; // Overlay pro win screen

const KRTECEK_FRAME_W = 145;
const KRTECEK_FRAME_H = 145;

// Mapování animací: přizpůsobte rozsahy podle vaší spritesheet
const KRTECEK_ANIM_MAP = {
  idle:  { start: 21,  end: 24,  frameRate: 2,  repeat: -1 },
  walk:  { start: 0,  end: 9, frameRate: 4, repeat: -1 },
  jump:  { start: 11, end: 19, frameRate: 4,  repeat: -1 }
};

// Drobná korekce pro vizuální zarovnání nohou s platformou (v pixelech)
const KRTECEK_GROUND_OFFSET = 1;
// Trim pro horní a dolní průhledný okraj (v pixelech) - upravte podle spritesheetu
const KRTECEK_BODY_TRIM_TOP = 1;
const KRTECEK_BODY_TRIM_BOTTOM = 50;

function preload () {
  // Logging pro loader: usnadní hledání chyb (filecomplete, loaderror, complete)
  // Základní loader: logujeme chyby a dokončení
  this.load.on('loaderror', (file) => {
    console.error('Asset failed to load:', file && file.key ? file.key : file);
  });
  this.load.on('complete', () => {
    console.log('Assets loaded');
  });

  // Načíst obrazec země (externí zdroj) a spritesheet Krtečka
  this.load.image('ground', 'https://labs.phaser.io/assets/sprites/platform.png');
  this.load.spritesheet('krtecek', 'assets/krtek_spritesheet8.png', { frameWidth: KRTECEK_FRAME_W, frameHeight: KRTECEK_FRAME_H });
}

function create () {
  // Platformy (pozice relativní k rozměrům)
  const w = this.scale.width*3;
  const h = this.scale.height;

  this.physics.world.setBounds(0, 0, w, h);

  platforms = this.physics.add.staticGroup();

  // Hlavní zem (roztáhnout přes šířku)
  platforms.create(w / 2, h - 30, 'ground').setScale(w / 400, 1).refreshBody();
  platforms.create(w * 0.1, h * 0.85, 'ground').setScale(0.5, 1).refreshBody();
  platforms.create(w * 0.15, h * 0.75, 'ground').setScale(0.5, 1).refreshBody();
  platforms.create(w * 0.2, h * 0.65, 'ground').setScale(0.5, 1).refreshBody();
  platforms.create(w * 0.25, h * 0.55, 'ground').setScale(0.5, 1).refreshBody();
  platforms.create(w * 0.3, h * 0.75, 'ground').setScale(1, 1).refreshBody();
  platforms.create(w * 0.39, h * 0.65, 'ground').setScale(0.5, 1).refreshBody();
  platforms.create(w * 0.45, h * 0.55, 'ground').setScale(0.5, 1).refreshBody();
  platforms.create(w * 0.56, h * 0.55, 'ground').setScale(1, 1).refreshBody();
  platforms.create(w * 0.65, h * 0.75, 'ground').setScale(3, 1).refreshBody();
  platforms.create(w * 0.48, h * 0.65, 'ground').setScale(0.2, 1).refreshBody();
  platforms.create(w * 0.5, h * 0.85, 'ground').setScale(0.5, 1).refreshBody();
  platforms.create(w * 0.64, h * 0.45, 'ground').setScale(0.5, 1).refreshBody();
  platforms.create(w * 0.7, h * 0.35, 'ground').setScale(0.5, 1).refreshBody();
  platforms.create(w * 0.75, h * 0.45, 'ground').setScale(0.25, 1).refreshBody();
  platforms.create(w * 0.8, h * 0.55, 'ground').setScale(0.25, 1).refreshBody();
  platforms.create(w * 0.85, h * 0.45, 'ground').setScale(0.25, 1).refreshBody();
  platforms.create(w * 0.9, h * 0.65, 'ground').setScale(0.5, 1).refreshBody();
  platforms.create(w * 0.83, h * 0.85, 'ground').setScale(0.25, 1).refreshBody();
  platforms.create(w * 0.86, h * 0.75, 'ground').setScale(0.25, 1).refreshBody();
  platforms.create(w * 0.95, h * 0.55, 'ground').setScale(0.5, 1).refreshBody().setTint(0x0000ff);// Cílová platforma (modrá)
  
  winPlatform = platforms.getChildren().pop(); // Poslední platforma je cílová (modrá)
    
  player = this.physics.add.sprite(w * 0.05, h * 0.9 + KRTECEK_GROUND_OFFSET, 'krtecek');
  player.setBounce(0.1);
  player.setCollideWorldBounds(true);
  // Rozumné měřítko: nechat responsivní, ale s horním limitem
  const desiredScale = Phaser.Math.Clamp(w / 800, 0.6, 1.2);
  player.setScale(desiredScale);
  player.setOrigin(0.5, 1); // kotvíme u nohou
  // Vynutit konzistentní zobrazovanou velikost podle rámce, aby animace neměnily výšku
  const forcedDisplayW = Math.round(KRTECEK_FRAME_W * desiredScale);
  const forcedDisplayH = Math.round(KRTECEK_FRAME_H * desiredScale);
  player.setDisplaySize(forcedDisplayW, forcedDisplayH);

  //kamera následuje hráče, ale jen horizontálně
  this.cameras.main.startFollow(player, true, 1, 0);
  this.cameras.main.setBounds(0, 0, w, h);

  // FPS text (lehké diagnostické info)
  fpsText = this.add.text(10, 10, '', { font: '14px Arial', fill: '#000' }).setScrollFactor(0);

  // Vytvořit animace ze zadané mapy, pokud jsou dostupné framy
  try {
    const tex = this.textures.get('krtecek');
    if (tex) {
      const frameNames = tex.getFrameNames().filter(n => n !== '__BASE');
      const numericFrames = frameNames.map(f => parseInt(f)).filter(n => !isNaN(n)).sort((a, b) => a - b);
      const totalFrames = numericFrames.length;
      let createdAny = false;
      for (const [key, cfg] of Object.entries(KRTECEK_ANIM_MAP)) {
        if (cfg.start <= cfg.end && cfg.start >= 0 && cfg.end < totalFrames) {
          this.anims.create({ key, frames: this.anims.generateFrameNumbers('krtecek', { start: cfg.start, end: cfg.end }), frameRate: cfg.frameRate, repeat: cfg.repeat });
          createdAny = true;
        } else {
          console.warn(`Skipping anim ${key}: frames ${cfg.start}-${cfg.end} not available (total ${totalFrames})`);
        }
      }
      if (!createdAny && numericFrames.length > 0) {
        // Fallback: první frame jako idle
        this.anims.create({ key: 'idle', frames: [{ key: 'krtecek', frame: numericFrames[0] }], frameRate: 3, repeat: -1 });
      }
      if (this.anims.exists('idle')) player.anims.play('idle');
    }
  } catch (e) {
    console.warn('Nelze vytvořit animace pro `krtecek`:', e);
  }

  // Upravit rozměry těla podle display size (lepší kolize)
  if (player.body) {
    // Použít skutečnou zobrazovanou velikost (konzistentní díky setDisplaySize)
    const dispW = player.displayWidth || Math.round(KRTECEK_FRAME_W * player.scaleX);
    const dispH = player.displayHeight || Math.round(KRTECEK_FRAME_H * player.scaleY);
    // Zmenšit výšku těla tak, aby nezahrnovala průhledné okraje ve spritesheetu
    const bw = Math.round(dispW * 0.5);
    // Odečíst horní i dolní trim od těla
    let bh = Math.round(dispH * 0.75) - (KRTECEK_BODY_TRIM_TOP + KRTECEK_BODY_TRIM_BOTTOM);
    if (bh < 8) bh = Math.max(8, Math.round(dispH * 0.5));
    // Vypočítat horizontální offset relativně k originX (lepší zarovnání pokud mají framy levý padding)
    const originX = (typeof player.originX === 'number') ? player.originX : 0.5;
    let ox = Math.round(dispW * originX - bw / 2);
    // Oříznout do rozsahu [0, dispW - bw]
    ox = Math.max(0, Math.min(ox, Math.max(0, dispW - bw)));
    // Offset tak, aby spodní okraj těla ležel KRTECEK_BODY_TRIM_BOTTOM nad spodním okrajem sprite
    let oy = Math.round(dispH - KRTECEK_BODY_TRIM_BOTTOM - bh);
    if (oy < 0) oy = 0;
    player.body.setSize(bw, bh);
    player.body.setOffset(ox, oy);
  }

  // Kolize
  this.physics.add.collider(player, platforms);
  this.physics.add.overlap(player, winPlatform, winReached, null, this);

  // Ovládání
  cursors = this.input.keyboard.createCursorKeys();

// Definujte funkci winReached (přidejte do create()):
function winReached(player, platform) {
  if (!winShown) {
    console.log('WIN REACHED'); // musí se objevit v konzoli
    showWinScreen.call(this);
    winShown = true;
  }
}
// Funkce pro win screen (přidejte do create()):
function showWinScreen() {
  console.log('SHOW WIN');
  // Černý overlay
  const overlay = this.add.rectangle(0, 0, w*2, h*2, 0x000000, 0.7).setOrigin(0).setScrollFactor(0);
  winGroup = this.add.group([overlay]);

  // Text
  const winText = this.add.text(w*0.85, h/2 - 100, 'Jsi vítěz!', 
    { fontSize: '48px', fill: '#FFD700', align: 'center' }).setOrigin(0.5).setStroke('#000', 4);
  winGroup.add(winText);

  // Tlačítko restart
  const restartBtn = this.add.text(w*0.85, h*0.75 + 50, 'Restart (R)', 
    { fontSize: '32px', fill: '#0f0', backgroundColor: '#000' })
    .setOrigin(0.5).setPadding(20).setInteractive();
  winGroup.add(restartBtn);

  restartBtn.on('pointerdown', () => restartLevel.call(this));
  restartBtn.on('pointerover', () => restartBtn.setStyle({ fill: '#fff' }));
  restartBtn.on('pointerout', () => restartBtn.setStyle({ fill: '#0f0' }));

  // Klávesa R pro restart
  this.input.keyboard.on('keydown-R', restartLevel, this);
}

// Funkce restart (přidejte globálně nebo do create()):
function restartLevel() {
  if (winGroup) winGroup.clear(true, true);
  player.setPosition(w * 0.05, h * 0.9);
  player.setVelocity(0);
  winShown = false;
}
}

function update () {
  if (winShown) {
  player.setVelocity(0); // Zastavte hráče
  return;
}
  if (fpsText && this.game && this.game.loop) {
    try { fpsText.setText('FPS: ' + (this.game.loop.actualFps || 0).toFixed(1)); } catch(e) {}
  }
  const onGround = player.body && (
    (player.body.touching && player.body.touching.down) ||
    (player.body.blocked && player.body.blocked.down) ||
    (typeof player.body.onFloor === 'function' && player.body.onFloor())
  );

  // Logování přistání / startu skoku při zapnutém debug režimu
  try {
    const debugOn = this.physics && this.physics.world && this.physics.world.drawDebug;
    if (debugOn) {
      const bodyInfo = player && player.body ? { x: Math.round(player.body.x), y: Math.round(player.body.y), w: Math.round(player.body.width), h: Math.round(player.body.height) } : null;
      if (!onGround && wasOnGround) {
        console.log('Jump start - body:', bodyInfo, 'player.y:', Math.round(player.y));
      }
      if (onGround && !wasOnGround) {
        console.log('Landed - body:', bodyInfo, 'player.y:', Math.round(player.y));
      }
    }
  } catch (e) { /* ignore logging errors */ }

  // Horizontální pohyb
  if (cursors.left.isDown) {
    player.setVelocityX(-160);
    player.setFlipX(true);
    if (onGround && player.anims && this.anims.exists('walk') && (!player.anims.currentAnim || player.anims.currentAnim.key !== 'walk')) {
      player.anims.play('walk');
    }
  } else if (cursors.right.isDown) {
    player.setVelocityX(160);
    player.setFlipX(false);
    if (onGround && player.anims && this.anims.exists('walk') && (!player.anims.currentAnim || player.anims.currentAnim.key !== 'walk')) {
      player.anims.play('walk');
    }
  } else {
    player.setVelocityX(0);
    if (onGround && player.anims && this.anims.exists('idle') && (!player.anims.currentAnim || player.anims.currentAnim.key !== 'idle')) {
      player.anims.play('idle');
    }
  }

  // Pokud je ve vzduchu, přehraj jump animaci (přepisuje walk/idle)
  if (!onGround) {
    if (player.anims && this.anims.exists('jump') && (!player.anims.currentAnim || player.anims.currentAnim.key !== 'jump')) {
      player.anims.play('jump');
    }
  }

  // Skok – jen když stojí na zemi
  if (cursors.up.isDown && onGround) {
    player.setVelocityY(-450);
    try {
      const debugOn = this.physics && this.physics.world && this.physics.world.drawDebug;
      if (debugOn && player && player.body) {
        console.log('Jump triggered - before velocity set, body:', { x: Math.round(player.body.x), y: Math.round(player.body.y), w: Math.round(player.body.width), h: Math.round(player.body.height), frame: player.frame ? player.frame.name : null });
      }
    } catch (e) {}
  }

  // Aktualizovat stav pro další frame
  wasOnGround = !!onGround;

}

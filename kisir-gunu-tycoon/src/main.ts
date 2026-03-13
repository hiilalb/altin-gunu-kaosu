// main.ts - Game loop and main initialization
import './style.css';
import { Plate, FoodItem, type FoodType } from './game/Entities';
import { PhysicsEngine } from './game/Physics';
import { SocialSystem } from './game/SocialSystem';

// Type declarations for the game state
type GameState = 'START' | 'PLAYING' | 'CHAOS' | 'GAME_OVER';

class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number = 0;
  height: number = 0;
  
  state: GameState = 'START';
  
  // Systems
  physics: PhysicsEngine;
  socialSystem: SocialSystem;
  
  // Entities
  plate: Plate;
  foods: FoodItem[] = [];
  
  // Game Variables
  score: number = 0; // Reputation points
  gossipEnergy: number = 0; // 0 to 100
  maxGossipEnergy: number = 100;
  
  // Input
  mouseX: number = 0;
  mouseY: number = 0;
  
  // Timing
  lastTime: number = 0;
  foodSpawnTimer: number = 0;

  // DOM Elements
  reputationLabel: HTMLElement;
  gossipEnergyLabel: HTMLElement;
  balanceLabel: HTMLElement;
  shockwaveWarning: HTMLElement;
  startScreen: HTMLElement;
  gameOverScreen: HTMLElement;
  finalScoreEl: HTMLElement;
  appContainer: HTMLElement;
  customCursor: HTMLElement;
  
  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    
    // Bind DOM
    this.reputationLabel = document.getElementById('reputation-label') as HTMLElement;
    this.gossipEnergyLabel = document.getElementById('gossip-energy-val') as HTMLElement;
    this.balanceLabel = document.getElementById('balance-val') as HTMLElement;
    this.shockwaveWarning = document.getElementById('shockwave-warning') as HTMLElement;
    
    this.startScreen = document.getElementById('start-screen') as HTMLElement;
    this.gameOverScreen = document.getElementById('game-over-screen') as HTMLElement;
    this.finalScoreEl = document.getElementById('final-score') as HTMLElement;
    this.appContainer = document.getElementById('app') as HTMLElement;
    this.customCursor = document.getElementById('custom-cursor') as HTMLElement;
    
    // Init Systems
    this.physics = new PhysicsEngine();
    this.socialSystem = new SocialSystem(
      this.handleGossipDelivery.bind(this)
    );
    
    // Provide a dummy init before resize, actual sizing happens in handleResize
    this.plate = new Plate(0, 0, 150, 20);

    this.setupEventListeners();
    this.handleResize();
    
    // Start Loop
    requestAnimationFrame(this.gameLoop.bind(this));
  }
  
  setupEventListeners() {
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Track mouse X for plate balancing and pseudo-cursor
    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      
      // Update custom cursor
      this.customCursor.style.left = `${this.mouseX}px`;
      this.customCursor.style.top = `${this.mouseY}px`;
      
      if (this.state === 'PLAYING') {
         // Start shaking if we are carrying a heavy load and off-center
         const dist = Math.abs(this.mouseX - this.plate.x);
         if (dist > 50 || Math.abs(this.physics.currentTorque) > 0.05) {
             this.customCursor.classList.add('cursor-shaking');
         } else {
             this.customCursor.classList.remove('cursor-shaking');
         }
      }
    });
    
    // UI Buttons
    document.getElementById('start-btn')?.addEventListener('click', () => {
      this.startGame();
    });
    
    document.getElementById('restart-btn')?.addEventListener('click', () => {
      this.startGame();
    });
  }
  
  handleResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    
    // Place plate at center, near bottom
    if (this.state === 'START' || this.state === 'GAME_OVER') {
       this.plate.x = this.width / 2;
    }
    this.plate.y = this.height * 0.8;
  }
  
  startGame() {
    this.state = 'PLAYING';
    this.score = 0;
    this.gossipEnergy = 10;
    this.foods = [];
    this.physics = new PhysicsEngine(); // Reset physics
    this.socialSystem.clearPrompt();
    this.updateUI();
    
    this.plate = new Plate(this.width / 2, this.height * 0.8, 200, 30);
    
    // Hide screens
    this.startScreen.classList.remove('active');
    this.gameOverScreen.classList.remove('active');
    document.body.classList.remove('chaos-active');
  }
  
  endGame() {
    this.state = 'GAME_OVER';
    this.socialSystem.clearPrompt();
    this.gameOverScreen.classList.add('active');
    this.finalScoreEl.innerText = Math.floor(this.score).toString();
    this.customCursor.classList.remove('cursor-shaking');
  }
  
  triggerChaosMode() {
    this.state = 'CHAOS';
    this.socialSystem.isChaosMode = true;
    this.socialSystem.clearPrompt();
    
    // Update visual overlays
    document.body.classList.add('chaos-active');
    
    this.physics.triggerChaos(this.foods);
    this.shockwaveWarning.classList.remove('hidden');
    this.shockwaveWarning.innerText = "SIFIR YERÇEKİMİ!";
    
    // Explode shockwave
    this.createShockwaveEffect();
  }
  
  // --- Gossip Handling --- //
  
  handleGossipDelivery(success: boolean) {
    if (success) {
      // Huge respect boost, trigger visual shockwave on plate
      this.gossipEnergy += 25;
      this.score += 500;
      
      this.createShockwaveEffect();
      
      // Apply sudden disruptive torque to the plate due to the shockwave!
      const randomDirection = Math.random() > 0.5 ? 1 : -1;
      this.plate.angle += 0.2 * randomDirection; 
      
      if (this.gossipEnergy >= this.maxGossipEnergy && this.state !== 'CHAOS') {
        this.triggerChaosMode();
      }
    } else {
      // Missed gossip lowers energy and applies penalty
      this.gossipEnergy -= 15;
      if (this.gossipEnergy < 0) this.gossipEnergy = 0;
      this.score -= 100;
    }
    
    this.updateUI();
  }

  createShockwaveEffect() {
    const shockwave = document.createElement('div');
    shockwave.className = 'shockwave-effect';
    
    // Originates from the top UI and hits the center
    shockwave.style.top = '15%'; 
    shockwave.style.left = '50%';
    
    document.getElementById('ui-layer')?.appendChild(shockwave);
    
    setTimeout(() => {
      shockwave.remove();
    }, 600);
  }
  
  // --- Core Loop --- //
  
  gameLoop(timestamp: number) {
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;
    
    this.update(deltaTime);
    this.draw();
    
    requestAnimationFrame(this.gameLoop.bind(this));
  }
  
  update(deltaTime: number) {
    if (this.state !== 'PLAYING' && this.state !== 'CHAOS') return;
    
    // Determine player target X for plate
    const targetX = this.state === 'PLAYING' ? this.mouseX : this.plate.x; 
    
    // Physics Step
    this.physics.update(this.plate, this.foods, targetX, this.width);
    
    // Check GAME OVER condition if playing (tilted over 45 degrees)
    if (this.state === 'PLAYING' && Math.abs(this.plate.angle) > this.plate.maxAngle) {
       this.endGame();
       return;
    }
    
    // Social System Step
    if (this.state === 'PLAYING') {
       this.socialSystem.update(deltaTime);
       
       // Warning label check
       if (this.gossipEnergy > 75) {
         this.shockwaveWarning.classList.remove('hidden');
       } else {
         this.shockwaveWarning.classList.add('hidden');
       }
       
       // Update balance HUD visually
       const balancePct = Math.max(0, 100 - (Math.abs(this.plate.angle) / this.plate.maxAngle) * 100);
       this.balanceLabel.innerText = Math.floor(balancePct).toString();
       this.balanceLabel.style.color = balancePct < 30 ? '#d32f2f' : 'inherit';
    }
    
    // Spawning Food
    this.foodSpawnTimer += deltaTime;
    const spawnRate = this.state === 'CHAOS' ? 400 : Math.max(800, 2000 - (this.score * 0.05)); 
    
    if (this.foodSpawnTimer > spawnRate) {
      this.foodSpawnTimer = 0;
      this.spawnFood();
    }
    
    // Rep increases over time while surviving
    if (this.state === 'PLAYING') {
      this.score += deltaTime * 0.01;
      this.updateUI();
    }
  }
  
  spawnFood() {
    const x = Math.random() * (this.width - 200) + 100; // Keep slightly centered
    
    let type: FoodType = 'kisir';
    const rand = Math.random();
    
    if (this.state === 'CHAOS') {
      type = rand > 0.5 ? 'gold' : 'borek';
    } else {
      if (rand < 0.5) type = 'kisir';
      else if (rand < 0.8) type = 'borek';
      else type = 'sarma';
    }
    
    const food = new FoodItem(type, x, -50);
    this.foods.push(food);
  }
  
  draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    if (this.state === 'START') return;
    
    // Draw Attached Foods (under plate rim slightly)
    this.foods.forEach(f => {
      if (f.isAttachedToPlate) f.draw(this.ctx, this.plate);
    });
    
    // Draw Plate
    this.plate.draw(this.ctx);
    
    // Draw Gizmo On top of Plate
    if (this.state === 'PLAYING') {
      this.physics.drawGizmo(this.ctx, this.plate);
    }
    
    // Draw Free/Floating Foods
    this.foods.forEach(f => {
      if (!f.isAttachedToPlate) f.draw(this.ctx);
    });
  }
  
  updateUI() {
    this.gossipEnergyLabel.innerText = Math.floor(this.gossipEnergy).toString();
    
    let repStr = "DÜŞÜK";
    if (this.score > 2000) repStr = "ZİRVE 👑";
    else if (this.score > 1000) repStr = "YÜKSEK";
    else if (this.score > 500) repStr = "ORTA";
    
    this.reputationLabel.innerText = `MAHALLE İTİBARI: ${repStr}`;
  }
}

// Kick it off!
window.onload = () => {
  new Game();
};

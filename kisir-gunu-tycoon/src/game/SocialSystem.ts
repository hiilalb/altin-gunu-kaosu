// SocialSystem.ts - Overhauled 5-Teyze Radar system
export interface Teyze {
  id: number;
  element: HTMLElement;
  picElement: HTMLElement;
  symbolElement: HTMLElement;
  currentWantedSymbol: string | null;
}

export interface GossipPrompt {
  text: string;
  correctSymbol: string;
}

export class SocialSystem {
  containerId: string;
  isChaosMode: boolean = false;
  
  onDeliverGossip: (success: boolean) => void;
  
  teyzes: Teyze[] = [];
  
  // Available symbols denoting gossip topics
  symbols = ['💰', '🐍', '⚡', '💔', '🍼'];
  
  // Pool of primary gossip texts and their corresponding symbol
  gossipPool: GossipPrompt[] = [
    { text: "Patronun Karısını Şikayet Et", correctSymbol: '🐍' },
    { text: "Altının Sahte Olduğunu Söyle", correctSymbol: '💰' },
    { text: "Görümceye Laf Sok", correctSymbol: '⚡' },
    { text: "Muhtarın Kızının Kaçtığını Fısılda", correctSymbol: '💔' },
    { text: "Nimet'in Gelinini Eleştir", correctSymbol: '🍼' },
  ];
  
  currentPrompt: GossipPrompt | null = null;
  promptElement: HTMLElement;
  primaryTextElement: HTMLElement;
  
  particlesContainer: HTMLElement;
  
  // Timers
  promptTimer = 0;

  constructor(onDeliverGossip: (success: boolean) => void) {
    this.containerId = 'teyze-radar';
    this.onDeliverGossip = onDeliverGossip;
    
    this.promptElement = document.getElementById('center-gossip-prompt') as HTMLElement;
    this.primaryTextElement = document.getElementById('primary-gossip-text') as HTMLElement;
    this.particlesContainer = document.getElementById('gossip-particles-container') as HTMLElement;
    
    this.initTeyzes();
  }
  
  initTeyzes() {
    for (let i = 0; i < 5; i++) {
      const el = document.getElementById(`t-${i}`) as HTMLElement;
      this.teyzes.push({
        id: i,
        element: el,
        picElement: el.querySelector('.teyze-pic') as HTMLElement,
        symbolElement: el.querySelector('.teyze-symbol') as HTMLElement,
        currentWantedSymbol: null
      });
      
      // Bind click event for "delivering" gossip
      el.addEventListener('mousedown', (e) => {
        // Prevent default to stop text selection / focus issues
        e.preventDefault();
        this.handleTeyzeClick(i, e.clientX, e.clientY);
      });
    }
  }

  update(deltaTime: number) {
    if (this.isChaosMode) return;
    
    this.promptTimer -= deltaTime;
    
    // Generate new prompt if we don't have one and timer is up
    if (this.currentPrompt === null && this.promptTimer <= 0) {
      this.generatePrompt();
    }
  }

  generatePrompt() {
    // Pick a random prompt
    this.currentPrompt = this.gossipPool[Math.floor(Math.random() * this.gossipPool.length)];
    this.primaryTextElement.innerText = `"${this.currentPrompt.text}"`;
    this.promptElement.classList.add('active');
    
    // Assign random wanted symbols to the Teyzes
    // Make sure EXACTLY ONE teyze wants the correct symbol so there is only one right answer
    const correctTeyzeIndex = Math.floor(Math.random() * 5);
    
    this.teyzes.forEach((t, i) => {
      if (i === correctTeyzeIndex) {
        t.currentWantedSymbol = this.currentPrompt!.correctSymbol;
      } else {
        // Pick a wrong symbol
        let wrongSymbol = this.symbols[Math.floor(Math.random() * this.symbols.length)];
        while (wrongSymbol === this.currentPrompt!.correctSymbol) {
          wrongSymbol = this.symbols[Math.floor(Math.random() * this.symbols.length)];
        }
        t.currentWantedSymbol = wrongSymbol;
      }
      
      t.symbolElement.innerText = t.currentWantedSymbol;
      t.symbolElement.classList.remove('hidden');
    });
    
    // Auto timeout if player ignores it for too long (e.g. 5 seconds)
    // Removed strict timeout penalty for prototype to let player focus on mechanics, 
    // but they just get a new one eventually.
    this.promptTimer = 4000;
  }
  
  handleTeyzeClick(index: number, startX: number, startY: number) {
    if (!this.currentPrompt) return;
    
    const teyze = this.teyzes[index];
    
    // Check if match
    const isSuccess = teyze.currentWantedSymbol === this.currentPrompt.correctSymbol;
    
    // Fire visual particle upwards from mouse to teyze portrait
    this.fireParticle(startX, startY, teyze.element, isSuccess);
    
    // Wait slightly for animation to "hit" before callback
    setTimeout(() => {
      this.onDeliverGossip(isSuccess);
    }, 400);

    // Reset prompt state immediately so player can't spam
    this.clearPrompt();
  }

  fireParticle(startX: number, startY: number, targetEl: HTMLElement, isSuccess: boolean) {
    const rect = targetEl.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top + rect.height / 2;
    
    const particle = document.createElement('div');
    particle.className = 'gossip-particle';
    particle.style.left = `${startX}px`;
    particle.style.top = `${startY}px`;
    
    if (!isSuccess) {
      particle.style.background = 'radial-gradient(circle, #fff, #d32f2f)';
      particle.style.boxShadow = '0 0 20px #d32f2f';
    }
    
    this.particlesContainer.appendChild(particle);
    
    // Trigger CSS transition
    requestAnimationFrame(() => {
      particle.style.transition = 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)';
      particle.style.left = `${targetX - 10}px`; // center particle offset
      particle.style.top = `${targetY - 10}px`;
      
      // Flash the target element when hit
      setTimeout(() => {
        targetEl.style.transform = 'scale(1.2)';
        targetEl.style.borderColor = isSuccess ? '#4caf50' : '#d32f2f';
        
        setTimeout(() => {
          targetEl.style.transform = '';
          targetEl.style.borderColor = '';
        }, 200);
        
        particle.remove();
      }, 400);
    });
  }

  clearPrompt() {
    this.currentPrompt = null;
    this.promptElement.classList.remove('active');
    // Hide symbols
    this.teyzes.forEach(t => {
      t.symbolElement.classList.add('hidden');
    });
    // Set timer for next gossip
    this.promptTimer = 2000;
  }
}

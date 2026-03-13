// Entities.ts - Definitions for game objects

export interface Vector2 {
  x: number;
  y: number;
}

export class Plate {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number; // In radians. 0 is flat.
  maxAngle: number = Math.PI / 4; // 45 degrees max tilt before spilling
  
  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.angle = 0;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    
    // Draw an ornate plate
    ctx.fillStyle = '#FDFBF7'; // Porcelain
    ctx.strokeStyle = '#D4AF37'; // Gold rim
    ctx.lineWidth = 4;
    
    // An elliptical plate shape
    ctx.beginPath();
    ctx.ellipse(0, 0, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner rim
    ctx.beginPath();
    ctx.ellipse(0, 0, this.width / 2.2, this.height / 2.5, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }
}

export type FoodType = 'kisir' | 'borek' | 'sarma' | 'gold';

export class FoodItem {
  id: string;
  type: FoodType;
  x: number;
  y: number;
  width: number;
  height: number;
  mass: number;
  color: string;
  
  // Physics properties
  vx: number = 0;
  vy: number = 0;
  isAttachedToPlate: boolean = false;
  offsetX: number = 0; // X offset relative to plate center when attached
  offsetY: number = 0; // Y offset relative to plate center
  
  constructor(type: FoodType, x: number, y: number) {
    this.id = Math.random().toString(36).substring(2, 9);
    this.type = type;
    this.x = x;
    this.y = y;
    
    switch(type) {
      case 'kisir':
        this.width = 30; this.height = 30;
        this.mass = 1.5;
        this.color = '#c64b28'; // Reddish bulgur
        break;
      case 'borek':
        this.width = 45; this.height = 25;
        this.mass = 2.0;
        this.color = '#dda35d'; // Baked pastry
        break;
      case 'sarma':
        this.width = 20; this.height = 40;
        this.mass = 1.0;
        this.color = '#3e5c20'; // Vine leaf green
        break;
      case 'gold':
        this.width = 35; this.height = 35;
        this.mass = 5.0; // heavy!
        this.color = '#FFD700'; // Gold coin
        break;
    }
  }

  draw(ctx: CanvasRenderingContext2D, plate?: Plate) {
    ctx.save();
    
    if (this.isAttachedToPlate && plate) {
      // Draw relative to plate's rotation
      ctx.translate(plate.x, plate.y);
      ctx.rotate(plate.angle);
      ctx.translate(this.offsetX, this.offsetY);
    } else {
      ctx.translate(this.x, this.y);
    }
    
    ctx.fillStyle = this.color;
    
    // Simple shapes for food
    if (this.type === 'gold') {
      ctx.beginPath();
      ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#B8860B';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Inner star/mark
      ctx.fillStyle = '#DAA520';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('₺', 0, 0);
    } else if (this.type === 'kisir') {
      // Bumpy shape
      ctx.beginPath();
      ctx.arc(-5, -5, 10, 0, Math.PI * 2);
      ctx.arc(5, -5, 12, 0, Math.PI * 2);
      ctx.arc(0, 5, 15, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
    }
    
    ctx.restore();
  }
}

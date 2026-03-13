// Physics.ts - Core balancing and movement logic
import { Plate, FoodItem } from './Entities';

export class PhysicsEngine {
  gravity: number = 0.15; // Slowed down for easier readability
  friction: number = 0.98;
  platePivotSpring: number = 0.05; // Pulls plate back to center
  
  // Chaos mode modifiers
  isChaosMode: boolean = false;
  
  // Tracking data for Gizmo rendering
  comOffset: number = 0;
  currentTorque: number = 0;
  
  update(
    plate: Plate, 
    foods: FoodItem[], 
    targetPlateX: number, 
    canvasWidth: number
  ) {
    // 1. Move Plate horizontally towards mouse target using simple lerp
    const smoothing = 0.15;
    plate.x += (targetPlateX - plate.x) * smoothing;
    
    // Clamp plate to screen bounds
    const halfWidth = plate.width / 2;
    if (plate.x < halfWidth) plate.x = halfWidth;
    if (plate.x > canvasWidth - halfWidth) plate.x = canvasWidth - halfWidth;

    if (!this.isChaosMode) {
      // --- NORMAL BALANCING MODE ---

      // Calculate Center of Gravity (CoG) for the plate + attached food
      let totalMass = 10; // Base mass of the plate itself
      let weightedOffsetSum = 0; // Sum of (mass * xOffset)

      foods.forEach(food => {
        if (!food.isAttachedToPlate) {
          // Free-falling food
          food.vy += this.gravity;
          food.y += food.vy;
          
          // Check collision with plate!
          if (this.checkCollision(food, plate)) {
            food.isAttachedToPlate = true;
            // Record offset relative to plate center
            food.offsetX = food.x - plate.x;
            // Place it resting on the plate surface roughly based on width
            food.offsetY = - (plate.height/2 + food.height/2);
            food.vy = 0;
            food.vx = 0;
          }
        } 
        
        if (food.isAttachedToPlate) {
          // Food is on the plate, contribute to weight distribution
          totalMass += food.mass;
          weightedOffsetSum += food.mass * food.offsetX;
          
          // Keep its physical coordinates updated for rendering/dropping
          // (assuming small angles so cos(angle) roughly 1 for X position)
          food.x = plate.x + food.offsetX * Math.cos(plate.angle) - food.offsetY * Math.sin(plate.angle);
          food.y = plate.y + food.offsetX * Math.sin(plate.angle) + food.offsetY * Math.cos(plate.angle);
        }
      });

      // Calculate the Center of Gravity offset relative to pivot (0)
      this.comOffset = weightedOffsetSum / totalMass;
      
      // Calculate torque based on CoG. Further out = more torque.
      // Torque = Force (Mass * Gravity) * Distance (CoG offset)
      this.currentTorque = (totalMass * this.gravity) * this.comOffset * 0.0005;
      
      // Apply torque to plate angle
      plate.angle += this.currentTorque;
      
      // Apply spring force trying to return plate to 0 (flat)
      plate.angle -= plate.angle * this.platePivotSpring;

      // Apply angular damping (friction)
      plate.angle *= this.friction;

      // Check if tilted too far! Game over condition triggers if angle > maxAngle
      if (Math.abs(plate.angle) > plate.maxAngle) {
        // Spill the foods!
        this.spillFoods(plate, foods);
      }
      
    } else {
      // --- CHAOS (ANTIGRAVITY) MODE ---
      this.comOffset = 0;
      this.currentTorque = 0;
      
      // In chaos mode, plate simply follows the mouse but doesn't tilt from food.
      plate.angle *= 0.9; // quickly level out
      
      foods.forEach(food => {
        // Antigravity slowly pulls things upwards
        food.vy -= 0.05; 
        
        // Add some random drift
        food.vx += (Math.random() - 0.5) * 0.2;
        
        // Apply velocity
        food.x += food.vx;
        food.y += food.vy;
        
        // Bounce off walls
        if (food.x < 0 || food.x > canvasWidth) {
          food.vx *= -1;
          food.x = Math.max(0, Math.min(food.x, canvasWidth));
        }
      });
    }
  }
  
  triggerChaos(foods: FoodItem[]) {
    this.isChaosMode = true;
    foods.forEach(food => {
      if (food.isAttachedToPlate) {
        food.isAttachedToPlate = false;
        // Explode outward and upward
        food.vy = -Math.random() * 10 - 5;
        // Direction based on which side of plate
        food.vx = (food.offsetX > 0 ? 1 : -1) * (Math.random() * 5); 
      }
    });
  }

  spillFoods(plate: Plate, foods: FoodItem[]) {
    // If tilted too far, all attached food slides off
    foods.forEach(food => {
      if (food.isAttachedToPlate) {
        food.isAttachedToPlate = false;
        // Give it velocity based on plate angle
        const slideDir = plate.angle > 0 ? 1 : -1;
        food.vx = slideDir * 5;
        food.vy = -2; // slight pop up before falling
      }
    });
  }

  // Simple AABB vs Ellipse approximation for collision
  checkCollision(food: FoodItem, plate: Plate): boolean {
    // Basic bounding box check first
    if (
      food.y + food.height/2 >= plate.y - plate.height && 
      food.y - food.height/2 <= plate.y + plate.height &&
      food.x + food.width/2 >= plate.x - plate.width/2 &&
      food.x - food.width/2 <= plate.x + plate.width/2
    ) {
      // It's close enough! We consider it landed.
      return true;
    }
    return false;
  }
  
  // Gizmo Drawing for functional UI prototype
  drawGizmo(ctx: CanvasRenderingContext2D, plate: Plate) {
    if (this.isChaosMode) return;
    
    ctx.save();
    ctx.translate(plate.x, plate.y);
    ctx.rotate(plate.angle);
    
    // Draw Center Pivot line
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -50);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw current Center of Mass dot
    ctx.beginPath();
    ctx.arc(this.comOffset, -30, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ff5252';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.setLineDash([]);
    ctx.stroke();
    
    // Label for CoM
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Ağırlık Merkezi', this.comOffset, -40);
    
    // Draw Torque Arrow (only if there is significant torque)
    if (Math.abs(this.currentTorque) > 0.001) {
      const dir = this.currentTorque > 0 ? 1 : -1;
      
      ctx.beginPath();
      // Draw arc arrow indicating rotation force
      ctx.arc(0, 0, plate.width/2 + 10, -Math.PI/2, -Math.PI/2 + (dir * 0.5), dir < 0);
      ctx.strokeStyle = 'cyan';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      ctx.fillStyle = 'cyan';
      ctx.fillText(`TORK`, (plate.width/2 + 25) * dir, -10);
    }

    ctx.restore();
  }
}

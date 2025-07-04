import { RunningLeft, RunningRight, StandingLeft, StandingRight } from './state.js';
export class Player {
    constructor(game){
        this.game = game;
        
        // Base sprite dimensions (from your sprite sheet)
        this.spriteWidth = 120;  // Width of one frame in your sprite sheet
        this.spriteHeight = 116; // Height of one frame in your sprite sheet
        
        this.jump = false;

        this.states = [
            new StandingLeft(this), 
            new StandingRight(this),
            new RunningLeft(this),
            new RunningRight(this),
        ];
        this.frameX = 0;
        this.frameY = 0;
        this.currentState = this.states[1];
        this.maxFrame = 4;
        this.fps = 10;
        this.frameTimer = 0;
        this.frameInterval = 1000 / this.fps;
        
        // Scaled game dimensions
        this.width = this.spriteWidth * this.game.scale;
        this.height = this.spriteHeight * this.game.scale;

        this.x = 600; // Starting position
        this.y = this.game.height - this.height - 50; // Position player higher to stand on grass

        this.vy = 0;
        this.weight = 1;
        this.image = document.getElementById('player');
        this.speed = 0;
        this.maxSpeed = 6;
        this.acceleration = 0.5;
        this.deceleration = 0.5;
        
        // Life system
        this.health = 3;
        this.maxHealth = 3;
        this.invulnerable = false;
        this.invulnerabilityTime = 0;
        this.invulnerabilityDuration = 2000; // 2 seconds of invulnerability after taking damage
        
        // Collision box - fits the player's visual appearance
        this.collisionBox = {
            x: this.x + this.width * 0.3,  // 30% from left edge
            y: this.y + this.height * 0.1, // 10% from top edge
            width: this.width * 0.3,       // 30% of sprite width (smaller for more precision)
            height: this.height * 0.6      // 60% of sprite height (smaller for more precision)
        };
        
        // Debugging
        console.log("Player initialized at:", this.x, this.y);
        console.log("Player dimensions:", this.width, this.height);
    }

    update(input, deltaTime){
        // Horizontal movement with acceleration/deceleration
        if (input.includes('ArrowRight') || input.includes('d')) {
            this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);
        } else if (input.includes('ArrowLeft') || input.includes('a')) {
            this.speed = Math.max(this.speed - this.acceleration, -this.maxSpeed);
        } else {
            // Deceleration when no input
            if (this.speed > 0) {
                this.speed = Math.max(0, this.speed - this.deceleration);
            } else if (this.speed < 0) {
                this.speed = Math.min(0, this.speed + this.deceleration);
            }
        }
        
        this.x += this.speed;
        
        // Vertical movement with improved jump
        if ((input.includes('ArrowUp') || input.includes('w')) && this.onGround()) {
            this.vy = -25;
        }
        this.y += this.vy;
        if (!this.onGround()) {
            this.vy += this.weight;
        } else {
            this.vy = 0;
            this.y = this.game.height - this.height - 50; // Snap to ground at the higher position
        }

        // Let the state machine handle animations
        this.currentState.handleInput(input);
        
        // Sprite animation timer
        if (this.frameTimer > this.frameInterval) {
            this.frameTimer = 0;
            if (this.frameX < this.maxFrame) {
                this.frameX++;
            } else {
                this.frameX = 0;
            }
        } else {
            this.frameTimer += deltaTime;
        }
        
        // Boundary checking
        this.x = Math.max(0, Math.min(this.x, this.game.width - this.width));
        
        // Update collision box position
        this.collisionBox.x = this.x + this.width * 0.3;
        this.collisionBox.y = this.y + this.height * 0.1;
        
        // Update invulnerability timer
        if (this.invulnerable) {
            this.invulnerabilityTime += deltaTime;
            if (this.invulnerabilityTime >= this.invulnerabilityDuration) {
                this.invulnerable = false;
                this.invulnerabilityTime = 0;
            }
        }
    }

    draw(context){
        // Draw invulnerability effect (flashing when invulnerable)
        if (this.invulnerable && Math.floor(this.invulnerabilityTime / 100) % 2 === 0) {
            context.globalAlpha = 0.5;
        }
        
        context.drawImage(
            this.image,
            this.spriteWidth * this.frameX,
            this.spriteHeight * this.frameY,
            this.spriteWidth,
            this.spriteHeight,
            this.x, this.y,
            this.width,
            this.height
        );
        
        // Reset alpha
        context.globalAlpha = 1.0;
        
        /*
        // Debug hitbox - show collision box instead of full sprite
        context.strokeStyle = this.invulnerable ? 'yellow' : 'red';
        context.lineWidth = 2;
        context.strokeRect(
            this.collisionBox.x, 
            this.collisionBox.y, 
            this.collisionBox.width, 
            this.collisionBox.height
        );
        */
    }

    onGround(){
        return this.y >= this.game.height - this.height - 50;
    }

    setState(state){
        this.currentState = this.states[state];
        this.currentState.enter();
    }
    
    takeDamage() {
        if (!this.invulnerable) {
            this.health--;
            this.invulnerable = true;
            this.invulnerabilityTime = 0;
            console.log(`Player took damage! Health: ${this.health}/${this.maxHealth}`);
            
            if (this.health <= 0) {
                console.log("Game Over!");
                // You can add game over logic here
            }
            return true; // Damage was taken
        }
        return false; // No damage taken (invulnerable)
    }
    
    checkCollisionWithHeart(heart) {
        // Rectangle collision detection between player collision box and heart
        // Use a smaller collision area for more precise detection
        const heartCollisionBox = {
            x: heart.x + heart.width * 0.2,  // 20% from left edge of heart
            y: heart.y + heart.height * 0.2, // 20% from top edge of heart
            width: heart.width * 0.6,        // 60% of heart width
            height: heart.height * 0.6       // 60% of heart height
        };
        
        return (
            this.collisionBox.x < heartCollisionBox.x + heartCollisionBox.width &&
            this.collisionBox.x + this.collisionBox.width > heartCollisionBox.x &&
            this.collisionBox.y < heartCollisionBox.y + heartCollisionBox.height &&
            this.collisionBox.y + this.collisionBox.height > heartCollisionBox.y
        );
    }
    
    checkCollisionWithAttacker(attacker) {
        // Rectangle collision detection between player collision box and attacker
        return (
            this.collisionBox.x < attacker.x + attacker.spriteWidth &&
            this.collisionBox.x + this.collisionBox.width > attacker.x &&
            this.collisionBox.y < attacker.y + attacker.spriteHeight &&
            this.collisionBox.y + this.collisionBox.height > attacker.y
        );
    }
    
    isAlive() {
        return this.health > 0;
    }
}
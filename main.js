import { InputHandler } from './input.js';
import { Player } from './player.js';

const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');

// Base game dimensions (logical size)
const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;

let gameSpeed = 4;

let state = 'STANDING LEFT';

const backgroundLayer1 = new Image();
backgroundLayer1.src = 'assets/sky.png';
const backgroundLayer2 = new Image();
backgroundLayer2.src = 'assets/cloud.png';
const backgroundLayer3 = new Image();
backgroundLayer3.src = 'assets/mountain.png';
const backgroundLayer4 = new Image();
backgroundLayer4.src = 'assets/grassGround.png';

// Preload game object images to avoid creating new Image objects in constructors
const bulletImage = new Image();
bulletImage.src = 'assets/bullet.png';
const heartImage = new Image();
heartImage.src = 'assets/heart.png';
const lifeImage = new Image();
lifeImage.src = 'assets/life.png';
const gameOverImage = new Image();
gameOverImage.src = 'assets/gameOver.png';
const tryAgainImage = new Image();
tryAgainImage.src = 'assets/tryAgain.png';
const tryAgainHoverImage = new Image();
tryAgainHoverImage.src = 'assets/tryAgainS.png';
const attackerImages = [
    new Image(), new Image(), new Image(), new Image()
];
attackerImages[0].src = 'assets/eye.png';
attackerImages[1].src = 'assets/nose.png';
attackerImages[2].src = 'assets/mouth.png';
attackerImages[3].src = 'assets/wine.png';

window.addEventListener('load', function(){

    class Layer {
        constructor(image, speedModifier){
            this.x = 0;
            this.y = 0;
            this.width = BASE_WIDTH;
            this.height = BASE_HEIGHT;
            this.x2 = this.width;
            this.image = image;
            this.speedModifier = speedModifier;
            this.speed = gameSpeed * speedModifier;
        }

        update(){
            this.speed = gameSpeed * this.speedModifier;
            if(this.x <= -this.width){
                this.x = 0;
            }
            this.x = this.x - this.speed;
        }
        draw(context){
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
            context.drawImage(this.image, this.x + this.width - this.speed, this.y, this.width, this.height);
        }
    }

    const layer1 = new Layer(backgroundLayer1, 0.2);
    const layer2 = new Layer(backgroundLayer2, 0.4);
    const layer3 = new Layer(backgroundLayer3, 0.6);
    const layer4 = new Layer(backgroundLayer4, 1);

    const gameObjects = [layer1, layer2, layer3, layer4];

    // Set display size (physical pixels)
    function resize() {
        const scale = Math.min(
            window.innerWidth / BASE_WIDTH,
            window.innerHeight / BASE_HEIGHT
        );
        
        canvas.width = BASE_WIDTH * scale;
        canvas.height = BASE_HEIGHT * scale;
        
        // Scale the context to match the logical size
        ctx.scale(scale, scale);
        
        return scale;
    }

    const scale = resize();
    
    // Throttle resize events to improve performance
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(resize, 100);
    });

    let mouseX = 0;
    let mouseY = 0;
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = (e.clientX - rect.left) / scale;
        mouseY = (e.clientY - rect.top) / scale;
        
        // Check try again button hover
        if (game && game.gameOver) {
            const button = game.tryAgainButton;
            const scaledMouseX = mouseX;
            const scaledMouseY = mouseY;
            
            button.isHovered = (
                scaledMouseX >= button.x && 
                scaledMouseX <= button.x + button.width &&
                scaledMouseY >= button.y && 
                scaledMouseY <= button.y + button.height
            );
        }
    });
    
    canvas.addEventListener('click', (e) => {
        // If game is over, check for try again button click
        if (game && game.gameOver) {
            const rect = canvas.getBoundingClientRect();
            const clickX = (e.clientX - rect.left) / scale;
            const clickY = (e.clientY - rect.top) / scale;
            const button = game.tryAgainButton;
            if (
                clickX >= button.x && 
                clickX <= button.x + button.width &&
                clickY >= button.y && 
                clickY <= button.y + button.height
            ) {
                game.restart();
                return;
            }
        }

        // If game is running, fire a bullet
        if (game && !game.showIntro && !game.gameOver) {
            const playerCenterX = game.player.x + game.player.width / 2;
            const playerCenterY = game.player.y + game.player.height / 2;
            game.bullets.push(
                game.getBulletFromPool(
                    playerCenterX,
                    playerCenterY,
                    mouseX,
                    mouseY
                )
            );
        }
    });

    class Bullet {
        constructor(game, x, y, targetX, targetY){
            this.game = game;
            this.spriteWidth = 20;
            this.spriteHeight = 14;
            this.x = x;
            this.y = y;
            this.speed = 5;
            ;
            this.circle = { x: this.x, y: this.y, radius: 7};
            this.markedForDeletion = false;
    
            const dx = targetX - x;
            const dy = targetY - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
    
            this.dx = distance > 0 ? dx / distance : 0;
            this.dy = distance > 0 ? dy / distance : 0;
            this.angle = Math.atan2(dy, dx);
    
            this.image = bulletImage;
        }
        update(){
            this.x += this.dx * this.speed;
            this.y += this.dy * this.speed;
            this.circle.x = this.x;
            this.circle.y = this.y;
            if (this.x < -this.width) this.markedForDeletion = true;
        }
        draw(context){
            context.save(); // Save the current context state
            
            // Move to bullet position and rotate
            context.translate(this.x, this.y);
            context.rotate(this.angle);
            
            // Draw the bullet centered (adjust if needed)
            context.drawImage(
                this.image, 
                -this.spriteWidth/2,  // Center X
                -this.spriteHeight/2, // Center Y
                this.spriteWidth, 
                this.spriteHeight
            );
            
            context.restore(); // Restore the context state
        }
    }

    class Attacker {
        constructor(game){
            this.game = game;
            this.spriteWidth = 80;
            this.spriteHeight = 80;
            this.x = BASE_WIDTH;
            this.y = Math.random() * (BASE_HEIGHT - this.spriteHeight); // Ensure spawn within canvas
            this.speedX = 1;
            this.speedY = 0.5;
            this.vy = Math.random() < 0.5 ? 1 : -1; // Random initial direction
    
            this.circle = { 
                x: this.x + this.spriteWidth/2,
                y: this.y + this.spriteHeight/2,
                radius: Math.min(this.spriteWidth, this.spriteHeight) * 0.45
            };
    
            this.markedForDeletion = false;
            this.angle = Math.random() * Math.PI * 2;
            this.angleSpeed = 0.003;
            this.amplitude = 10 + Math.random() * 10;
    
            const randomIndex = Math.floor(Math.random() * attackerImages.length);
            this.image = attackerImages[randomIndex];
        }
        
        update(){
            // Update position
            this.x -= this.speedX;
            this.y += this.vy * this.speedY;
            this.angle += this.angleSpeed;
    
            // Update collision circle position
            this.circle.x = this.x + this.spriteWidth/2;
            this.circle.y = this.y + this.spriteHeight/2;
    
            // Bounce at edges (using sprite dimensions)
            if (this.y <= 0) { // Top edge
                this.y = 0;
                this.vy = 1; // Force downward
            } else if (this.y + this.spriteHeight >= BASE_HEIGHT) { // Bottom edge
                this.y = BASE_HEIGHT - this.spriteHeight;
                this.vy = -1; // Force upward
            }
    
            if (this.x < -this.spriteWidth) this.markedForDeletion = true;
        }
        
        draw(context){
            context.save();
            context.translate(
                this.x + this.spriteWidth/2, 
                this.y + this.spriteHeight/2
            );
            context.rotate(this.angle);
            context.drawImage(
                this.image,
                -this.spriteWidth/2,
                -this.spriteHeight/2,
                this.spriteWidth,
                this.spriteHeight
            );
            context.restore();
        }
    }
    class Heart {
        constructor(game) {
            this.game = game;
            this.spriteWidth = 90;
            this.spriteHeight = 80;
            this.sizeModifier = Math.random() * 0.6 + 0.4;
            this.width = this.spriteWidth * this.sizeModifier;
            this.height = this.spriteHeight * this.sizeModifier;
            this.x = BASE_WIDTH;
            this.y = Math.random() * (BASE_HEIGHT - this.height);
            this.circle = { 
                x: this.x + this.width/2,  // Center of heart
                y: this.y + this.height/2, // Center of heart
                radius: Math.min(this.width, this.height) * 0.45 // 40% of smallest dimension
            };
            this.directionX = Math.random() * 0.7 + 3;
            this.directionY = Math.random() * 5 - 2.5;
            this.markedForDeletion = false;
            this.frameTimer = 0;
            this.frameInterval = 1000 / this.fps;
            this.image = heartImage;
            
            this.frameX = 0;
            this.maxFrame = 5;
            this.fps = 5;
        }
        update(deltaTime){
            this.x -= this.directionX;
            this.circle.x = this.x + this.width/2;
            this.circle.y = this.y + this.height/2;
            if (this.x < 0 - this.width) this.markedForDeletion = true;

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
        }
        draw(context){
            context.drawImage(
                this.image,
                this.spriteWidth * this.frameX,
                0,
                this.spriteWidth,
                this.spriteHeight,
                this.x, this.y,
                this.width, this.height);
            /*
            context.beginPath();
            context.arc(this.circle.x, this.circle.y, this.circle.radius, 0, Math.PI*2);
            context.strokeStyle = 'red';
            context.stroke(); */
        }
        isOffScreen() {
            return (
                this.x < 0 ||
                this.x > canvas.width ||
                this.y < 0 ||
                this.y > canvas.height
            )
        }
    }
    
    class Game {
        constructor(scale){
            this.scale = scale;
            this.width = BASE_WIDTH;
            this.height = BASE_HEIGHT;
            this.player = new Player(this);
            this.heart = new Heart(this);
            this.input = new InputHandler();
            this.lastTime = 0;
            this.hearts = [];
            this.timeToNextHeart = 0;
            this.heartInterval = 900;
            this.bullets = [];
            this.bulletPool = []; // Object pool for bullets
            this.shootCoolDown = 0;
            this.shootDelay = 100;
            this.shootingMode = false;
            this.attackers = [];
            this.attackCoolDown = 0;
            //this.attackDelay = Math.floor(Math.random() * 501) + 100;;
            
            // Life animation tracking
            this.lifeAnimations = [];
            this.lifeAnimationDuration = 1000; // 1 second animation
            
            // Timer tracking
            this.gameStartTime = 0;
            this.currentTime = 0;
            
            // Game over state
            this.gameOver = false;
            this.gameOverAnimation = {
                startTime: 0,
                duration: 1500, // 1.5 seconds for drop animation
                gameOverY: -252, // Start above screen (height of gameOver image)
                tryAgainY: -151, // Start above screen (height of tryAgain image)
                targetY: BASE_HEIGHT / 3 - 150, // 1/3 from top
                bounceHeight: 30, // Bounce height
                bounceDuration: 300, // Bounce duration
                screenDarkness: 0
            };
            
            // Try again button state
            this.tryAgainButton = {
                x: BASE_WIDTH / 2 - 295.5, // Centered horizontally (591/2)
                y: 0, // Will be set during animation
                width: 591,
                height: 151,
                isHovered: false
            };
        }
        getBulletFromPool(x, y, targetX, targetY) {
            let bullet;
            if (this.bulletPool.length > 0) {
                bullet = this.bulletPool.pop();
                // Reset bullet properties
                bullet.x = x;
                bullet.y = y;
                bullet.circle.x = x;
                bullet.circle.y = y;
                bullet.markedForDeletion = false;
                
                const dx = targetX - x;
                const dy = targetY - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                bullet.dx = distance > 0 ? dx / distance : 0;
                bullet.dy = distance > 0 ? dy / distance : 0;
                bullet.angle = Math.atan2(dy, dx);
            } else {
                bullet = new Bullet(this, x, y, targetX, targetY);
            }
            return bullet;
        }
        update(currentTime){
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            // Update timer
            if (this.gameStartTime === 0) {
                this.gameStartTime = currentTime;
            }
            this.currentTime = currentTime;
            
            // Update game over animation
            if (this.gameOver) {
                this.updateGameOverAnimation(currentTime);
                return; // Don't update game objects when game is over
            }
            
            this.timeToNextHeart += deltaTime;
            if(this.timeToNextHeart > this.heartInterval && this.hearts.length < 10){
                this.hearts.push(new Heart());
                this.timeToNextHeart = 0;
            };
            this.hearts.forEach(object => object.update(deltaTime));
            this.hearts = this.hearts.filter(object => !object.markedForDeletion);

            // Use player's center position for bullet spawn
            const playerCenterX = this.player.x + this.player.width / 2;
            const playerCenterY = this.player.y + this.player.height / 2;

            // Update and clean up bullets
            this.bullets.forEach(object => object.update());
            this.bullets = this.bullets.filter(object => !object.markedForDeletion);

            if (this.input.shootingMode) {
                this.bullets.push(this.getBulletFromPool(
                    playerCenterX,
                    playerCenterY,
                    mouseX,
                    mouseY
                ))
                this.input.shootingMode = false
            };

            //attackers - spawn one attacker at a time, not for every heart
            if (this.attackCoolDown <= 0 && this.hearts.length > 0 && this.attackers.length < 5) {
                // Pick a random heart to spawn attacker from
                const attackDelay = Math.floor(Math.random() * 501) + 100;
                this.attackers.push(new Attacker(this));
                this.attackCoolDown = attackDelay;
            } else if (this.attackCoolDown > 0) {
                this.attackCoolDown--;
            }

            this.attackers.forEach(object => object.update());
            this.attackers = this.attackers.filter(object => !object.markedForDeletion);
            
            
            //checking collisions
            this.bullets.forEach(bullet => {
                this.hearts.forEach(heart => {
                    if (this.checkCollision(bullet, heart)) {
                        bullet.markedForDeletion = true;
                        heart.markedForDeletion = true;
                    }
                });
            });
            
            // Check player-heart collisions
            this.hearts.forEach(heart => {
                if (this.player.checkCollisionWithHeart(heart)) {
                    if (this.player.takeDamage()) {
                        heart.markedForDeletion = true; // Remove heart when player takes damage
                        
                        // Add life animation for the lost life
                        const lostLifeIndex = this.player.health; // Index of the life that was lost
                        this.lifeAnimations.push({
                            index: lostLifeIndex,
                            startTime: currentTime,
                            duration: this.lifeAnimationDuration
                        });
                        
                        // Check for game over
                        if (this.player.health <= 0) {
                            this.startGameOver(currentTime);
                        }
                    }
                }
            });
            
            // Check player-attacker collisions
            this.attackers.forEach(attacker => {
                if (this.player.checkCollisionWithAttacker(attacker)) {
                    if (this.player.takeDamage()) {
                        attacker.markedForDeletion = true; // Remove attacker when player takes damage
                        
                        // Add life animation for the lost life
                        const lostLifeIndex = this.player.health; // Index of the life that was lost
                        this.lifeAnimations.push({
                            index: lostLifeIndex,
                            startTime: currentTime,
                            duration: this.lifeAnimationDuration
                        });
                        
                        // Check for game over
                        if (this.player.health <= 0) {
                            this.startGameOver(currentTime);
                        }
                    }
                }
            });

            this.player.update(this.input.keys, deltaTime);
            gameObjects.forEach(object => {
                object.update();
            });
        }
        draw(context, currentTime){
            // Clear the entire canvas
            context.clearRect(0, 0, this.width, this.height);
            
            // Draw background layers
            gameObjects.forEach(object => {
                object.draw(context);
            });
            

            this.hearts.forEach(heart => heart.draw(context));
            this.bullets.forEach(object => object.draw(context));
            this.attackers.forEach(object => object.draw(context));

            // Draw player
            this.player.draw(context);
            
            // Draw health display
            this.drawHealth(context, currentTime);
            
            // Draw game over screen
            if (this.gameOver) {
                this.drawGameOverScreen(context, currentTime);
            }
        }
        
        drawHealth(context, currentTime) {
            const lifeSize = 40;
            const spacing = 45;
            const startX = 20;
            const startY = 20;
            
            // Draw lives
            for (let i = 0; i < this.player.maxHealth; i++) {
                let shouldDraw = true;
                let alpha = 1.0;
                
                // Check if this life is being animated
                const animation = this.lifeAnimations.find(anim => anim.index === i);
                if (animation) {
                    const elapsed = currentTime - animation.startTime;
                    const progress = elapsed / animation.duration;
                    
                    if (progress >= 1.0) {
                        // Animation complete, remove it
                        this.lifeAnimations = this.lifeAnimations.filter(anim => anim.index !== i);
                        shouldDraw = false; // Don't draw this life anymore
                    } else {
                        // Animate the life (blink and fade out)
                        alpha = 1.0 - progress;
                        const blinkRate = 50; // Blink every 50ms
                        const shouldBlink = Math.floor(elapsed / blinkRate) % 2 === 0;
                        if (!shouldBlink) {
                            shouldDraw = false; // Blink off
                        }
                    }
                }
                
                if (shouldDraw && i < this.player.health) {
                    // Draw life image with current alpha
                    context.save();
                    context.globalAlpha = alpha;
                    context.drawImage(
                        lifeImage,
                        startX + i * spacing,
                        startY,
                        lifeSize,
                        lifeSize
                    );
                    context.restore();
                } else if (shouldDraw && i >= this.player.health && !animation) {
                    // Draw empty life (grayed out)
                    context.save();
                    context.globalAlpha = 0.3;
                    context.drawImage(
                        lifeImage,
                        startX + i * spacing,
                        startY,
                        lifeSize,
                        lifeSize
                    );
                    context.restore();
                }
            }
            
            // Draw timer next to lives
            if (!this.gameOver) {
                const elapsedTime = this.currentTime - this.gameStartTime;
                const milliseconds = Math.floor(elapsedTime);
                
                // Format time as MM:SS.mmm
                const seconds = Math.floor(milliseconds / 1000);
                const ms = milliseconds % 1000;
                
                const timeString = `${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
                
                // Position timer to the right of lives
                const timerX = startX + (this.player.maxHealth * spacing) + 20;
                const timerY = startY + 30;
                
                // Draw timer text
                context.fillStyle = 'white';
                context.font = 'bold 35px Arial';
                context.textAlign = 'left';
                context.fillText(timeString, timerX, timerY);
            }
        }
        checkCollision(bullet, heart) {
            // Optimized circle-circle collision detection using squared distance
            const dx = bullet.circle.x - heart.circle.x;
            const dy = bullet.circle.y - heart.circle.y;
            const distanceSquared = dx * dx + dy * dy;
            const radiusSum = bullet.circle.radius + heart.circle.radius;
            return distanceSquared < (radiusSum * radiusSum);
        }
        startGameOver(currentTime) {
            this.gameOver = true;
            this.gameOverAnimation.startTime = currentTime;
            this.gameOverAnimation.gameOverY = -252;
            this.gameOverAnimation.tryAgainY = -151;
            this.gameOverAnimation.screenDarkness = 0;
        }
        restart() {
            // Reset game state
            this.gameOver = false;
            this.hearts = [];
            this.bullets = [];
            this.bulletPool = [];
            this.attackers = [];
            this.timeToNextHeart = 0;
            this.shootCoolDown = 0;
            this.attackCoolDown = 0;
            this.lifeAnimations = [];
            
            // Reset timer
            this.gameStartTime = 0;
            this.currentTime = 0;
            
            // Reset player
            this.player.health = this.player.maxHealth;
            this.player.invulnerable = false;
            this.player.invulnerabilityTime = 0;
            this.player.x = 600;
            this.player.y = this.game.height - this.player.height - 50;
            this.player.speed = 0;
            this.player.vy = 0;
            
            // Reset background layers
            gameObjects.forEach(layer => {
                layer.x = 0;
            });
            
            console.log("Game restarted!");
        }
        updateGameOverAnimation(currentTime) {
            const elapsed = currentTime - this.gameOverAnimation.startTime;
            const anim = this.gameOverAnimation;
            
            // Update screen darkness
            anim.screenDarkness = Math.min(0.6, elapsed / 1000);
            
            // Calculate drop animation
            if (elapsed < anim.duration) {
                const progress = elapsed / anim.duration;
                const easeOut = 1 - Math.pow(1 - progress, 3); // Ease out cubic
                
                anim.gameOverY = -252 + (anim.targetY + 252) * easeOut;
                anim.tryAgainY = -151 + (anim.targetY + 252 + 50 + 151) * easeOut; // 50px gap between images
            } else {
                // Add bounce effect
                const bounceElapsed = elapsed - anim.duration;
                if (bounceElapsed < anim.bounceDuration) {
                    const bounceProgress = bounceElapsed / anim.bounceDuration;
                    const bounce = Math.sin(bounceProgress * Math.PI) * anim.bounceHeight;
                    
                    anim.gameOverY = anim.targetY + bounce;
                    anim.tryAgainY = anim.targetY + 252 + 50 + bounce; // 50px gap + bounce
                } else {
                    // Final positions
                    anim.gameOverY = anim.targetY;
                    anim.tryAgainY = anim.targetY + 252 + 50; // 50px gap below gameOver image
                }
            }
            
            // Update try again button position
            this.tryAgainButton.y = anim.tryAgainY;
        }
        drawGameOverScreen(context, currentTime) {
            const anim = this.gameOverAnimation;
            
            // Draw darkening overlay
            context.save();
            context.globalAlpha = anim.screenDarkness;
            context.fillStyle = 'black';
            context.fillRect(0, 0, this.width, this.height);
            context.restore();
            
            // Draw game over image (centered horizontally, at 1/3 from top)
            const gameOverWidth = 1000;
            const gameOverHeight = 252;
            context.drawImage(
                gameOverImage,
                this.width / 2 - gameOverWidth / 2, // Center horizontally
                anim.gameOverY, // Use animated Y position
                gameOverWidth,
                gameOverHeight
            );
            
            // Draw try again button with hover effect (just below gameOver image)
            const button = this.tryAgainButton;
            const tryAgainWidth = 591;
            const tryAgainHeight = 151;
            
            context.drawImage(
                button.isHovered ? tryAgainHoverImage : tryAgainImage,
                button.x, // Already centered horizontally
                button.y, // Use animated Y position
                tryAgainWidth,
                tryAgainHeight
            );
        }
    }

    const game = new Game(scale);
    console.log("Game scale:", scale);

    function animate(currentTime){
        game.update(currentTime);
        game.draw(ctx, currentTime);
        requestAnimationFrame(animate);
    }
    
    animate(0);
});
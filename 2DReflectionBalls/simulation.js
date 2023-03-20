const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
canvas.width = innerWidth - 64;
canvas.height = innerHeight - 64;

class Ball {
    constructor(x, y, radius, color, dx, dy) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.dx = dx;
        this.dy = dy;
        this.spawned = false;
    }
  
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }
  
    updatePosition() {
        this.x += this.dx;
        this.y += this.dy;
    }

    getNeighbors() {
        const neighbors = [];
        balls.forEach(neighbor => {
            if (this !== neighbor && this.spawned && neighbor.spawned) {
                const dx = this.x - neighbor.x;
                const dy = this.y - neighbor.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDistance = this.radius + neighbor.radius;
    
                if (distance < minDistance) {
                    neighbors.push(neighbor);
                }
            }
        });
        return neighbors;
    }
    
    correctOverlap(neighbors) {
        for (let other of neighbors) {
            if (this !== other && this.isCollidingWith(other)) {
                this.adjustPositionAfterCollision(other);
            }
        }
    }
    
    isCollidingWith(other) {
        const distance = Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
        return distance < this.radius + other.radius;
    }
  
    adjustPositionAfterCollision(other) {
        const overlap = this.radius + other.radius - this.distanceTo(other);
        const angle = Math.atan2(this.y - other.y, this.x - other.x);
        const moveX = Math.cos(angle) * overlap * 0.5;
        const moveY = Math.sin(angle) * overlap * 0.5;

        this.x += moveX;
        this.y += moveY;
        other.x -= moveX;
        other.y -= moveY;
    }
  
    distanceTo(other) {
        return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
    }

    resolveBallCollisions(neighbors) {
        for (let other of neighbors) {
            if (this !== other && this.isCollidingWith(other)) {
                this.adjustPositionAfterCollision(other);

                const dx = other.x - this.x;
                const dy = other.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const normalX = dx / distance;
                const normalY = dy / distance;
                const tangentX = -normalY;
                const tangentY = normalX;
                const dpTan1 = this.dx * tangentX + this.dy * tangentY;
                const dpTan2 = other.dx * tangentX + other.dy * tangentY;
                const dpNorm1 = this.dx * normalX + this.dy * normalY;
                const dpNorm2 = other.dx * normalX + other.dy * normalY;
                const m1 = (dpNorm1 * (this.radius - other.radius) + 2 * other.radius * dpNorm2) / (this.radius + other.radius);
                const m2 = (dpNorm2 * (other.radius - this.radius) + 2 * this.radius * dpNorm1) / (this.radius + other.radius);
                this.dx = tangentX * dpTan1 + normalX * m1;
                this.dy = tangentY * dpTan1 + normalY * m1;
                other.dx = tangentX * dpTan2 + normalX * m2;
                other.dy = tangentY * dpTan2 + normalY * m2;
            }
        }
    }

    checkWallCollision() {
        if (this.x + this.radius > canvas.width || this.x - this.radius < 0) {
            this.adjustWallPosition();
            this.dx = -this.dx;
        }
        if (this.y + this.radius > canvas.height || this.y - this.radius < 0) {
            this.adjustWallPosition();
            this.dy = -this.dy;
        }
    }

    adjustWallPosition() {
        if (this.x + this.radius > canvas.width) {
            this.x = canvas.width - this.radius;
        }
        if (this.x - this.radius < 0) {
            this.x = this.radius;
        }
        if (this.y + this.radius > canvas.height) {
            this.y = canvas.height - this.radius;
        }
        if (this.y - this.radius < 0) {
            this.y = this.radius;
        }
    }

    update(neighbors) {
        if (!this.spawned && this.y >= this.radius) {
            this.spawned = true;
        }

        if (this.spawned) {
            this.x += this.dx;
            this.y += this.dy;
            this.checkWallCollision();
            this.resolveBallCollisions(neighbors);
            this.draw();
        }
    }
}



const balls = [];

function spawnBall() {
    const radius = 10 + Math.random() * 10;
    const x = Math.random() * (canvas.width - radius * 2) + radius;
    const y = -Math.random() * 30;
    const color = `rgba(255, 255, 255, 1)`;
    const dx = Math.random() * 4 - 2;
    const dy = Math.random() * 4 + 1;
    balls.push(new Ball(x, y, radius, color, dx, dy));
}

let frameCount = 0;

function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  
    frameCount++;
  
    if (frameCount % 60 === 0) {
        spawnBall();
        spawnBall();
        spawnBall();
    }

    // Step 1: Move all balls
    for (const ball of balls) {
      ball.updatePosition();
    }
  
    // Step 2 & 3: Resolve collisions and correct positions
    for (let i = 0; i < 3; i++) {
      for (const ball of balls) {
        const neighbors = ball.getNeighbors();
        ball.checkWallCollision();
        ball.resolveBallCollisions(neighbors);
        ball.correctOverlap(neighbors);
      }
    }
  
    // Draw balls
    for (const ball of balls) {
      ball.update(ball.getNeighbors());
      ball.draw();
    }
}

animate();

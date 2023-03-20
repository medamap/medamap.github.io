const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 5000);
camera.position.set(0, window.innerHeight/2, 1100);
camera.lookAt(new THREE.Vector3(0, window.innerHeight / 2, 0));

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const clock = new THREE.Clock();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

var zlength = 500;

class Particle {
    constructor(x, y, z, size, color, lifetime) {
        this.geometry = new THREE.TorusGeometry(size, 0.1, 8, 32);
        this.material = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.set(x, y, z);
        scene.add(this.mesh);
        this.lifetime = lifetime;
        this.currentTime = 0;
        this.originalSize = size;
        this.timeAlive = 0;
    }
  
    update(deltaTime) {
        this.timeAlive += deltaTime;
      
        if (this.timeAlive >= this.lifetime) {
          this.mesh.geometry.dispose();
          this.mesh.material.dispose();
          scene.remove(this.mesh);
          return false;
        }
      
        const remainingLifetimeRatio = 1 - (this.timeAlive / this.lifetime);
        const scale = (1 - remainingLifetimeRatio) * 50;
        this.mesh.scale.set(scale, scale, scale);
      
        return true;
    }
}

class Ball {
    constructor(x, y, z, radius, color, dx, dy, dz) {
        this.geometry = new THREE.SphereGeometry(radius, 32, 32);
        this.material = new THREE.MeshBasicMaterial({ color });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.set(x, y, z);
        scene.add(this.mesh);
        this.radius = radius;
        this.dx = dx;
        this.dy = dy;
        this.dz = dz;
        this.maxHealth = 300;
        this.currentHealth = this.maxHealth;
        this.gravity = 0.1; // 重力の強さ
        this.initialColor = new THREE.Color(color); // 初期カラーを保存
        this.damageTimer = 0;
    }

    updatePosition() {
        this.mesh.position.x += this.dx;
        this.mesh.position.y += this.dy;
        this.mesh.position.z += this.dz;
    }

    updateColor() {
        const healthRatio = this.currentHealth / this.maxHealth;
        this.material.color.copy(this.initialColor).lerp(new THREE.Color(0xff0000), 1 - healthRatio);
    }

    update() {
        this.dy -= this.gravity; // 重力を速度に加算
        this.updatePosition();
        this.resolveWallCollisions();
        this.resolveBallCollisions();
        this.updateColor();
    }

    distanceTo(other) {
        const dx = this.mesh.position.x - other.mesh.position.x;
        const dy = this.mesh.position.y - other.mesh.position.y;
        const dz = this.mesh.position.z - other.mesh.position.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
  
    isCollidingWith(other) {
        const distance = this.distanceTo(other);
        return distance < this.radius + other.radius;
    }
  
    // 他のボールとの衝突処理および耐久力の減少処理を含む関数
    resolveBallCollisions() {
        this.damageTimer -= clock.getDelta();
        for (const other of balls) {
            if (this !== other && this.isCollidingWith(other)) {
                
                // 速度に基づいてダメージを計算
                const damage1 = Math.sqrt(this.dx * this.dx + this.dy * this.dy + this.dz * this.dz);
                const damage2 = Math.sqrt(other.dx * other.dx + other.dy * other.dy + other.dz * other.dz);
                
                // 耐久力を減らす
                this.currentHealth -= damage1 - damage2;
                other.currentHealth -= damage1 - damage2;

                // 耐久力に応じてボールの色を変更
                const healthRatio = this.currentHealth / this.initialHealth;
                this.material.color = new THREE.Color(1, healthRatio, healthRatio);
                other.material.color = new THREE.Color(1, other.currentHealth / other.initialHealth, other.currentHealth / other.initialHealth);

                // 衝突解決処理
                const dx = other.mesh.position.x - this.mesh.position.x;
                const dy = other.mesh.position.y - this.mesh.position.y;
                const dz = other.mesh.position.z - this.mesh.position.z;
                const distance = this.distanceTo(other);
                const overlap = this.radius + other.radius - distance;

                const moveFactor = overlap / distance;
                const moveX = dx * moveFactor;
                const moveY = dy * moveFactor;
                const moveZ = dz * moveFactor;
                this.mesh.position.x -= moveX / 2;
                this.mesh.position.y -= moveY / 2;
                this.mesh.position.z -= moveZ / 2;
                other.mesh.position.x += moveX / 2;
                other.mesh.position.y += moveY / 2;
                other.mesh.position.z += moveZ / 2;

                // パーティクルを生成
                if (this.damageTimer <= 0)
                {
                    this.damageTimer = 1;
                    const particleX = (this.mesh.position.x + other.mesh.position.x) / 2;
                    const particleY = (this.mesh.position.y + other.mesh.position.y) / 2;
                    const particleZ = (this.mesh.position.z + other.mesh.position.z) / 2;
                    const particleSize = 1;
                    const particleColor = 0xff0000;
                    const particleLifetime = 0.5;
                    const particle = new Particle(particleX, particleY, particleZ, particleSize, particleColor, particleLifetime);
                    particles.push(particle);
                }
            }
        }
    }

  resolveWallCollisions() {
    const halfWidth = window.innerWidth / 2;
    const maxHeight = window.innerHeight;
  
    if (this.mesh.position.x - this.radius < -halfWidth || this.mesh.position.x + this.radius > halfWidth) {
      this.dx = -this.dx;
      this.mesh.position.x = Math.min(Math.max(this.mesh.position.x, -halfWidth + this.radius), halfWidth - this.radius);
    }
    if (this.mesh.position.y - this.radius < 0 || this.mesh.position.y + this.radius > maxHeight) {
      this.dy = -this.dy;
      this.mesh.position.y = Math.min(Math.max(this.mesh.position.y, this.radius), maxHeight - this.radius);
    }
    if (this.mesh.position.z - this.radius < 0 || this.mesh.position.z + this.radius > zlength) {
      this.dz = -this.dz;
      this.mesh.position.z = Math.min(Math.max(this.mesh.position.z, this.radius), zlength - this.radius);
    }
  }

}

const balls = [];
let particles = [];

// パステルカラーをランダムに生成する関数
function randomPastelColor() {
    const r = (Math.random() * 127) + 127;
    const g = (Math.random() * 127) + 127;
    const b = (Math.random() * 127) + 127;
    return new THREE.Color(r / 255, g / 255, b / 255);
}

function spawnBall() {
    const width = window.innerWidth / 2;
    const radius = 20 + Math.random() * 40;
    const x = Math.random() * (width - radius * 2) - (width / 2);
    const y = window.innerHeight; // スポーン位置を上に変更
    const z = Math.random() * (zlength - radius * 2);
    const color = randomPastelColor();
  
    const newBall = new Ball(x, y, z, radius, color, 0, 0, 0);
  
    let safeToSpawn = true;

    for (const other of balls) {
        if (newBall.isCollidingWith(other)) {
            safeToSpawn = false;
            break;
        }
    }

    if (safeToSpawn) {
        newBall.dx = Math.random() * 4 - 2;
        newBall.dy = -(Math.random() * 4 + 1); // Y成分を負の値に変更
        newBall.dz = Math.random() * 4 - 2;
        balls.push(newBall);
    } else {
        scene.remove(newBall.mesh);
    }
}

let frameCount = 0;

function animate() {
    requestAnimationFrame(animate);

    // デルタタイム（前フレームからの経過時間）を取得
    const deltaTime = clock.getDelta();

    frameCount++;

    if (frameCount % 60 === 0) {
        spawnBall();
        spawnBall();
        spawnBall();
    }

    // Draw lines
    //drawLines();
    
    // Update ball positions and handle collisions
    for (const ball of balls) {
      ball.update();
    }

    // パーティクルを更新
    for (let i = particles.length - 1; i >= 0; i--) {
        if (!particles[i].update(deltaTime)) {
        particles.splice(i, 1);
        }
    }

    // 耐久力が0以下のボールを削除
    for (let i = balls.length - 1; i >= 0; i--) {
        if (balls[i].currentHealth <= 0) {
            scene.remove(balls[i].mesh);
            balls.splice(i, 1);
        }
    }

    // Clear the renderer
    renderer.render(scene, camera);

}

function createLine(x1, y1, z1, x2, y2, z2, color) {
    const points = [new THREE.Vector3(x1, y1, z1), new THREE.Vector3(x2, y2, z2)];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color });
    const line = new THREE.Line(geometry, material);
    scene.add(line);
}
  
let linesDrawn = false;

function drawLines() {
  if (linesDrawn) return;

  const halfWidth = window.innerWidth / 2;
  const maxHeight = window.innerHeight;

  // 底面の四角形
  createLine(-halfWidth, 0, 0, halfWidth, 0, 0, 0xff0000);
  createLine(halfWidth, 0, 0, halfWidth, 0, zlength, 0xff0000);
  createLine(halfWidth, 0, zlength, -halfWidth, 0, zlength, 0xff0000);
  createLine(-halfWidth, 0, zlength, -halfWidth, 0, 0, 0xff0000);

  // 上面の四角形
  createLine(-halfWidth, maxHeight, 0, halfWidth, maxHeight, 0, 0x00ff00);
  createLine(halfWidth, maxHeight, 0, halfWidth, maxHeight, zlength, 0x00ff00);
  createLine(halfWidth, maxHeight, zlength, -halfWidth, maxHeight, zlength, 0x00ff00);
  createLine(-halfWidth, maxHeight, zlength, -halfWidth, maxHeight, 0, 0x00ff00);

  // 側面の縦線
  createLine(-halfWidth, 0, 0, -halfWidth, maxHeight, 0, 0x0000ff);
  createLine(halfWidth, 0, 0, halfWidth, maxHeight, 0, 0x0000ff);
  createLine(-halfWidth, 0, zlength, -halfWidth, maxHeight, zlength, 0x0000ff);
  createLine(halfWidth, 0, zlength, halfWidth, maxHeight, zlength, 0x0000ff);

  linesDrawn = true;
}

animate();


const canvas = document.getElementById("fireworkCanvas");
const ctx = canvas.getContext("2d");

// Set canvas on resize
function setCanvasSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Firework properties
const GRAVITY = 0.02;
const PARTICLE_SIZE = 3;
const PARTICLE_FADE_AWAY = 0.002;
const PARTICLE_SHRINKAGE = 0.04;
const FLASH_DURATION = 100;
const fireworks = [];

let FIREWORK_GENERATION_RATE;
let PARTICLE_AMOUNT;

const userAgent = navigator.userAgent.toLowerCase();

if (userAgent.includes('chrome') || userAgent.includes('chromium') || userAgent.includes('edg')) {
    FIREWORK_GENERATION_RATE = 0.05;
    PARTICLE_AMOUNT = 60;
} else if (userAgent.includes('firefox')) {
    FIREWORK_GENERATION_RATE = 0.01;
    PARTICLE_AMOUNT = 50;
} else {
    FIREWORK_GENERATION_RATE = 0.02;
    PARTICLE_AMOUNT = 50;
}

// Bools and engine variables
let isMouseDown = false;
let mouseX = 0;
let mouseY = 0;
let mouseDownTime = 0;

let clickingEnabled = false;
let fpsEnabled = false;

document.addEventListener('keydown', function(event) {
    if (event.altKey && event.shiftKey && (event.key === 'z' || event.key === 'Z')) {
        clickingEnabled = !clickingEnabled;
        console.log("Clicking Enabled:", clickingEnabled);
    }
});

document.addEventListener('keydown', function(event) {
    if (event.altKey && event.shiftKey && (event.key === 'x' || event.key === 'X')) {
        fpsEnabled = !fpsEnabled;
        console.log("FPS Enabled:", fpsEnabled);
    }
});

let lastTime = performance.now();
let frameTimes = [];  

// Set initial canvas size and add resize listener
setCanvasSize();
window.addEventListener('resize', setCanvasSize);

// Function to create a firework
function createFirework(x, y) {
    const firework = {
        x: x,
        y: y,
        vx: (Math.random() - 0.5),
        vy: Math.random(),
        color: [
            Math.floor(Math.random() * 255),
            Math.floor(Math.random() * 255),
            Math.floor(Math.random() * 255)
        ],
        particles: [],
        flashStart: performance.now() 
    };

    explodeFirework(firework);

    fireworks.push(firework);
}

// Function to explode firework and give all particles values
function explodeFirework(firework) {
    for (let i = 0; i < PARTICLE_AMOUNT; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2.5;
        firework.particles.push({
            x: firework.x,
            y: firework.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: firework.color,
            size: Math.random() * PARTICLE_SIZE + 2,
            alpha: 1
        });
    }
}

// Rendering engine
function update() {
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 16.67; // Normalize to 60fps

    // Calculate FPS
    frameTimes.push(currentTime);
    if (frameTimes.length > 60) {
        frameTimes.shift();  // Keep last 60 frames only
    }
    const fps = frameTimes.length / ((currentTime - frameTimes[0]) / 1000);

    lastTime = currentTime;

    // Clear the canvas (this is the golden amount of alpha do not change)
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    fireworks.forEach((firework, index) => {
        // Draw the flash effect if the firework is new
        if (currentTime - firework.flashStart < FLASH_DURATION) {
            ctx.fillStyle = `rgba(255, 255, 255, ${1 - (currentTime - firework.flashStart) / FLASH_DURATION})`;
            ctx.beginPath();
            ctx.arc(firework.x, firework.y, PARTICLE_SIZE * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        firework.particles = firework.particles.filter((particle) => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.vy += GRAVITY * deltaTime;
            particle.alpha -= PARTICLE_FADE_AWAY * deltaTime;
            particle.size = Math.max(particle.size - PARTICLE_SHRINKAGE * deltaTime, 0);

            if (particle.size > 0) {
                ctx.fillStyle = `rgba(${particle.color[0]}, ${particle.color[1]}, ${particle.color[2]}, ${particle.alpha})`;

                // Set glowing effect (don't change, it's not worth it)
                ctx.shadowBlur = 30; 
                ctx.shadowColor = `rgba(${particle.color[0]}, ${particle.color[1]}, ${particle.color[2]}, 0.5)`; // Adjust glow opacity

                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();

                // Clear shadow settings after drawing
                ctx.shadowBlur = 0;
                ctx.shadowColor = 'rgba(0,0,0,0)';
            }

            return particle.alpha > 0 &&
                   particle.y < canvas.height &&
                   particle.x >= 0 &&
                   particle.x <= canvas.width &&
                   particle.size > 0;
        });

        if (firework.particles.length === 0 && currentTime - firework.flashStart >= FLASH_DURATION) {
            fireworks.splice(index, 1);
        }
    });

    // Randomly create fireworks
    if (Math.random() < FIREWORK_GENERATION_RATE * deltaTime) {
        createFirework(Math.random() * canvas.width, Math.random() * (canvas.height * 0.8));
    }

    // Draw FPS
    if (fpsEnabled) {
        ctx.fillStyle = "white";
        ctx.font = "20px Arial";
        ctx.fillText(`FPS: ${Math.round(fps)}`, 10, 30);
    }

    requestAnimationFrame(update);
}

// Mouse hearers
canvas.addEventListener('mousedown', (event) => {
    if (clickingEnabled) {
        isMouseDown = true;
        mouseDownTime = performance.now();
        const rect = canvas.getBoundingClientRect();
        mouseX = event.clientX - rect.left;
        mouseY = event.clientY - rect.top;

        createFirework(mouseX, mouseY);
    }
});

// Start the animation loop
update();

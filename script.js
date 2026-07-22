const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

// Set Canvas size
function resizeCanvas() {    
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // Set the canvas drawing buffer size to match its display size
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
}
resizeCanvas();

// Debounced resize handler for performance
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        resizeCanvas();
        // Recalculate columns and reset drops on resize
        columns = Math.floor(canvas.width / fontSize);
        drops.fill(1);
    }, 150);
});

// Configuration
const characters = "0123456789ABCDEFHIJKLMNOPQRSTUVXYZ";
const fontSize = 16;
const columns = Math.floor(canvas.width / fontSize);
const drops = Array(columns).fill(1);

function draw() {
    // Semi-transparent black to create trailing effect
    ctx.fillStyle = "rgba(10, 10, 10, 0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set text style
    ctx.fillStyle = "#003b00"; // Dark green for a subtle look
    ctx.font = fontSize + "px monospace";

    for (let i = 0; i < drops.length; i++) {
        const text = characters.charAt(Math.floor(Math.random() * characters.length));
        
        // Draw the character
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        // Reset drop to top if it leaves screen
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }

        drops[i]++;
    }
}

// Control the speed (Higher = Slower)
setInterval(draw, 45);
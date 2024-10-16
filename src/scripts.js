// === Initialize the Scene, Camera, and Renderer ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);  // Optimize for device pixel ratio
document.body.appendChild(renderer.domElement);  // Attach renderer to the HTML

camera.position.z = 5;  // Move the camera back so we can see the object

// === Create a Smaller Icosahedron ===
const geometry = new THREE.IcosahedronGeometry(1, 2);  // Reduce detail level for better performance
const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00, // Bright green color for visibility
    wireframe: true  // Enable wireframe mode to see the object clearly
});
const sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);  // Add the object to the scene

// === Add an Ambient Light (for better visibility) ===
const ambientLight = new THREE.AmbientLight(0xffffff, 1);  // White ambient light
scene.add(ambientLight);

// === Audio Setup ===
const listener = new THREE.AudioListener();
camera.add(listener);

const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();
audioLoader.load('./static/Beats.mp3', function(buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.5);
});

const analyser = new THREE.AudioAnalyser(sound, 32);

let isPlaying = false;  // Track whether the music is playing

// === Button to Start or Pause Music ===
const startButton = document.getElementById('start');
startButton.addEventListener('click', () => {
    if (isPlaying) {
        sound.pause();
        startButton.textContent = 'Start';
        isPlaying = false;
    } else {
        sound.play();
        startButton.textContent = 'Pause';
        isPlaying = true;
    }
});
const guiParams = {
    red: 0,
    green: 255,
    blue: 0
};

const gui = new dat.GUI();
gui.add(guiParams, 'red', 0, 255).name('Red').onChange(updateColor);
gui.add(guiParams, 'green', 0, 255).name('Green').onChange(updateColor);
gui.add(guiParams, 'blue', 0, 255).name('Blue').onChange(updateColor);

function updateColor() {
    // Update color based on GUI sliders
    const newColor = new THREE.Color(`rgb(${Math.floor(guiParams.red)}, ${Math.floor(guiParams.green)}, ${Math.floor(guiParams.blue)})`);
    material.color.set(newColor);  // Update material color
}

// === Animation Loop ===
function animate() {
    setTimeout(() => {  // Limit frame rate to 30 FPS
        requestAnimationFrame(animate);

        // Get frequency data from the audio analyzer
        const dataArray = analyser.getFrequencyData();

        // Use the frequency data to scale the sphere (for a basic visual effect)
        const averageFrequency = analyser.getAverageFrequency();
        const scale = 1 + averageFrequency / 128;  // Scale factor based on average frequency
        sphere.scale.set(scale, scale, scale);  // Apply the scaling

        // Render the scene
        renderer.render(scene, camera);
    }, 1000 / 30);  // 30 FPS
}

// Start the animation loop
animate();

// === Handle Window Resize ===
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
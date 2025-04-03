import { frag, vert } from "./shader-web.js";
import {
  preloadAudio,
  setupAudio,
  updateAudioAnalysis,
  getAudioParameters,
  updateAudioVisualization,
  isAudioReactive,
  toggleAudioReactive,
  syncAudioWithAnimation,
  toggleAudio,
  isAudioLoaded,
  sound,
  skipForward,
  skipBackward,
  setNormalizedEasing,
  getNormalizedEasing,
} from "./audio.js";

let worleyShader;
let observationPoint;
let delta;
let paused = false;
let goingBackwards = false;
let speedMultiplier = 0.002;

let zDistribution = 0.5;
let speed = 0.3;
let canvas;

// Keyboard controls for skipping
let isRightArrowDown = false;
let isLeftArrowDown = false;
let skipAcceleration = 0.25; // How much to increase skip amount per frame
let maxSkipAmount = 5.0; // Maximum seconds to skip per frame
let currentSkipAmount = 2.5; // Starting amount to skip (seconds)

// Easing adjustment amount
let easingStep = 0.05;

function preload() {
  worleyShader = createShader(vert, frag);
  preloadAudio();
}

function setup() {
  canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  canvas.elt.classList.add("static");
  pixelDensity(1);
  resize();
  noStroke();

  observationPoint = 0;

  // Setup audio components
  setupAudio();

  // Add keyboard event listeners directly to ensure they work
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
}

function handleKeyDown(event) {
  // Handle key down events
  if (event.key === "ArrowRight") {
    isRightArrowDown = true;
    // Initial skip when key is first pressed
    skipForward(currentSkipAmount);
    event.preventDefault();
  } else if (event.key === "ArrowLeft") {
    isLeftArrowDown = true;
    // Initial skip when key is first pressed
    skipBackward(currentSkipAmount);
    event.preventDefault();
  } else if (event.key === " ") {
    // Toggle animation pause state
    paused = !paused;
    // Sync audio with animation state
    syncAudioWithAnimation(paused);
    event.preventDefault();
  } else if (event.key === "a") {
    toggleAudio();
    event.preventDefault();
  } else if (event.key === "+" || event.key === "=") {
    // Increase easing factor (faster response)
    const currentEasing = getNormalizedEasing();
    setNormalizedEasing(currentEasing + easingStep);
    console.log(
      `Easing: ${getNormalizedEasing().toFixed(2)} (faster response)`
    );
    event.preventDefault();
  } else if (event.key === "-" || event.key === "_") {
    // Decrease easing factor (smoother transitions)
    const currentEasing = getNormalizedEasing();
    setNormalizedEasing(currentEasing - easingStep);
    console.log(
      `Easing: ${getNormalizedEasing().toFixed(2)} (smoother transitions)`
    );
    event.preventDefault();
  }
}

function handleKeyUp(event) {
  // Handle key up events
  if (event.key === "ArrowRight") {
    isRightArrowDown = false;
    currentSkipAmount = 2.5; // Reset skip amount when key is released
    event.preventDefault();
  } else if (event.key === "ArrowLeft") {
    isLeftArrowDown = false;
    currentSkipAmount = 2.5; // Reset skip amount when key is released
    event.preventDefault();
  }
}

function draw() {
  if (paused) return;

  // Handle continuous skipping when arrow keys are held down
  if (isRightArrowDown) {
    // Gradually increase skip amount for acceleration effect
    currentSkipAmount = min(
      currentSkipAmount + skipAcceleration,
      maxSkipAmount
    );
    skipForward(currentSkipAmount);
  }

  if (isLeftArrowDown) {
    // Gradually increase skip amount for acceleration effect
    currentSkipAmount = min(
      currentSkipAmount + skipAcceleration,
      maxSkipAmount
    );
    skipBackward(currentSkipAmount);
  }

  // Update audio analysis if available and enabled
  if (isAudioReactive()) {
    updateAudioAnalysis();

    // Update the visualization panel with audio data
    const audioParams = getAudioParameters();
    updateAudioVisualization(audioParams);
  }

  // Get base delta movement (use original parameters, no audio influence)
  delta = speed * speedMultiplier;

  delta = delta * (goingBackwards ? -1 : 1);
  if (observationPoint + delta >= zDistribution) {
    goingBackwards = true;
  } else if (observationPoint + delta <= 0) {
    goingBackwards = false;
  }

  observationPoint += delta;

  const normalizedMouse = [
    mouseX / width,
    (height - mouseY) / height,
    observationPoint,
  ];

  // Set uniforms for the shader
  worleyShader.setUniform("u_z", observationPoint);
  worleyShader.setUniform("u_ratio", width / height);
  worleyShader.setUniform("u_time", frameCount / 100);
  // worleyShader.setUniform("u_mouse", normalizedMouse);

  // Add audio uniforms if available
  if (isAudioReactive()) {
    const audioParams = getAudioParameters();

    // Pass pre-normalized values to shader directly
    worleyShader.setUniform("u_bass", audioParams.normalizedBass);
    worleyShader.setUniform("u_mid", audioParams.normalizedMid);
    worleyShader.setUniform("u_high", audioParams.normalizedHigh);
    worleyShader.setUniform("u_avg", audioParams.normalizedAvg);
    worleyShader.setUniform("u_level", audioParams.normalizedLevel);
  } else {
    // Default values when audio is not available
    worleyShader.setUniform("u_bass", 0.0);
    worleyShader.setUniform("u_mid", 0.0);
    worleyShader.setUniform("u_high", 0.0);
    worleyShader.setUniform("u_avg", 0.0);
    worleyShader.setUniform("u_level", 0.0);
  }

  shader(worleyShader);

  // Draw a plane that fills the canvas
  plane(width, height);
}

function resize() {
  resizeCanvas(windowWidth, windowHeight);
}

// Keep p5.js keyPressed for compatibility
function keyPressed() {
  // Return false to prevent default browser behavior
  return false;
}

window.preload = preload;
window.setup = setup;
window.draw = draw;
window.keyPressed = keyPressed;

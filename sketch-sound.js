import { settings } from "./controls.js";
import { frag, vert } from "./shader.js";

let n = 50;
let points = [];
let worleyShader;
let observationPoint;
let delta;
let canvas;
let paused = false;
let goingBackwards = false;
let speedMultiplier = 0.002;

// Enhanced audio variables
let synth;
let audioInitialized = false;
let filter, vibrato, filterLFO, detuneLFO;

function createPoints() {
  points = [];

  for (let i = 0; i < n; i++) {
    let randomPos = createVector(
      random(),
      random(),
      random(settings.zDistribution)
    );
    const point = new Point({ pos: randomPos });
    points.push(point);
  }
}

function preload() {
  worleyShader = createShader(vert, frag(n));
}

function setup() {
  canvas = createCanvas(settings.canvas.width, settings.canvas.height, WEBGL);
  pixelDensity(1);
  resize();
  noStroke();

  createPoints();

  observationPoint = 0;

  let startButton = createButton("Start Audio");
  startButton.position(20, 20);
  startButton.style("padding", "10px");
  startButton.style("background-color", "#4CAF50");
  startButton.style("color", "white");
  startButton.style("font-size", "16px");
  startButton.mousePressed(initializeAudio);

  canvas.mousePressed(initializeAudio);
}

function initializeAudio() {
  if (!audioInitialized) {
    console.log("Attempting to start audio...");

    const testTone = new Tone.Oscillator({
      frequency: 440,
      volume: -20,
      type: "sine",
    }).toDestination();

    Tone.start()
      .then(() => {
        console.log("Tone.js context started");

        testTone.start();
        setTimeout(() => {
          testTone.stop();

          // 🔊 AUDIO CHAIN WITH EFFECTS
          filter = new Tone.Filter({
            type: "lowpass",
            frequency: 800,
            rolloff: -24,
            Q: 1,
          }).toDestination();

          vibrato = new Tone.Vibrato({
            frequency: 5,
            depth: 0.1,
          }).connect(filter);

          synth = new Tone.Synth({
            oscillator: {
              type: "sine",
            },
            envelope: {
              attack: 0.1,
              decay: 0.2,
              sustain: 0.5,
              release: 0.5,
            },
            volume: -15,
          }).connect(vibrato);

          filterLFO = new Tone.LFO({
            frequency: 0.1,
            min: 300,
            max: 1200,
          }).start();
          filterLFO.connect(filter.frequency);

          detuneLFO = new Tone.LFO({
            frequency: 0.05,
            min: -10,
            max: 10,
          }).start();
          detuneLFO.connect(synth.detune);

          synth.triggerAttack("C4");

          let statusText = createDiv(
            "Audio Enabled - Move mouse to control sound"
          );
          statusText.position(20, 60);
          statusText.style("color", "green");
          statusText.style("font-weight", "bold");

          audioInitialized = true;
          console.log("Enhanced audio system initialized and running");
        }, 500);
      })
      .catch((err) => {
        console.error("Error starting Tone.js:", err);
        alert("Audio failed to start. Please check console for errors.");
        let errorText = createDiv("Audio Error: " + err.message);
        errorText.position(20, 60);
        errorText.style("color", "red");
      });
  }
}

function draw() {
  if (paused) return;
  background(220);

  delta = settings.speed * speedMultiplier;

  if (settings.animate) {
    delta = delta * (goingBackwards ? -1 : 1);
    if (observationPoint + delta >= settings.zDistribution) {
      goingBackwards = true;
    } else if (observationPoint + delta <= 0) {
      goingBackwards = false;
    }

    observationPoint += delta;
  }

  const normalizedMouse = [mouseX / width, (height - mouseY) / height];

  worleyShader.setUniform("u_z", observationPoint);
  worleyShader.setUniform("u_ratio", width / height);
  worleyShader.setUniform("u_points", [
    ...points.flatMap((p) => [p.pos.x, p.pos.y, p.pos.z]),
    ...normalizedMouse,
    observationPoint,
  ]);

  worleyShader.setUniform("u_time", frameCount / 100);
  worleyShader.setUniform("u_mouse", normalizedMouse);
  worleyShader.setUniform("u_contrast", settings.size);
  worleyShader.setUniform("u_n", n);
  worleyShader.setUniform("u_exposure", settings.exposure);
  worleyShader.setUniform("u_range", settings.range);

  shader(worleyShader);
  plane(width, height);

  if (audioInitialized && synth) {
    try {
      const noteFreq = map(mouseX, 0, width, 100, 800);
      synth.frequency.value = noteFreq;

      const vol = map(mouseY, 0, height, -10, -40);
      synth.volume.value = vol;

      if (frameCount % 60 === 0) {
        console.log(
          `Frequency: ${noteFreq.toFixed(0)} Hz, Volume: ${vol.toFixed(1)} dB`
        );
      }
    } catch (e) {
      console.error("Error updating audio parameters:", e);
    }
  }
}

function resize() {
  const { width, height } = settings.canvas;

  const wRatio = window.innerWidth / width;
  const hRatio = window.innerHeight / height;

  let scale = Math.min(Math.min(wRatio, hRatio), 1);

  canvas.elt.style = `--scale:${scale}`;

  if (scale <= 1) {
    canvas.elt.classList?.remove("static");
  } else {
    canvas.elt.classList?.add("static");
  }

  resizeCanvas(width, height);
}

function keyPressed() {
  if (key === " ") {
    paused = !paused;

    if (audioInitialized && synth) {
      if (paused) {
        synth.triggerRelease();
        console.log("Audio paused");
      } else {
        synth.triggerAttack("C4");
        console.log("Audio resumed");
      }
    }
  }
}

class Point {
  constructor({ pos }) {
    this.pos = pos;
  }
}

window.preload = preload;
window.setup = setup;
window.draw = draw;
window.keyPressed = keyPressed;

export { n, resize };

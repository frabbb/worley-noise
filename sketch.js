import { settings } from "./controls.js";
import { frag, vert } from "./shader.js";

let capturer;

let n = 50;
let points = [];
let worleyShader;
let observationPoint;
let delta;
let canvas;
let paused = false;
let goingBackwards = false;
let speedMultiplier = 0.002;

let recording = false;
let timeLimit = 0;
let recordedFrames = 0;
let fps = 30;

let progressEl = document.querySelector(".progress");
let progressPercentageEl = document.querySelector(".progress-percentage");
let abortBtn = document.querySelector(".abort");
let controls = document.querySelector(".commands");

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

  capturer = new CCapture({
    framerate: fps,
    format: "webm",
    name: "worley",
    quality: 100,
    videoBitsPerSecond: 5e6,
  });
}

function setup() {
  canvas = createCanvas(settings.canvas.width, settings.canvas.height, WEBGL);
  pixelDensity(1);
  resize();
  noStroke();

  createPoints();

  observationPoint = 0;
}

function draw() {
  if (paused) return;
  background(220);

  // timeLimit = Math.round(
  //   (settings.zDistribution * 2) / (settings.speed * speedMultiplier)
  // );

  timeLimit = settings.duration * 30;

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
    // ...normalizedMouse,
    observationPoint,
  ]);

  worleyShader.setUniform("u_time", frameCount / 100);
  worleyShader.setUniform("u_mouse", normalizedMouse);
  worleyShader.setUniform("u_contrast", settings.size);
  worleyShader.setUniform("u_n", n);
  worleyShader.setUniform("u_exposure", settings.exposure);
  worleyShader.setUniform("u_range", settings.range);

  shader(worleyShader);

  // Draw a plane that fills the canvas
  plane(width, height);

  strokeWeight(1);
  blendMode(DIFFERENCE);

  translate(-width / 2, -height / 2, 1);
  for (let i = 0; i <= width; i++) {
    let color = lerp(0, 255, i / width);
    stroke(color);
    line(i, 0, i, height);
  }

  if (recording) {
    if (recordedFrames === timeLimit) {
      toggleRecord();
      return;
    }
    requestAnimationFrame(draw);
    capturer.capture(canvas.elt);
    recordedFrames++;

    progressPercentageEl.innerHTML = `${Math.round(
      (recordedFrames / timeLimit) * 100
    )}%`;
    progressEl.style = `--progress: ${(recordedFrames / timeLimit) * 100}%`;
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

async function restart() {
  n = settings.number;

  if (paused) return;

  paused = true;

  worleyShader = createShader(vert, frag(n));
  createPoints();

  paused = false;
}

function dowload() {
  if (recording) return;
  if (!settings.animate) {
    saveCanvas("worley.jpg");
  } else {
    toggleRecord();
  }
}

// const recordBtn = document.querySelector(".record");
// let play = recordBtn.querySelector(".play");
// let stop = recordBtn.querySelector(".stop");

function toggleRecord(shouldSave = true) {
  progressEl.style = "--progress: 0px";
  progressPercentageEl.innerHTML = "";

  if (recording) {
    downloadBtn.classList.remove("disabled");
    capturer.stop();
    if (shouldSave) {
      capturer.save();
    }
    abortBtn.classList.add("hidden");
  } else {
    setTimeout(() => {
      draw();
    }, 0);

    abortBtn.classList.remove("hidden");

    // observationPoint = 0;
    recordedFrames = 0;
    capturer.start();
    downloadBtn.classList.add("disabled");
  }

  recording = !recording;
  controls.classList.toggle("disabled");

  abortBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleRecord(false);
  });

  // play.classList.toggle("hidden");
  // stop.classList.toggle("hidden");
}

const downloadBtn = document.querySelector(".download");
downloadBtn.addEventListener("click", dowload);

// recordBtn.addEventListener("click", toggleRecord);

function toggleAnimation() {
  // downloadBtn.classList.toggle("disabled");
  // recordBtn.classList.toggle("disabled");
}

class Point {
  constructor({ pos }) {
    this.pos = pos;
  }
}

window.preload = preload;
window.setup = setup;
window.draw = draw;

export { n, resize, restart, toggleAnimation, recording };

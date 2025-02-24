import { settings } from "./controls.js";
import { frag, vert } from "./shader.js";

let capturer;

let n = 50;
let points = [];
let worleyShader;
let observationPoint;
let delta;
const zDistribution = 1;
let canvas;
let paused = false;
let goingBackwards = false;
let speedMultiplier = 0.002;

let recording = false;
let timeLimit = 0;
let recordedFrames = 0;
let fps = 30;

function createPoints() {
  points = [];

  for (let i = 0; i < n; i++) {
    let randomPos = createVector(random(), random(), random(zDistribution));
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

  timeLimit = Math.round(
    (zDistribution * 2) / (settings.speed * speedMultiplier)
  );

  delta = settings.speed * speedMultiplier;

  if (settings.animate) {
    delta = delta * (goingBackwards ? -1 : 1);
    if (observationPoint + delta >= zDistribution) {
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

  if (recording) {
    if (recordedFrames === timeLimit) {
      toggleRecord();
      return;
    }
    requestAnimationFrame(draw);
    capturer.capture(canvas.elt);
    recordedFrames++;
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
  saveCanvas("worley.jpg");
}

const recordBtn = document.querySelector(".record");
let play = recordBtn.querySelector(".play");
let stop = recordBtn.querySelector(".stop");

function toggleRecord() {
  if (recording) {
    capturer.stop();
    capturer.save();
  } else {
    setTimeout(() => {
      draw();
    }, 0);

    observationPoint = 0;
    recordedFrames = 0;
    capturer.start();
  }

  recording = !recording;

  play.classList.toggle("hidden");
  stop.classList.toggle("hidden");
}

const donwloadBtn = document.querySelector(".download");
donwloadBtn.addEventListener("click", dowload);

recordBtn.addEventListener("click", toggleRecord);

class Point {
  constructor({ pos }) {
    this.pos = pos;
  }
}

window.preload = preload;
window.setup = setup;
window.draw = draw;

export { n, resize, restart };

import { settings } from "./controls.js";
import { frag, vert } from "./shader.js";

let n = 20;
let points = [];
let worleyShader;
let observationPoint;
let delta;
const zDistribution = 1;
let canvas;
let paused = false;
let goingBackwards = false;

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
}

function setup() {
  canvas = createCanvas(settings.canvas.width, settings.canvas.height, WEBGL);
  resize();
  noStroke();

  createPoints();

  observationPoint = 0;

  worleyShader.setUniform("u_resolution", createVector(width, height));
}

function draw() {
  if (paused) return;
  background(220);

  delta = settings.speed * 0.002;

  if (settings.animate) {
    // goingBackwards = observationPoint >= zDistribution || observationPoint <= 0;

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
}

function resize() {
  const { width, height } = settings.canvas;

  const wRatio = window.innerWidth / width;
  const hRatio = window.innerHeight / height;

  let scale = Math.min(Math.min(wRatio, hRatio), 1);

  canvas.elt.style = `--scale:${scale}`;

  if (scale <= 1) {
    canvas.elt.clasList?.remove("static");
  } else {
    canvas.elt.clasList?.add("static");
  }

  console.log(width, height);
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

const donwloadBtn = document.querySelector(".download");
donwloadBtn.addEventListener("click", dowload);

class Point {
  constructor({ pos }) {
    this.pos = pos;
  }
}

window.preload = preload;
window.setup = setup;
window.draw = draw;

export { n, resize, restart };

import { settings } from "./controls.js";

let n = 10;
let points = [];
let worleyShader;
let observationPoint;
let delta = 0.001;
const zDistribution = 0;
let canvas;

function preload() {
  worleyShader = loadShader("shader.vert", "shader.frag");
}

function setup() {
  canvas = createCanvas(settings.canvas.width, settings.canvas.height, WEBGL);
  resize();
  noStroke();

  observationPoint = 0;

  for (let i = 0; i < n; i++) {
    let randomPos = createVector(random(), random(), random(zDistribution));
    const point = new Point({ pos: randomPos });
    points.push(point);
  }

  worleyShader.setUniform("u_resolution", createVector(width, height));
}

function draw() {
  background(220);

  observationPoint += delta;
  delta =
    observationPoint >= zDistribution || observationPoint <= 0 ? -delta : delta;

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

  resizeCanvas(width, height);
}

function keyPressed() {
  if (key === "s") {
    saveCanvas("worley.jpg");
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

export { resize };

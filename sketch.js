let n = 200;
let points = [];
let worelyShader;
let observationPoint;
let delta = 0.001;

const zDistribution = 0.2;

function preload() {
  worelyShader = loadShader("shader.vert", "shader.frag");
}

function setup() {
  createCanvas(windowWidth, windowWidth, WEBGL);
  noStroke();

  observationPoint = 0;

  for (let i = 0; i < n; i++) {
    let randomPos = createVector(random(), random(), random(zDistribution));
    const point = new Point({ pos: randomPos });
    points.push(point);
  }

  worelyShader.setUniform("u_resolution", createVector(width, height));
}

function draw() {
  background(220);

  observationPoint += delta;
  delta =
    observationPoint >= zDistribution || observationPoint <= 0 ? -delta : delta;

  const normalizedMouse = [mouseX / width, (height - mouseY) / height];

  worelyShader.setUniform("u_z", observationPoint);

  worelyShader.setUniform("u_points", [
    ...points.flatMap((p) => [p.pos.x, p.pos.y, p.pos.z]),
    ...normalizedMouse,
    observationPoint,
  ]);

  worelyShader.setUniform("u_time", frameCount / 100);
  worelyShader.setUniform("u_mouse", normalizedMouse);

  shader(worelyShader);

  // Draw a plane that fills the canvas
  plane(width, height);
}

class Point {
  constructor({ pos }) {
    this.pos = pos;
  }
}

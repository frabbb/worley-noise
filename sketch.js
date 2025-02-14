let n = 10;
let points = [];
let worleyShader;
let observationPoint;
let delta = 0.001;

const zDistribution = 0;
let invert = true;

const container = document.querySelector(".commands");
let channels = [{ name: "r" }, { name: "g" }, { name: "b" }];

channels.forEach((channel) => {
  const el = document.createElement("div");
  el.classList.add(channel.name);
  el.classList.add("channel");

  const title = document.createElement("p");
  title.innerHTML = channel.name.toUpperCase();
  el.appendChild(title);

  const intensityEl = document.createElement("div");
  intensityEl.classList.add("intensity");

  const intensityInput = document.createElement("input");
  intensityInput.type = "range";
  intensityInput.min = 0;
  intensityInput.max = 5;
  intensityInput.step = 0.1;
  intensityInput.value = 1;
  channel.intensity = intensityInput.value;
  intensityEl.appendChild(intensityInput);

  const label = document.createElement("label");
  label.innerHTML = intensityInput.value;
  intensityEl.appendChild(label);

  intensityInput.addEventListener("input", () => {
    channel.intensity = Number(intensityInput.value);
    label.innerHTML = channel.intensity;
  });

  el.appendChild(intensityEl);

  let ranges = ["min", "max"];
  const rangesEl = document.createElement("div");
  rangesEl.classList.add("ranges");

  ranges.forEach((range) => {
    const input = document.createElement("input");
    input.type = "number";
    input.min = 0;
    input.max = 1;
    input.value = range === "min" ? 0 : 1;
    input.step = 0.05;
    channel[range] = input.value;

    input.addEventListener("input", () => {
      channel[range] = Number(input.value);
    });
    rangesEl.appendChild(input);
  });

  el.appendChild(rangesEl);
  container.appendChild(el);
});

let invertEl = document.createElement("div");
invertEl.classList.add("invert");

const checkbox = document.createElement("input");
checkbox.type = "checkbox";
checkbox.checked = invert;

invertEl.appendChild(checkbox);
const title = document.createElement("p");
title.innerHTML = "Invert";
invertEl.appendChild(title);
container.appendChild(invertEl);

checkbox.addEventListener("input", () => (invert = checkbox.checked));

function preload() {
  worleyShader = loadShader("shader.vert", "shader.frag");
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
  worleyShader.setUniform("u_invert", invert ? 1 : 0);

  channels.forEach((channel) => {
    worleyShader.setUniform("u_range_min_" + channel.name, channel.min);
    worleyShader.setUniform("u_range_max_" + channel.name, channel.max);
    worleyShader.setUniform("u_intensity_" + channel.name, channel.intensity);
  });

  shader(worleyShader);

  // Draw a plane that fills the canvas
  plane(width, height);
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

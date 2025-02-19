import { resize } from "./sketch.js";

const container = document.querySelector(".commands");
let controls = [
  {
    key: "canvas",
    label: "Canvas",
    fields: [
      {
        label: "Width",
        key: "width",
        type: "number",
        min: 100,
        max: 4000,
        value: 1080,
        onUpdate: resize,
      },
      {
        label: "Height",
        key: "height",
        type: "number",
        min: 100,
        max: 4000,
        value: 1080,
        onUpdate: resize,
      },
    ],
  },
  {
    fields: [
      {
        label: "Number of points",
        key: "number",
        type: "number",
        min: 1,
        max: 100,
        value: 2,
      },
    ],
  },
  {
    fields: [
      {
        label: "Exposure",
        key: "exposure",
        type: "range",
        min: 1,
        max: 10,
        step: 0.1,
        value: 7,
      },
    ],
  },
  {
    fields: [
      {
        label: "Points size",
        key: "size",
        type: "range",
        min: 0.01,
        max: 1,
        step: 0.01,
        value: 1,
      },
    ],
  },
  {
    fields: [
      { label: "Animate", key: "animate", type: "checkbox", checked: false },
    ],
  },
];

let settings = {};

controls.forEach((group) => {
  let target = settings;
  if (group.key) {
    settings[group.key] = {};
    target = settings[group.key];
  }

  let groupEl = document.createElement("div");
  groupEl.classList.add("group");
  container.appendChild(groupEl);

  if (group.label) {
    const label = document.createElement("p");
    label.innerHTML = group.label;
    groupEl.appendChild(label);
  }

  let fieldsEl = document.createElement("div");
  fieldsEl.classList.add("fields");
  groupEl.appendChild(fieldsEl);

  group.fields.forEach((field) => {
    target[field.key] = field.type === "checkbox" ? field.checked : field.value;

    const fieldEl = document.createElement("div");
    fieldEl.classList.add("field");
    fieldsEl.appendChild(fieldEl);

    if (field.label) {
      const label = document.createElement("p");
      label.innerHTML = field.label;
      fieldEl.appendChild(label);
    }

    const input = document.createElement("input");
    Object.entries(field).forEach(([key, value]) => (input[key] = value));
    fieldEl.appendChild(input);

    let label;

    if (field.type === "range") {
      label = document.createElement("p");
      label.classList.add("label");
      label.innerHTML = field.value;
      fieldEl.appendChild(label);
    }

    input.addEventListener("input", () => {
      let v =
        field.type === "checkbox"
          ? input.checked
          : ["number", "range"].includes(field.type)
          ? Number(input.value)
          : input.value;

      target[field.key] = v;

      if (label) {
        label.innerHTML = v;

        if (field.type === "range") {
          label.style.marginLeft = `${
            ((v - field.min) / (field.max - field.min)) * 100
          }%`;
          label.style.transform = `translate(-${
            ((v - field.min) / (field.max - field.min)) * 100
          }%, 0)`;
        }
      }

      if (field.onUpdate) {
        field.onUpdate();
      }
    });
  });
});

export { settings };

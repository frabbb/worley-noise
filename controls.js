import { n, resize, restart, toggleAnimation, recording } from "./sketch.js";

const container = document.querySelector(".commands");

let settings = {};

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
        max: 5700,
        value: 1080,
        onUpdate: resize,
      },
      {
        label: "Height",
        key: "height",
        type: "number",
        min: 100,
        max: 5700,
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
        type: "range",
        min: 1,
        max: 150,
        value: n,
        onUpdate: restart,
      },
    ],
  },
  {
    fields: [
      {
        label: "Z Distribution",
        key: "zDistribution",
        type: "range",
        min: 0,
        max: 1,
        value: 1,
        step: 0.01,
        onUpdate: restart,
      },
    ],
  },
  {
    fields: [
      {
        label: "Point Size",
        key: "size",
        type: "range",
        min: 0.01,
        max: 1,
        step: 0.01,
        value: 0.5,
      },
    ],
  },
  {
    fields: [
      {
        label: "Exposure range",
        key: "range",
        type: "dualrange",
        min: 0,
        max: 1,
        step: 0.01,
        value: [0.15, 0.7],
      },
    ],
  },
  {
    fields: [
      {
        label: "Speed",
        key: "speed",
        type: "range",
        min: 0,
        max: 2,
        step: 0.01,
        value: 0.3,
      },
    ],
  },
  {
    fields: [
      {
        label: "Animate",
        key: "animate",
        type: "checkbox",
        checked: true,
        onUpdate: toggleAnimation,
      },
    ],
  },
  {
    fields: [
      {
        label: "Video duration (s)",
        key: "duration",
        type: "number",
        min: 1,
        max: 60,
        value: 10,
        onUpdate: (field) => {
          settings.duration = Math.max(Math.min(settings.duration, 30), 1);
          field.el.value = settings.duration;
        },
      },
    ],
  },
];

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

    const inputWrapper = document.createElement("div");
    inputWrapper.classList.add("input-wrapper");
    fieldEl.appendChild(inputWrapper);

    if (field.type === "dualrange") {
      const wrapper = document.createElement("div");
      wrapper.classList.add("dual-range");
      inputWrapper.appendChild(wrapper);

      let minInput = document.createElement("input");
      let maxInput = document.createElement("input");

      const inputs = [minInput, maxInput];

      settings[field.key] = field.value;

      const labelWrapper = document.createElement("div");
      labelWrapper.classList.add("label-wrapper");

      const selection = document.createElement("div");
      selection.classList.add("selection");
      wrapper.appendChild(selection);

      selection.style.marginLeft = `${
        ((field.value[0] - field.min) / (field.max - field.min)) * 100
      }%`;
      selection.style.width = `${
        ((field.value[1] - field.value[0] - field.min) /
          (field.max - field.min)) *
        100
      }%`;

      inputs.forEach((input, index) => {
        wrapper.appendChild(input);

        input.type = "range";
        input.min = field.min;
        input.max = field.max;
        input.step = field.step;
        input.value = field.value[index];

        const label = document.createElement("p");
        label.classList.add("label");
        label.innerHTML = field.value[index];

        labelWrapper.appendChild(label);

        label.style.marginLeft = `${
          ((field.value[index] - field.min) / (field.max - field.min)) * 100
        }%`;
        label.style.transform = `translate(-${
          ((field.value[index] - field.min) / (field.max - field.min)) * 100
        }%, 0)`;

        input.addEventListener("input", () => {
          let v = Number(input.value);
          let min = settings[field.key][0];
          let max = settings[field.key][1];

          if (index === 0) {
            if (v >= max) {
              v = max;
            }
          } else if (index === 1) {
            if (v <= min) {
              v = min;
            }
          }

          input.value = v;
          settings[field.key][index] = v;

          label.innerHTML = v;

          label.style.marginLeft = `${
            ((v - field.min) / (field.max - field.min)) * 100
          }%`;
          label.style.transform = `translate(-${
            ((v - field.min) / (field.max - field.min)) * 100
          }%, 0)`;

          selection.style.marginLeft = `${
            ((field.value[0] - field.min) / (field.max - field.min)) * 100
          }%`;
          selection.style.width = `${
            ((field.value[1] - field.value[0] - field.min) /
              (field.max - field.min)) *
            100
          }%`;
        });
      });

      wrapper.appendChild(labelWrapper);

      return;
    }

    const input = document.createElement("input");
    field.el = input;
    Object.entries(field).forEach(([key, value]) => (input[key] = value));
    inputWrapper.appendChild(input);

    let label;

    if (field.type === "range") {
      label = document.createElement("p");
      label.classList.add("label");
      label.innerHTML = field.value;
      fieldEl.appendChild(label);

      if (field.type === "range") {
        label.style.marginLeft = `${
          ((field.value - field.min) / (field.max - field.min)) * 100
        }%`;
        label.style.transform = `translate(-${
          ((field.value - field.min) / (field.max - field.min)) * 100
        }%, 0)`;
      }
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
        field.onUpdate(field);
      }
    });
  });
});

document.addEventListener("keypress", (e) => {
  if (e.code === "Space" && !recording) {
    settings.animate = !settings.animate;

    const field = controls
      .map((g) => g.fields)
      .flat()
      .find((f) => f.key === "animate");

    field.el.checked = settings.animate;

    toggleAnimation();
  }
});

export { settings };

export default class ColorView {

  constructor(serializedState) {
    // Create root element, part of custom HTML element?
    this.element = document.createElement("div");
    this.element.classList.add("codewall");
  }

  addMessage(text) {
    const message = document.createElement("div");
    message.textContent = text;
    message.classList.add("message");

    this.element.appendChild(message);
  }

  addColorInput() {
    // 4 number inputs for RGBA
    // RGB nust be integers (0 - 255), A can be anything between 0 and 1.

    // form -> inputs -> button

    const colorInputBlock = document.createElement("div");
    colorInputBlock.classList.add("block");

    // Define RGBA input
    const colors = [
      {name: "red", max: 255, step: 1},
      {name: "green", max: 255, step: 1},
      {name: "blue", max: 255, step: 1},
      {name: "opacity", max: 1, step: "any"}
    ];

    for (let color of colors) {
      let colorInput = document.createElement("input");
      colorInput.setAttribute("type", "number");
      colorInput.setAttribute("required", "true");
      colorInput.setAttribute("min", 0);
      colorInput.setAttribute("max", color.max);
      colorInput.setAttribute("step", color.step);
      colorInput.id = color.name;
      colorInput.classList.add("color");
      colorInputBlock.appendChild(colorInput);
    }

    this.element.appendChild(colorInputBlock);

    const colorInputSubmit = document.createElement("button");
    colorInputSubmit.classList.add("submit-button");
    this.element.appendChild(colorInputSubmit);
  }

}

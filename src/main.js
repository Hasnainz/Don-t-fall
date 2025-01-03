import { World } from "./world";

let instructions = document.getElementById("instructions");
let level1 = document.getElementById("level1-button");
let level2 = document.getElementById("level2-button");
let loadbutton = document.getElementById("load-button");

let level = 1;
// instructions.style.display = "none";
// let app = new World(level);

let app = null;
let toggle = true;

document.addEventListener("keydown", (event) => {
  if (event.code == "Escape") {
    if (app != null) {
      if (toggle) {
        instructions.style.display = "";
        toggle = !toggle;
      } else {
        instructions.style.display = "none";
        toggle = !toggle;
      }
    }
  }
});

level1.addEventListener("click", () => {
  level = 1;
  loadbutton.innerText = "load level 1";
});

level2.addEventListener("click", () => {
  level = 2;
  loadbutton.innerText = "load level 2";
});

loadbutton.addEventListener("click", () => {
  instructions.style.display = "none";
  if (app != null) {
    app.Cleanup();
  }
  app = new World(level);
});

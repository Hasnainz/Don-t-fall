import { World } from "./world";
import * as THREE from "three";

let instructions = document.getElementById("instructions");
let level1 = document.getElementById("level1-button");
let level2 = document.getElementById("level2-button");
let loadbutton = document.getElementById("load-button");

let level = 1;
let app = null;

document.addEventListener("keydown", (event) => {
  if (event.code == "Escape") {
    if (app != null) {
      instructions.style.display = "";
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
  if(app != null) {
    app.Cleanup();
  }
    app = new World(level);
});
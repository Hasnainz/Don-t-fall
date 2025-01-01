export class CharacterControllerInput {
  constructor() {
    this._Initialize();
  }
  _Initialize() {
    this._keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      shift: false,
      space: false,
      dance: false
    };

    document.addEventListener("keydown", (e) => this._onKeyDown(e), false);
    document.addEventListener("keyup", (e) => this._onKeyUp(e), false);
  }

  _onKeyDown(e) {
    switch (e.code) {
      case "KeyW":
        this._keys.forward = true;
        break;

      case "KeyA":
        this._keys.left = true;
        break;

      case "KeyS":
        this._keys.backward = true;
        break;

      case "KeyD":
        this._keys.right = true;
        break;

      case "ShiftLeft":
        this._keys.shift = true;
        break;

      case "Space":
        this._keys.space = true;
        break;

      case "KeyR":
        this._keys.dance = true;
        break;
    }
  }

  _onKeyUp(e) {
    switch (e.code) {
      case "KeyW":
        this._keys.forward = false;
        break;

      case "KeyA":
        this._keys.left = false;
        break;

      case "KeyS":
        this._keys.backward = false;
        break;

      case "KeyD":
        this._keys.right = false;
        break;

      case "ShiftLeft":
        this._keys.shift = false;
        break;

      case "Space":
        this._keys.space = false;
        break;

      case "KeyR":
        this._keys.dance = false;
        break;
    }
  }
};

import * as THREE from "three";

class State {
  constructor(parent) {
    this._parent = parent;
  }

  Enter() {}
  Exit() {}
  Update() {}
}

export class DanceState extends State {
  constructor(parent) {
    super(parent);

    this._FinishedCallback = () => {
      this._Finished();
    };
  }

  get Name() {
    return "dance";
  }

  Enter(prevState) {
    const curAction = this._parent._animations["dance"].action;
    const mixer = curAction.getMixer();
    mixer.addEventListener("finished", this._FinishedCallback);

    if (prevState) {
      const prevAction = this._parent._animations[prevState.Name].action;

      curAction.reset();
      curAction.setLoop(THREE.LoopOnce, 1);
      curAction.clampWhenFinished = true;
      curAction.crossFadeFrom(prevAction, 0.2, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  _Finished() {
    this._Cleanup();
    this._parent.SetState("idle");
  }

  _Cleanup() {
    const action = this._parent._animations["dance"].action;

    action.getMixer().removeEventListener("finished", this._CleanupCallback);
  }

  Exit() {
    this._Cleanup();
  }

  Update(_, input) {
    if (input.key._keys.forward || input.key._keys.backward) {
      this._parent.SetState("walk");
    } else if (input.key._keys.dance) {
      this._parent.SetState("dance");
    } else if (input.key._keys.space && input.jump) {
      this._parent.SetState("jump");
    }
  }
}

export class WalkState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return "walk";
  }

  Enter(prevState) {
    const curAction = this._parent._animations["walk"].action;
    if (prevState) {
      const prevAction = this._parent._animations[prevState.Name].action;

      curAction.enabled = true;

      if (prevState.Name == "run") {
        const ratio =
          curAction.getClip().duration / prevAction.getClip().duration;
        curAction.time = prevAction.time * ratio;
      } else {
        curAction.time = 0.2;
        curAction.setEffectiveTimeScale(1.0);
        curAction.setEffectiveWeight(1.0);
      }

      curAction.crossFadeFrom(prevAction, 0.5, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  Exit() {}

  Update(timeElapsed, input) {
    if (input.key._keys.space && input.jump) {
      this._parent.SetState("jump");
    }
    if (input.key._keys.forward) {
      if (input.key._keys.shift) {
        this._parent.SetState("run");
      }
      return;
    } else if (input.key._keys.backward) {
      this._parent.SetState("walkback");
    }
    this._parent.SetState("idle");
  }
}

export class RunState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return "run";
  }

  Enter(prevState) {
    const curAction = this._parent._animations["run"].action;
    if (prevState) {
      const prevAction = this._parent._animations[prevState.Name].action;

      curAction.enabled = true;

      if (prevState.Name == "walk") {
        const ratio =
          curAction.getClip().duration / prevAction.getClip().duration;
        curAction.time = prevAction.time * ratio;
      } else {
        curAction.time = 0.0;
        curAction.setEffectiveTimeScale(1.0);
        curAction.setEffectiveWeight(1.0);
      }

      curAction.crossFadeFrom(prevAction, 0.5, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  Exit() {}

  Update(timeElapsed, input) {
    if (input.key._keys.space && input.jump) {
      this._parent.SetState("jump");
    }
    if (input.key._keys.forward || input.key._keys.backward) {
      if (!input.key._keys.shift) {
        this._parent.SetState("walk");
      }
      return;
    }
    this._parent.SetState("idle");
  }
}

export class IdleState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return "idle";
  }

  Enter(prevState) {
    const idleAction = this._parent._animations["idle"].action;
    if (prevState) {
      const prevAction = this._parent._animations[prevState.Name].action;
      idleAction.time = 0.0;
      idleAction.enabled = true;
      idleAction.setEffectiveTimeScale(1.0);
      idleAction.setEffectiveWeight(1.0);
      idleAction.crossFadeFrom(prevAction, 0.5, true);
      idleAction.play();
    } else {
      idleAction.play();
    }
  }

  Exit() {}

  Update(_, input) {
    if (input.key._keys.forward) {
      this._parent.SetState("walk");
    }
    if (input.key._keys.backward) {
      this._parent.SetState("walkback");
    }
    if (input.key._keys.dance) {
      this._parent.SetState("dance");
    }
    if (input.key._keys.space && input.jump) {
      this._parent.SetState("jump");
    }
  }
}

export class JumpState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return "jump";
  }

  Enter(prevState) {
    const curAction = this._parent._animations["jump"].action;
    if (prevState) {
      const prevAction = this._parent._animations[prevState.Name].action;
      curAction.enabled = true;
      curAction.time = 0.0;
      curAction.setEffectiveTimeScale(1.0);
      curAction.setEffectiveWeight(1.0);
      curAction.crossFadeFrom(prevAction, 0.1, true);
      curAction.play();
    } else {
      curAction.play();
    }
  }

  Exit() {}

  Update(timeElapsed, input) {
    if (input.key._keys.forward || input.key._keys.backward) {
      if (input.key._keys.shift) {
        this._parent.SetState("run");
      }
      this._parent.SetState("walk");
      return;
    }

    this._parent.SetState("idle");
  }
}

export class WalkBackState extends State {
  constructor(parent) {
    super(parent);
  }

  get Name() {
    return "walkback";
  }

  Enter(prevState) {
    const curAction = this._parent._animations["walkback"].action;
    curAction.enabled = true;
    curAction.play();
  }

  Exit() {}

  Update(timeElapsed, input) {
    if (input.key._keys.space && input.jump) {
      this._parent.SetState("jump");
    } else if (input.key._keys.forward) {
      this._parent.SetState("walk");
    }
    this._parent.SetState("idle");
  }
}

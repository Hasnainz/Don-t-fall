import * as State from "./animationstates";

class FiniteStateMachine {
  constructor() {
    this._states = {};
    this._currentState = null;
  }
  _AddState(name, type) {
    this._states[name] = type;
  }

  SetState(name) {
    const prevState = this._currentState;
    if (prevState) {
      if (prevState.Name == name) {
        return;
      }
      prevState.Exit();
    }
    const state = new this._states[name](this);

    this._currentState = state;
    state.Enter(prevState);
  }

  Update(timeElapsed, input) {
    if (this._currentState) {
      this._currentState.Update(timeElapsed, input);
    }
  }
}

export class CharacterStateMachine extends FiniteStateMachine {
  constructor(animations) {
    super();
    this._animations = animations;
    this._Init();
  }

  _Init() {
    this._AddState("idle", State.IdleState);
    this._AddState("walk", State.WalkState);
    this._AddState("run", State.RunState);
    this._AddState("dance", State.DanceState);
    this._AddState("jump", State.JumpState);
    this._AddState("walkback", State.WalkBackState);
  }
}

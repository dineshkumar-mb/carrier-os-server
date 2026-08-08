export type ExecutionState =
  | 'CREATED'
  | 'PLANNING'
  | 'READY'
  | 'RUNNING'
  | 'WAITING'
  | 'RETRYING'
  | 'FAILED'
  | 'COMPLETED'
  | 'CANCELLED';

const VALID_TRANSITIONS: Record<ExecutionState, ExecutionState[]> = {
  CREATED: ['PLANNING', 'CANCELLED'],
  PLANNING: ['READY', 'FAILED', 'CANCELLED'],
  READY: ['RUNNING', 'CANCELLED'],
  RUNNING: ['WAITING', 'RETRYING', 'COMPLETED', 'FAILED', 'CANCELLED'],
  WAITING: ['RUNNING', 'FAILED', 'CANCELLED'],
  RETRYING: ['RUNNING', 'FAILED', 'CANCELLED'],
  FAILED: ['RETRYING', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: []
};

export class ExecutionStateMachine {
  private currentState: ExecutionState;

  constructor(initialState: ExecutionState = 'CREATED') {
    this.currentState = initialState;
  }

  public getState(): ExecutionState {
    return this.currentState;
  }

  public canTransitionTo(nextState: ExecutionState): boolean {
    const validNextStates = VALID_TRANSITIONS[this.currentState] || [];
    return validNextStates.includes(nextState);
  }

  public transitionTo(nextState: ExecutionState, reason?: string): ExecutionState {
    if (!this.canTransitionTo(nextState)) {
      throw new Error(`[ExecutionStateMachine] Invalid state transition from "${this.currentState}" to "${nextState}". Valid targets: [${VALID_TRANSITIONS[this.currentState].join(', ')}]`);
    }

    console.log(`[ExecutionStateMachine] 🔄 Transition: ${this.currentState} ➔ ${nextState} ${reason ? `(${reason})` : ''}`);
    this.currentState = nextState;
    return this.currentState;
  }
}

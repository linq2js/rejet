export interface State {
  get(): any;
  subscribe(subscription: Function): void;
}

export interface ValuedState extends State {
  value: any;
}

export interface ComputedState extends State {
  (...args): ComputedState;
  readonly value: any;
  loadable: State;
}

export interface Action extends Function {
  (...args: any[]): any;
  subscribe(subscription: Function): Function;
}

export interface ActionBody {
  (context?: ActionContext, ...args: any[]): any;
}

export interface Computer {
  (context?: ComputingContext, ...args: any[]): any;
}

export interface ActionContext {
  get(state: State): any;
  set(state: ValuedState, mapper: (prev: any) => any): void;
  set(state: ValuedState, value: any): void;
  merge(state: ValuedState, mapper: (prev: any) => any): void;
  merge(state: ValuedState, value: any): void;
  add(state: ValuedState, value: any): void;
  watch(actionsOrStates: Action | State | Action[] | State[]): Promise<any>;
  call(actionOrFunction: Action | Function, ...args: any[]);
  when(
    actionsOrStates: Action | State | Action[] | State[],
    listener: Function,
  ): void;
  delay(ms?: number): Promise<any>;
  throttle<T extends Function>(ms: number, func: T): T;
  debounce<T extends Function>(ms: number, func: T): T;
  once<T extends Function>(func: T): T;
}

export interface ComputingContext {
  get(state: State): any;
}

export interface ActionOptions {
  repeatCondition?: boolean | RepeatCondition;
  restartOnFailure?: boolean;
}

export interface RepeatCondition {
  (context: ActionContext, ...args: any[]): boolean;
}

export function action(options: ActionOptions, body?: ActionBody): Action;

export function action(body?: ActionBody): Action;

export function state(computer: Computer): ComputedState;

export function state(value?: any): ValuedState;

export function select(states: State[]): any[];

export function select(states: State): any;

export function delay(ms?: number): Promise<any>;

export function memoize<T extends Function>(func: T): T;

export function throttle<T extends Function>(ms: number, func: T): T;

export function debounce<T extends Function>(ms: number, func: T): T;

export function once<T extends Function>(func: T): T;

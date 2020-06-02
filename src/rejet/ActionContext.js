import subscribeAll from './subscribeAll';
import debounce from './debounce';
import throttle from './throttle';
import once from './once';
import delay from './delay';
import createPublisher from './createPublisher';
import createSymbol from './createSymbol';
import createCancellationError from './createCancellationError';

const cancellingSymbol = createSymbol('cancelling');
const successSymbol = createSymbol('success');
const errorSymbol = createSymbol('error');
const doneSymbol = createSymbol('done');
const disposeSymbol = createSymbol('dispose');
const noop = () => {};

export default class ActionContext {
  constructor() {
    this.__publisher = createPublisher();
    this.__disposed = false;
    this.__isCancelled = false;
  }

  __wrap(name, f) {
    const propName = '__' + name;
    let wrapper = this[propName];
    if (!wrapper) {
      this[propName] = wrapper = (...args) => {
        this.checkCancellationStatus();
        return f(...args);
      };
    }
    return wrapper;
  }

  __mutate(name, f) {
    return this.__wrap(name, (state, ...args) =>
      this.set(state, (prevState) => f(prevState, ...args)),
    );
  }

  __cancel() {
    if (this.__isCancelled) {
      return;
    }
    this.__isCancelled = true;
    this.__publisher.channel(cancellingSymbol).dispatch(undefined);
    this.dispose();
  }

  checkCancellationStatus() {
    if (this.__isCancelled) {
      throw createCancellationError();
    }
    return true;
  }

  get(state) {
    return state.get();
  }

  get isCancelled() {
    return () => this.__isCancelled;
  }

  get onCancelling() {
    return (subscription) =>
      this.__publisher.channel(cancellingSymbol).subscribe(subscription);
  }

  get onSuccess() {
    return (subscription) =>
      this.__publisher.channel(successSymbol).subscribe(subscription);
  }

  get onError() {
    return (subscription) =>
      this.__publisher.channel(errorSymbol).subscribe(subscription);
  }

  get cancel() {
    return () => {
      this.__cancel();
      throw createCancellationError();
    };
  }

  get onDone() {
    return (subscription) =>
      this.__publisher.channel(doneSymbol).subscribe(subscription);
  }

  done(payload) {
    this.__publisher.channel(doneSymbol).dispatch(payload);
  }

  error(payload) {
    this.__publisher.channel(errorSymbol).dispatch(payload);
  }

  success(payload) {
    this.__publisher.channel(successSymbol).dispatch(payload);
  }

  get call() {
    return this.__wrap('run', (f, ...args) => f(...args));
  }

  get watch() {
    return this.__wrap('watch', (actionsOrStates) => {
      return new Promise((resolve) => {
        this.when(actionsOrStates, resolve, true);
      });
    });
  }

  get when() {
    return this.__wrap('when', (actionsOrStates, callback, once) => {
      if (!Array.isArray(actionsOrStates)) {
        actionsOrStates = [actionsOrStates];
      }

      const handleStateChangedOrActionDispatched = (e) => {
        if (this.__isCancelled) {
          return;
        }
        if (once) {
          handleDisposing();
          unsubscribeDisposingListener();
        }

        callback(e);
      };

      const handleDisposing = subscribeAll(
        actionsOrStates,
        handleStateChangedOrActionDispatched,
      );

      const unsubscribeDisposingListener = once
        ? // remove listeners when parent context disposed if once flag is true
          this.__publisher.channel(disposeSymbol).subscribe(handleDisposing)
        : // do nothing when parent context disposed
          noop;

      return handleDisposing;
    });
  }

  dispose() {
    if (this.__disposed) {
      return;
    }
    this.__publisher.channel(disposeSymbol).dispatch();
    this.__publisher.clear();
    this.__disposed = true;
  }

  get delay() {
    return this.__wrap('delay', async (ms) => {
      await delay(ms);
      this.checkCancellationStatus();
    });
  }

  get throttle() {
    return this.__wrap('throttle', (ms, func) =>
      throttle(ms, (...args) => {
        this.checkCancellationStatus();
        return func(...args);
      }),
    );
  }

  get once() {
    return this.__wrap('once', (ms, func) =>
      once(ms, (...args) => {
        this.checkCancellationStatus();
        return func(...args);
      }),
    );
  }

  get debounce() {
    return this.__wrap('debounce', (ms, func) =>
      debounce(ms, (...args) => {
        this.checkCancellationStatus();
        return func(...args);
      }),
    );
  }

  get set() {
    return this.__wrap('set', (state, value) =>
      typeof value === 'function'
        ? state.set(value(state.get()))
        : state.set(value),
    );
  }

  get merge() {
    return this.__mutate('merge', (state, value) => {
      let nextState = state;
      Object.entries(
        value ? (typeof value === 'function' ? value(state) : value) : {},
      ).forEach(([propName, propValue]) => {
        if (state[propName] === propValue) {
          return;
        }
        if (nextState === state) {
          nextState = Array.isArray(state) ? state.slice(0) : {...state};
        }
        nextState[propName] = propValue;
      });
      return nextState;
    });
  }

  get add() {
    return this.__mutate('add', (state, by) => {
      if (typeof state === 'number') {
        return state + by;
      }
      const date = state;
      let duration = by;
      if (typeof duration !== 'object') {
        duration = {
          milliseconds: duration,
        };
      }
      const {
        years = 0,
        months = 0,
        days = 0,
        hours = 0,
        seconds = 0,
        minutes = 0,
        milliseconds = 0,
      } = duration;

      return new Date(
        date.getFullYear() + years,
        date.getMonth() + months,
        date.getDate() + days,
        date.getHours() + hours,
        date.getMinutes() + minutes,
        date.getSeconds() + seconds,
        date.getMilliseconds() + milliseconds,
      );
    });
  }
}

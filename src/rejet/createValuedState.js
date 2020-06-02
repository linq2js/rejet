import createPublisher from './createPublisher';
import globalScope from './globalScope';

export default function createState(defaultValue) {
  let currentValue = defaultValue;
  const {subscribe, dispatch} = createPublisher();
  const api = [get, set];
  const state = {
    subscribe,
    get,
    set,
    api: {
      get() {
        return api;
      },
    },
  };

  function get() {
    return currentValue;
  }

  function set(value) {
    if (currentValue === value) {
      return;
    }
    currentValue = value;
    const currentScope = globalScope();
    if (currentScope.stateChangeQueue) {
      currentScope.stateChangeQueue.set(state, () => dispatch(currentValue));
    } else {
      dispatch(currentValue);
    }
  }

  Object.defineProperty(state, 'value', {
    get,
    set,
  });

  return state;
}

import {loading, hasError, hasValue} from './loadableStatus';
import createPublisher from './createPublisher';
import createArrayKeyedMap from './ArrayKeyedMap';

const empty = {};

export default function createComputedState(selector) {
  let cacheMap = createArrayKeyedMap();
  const {subscribe, dispatch} = createPublisher();
  const dependencies = new Set();
  const handleChange = (payload) => {
    cacheMap = createArrayKeyedMap();
    dispatch(payload);
  };

  const selectorContext = {
    get(state) {
      // add new state dependency if not exist
      if (!dependencies.has(state)) {
        state.subscribe(handleChange);
        dependencies.add(state);
      }
      return state.get();
    },
  };
  const getSelector = (args) => {
    let cachedSelector = cacheMap.get(args);
    if (!cachedSelector) {
      function get() {
        // re-evaluate for first time
        if (cachedSelector.__value === empty) {
          evaluate(cachedSelector, selector, args);
        }
        // re-evaluate if any dependency state changed
        else if (cachedSelector.__cache !== cacheMap) {
          evaluate(cachedSelector, selector, args);
        }
        return cachedSelector.__value;
      }
      const api = [get];
      cachedSelector = {
        __value: empty,
        __cache: cacheMap,
        get,
        subscribe,
        loadable: {
          get: () => {
            const value = get();
            if (cachedSelector.__loadable) {
              return cachedSelector.__loadable;
            }
            if (!cachedSelector.__hasValueLoadable) {
              cachedSelector.__hasValueLoadable = {status: hasValue};
            }
            cachedSelector.__hasValueLoadable.value = value;
            return cachedSelector.__hasValueLoadable;
          },
          subscribe,
        },
        api: {
          get: () => api,
        },
      };
      cacheMap.set(args, cachedSelector);
    }
    return cachedSelector;
  };
  const defaultSelector = getSelector([]);
  const evaluate = (state, selector, args) => {
    dependencies.clear();
    state.__cache = cacheMap;
    const value = selector(selectorContext, ...args);
    // promise
    if (value && typeof value.then === 'function') {
      const loadable = (state.__loadable = {
        status: loading,
        value: undefined,
      });
      value.then(
        (payload) => {
          if (loadable === state.__loadable) {
            loadable.status = hasValue;
            loadable.value = payload;
            dispatch(state.__value);
          }
        },
        (error) => {
          if (loadable === state.__loadable) {
            loadable.status = hasError;
            loadable.value = error;
            dispatch(state.__value);
          }
        },
      );
    } else {
      delete state.__loadable;
    }

    state.__value = value;
    dispatch(state.__value);
  };

  const state = Object.assign((...args) => {
    if (!args.length) {
      return defaultSelector;
    }
    return getSelector(args);
  }, defaultSelector);

  Object.defineProperty(state, '__loadable', {
    get: () => defaultSelector.__loadable,
  });

  Object.defineProperty(state, 'value', {
    get: () => defaultSelector.get(),
  });

  return state;
}

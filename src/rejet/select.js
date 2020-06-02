import {useEffect, useState} from 'react';

const effectHook = useEffect;
export default function useSelect(states) {
  const multipleSelector = Array.isArray(states);
  if (!multipleSelector) {
    states = [states];
  }
  const [, setState] = useState();
  effectHook(() => {
    const handleChange = () => {
      setState({});
    };
    const unsubscribes = states.map((state) => state.subscribe(handleChange));
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, states);

  const values = states.map((state) => {
    const value = state.get();
    // is promise
    if (value && typeof value.then === 'function') {
      const loadable = state.__loadable;
      if (loadable.status === 'loading') {
        throw value;
      } else if (loadable.status === 'hasValue') {
        return loadable.value;
      } else if (loadable.status === 'hasError') {
        throw loadable.value;
      }
    }
    return value;
  });

  return multipleSelector ? values : values[0];
}

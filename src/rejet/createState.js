import createValuedState from './createValuedState';
import createComputedState from './createComputedState';

export default function createState(defaultValue) {
  if (typeof defaultValue === 'function') {
    return createComputedState(defaultValue);
  }
  return createValuedState(defaultValue);
}

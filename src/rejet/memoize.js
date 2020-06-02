export default function memoize(func) {
  let lastResult, lastArgs;
  return (...args) => {
    if (!lastArgs || args.every((arg, i) => arg === lastArgs[i])) {
      return lastResult;
    }
    lastArgs = args;
    return (lastResult = func(...args));
  };
}

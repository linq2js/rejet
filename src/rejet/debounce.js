export default function debounce(ms, func) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(func, ms, ...args);
  };
}

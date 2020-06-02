export default function (ms, func) {
  let result,
    lastTimestamp = 0;
  return (...args) => {
    const currentTimestamp = new Date().getTime();
    if (currentTimestamp - lastTimestamp >= ms) {
      lastTimestamp = currentTimestamp;
      result = func(...args);
    }
    return result;
  };
}

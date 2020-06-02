export default function (func) {
  let executed = false,
    hasError = false,
    result;
  return (...args) => {
    if (executed) {
      if (hasError) {
        throw result;
      }
      return result;
    }
    executed = true;
    try {
      return (result = func(...args));
    } catch (e) {
      result = e;
      hasError = true;
    }
  };
}

const emptyMap = new Map();

export default function createArrayKeyedMap() {
  const root = new Map();

  function getMap(key, createIfNotExist) {
    const keyArray = Array.isArray(key) ? key : [key];
    let prev = root;
    for (let i = 0; i < keyArray.length; i++) {
      const item = keyArray[i];
      const value = prev.get(item);
      if (typeof value === 'undefined') {
        if (!createIfNotExist) {
          return emptyMap;
        }
        const newMap = new Map();
        prev.set(item, newMap);
        prev = newMap;
      } else {
        prev = value;
      }
    }
    return prev;
  }

  return {
    set(key, value) {
      getMap(key, true).value = value;
    },
    get(key) {
      return getMap(key, false).value;
    },
    delete(key) {
      delete getMap(key, false).value;
    },
  };
}

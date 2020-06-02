let currentScope = {};

export default function(f, { initial, onFinally } = {}) {
  if (!arguments.length) {
    return currentScope;
  }
  const prevScope = currentScope;
  try {
    currentScope = initial;
    return f(currentScope);
  } finally {
    currentScope = prevScope;
    onFinally && onFinally(initial);
  }
}

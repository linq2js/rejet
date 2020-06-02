export default function subscribeAll(statesOrActions, listener) {
  if (!Array.isArray(statesOrActions)) {
    statesOrActions = [statesOrActions];
  }
  const unsubscribes = statesOrActions.map((target) =>
    target.subscribe(listener),
  );
  if (statesOrActions.length < 2) {
    return statesOrActions[0];
  }
  let unsubscribed = false;
  return () => {
    if (unsubscribed) {
      return;
    }
    unsubscribed = true;
    unsubscribes.forEach((unsubscribe) => unsubscribe());
  };
}

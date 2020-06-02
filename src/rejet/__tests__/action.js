import {state, action, delay} from 'rejet';

test('should change state value properly', () => {
  const count = state(0);
  const increase = action(({set, get}) => set(count, get(count) + 1));
  increase();
  expect(count.value).toBe(1);
  increase();
  expect(count.value).toBe(2);
});

test('should change state value using .value setter  properly', () => {
  const count = state(0);
  const increase = action(() => count.value++);
  increase();
  expect(count.value).toBe(1);
  increase();
  expect(count.value).toBe(2);
});

test('should change state value using set callback properly', () => {
  const count = state(0);
  const increase = action(({set}) => set(count, (prev) => prev + 1));
  increase();
  expect(count.value).toBe(1);
  increase();
  expect(count.value).toBe(2);
});

test('should change state value using add properly', () => {
  const count = state(0);
  const increase = action(({add}) => add(count, 1));
  increase();
  expect(count.value).toBe(1);
  increase();
  expect(count.value).toBe(2);
});

test('should merge state properly', () => {
  const original = {value: 100};
  const data = state(original);
  const mergeData = action(({merge}, value) => merge(data, value));
  mergeData({value: 100});
  expect(data.value).toBe(original);
  mergeData({otherValue: 100});
  expect(data.value).toEqual({
    value: 100,
    otherValue: 100,
  });
});

test('should listen action dispatched properly', async () => {
  const click = action();
  const clicked = jest.fn();
  const epic = action(async ({watch, isCancelled}) => {
    while (!isCancelled()) {
      await watch(click);
      clicked();
    }
  });

  epic();
  await delay();
  expect(clicked).toBeCalledTimes(0);
  click();
  await delay();
  expect(clicked).toBeCalledTimes(1);
  click();
  await delay();
  expect(clicked).toBeCalledTimes(2);
});

test('should listen state changed properly', async () => {
  const count = state(0);
  const increase = action(({add}) => {
    add(count, 1);
  });
  const changed = jest.fn();
  const epic = action(async ({watch, isCancelled}) => {
    while (!isCancelled()) {
      await watch(count);
      changed();
    }
  });

  epic();
  await delay();
  expect(changed).toBeCalledTimes(0);
  increase();
  await delay();
  expect(changed).toBeCalledTimes(1);
  increase();
  await delay();
  expect(changed).toBeCalledTimes(2);

  expect(count.value).toBe(2);
});

test('should cancel async action properly', async () => {
  const done = jest.fn();
  const asyncAction = action(async ({isCancelled}) => {
    await delay(20);
    !isCancelled() && done();
  });

  const result = asyncAction();
  expect(done).toBeCalledTimes(0);
  result.cancel();
  await delay(30);
  expect(done).toBeCalledTimes(0);
  asyncAction();
  await delay(30);
  expect(done).toBeCalledTimes(1);
});

test('should restart on failure properly', async () => {
  let count = 0;
  const epic = action({restartOnFailure: true}, async ({cancel}) => {
    while (true) {
      await delay(5);
      count++;
      if (count === 5) {
        throw new Error();
      }

      if (count === 7) {
        return;
        // cancel();
      }
    }
  });

  epic();
  await delay(50);
  expect(count).toBe(7);
});

test('should repeat action properly', async () => {
  let count = 0;
  const epic = action(
    {restartOnFailure: true, repeatCondition: () => count < 7},
    async () => {
      await delay(5);
      count++;
      if (count === 5) {
        throw new Error();
      }
    },
  );

  epic();
  await delay(45);
  expect(count).toBe(7);
});

test('should listen action dispatching properly', async () => {
  let count = 0;
  const increase = action();
  const doIncrease = action(() => {
    return count++;
  });
  const epic = action(({when}) => {
    when(increase, doIncrease);
  });
  epic();
  increase();
  increase();
  increase();
  expect(count).toBe(3);
});

test('should listen action dispatching using debounce properly', async () => {
  let count = 0;
  const increase = action();
  const doIncrease = action(() => {
    return count++;
  });
  const epic = action(({when, debounce}) => {
    when(increase, debounce(10, doIncrease));
  });
  epic();
  increase();
  await delay(5);
  increase();
  await delay(5);
  increase();
  await delay(15);
  expect(count).toBe(1);
});

test('should listen action dispatching using throttle properly', async () => {
  let count = 0;
  const increase = action();
  const doIncrease = action(() => {
    return count++;
  });
  const epic = action(({when, throttle}) => {
    when(increase, throttle(10, doIncrease));
  });
  epic();
  increase();
  expect(count).toBe(1);
  await delay(5);
  increase();
  await delay(5);
  increase();
  await delay(5);
  expect(count).toBe(2);
});

test('should listen action dispatching using once properly', async () => {
  let count = 0;
  const increase = action();
  const doIncrease = action(() => {
    return count++;
  });
  const epic = action(({when, once}) => {
    when(increase, once(doIncrease));
  });
  epic();
  increase();
  increase();
  increase();
  expect(count).toBe(1);
});

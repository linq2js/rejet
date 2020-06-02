import createArrayKeyedMap from '../ArrayKeyedMap';

test('simple key', () => {
  const map = createArrayKeyedMap();
  const value = {};
  map.set([1, 2, 3, 4], value);
  expect(map.get([1, 2, 3, 4])).toBe(value);

  map.set([1], value);
  expect(map.get([1])).toBe(value);

  map.delete([1]);
  expect(map.get([1, 2, 3, 4])).toBe(value);
});

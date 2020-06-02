export default function createCancellationError() {
  return Object.assign(new Error('Invalid Operation'), {
    isCancellationError: true,
  });
}

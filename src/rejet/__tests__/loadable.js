import React, {Suspense} from 'react';
import {act, render} from '@testing-library/react';
import {delay, select, state} from 'rejet';
import {hasError, loading} from 'rejet/loadableStatus';

const suspenseFallback = <div data-testid="loading" />;
const errorBoundaryFallback = <div data-testid="error" />;
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {hasError: false};
  }

  static getDerivedStateFromError(error) {
    return {hasError: true, error};
  }

  render() {
    if (this.state.hasError) {
      return errorBoundaryFallback;
    }

    return this.props.children;
  }
}
const omitErrorLog = () =>
  jest.spyOn(console, 'error').mockImplementation(jest.fn());

test('should receive value from async computed state properly', async () => {
  const testValue = '100';
  const lazyCountState = state(async () => {
    await delay(10);
    return testValue;
  });
  const App = () => {
    const count = select(lazyCountState);
    return <div data-testid="count">{count}</div>;
  };
  const {getByTestId} = render(
    <Suspense fallback={suspenseFallback}>
      <App />
    </Suspense>,
  );

  expect(getByTestId('loading')).not.toBeUndefined();
  await delay(20);
  expect(getByTestId('count').innerHTML).toBe(testValue);
});

test('should get an error from async computed state properly', async () => {
  omitErrorLog();

  const lazyCountState = state(async () => {
    await delay(10);
    throw new Error('Invalid data');
  });

  const App = () => {
    const count = select(lazyCountState);
    return <div data-testid="count">{count}</div>;
  };

  const {getByTestId} = render(
    <ErrorBoundary>
      <Suspense fallback={suspenseFallback}>
        <App />
      </Suspense>
    </ErrorBoundary>,
  );

  expect(getByTestId('loading')).not.toBeUndefined();
  await delay(20);
  expect(getByTestId('error')).not.toBeUndefined();
});

test('should receive value from loadable properly', async () => {
  const testValue = '100';
  const lazyCountState = state(async () => {
    await delay(10);
    return testValue;
  });
  const App = () => {
    const {status, value} = select(lazyCountState.loadable);
    if (status === loading) {
      return suspenseFallback;
    }
    return <div data-testid="count">{value}</div>;
  };
  const {getByTestId} = render(<App />);

  expect(getByTestId('loading')).not.toBeUndefined();
  await act(() => delay(20));
  expect(getByTestId('count').innerHTML).toBe(testValue);
});

test('should get an error from loadable properly', async () => {
  omitErrorLog();

  const lazyCountState = state(async () => {
    await delay(10);
    throw new Error('Invalid data');
  });

  const App = () => {
    const {status, value} = select(lazyCountState.loadable);
    if (status === hasError) {
      return errorBoundaryFallback;
    }
    if (status === loading) {
      return suspenseFallback;
    }
    return <div data-testid="count">{value}</div>;
  };

  const {getByTestId} = render(<App />);

  expect(getByTestId('loading')).not.toBeUndefined();
  await act(() => delay(20));
  expect(getByTestId('error')).not.toBeUndefined();
});

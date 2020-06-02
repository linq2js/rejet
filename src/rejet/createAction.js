import ActionContext from './ActionContext';
import createPublisher from './createPublisher';
import globalScope from './globalScope';
import createCancellationError from './createCancellationError';

const noop = () => {};

export default function createAction() {
  const [
    // options
    {repeatCondition, restartOnFailure} = {},
    body = noop,
  ] =
    arguments.length > 1
      ? // createAction(options, body)
        arguments
      : // createAction(body)
        [undefined, arguments[0]];

  const {subscribe, dispatch} = createPublisher();
  const canRepeat =
    typeof repeatCondition === 'function'
      ? ({get}, ...args) => repeatCondition({get}, ...args)
      : () => repeatCondition;
  const start = (context, args) => {
    const currentScope = globalScope();

    return globalScope(
      () => {
        let isAsync = false,
          hasError = false,
          result,
          cancelPromiseReject;
        try {
          result = body(context, ...args);
          // is promise like
          if (result && typeof result.then === 'function') {
            isAsync = true;
            return Object.assign(
              Promise.race([
                result,
                new Promise((resolve, reject) => {
                  cancelPromiseReject = reject;
                }),
              ])
                .then((asyncResult) => {
                  try {
                    return asyncResult;
                  } finally {
                    context.success(result);
                    dispatch(asyncResult);
                  }
                })
                .finally(() => {
                  context.done();
                  context.dispose();
                }),
              {
                result: undefined,
                isCancelled: context.isCancelled,
                cancel() {
                  if (cancelPromiseReject) {
                    cancelPromiseReject(createCancellationError());
                  }
                  context.__cancel();
                },
              },
            );
          }
          context.success(result);
          return result;
        } catch (error) {
          hasError = true;
          context.error(error);
        } finally {
          if (!isAsync) {
            if (!hasError) {
              dispatch(result);
            }
            context.done();
            context.dispose();
          }
        }
      },
      {
        initial: {
          actionExecutionCount: (currentScope.actionExecutionCount || 0) + 1,
          stateChangeQueue: currentScope.stateChangeQueue || new Map(),
        },
        onFinally(scope) {
          scope.actionExecutionCount--;
          if (!scope.actionExecutionCount) {
            const queue = scope.stateChangeQueue;
            delete scope.stateChangeQueue;
            // do updates
            for (const [, value] of queue) {
              value();
            }
          }
        },
      },
    );
  };

  const tryRestartOnFailureIfPossible = (context, args) => {
    try {
      const result = start(context, args);
      if (result && typeof result.then === 'function') {
        return Object.assign(
          result.then(
            (payload) => {
              context.checkCancellationStatus();
              if (canRepeat(context, ...args)) {
                return tryRestartOnFailureIfPossible(context, args);
              }
              return payload;
            },
            (e) => {
              if (e.isCancellationError) {
                return;
              }
              context.checkCancellationStatus();
              tryRestartOnFailureIfPossible(context, args);
            },
          ),
          {
            isCancelled: result.isCancelled,
            cancel: result.cancel,
          },
        );
      }
      context.checkCancellationStatus();
      if (canRepeat(context, ...args)) {
        tryRestartOnFailureIfPossible(context, args);
        return;
      }
      return result;
    } catch (e) {
      if (e && e.isCancellationError) {
        return;
      }
      context.checkCancellationStatus();
      if (restartOnFailure) {
        return tryRestartOnFailureIfPossible(context, args);
      }
      throw e;
    }
  };

  const wrapper = (...args) => {
    const context = new ActionContext();
    return tryRestartOnFailureIfPossible(context, args);
  };

  return Object.assign(wrapper, {
    subscribe,
  });
}

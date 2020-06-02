export default function createPublisher() {
  const allChannels = {};

  function getChannel(name = '') {
    let channel = allChannels[name];
    if (!channel) {
      const subscriptions = new Set();
      allChannels[name] = channel = {
        clear() {
          subscriptions.clear();
        },
        dispatch(payload) {
          for (const subscription of subscriptions) {
            subscription(payload);
          }
        },
        subscribe(subscription) {
          subscriptions.add(subscription);
          return () => {
            subscriptions.delete(subscription);
          };
        },
      };
    }
    return channel;
  }

  return {
    clear() {
      Object.values(allChannels).forEach((channel) => channel.clear());
    },
    // copy all methods of default channel
    ...getChannel(),
    channel(name) {
      return getChannel(name);
    },
  };
}

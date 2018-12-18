const withFilter = require("graphql-subscriptions").withFilter;
const PubSub = require("graphql-subscriptions").PubSub;
const { of } = require("rxjs");
const { mergeMap, catchError, map } = require("rxjs/operators");
const broker = require("../../broker/BrokerFactory")();

let pubsub = new PubSub();

function getReponseFromBackEnd$(response) {
  return of(response).pipe(
    map(resp => {
      if (resp.result.code != 200) {
        const err = new Error();
        err.name = "Error";
        err.message = resp.result.error;
        // this[Symbol()] = resp.result.error;
        Error.captureStackTrace(err, "Error");
        throw err;
      }
      return resp.data;
    })
  );
}

module.exports = {
  Query: {
    getDeviceDetail(root, args, context) {
      return context.broker
        .forwardAndGetReply$(
          "Device",
          "gateway.graphql.query.getDeviceDetail",
          { root, args, jwt: context.encodedToken },
          500
        )
        .pipe(mergeMap(response => getReponseFromBackEnd$(response)))
        .toPromise();
    },
    getDeviceAlarms(root, args, context) {
      return context.broker
        .forwardAndGetReply$(
          "Device",
          "gateway.graphql.query.getDeviceAlarms",
          { root, args, jwt: context.encodedToken },
          500
        )
        .pipe(mergeMap(response => getReponseFromBackEnd$(response)))
        .toPromise();
    },
    getRamAvgInRangeOfTime(root, args, context) {
      return context.broker
        .forwardAndGetReply$(
          "Device",
          "gateway.graphql.query.getRamAvgInRangeOfTime",
          { root, args, jwt: context.encodedToken },
          500
        )
        .pipe(mergeMap(response => getReponseFromBackEnd$(response)))
        .toPromise();
    },
    getSdAvgInRangeOfTime(root, args, context) {
      return context.broker
        .forwardAndGetReply$(
          "Device",
          "gateway.graphql.query.getSdAvgInRangeOfTime",
          { root, args, jwt: context.encodedToken },
          500
        )
        .pipe(mergeMap(response => getReponseFromBackEnd$(response)))
        .toPromise();
    },
    getCpuAvgInRangeOfTime(root, args, context) {
      return context.broker
        .forwardAndGetReply$(
          "Device",
          "gateway.graphql.query.getCpuAvgInRangeOfTime",
          { root, args, jwt: context.encodedToken },
          500
        )
        .pipe(mergeMap(response => getReponseFromBackEnd$(response)))
        .toPromise();
    },
    getVoltageInRangeOfTime(root, args, context) {
      return context.broker
        .forwardAndGetReply$(
          "Device",
          "gateway.graphql.query.getVoltageInRangeOfTime",
          { root, args, jwt: context.encodedToken },
          500
        )
        .pipe(mergeMap(response => getReponseFromBackEnd$(response)))
        .toPromise();
    },
    getDevices(root, args, context) {
      return context.broker
        .forwardAndGetReply$(
          "Device",
          "gateway.graphql.query.getDevices",
          { root, args, jwt: context.encodedToken },
          500
        )
        .pipe(mergeMap(response => getReponseFromBackEnd$(response)))
        .toPromise();
    },
    getDeviceTableSize(root, args, context) {
      return context.broker
        .forwardAndGetReply$(
          "Device",
          "gateway.graphql.query.getDeviceTableSize",
          { root, args, jwt: context.encodedToken },
          500
        )
        .pipe(mergeMap(response => getReponseFromBackEnd$(response)))
        .toPromise();
    },
    getAlarmTableSize(root, args, context) {
      return context.broker
        .forwardAndGetReply$(
          "Device",
          "gateway.graphql.query.getAlarmTableSize",
          { root, args, jwt: context.encodedToken },
          500
        )
        .pipe(mergeMap(response => getReponseFromBackEnd$(response)))
        .toPromise();
    }
  },
  Subscription: {
    DeviceVolumesStateReportedEvent: {
      subscribe: withFilter(
        (payload, variables, context, info) =>
          pubsub.asyncIterator("DeviceVolumesStateReportedEvent"),
        (payload, variables, context, info) =>
          variables.ids.filter(
            id => id == payload.DeviceVolumesStateReportedEvent.id
          )[0] !== undefined
      )
    },
    DeviceDisplayStateReportedEvent: {
      subscribe: withFilter(
        (payload, variables, context, info) =>
          pubsub.asyncIterator("DeviceDisplayStateReportedEvent"),
        (payload, variables, context, info) =>
          payload.DeviceDisplayStateReportedEvent.id === variables.id
      )
    },
    DeviceDeviceStateReportedEvent: {
      subscribe: withFilter(
        (payload, variables, context, info) =>
          pubsub.asyncIterator("DeviceDeviceStateReportedEvent"),
        (payload, variables, context, info) =>
          variables.ids.filter(
            id => id == payload.DeviceDeviceStateReportedEvent.id
          )[0] !== undefined
      )
    },
    DeviceSystemStateReportedEvent: {
      subscribe: withFilter(
        (payload, variables, context, info) =>
          pubsub.asyncIterator("DeviceSystemStateReportedEvent"),
        (payload, variables, context, info) =>
          variables.ids.filter(
            id => id == payload.DeviceSystemStateReportedEvent.id
          )[0] !== undefined
      )
    },
    DeviceLowestVoltageReportedEvent: {
      subscribe: withFilter(
        (payload, variables, context, info) =>
          pubsub.asyncIterator("DeviceLowestVoltageReportedEvent"),
        (payload, variables, context, info) =>
          payload.DeviceLowestVoltageReportedEvent.id === variables.id
      )
    },
    DeviceHighestVoltageReportedEvent: {
      subscribe: withFilter(
        (payload, variables, context, info) =>
          pubsub.asyncIterator("DeviceHighestVoltageReportedEvent"),
        (payload, variables, context, info) =>
          payload.DeviceHighestVoltageReportedEvent.id === variables.id
      )
    },
    DeviceNetworkStateReportedEvent: {
      subscribe: withFilter(
        (payload, variables, context, info) =>
          pubsub.asyncIterator("DeviceNetworkStateReportedEvent"),
        (payload, variables, context, info) =>
          payload.DeviceNetworkStateReportedEvent.id === variables.id
      )
    },
    DeviceModemStateReportedEvent: {
      subscribe: withFilter(
        (payload, variables, context, info) =>
          pubsub.asyncIterator("DeviceModemStateReportedEvent"),
        (payload, variables, context, info) =>
          payload.DeviceModemStateReportedEvent.id === variables.id
      )
    },
    DeviceMainAppStateReportedEvent: {
      subscribe: withFilter(
        (payload, variables, context, info) =>
          pubsub.asyncIterator("DeviceMainAppStateReportedEvent"),
        (payload, variables, context, info) =>
          payload.DeviceMainAppStateReportedEvent.id === variables.id
      )
    },
    DeviceConnectedEvent: {
      subscribe: withFilter(
        (payload, variables, context, info) =>
          pubsub.asyncIterator("DeviceConnectedEvent"),
        (payload, variables, context, info) =>
          variables.ids.filter(
            id => id == payload.DeviceConnectedEvent.id
          )[0] !== undefined
      )
    },
    DeviceDisconnectedEvent: {
      subscribe: withFilter(
        (payload, variables, context, info) =>
          pubsub.asyncIterator("DeviceDisconnectedEvent"),
        (payload, variables, context, info) =>
          variables.ids.filter(
            id => id == payload.DeviceDisconnectedEvent.id
          )[0] !== undefined
      )
    },
    DeviceTemperatureAlarmActivatedEvent: {
      subscribe: withFilter(
        (payload, variables, context, info) =>
          pubsub.asyncIterator("DeviceTemperatureAlarmActivatedEvent"),
        (payload, variables, context, info) =>
          payload.DeviceTemperatureAlarmActivatedEvent.id === variables.id
      )
    },
    DeviceTemperatureAlarmDeactivatedEvent: {
      subscribe: withFilter(
        (payload, variables, context, info) =>
          pubsub.asyncIterator("DeviceTemperatureAlarmDeactivatedEvent"),
        (payload, variables, context, info) =>
          payload.DeviceTemperatureAlarmDeactivatedEvent.id === variables.id
      )
    }
  }
};

//// SUBSCRIPTIONS SOURCES ////

const eventDescriptors = [
  {
    backendEventName: "DeviceTemperatureAlarmActivatedEvent",
    gqlSubscriptionName: "DeviceTemperatureAlarmActivatedEvent"
  },
  {
    backendEventName: "DeviceTemperatureAlarmDeactivatedEvent",
    gqlSubscriptionName: "DeviceTemperatureAlarmDeactivatedEvent"
  },
  {
    backendEventName: "DeviceVolumesStateReportedEvent",
    gqlSubscriptionName: "DeviceVolumesStateReportedEvent"
  },
  {
    backendEventName: "DeviceDisplayStateReportedEvent",
    gqlSubscriptionName: "DeviceDisplayStateReportedEvent"
  },
  {
    backendEventName: "DeviceDeviceStateReportedEvent",
    gqlSubscriptionName: "DeviceDeviceStateReportedEvent"
  },
  {
    backendEventName: "DeviceSystemStateReportedEvent",
    gqlSubscriptionName: "DeviceSystemStateReportedEvent"
  },
  {
    backendEventName: "DeviceLowestVoltageReportedEvent",
    gqlSubscriptionName: "DeviceLowestVoltageReportedEvent"
  },
  {
    backendEventName: "DeviceLowestVoltageReportedEvent",
    gqlSubscriptionName: "DeviceLowestVoltageReportedEvent"
  },
  {
    backendEventName: "DeviceHighestVoltageReportedEvent",
    gqlSubscriptionName: "DeviceHighestVoltageReportedEvent"
  },
  {
    backendEventName: "DeviceNetworkStateReportedEvent",
    gqlSubscriptionName: "DeviceNetworkStateReportedEvent"
  },
  {
    backendEventName: "DeviceModemStateReportedEvent",
    gqlSubscriptionName: "DeviceModemStateReportedEvent"
  },
  {
    backendEventName: "DeviceMainAppStateReportedEvent",
    gqlSubscriptionName: "DeviceMainAppStateReportedEvent"
  },
  {
    backendEventName: "DeviceConnectedEvent",
    gqlSubscriptionName: "DeviceConnectedEvent"
  },
  {
    backendEventName: "DeviceDisconnected",
    gqlSubscriptionName: "DeviceDisconnected"
  },
  {
    backendEventName: "NotifyNewDeviceEvent",
    gqlSubscriptionName: "NotifyNewDeviceEvent"
  }
];

/**
 * Connects every backend event to the right GQL subscription
 */
eventDescriptors.forEach(descriptor => {
  broker.getMaterializedViewsUpdates$([descriptor.backendEventName]).subscribe(
    evt => {
      if (descriptor.onEvent) {
        descriptor.onEvent(evt, descriptor);
      }
      const payload = {};
      payload[descriptor.gqlSubscriptionName] = descriptor.dataExtractor
        ? descriptor.dataExtractor(evt)
        : evt.data;
      pubsub.publish(descriptor.gqlSubscriptionName, payload);
    },
    error => {
      if (descriptor.onError) {
        descriptor.onError(error, descriptor);
      }
      console.error(`Error listening ${descriptor.gqlSubscriptionName}`, error);
    },
    () => {}
  );
});

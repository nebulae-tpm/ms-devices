const withFilter = require('graphql-subscriptions').withFilter;
const TestToDelete = require('../../TestToDelete')();
const Rx = require('rxjs');
module.exports = {
  Query: {
    getDeviceDetail(root, args, context) {
      return context.broker
        .forwardAndGetReply$(
          'Device',
          'gateway.graphql.query.getDeviceDetail',
          { root, args, jwt: context.encodedToken },
          500
        )
        .toPromise();
    },
    getRamAvgInRangeOfTime(root, args, context) {
      return context.broker.forwardAndGetReply$(
        'Device',
        'gateway.graphql.query.getRamAvgInRangeOfTime',
        { root, args, jwt: context.encodedToken },
        500
      )
      .toPromise();
    },
    getDevices(root, args, context) {
      return context.broker
        .forwardAndGetReply$(
          'Device',
          'gateway.graphql.query.getDevices',
          { root, args, jwt: context.encodedToken },
          500
        )
        .toPromise();
    },
    getDeviceTableSize(root, args, context) {
      return context.broker
        .forwardAndGetReply$(
          'Device',
          'gateway.graphql.query.getDeviceTableSize',
          { root, args, jwt: context.encodedToken },
          500
        )
        .toPromise();
    }
  },
  Subscription: {
    DeviceVolumesStateReportedEvent: {
      subscribe: withFilter(
        (payload, variables, context, info) => {
          return TestToDelete.getPubSub().asyncIterator(
            'DeviceVolumesStateReportedEvent'
          );
        },
        (payload, variables, context, info) => {
          return payload.DeviceVolumesStateReportedEvent.id === variables.id;
        }
      )
    },
    DeviceDisplayStateReportedEvent: {
      subscribe: withFilter(
        (payload, variables, context, info) => {
          return TestToDelete.getPubSub().asyncIterator(
            'DeviceDisplayStateReportedEvent'
          );
        },
        (payload, variables, context, info) => {
          return payload.DeviceDisplayStateReportedEvent.id === variables.id;
        }
      )
    },
    DeviceDeviceStateReportedEvent: {
      subscribe: withFilter(
        (payload, variables, context, info) => {
          return TestToDelete.getPubSub().asyncIterator(
            'DeviceDeviceStateReportedEvent'
          );
        },
        (payload, variables, context, info) => {
          return payload.DeviceDeviceStateReportedEvent.id === variables.id;
        }
      )
    },
    DeviceSystemStateReportedEvent: {
      subscribe: withFilter(
        (payload, variables, context, info) => {
          return TestToDelete.getPubSub().asyncIterator(
            'DeviceSystemStateReportedEvent'
          );
        },
        (payload, variables, context, info) => {
          return payload.DeviceSystemStateReportedEvent.id === variables.id;
        }
      )
    },
    DeviceLowestVoltageReportedEvent: {
      subscribe: withFilter(
        (payload, variables, context, info) => {
          return TestToDelete.getPubSub().asyncIterator(
            'DeviceLowestVoltageReportedEvent'
          );
        },
        (payload, variables, context, info) => {
          return payload.DeviceLowestVoltageReportedEvent.id === variables.id;
        }
      )
    },
    DeviceHighestVoltageReportedEvent: {
      subscribe: withFilter(
        (payload, variables, context, info) => {
          return TestToDelete.getPubSub().asyncIterator(
            'DeviceHighestVoltageReportedEvent'
          );
        },
        (payload, variables, context, info) => {
          return payload.DeviceHighestVoltageReportedEvent.id === variables.id;
        }
      )
    },
    DeviceNetworkStateReportedEvent: {
      subscribe: withFilter(
        (payload, variables, context, info) => {
          return TestToDelete.getPubSub().asyncIterator(
            'DeviceNetworkStateReportedEvent'
          );
        },
        (payload, variables, context, info) => {
          return payload.DeviceNetworkStateReportedEvent.id === variables.id;
        }
      )
    },
    DeviceModemStateReportedEvent: {
      subscribe: withFilter(
        (payload, variables, context, info) => {
          return TestToDelete.getPubSub().asyncIterator(
            'DeviceModemStateReportedEvent'
          );
        },
        (payload, variables, context, info) => {
          return payload.DeviceModemStateReportedEvent.id === variables.id;
        }
      )
    },
    DeviceMainAppStateReportedEvent: {
      subscribe: withFilter(
        (payload, variables, context, info) => {
          return TestToDelete.getPubSub().asyncIterator(
            'DeviceMainAppStateReportedEvent'
          );
        },
        (payload, variables, context, info) => {
          return payload.DeviceMainAppStateReportedEvent.id === variables.id;
        }
      )
    }
  }
};

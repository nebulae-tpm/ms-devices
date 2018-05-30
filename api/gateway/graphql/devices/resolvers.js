const withFilter = require('graphql-subscriptions').withFilter;
const PubSub = require('graphql-subscriptions').PubSub;
const Rx = require('rxjs');
const broker = require('../../broker/BrokerFactory')();

let pubsub = new PubSub();
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
    getDeviceAlarms(root, args, context) {
      return context.broker
        .forwardAndGetReply$(
          'Device',
          'gateway.graphql.query.getDeviceAlarms',
          { root, args, jwt: context.encodedToken },
          500
        )
        .toPromise();
    },
    getRamAvgInRangeOfTime(root, args, context) {
      return context.broker
        .forwardAndGetReply$(
          'Device',
          'gateway.graphql.query.getRamAvgInRangeOfTime',
          { root, args, jwt: context.encodedToken },
          500
        )
        .toPromise();
    },
    getVolumeAvgInRangeOfTime(root, args, context) {
      return context.broker
        .forwardAndGetReply$(
          'Device',
          'gateway.graphql.query.getVolumeAvgInRangeOfTime',
          { root, args, jwt: context.encodedToken },
          500
        )
        .toPromise();
    },
    getCpuAvgInRangeOfTime(root, args, context) {
      return context.broker
        .forwardAndGetReply$(
          'Device',
          'gateway.graphql.query.getCpuAvgInRangeOfTime',
          { root, args, jwt: context.encodedToken },
          500
        )
        .toPromise();
    },
    getVoltageInRangeOfTime(root, args, context) {
      return context.broker
        .forwardAndGetReply$(
          'Device',
          'gateway.graphql.query.getVoltageInRangeOfTime',
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
          return pubsub.asyncIterator(
            'DeviceVolumesStateReportedEvent'
          );
        },
        (payload, variables, context, info) => {
          return variables.ids.filter(id => id == payload.DeviceVolumesStateReportedEvent.id)[0] !== undefined;
        }
      )
    },
    DeviceDisplayStateReportedEvent: {
      subscribe: withFilter(
        (payload, variables, context, info) => {
          return pubsub.asyncIterator(
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
          return pubsub.asyncIterator(
            'DeviceDeviceStateReportedEvent'
          );
        },
        (payload, variables, context, info) => {
          return variables.ids.filter(id => id == payload.DeviceDeviceStateReportedEvent.id)[0] !== undefined;
        }
      )
    },
    DeviceSystemStateReportedEvent: {
      subscribe: withFilter(
        (payload, variables, context, info) => {
          return pubsub.asyncIterator(
            'DeviceSystemStateReportedEvent'
          );
        },
        (payload, variables, context, info) => {
          return variables.ids.filter(id => id == payload.DeviceSystemStateReportedEvent.id)[0] !== undefined;
        }
      )
    },
    DeviceLowestVoltageReportedEvent: {
      subscribe: withFilter(
        (payload, variables, context, info) => {
          return pubsub.asyncIterator(
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
          return pubsub.asyncIterator(
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
          return pubsub.asyncIterator(
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
          return pubsub.asyncIterator(
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
          return pubsub.asyncIterator(
            'DeviceMainAppStateReportedEvent'
          );
        },
        (payload, variables, context, info) => {
          return payload.DeviceMainAppStateReportedEvent.id === variables.id;
        }
      )
    },
    DeviceConnectedEvent: {
      subscribe: withFilter(
        (payload, variables, context, info) => {
          return pubsub.asyncIterator(
            'DeviceConnectedEvent'
          );
        },
        (payload, variables, context, info) => {
          return variables.ids.filter(id => id == payload.DeviceConnectedEvent.id)[0] !== undefined;
        }
      )
    },
    DeviceDisconnectedEvent: {
      subscribe: withFilter(
        (payload, variables, context, info) => {
          return pubsub.asyncIterator(
            'DeviceDisconnectedEvent'
          );
        },
        (payload, variables, context, info) => {
          return variables.ids.filter(id => id == payload.DeviceDisconnectedEvent.id)[0] !== undefined;
        }
      )
    }
  }
};

broker
  .getMaterializedViewsUpdates$(['DeviceVolumesStateReportedEvent'])
  .subscribe(
    evt => {
      console.log('Se escucha evento: ', evt);
      pubsub.publish('DeviceVolumesStateReportedEvent', {
        DeviceVolumesStateReportedEvent: evt.data
      });
    },
    error =>
      console.error('Error listening DeviceVolumesStateReportedEvent', error),
    () => console.log('DeviceVolumesStateReportedEvent listener STOPPED')
  );

broker
  .getMaterializedViewsUpdates$(['DeviceDisplayStateReportedEvent'])
  .subscribe(
    evt => {
      pubsub.publish('DeviceDisplayStateReportedEvent', {
        DeviceDisplayStateReportedEvent: evt.data
      });
    },
    error =>
      console.error('Error listening DeviceDisplayStateReportedEvent', error),
    () => console.log('DeviceDisplayStateReportedEvent listener STOPPED')
  );
broker
  .getMaterializedViewsUpdates$(['DeviceDeviceStateReportedEvent'])
  .subscribe(
    evt => {
      pubsub.publish('DeviceDeviceStateReportedEvent', {
        DeviceDeviceStateReportedEvent: evt.data
      });
    },
    error =>
      console.error('Error listening DeviceDeviceStateReportedEvent', error),
    () => console.log('DeviceDeviceStateReportedEvent listener STOPPED')
  );
broker
  .getMaterializedViewsUpdates$(['DeviceSystemStateReportedEvent'])
  .subscribe(
  evt => {
    console.log('Pasa por aqui');
      pubsub.publish('DeviceSystemStateReportedEvent', {
        DeviceSystemStateReportedEvent: evt.data
      });
    },
    error =>
      console.error('Error listening DeviceSystemStateReportedEvent', error),
    () => console.log('DeviceSystemStateReportedEvent listener STOPPED')
  );
broker
  .getMaterializedViewsUpdates$(['DeviceLowestVoltageReportedEvent'])
  .subscribe(
    evt => {
      pubsub.publish('DeviceLowestVoltageReportedEvent', {
        DeviceLowestVoltageReportedEvent: evt.data
      });
    },
    error =>
      console.error('Error listening DeviceLowestVoltageReportedEvent', error),
    () => console.log('DeviceLowestVoltageReportedEvent listener STOPPED')
  );

broker
  .getMaterializedViewsUpdates$(['DeviceHighestVoltageReportedEvent'])
  .subscribe(
    evt => {
      pubsub.publish('DeviceHighestVoltageReportedEvent', {
        DeviceHighestVoltageReportedEvent: evt.data
      });
    },
    error =>
      console.error('Error listening DeviceHighestVoltageReportedEvent', error),
    () => console.log('DeviceHighestVoltageReportedEvent listener STOPPED')
  );
broker
  .getMaterializedViewsUpdates$(['DeviceNetworkStateReportedEvent'])
  .subscribe(
    evt => {
      pubsub.publish('DeviceNetworkStateReportedEvent', {
        DeviceNetworkStateReportedEvent: evt.data
      });
    },
    error =>
      console.error('Error listening DeviceNetworkStateReportedEvent', error),
    () => console.log('DeviceNetworkStateReportedEvent listener STOPPED')
  );
broker
  .getMaterializedViewsUpdates$(['DeviceModemStateReportedEvent'])
  .subscribe(
    evt => {
      pubsub.publish('DeviceModemStateReportedEvent', {
        DeviceModemStateReportedEvent: evt.data
      });
    },
    error =>
      console.error('Error listening DeviceModemStateReportedEvent', error),
    () => console.log('DeviceModemStateReportedEvent listener STOPPED')
  );
broker
  .getMaterializedViewsUpdates$(['DeviceMainAppStateReportedEvent'])
  .subscribe(
    evt => {
      pubsub.publish('DeviceMainAppStateReportedEvent', {
        DeviceMainAppStateReportedEvent: evt.data
      });
    },
    error =>
      console.error('Error listening DeviceMainAppStateReportedEvent', error),
    () => console.log('DeviceMainAppStateReportedEvent listener STOPPED')
  );

broker
  .getMaterializedViewsUpdates$(['DeviceConnectedEvent'])
  .subscribe(
    evt => {
      pubsub.publish('DeviceConnectedEvent', {
        DeviceConnectedEvent: evt.data
      });
    },
    error =>
      console.error('Error listening DeviceConnectedEvent', error),
    () => console.log('DeviceConnectedEvent listener STOPPED')
);
  
broker
  .getMaterializedViewsUpdates$(['DeviceDisconnected'])
  .subscribe(
    evt => {
      pubsub.publish('DeviceDisconnected', {
        DeviceDisconnected: evt.data
      });
    },
    error =>
      console.error('Error listening DeviceDisconnected', error),
    () => console.log('DeviceDisconnected listener STOPPED')
);
  
broker
  .getMaterializedViewsUpdates$(['NotifyNewDeviceEvent'])
  .subscribe(
    evt => {
      pubsub.publish('NotifyNewDeviceEvent', {
        NotifyNewDeviceEvent: evt.data
      });
    },
    error =>
      console.error('Error listening NotifyNewDeviceEvent', error),
    () => console.log('NotifyNewDeviceEvent listener STOPPED')
);

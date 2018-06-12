'use strict';

const devices = require('../../domain/Devices')();
const broker = require('../../tools/broker/BrokerFactory')();
const Rx = require('rxjs');
const jsonwebtoken = require('jsonwebtoken');
const jwtPublicKey = process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n');

let instance;

class GraphQlService {
  constructor() {
    this.functionMap = this.generateFunctionMap();
    this.subscriptions = [];
  }

  generateFunctionMap() {
    return {
      'gateway.graphql.query.getDeviceDetail': {
        fn: devices.getDeviceDetail,
        obj: devices
      },
      'gateway.graphql.query.getDevices': {
        fn: devices.getDevices,
        obj: devices
      },
      'gateway.graphql.query.getDeviceTableSize': {
        fn: devices.getDeviceTableSize,
        obj: devices
      },
      'gateway.graphql.query.getAlarmTableSize': {
        fn: devices.getAlarmTableSize,
        obj: devices
      },
      'gateway.graphql.query.getRamAvgInRangeOfTime': {
        fn: devices.getRamAvgInRangeOfTime,
        obj: devices
      },
      'gateway.graphql.query.getSdAvgInRangeOfTime': {
        fn: devices.getSdAvgInRangeOfTime,
        obj: devices
      },
      'gateway.graphql.query.getCpuAvgInRangeOfTime': {
        fn: devices.getCpuAvgInRangeOfTime,
        obj: devices
      },
      'gateway.graphql.query.getVoltageInRangeOfTime': {
        fn: devices.getVoltageInRangeOfTime,
        obj: devices
      },
      'gateway.graphql.query.getDeviceAlarms': {
        fn: devices.getDeviceAlarms,
        obj: devices
      }
    };
  }

  start$() {
    const onErrorHandler = error => {
      console.error('Error handling  GraphQl incoming event', error);
      process.exit(1);
    };

    //default onComplete handler
    const onCompleteHandler = () => {
      () => console.log('GraphQlService incoming event subscription completed');
    };
    console.log('GraphQl Service starting ...');

    return Rx.Observable.from([
      {
        aggregateType: 'Device',
        messageType: 'gateway.graphql.query.getDeviceDetail',
        onErrorHandler,
        onCompleteHandler
      },
      {
        aggregateType: 'Device',
        messageType: 'gateway.graphql.query.getDevices',
        onErrorHandler,
        onCompleteHandler
      },
      {
        aggregateType: 'Device',
        messageType: 'gateway.graphql.query.getDeviceTableSize',
        onErrorHandler,
        onCompleteHandler
      },
      {
        aggregateType: 'Device',
        messageType: 'gateway.graphql.query.getAlarmTableSize',
        onErrorHandler,
        onCompleteHandler
      },
      {
        aggregateType: 'Device',
        messageType: 'gateway.graphql.query.getRamAvgInRangeOfTime',
        onErrorHandler,
        onCompleteHandler
      },
      {
        aggregateType: 'Device',
        messageType: 'gateway.graphql.query.getSdAvgInRangeOfTime',
        onErrorHandler,
        onCompleteHandler
      },
      {
        aggregateType: 'Device',
        messageType: 'gateway.graphql.query.getCpuAvgInRangeOfTime',
        onErrorHandler,
        onCompleteHandler
      },
      {
        aggregateType: 'Device',
        messageType: 'gateway.graphql.query.getVoltageInRangeOfTime',
        onErrorHandler,
        onCompleteHandler
      },
      {
        aggregateType: 'Device',
        messageType: 'gateway.graphql.query.getDeviceAlarms',
        onErrorHandler,
        onCompleteHandler
      }
    ]).map(params => this.subscribeEventHandler(params));
  }

  subscribeEventHandler({
    aggregateType,
    messageType,
    onErrorHandler,
    onCompleteHandler
  }) {
    const handler = this.functionMap[messageType];
    const subscription = broker
      .getMessageListener$([aggregateType], [messageType])
      //decode and verify the jwt token
      .map(message => {
        return {
          authToken: jsonwebtoken.verify(message.data.jwt, jwtPublicKey),
          message
        };
      })
      //ROUTE MESSAGE TO RESOLVER
      .mergeMap(({ authToken, message }) =>
        handler.fn
          .call(handler.obj, message.data, authToken)
          // .do(r => console.log("############################", r))
          .map(response => {
            return {
              response,
              correlationId: message.id,
              replyTo: message.attributes.replyTo
            };
          })
      )
      //send response back if neccesary
      .mergeMap(({ response, correlationId, replyTo }) => {
        if (replyTo) {
          return broker.send$(
            replyTo,
            'gateway.graphql.Query.response',
            response,
            { correlationId }
          );
        } else {
          return Rx.Observable.of(undefined);
        }
      })
      .subscribe(
        msg => {
          console.log(`GraphQlService process: ${msg}`);
        },
        onErrorHandler,
        onCompleteHandler
      );
    this.subscriptions.push({
      aggregateType,
      messageType,
      handlerName: handler.fn.name,
      subscription
    });
    return {
      aggregateType,
      messageType,
      handlerName: `${handler.obj.name}.${handler.fn.name}`
    };
  }

  stop$() {
    return Rx.Observable.from(this.subscriptions).map(subscription => {
      subscription.subscription.unsubscribe();
      return `Unsubscribed: aggregateType=${aggregateType}, eventType=${eventType}, handlerName=${handlerName}`;
    });
  }
}

module.exports = () => {
  if (!instance) {
    instance = new GraphQlService();
    console.log('NEW instance GraphQlService !!');
  }
  return instance;
};

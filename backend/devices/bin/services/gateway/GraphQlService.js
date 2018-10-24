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

    return Rx.Observable.from(this.getSubscriptionDescriptors())
    .map( aggregateEvent => ({ ...aggregateEvent, onErrorHandler, onCompleteHandler}) )
    .map(params => this.subscribeEventHandler(params));
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
      .mergeMap(message => this.verifyRequest$(message))
      .mergeMap(request => ( request.failedValidations.length > 0)
        ? Rx.Observable.of(request.errorResponse)
        : Rx.Observable.of(request)
          //ROUTE MESSAGE TO RESOLVER
          .mergeMap(({ authToken, message }) =>
            handler.fn
              .call(handler.obj, message.data, authToken)
              .map(response => ({ response, correlationId: message.id, replyTo: message.attributes.replyTo }))
          )
      )    
      .mergeMap(msg => this.sendResponseBack$(msg))
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

     /**
   * Verify the message if the request is valid.
   * @param {any} request request message
   * @returns { Rx.Observable< []{request: any, failedValidations: [] }>}  Observable object that containg the original request and the failed validations
   */
  verifyRequest$(request) {
    return Rx.Observable.of(request)
      //decode and verify the jwt token
      .mergeMap(message =>
        Rx.Observable.of(message)
          .map(message => ({ authToken: jsonwebtoken.verify(message.data.jwt, jwtPublicKey), message, failedValidations: [] }))
          .catch(err =>
            devices.errorHandler$(err)
              .map(response => ({
                errorResponse: { response, correlationId: message.id, replyTo: message.attributes.replyTo },
                failedValidations: ['JWT']
              }
              ))
          )
      )
  }

 /**
  * 
  * @param {any} msg Object with data necessary  to send response
  */
 sendResponseBack$(msg) {
  return Rx.Observable.of(msg).mergeMap(
    ({ response, correlationId, replyTo }) =>
      replyTo
        ? broker.send$(replyTo, "gateway.graphql.Query.response", response, {
            correlationId
          })
        : Rx.Observable.of(undefined)
  );
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

getSubscriptionDescriptors(){
  return [
    {
      aggregateType: 'Device',
      messageType: 'gateway.graphql.query.getDeviceDetail'
    },
    {
      aggregateType: 'Device',
      messageType: 'gateway.graphql.query.getDevices'
    },
    {
      aggregateType: 'Device',
      messageType: 'gateway.graphql.query.getDeviceTableSize'
    },
    {
      aggregateType: 'Device',
      messageType: 'gateway.graphql.query.getAlarmTableSize'
    },
    {
      aggregateType: 'Device',
      messageType: 'gateway.graphql.query.getRamAvgInRangeOfTime'
    },
    {
      aggregateType: 'Device',
      messageType: 'gateway.graphql.query.getSdAvgInRangeOfTime'
    },
    {
      aggregateType: 'Device',
      messageType: 'gateway.graphql.query.getCpuAvgInRangeOfTime'
    },
    {
      aggregateType: 'Device',
      messageType: 'gateway.graphql.query.getVoltageInRangeOfTime'
    },
    {
      aggregateType: 'Device',
      messageType: 'gateway.graphql.query.getDeviceAlarms'
    }
  ]
}
}
/**
 * @returns {GraphQlService}
 */
module.exports = () => {
  if (!instance) {
    instance = new GraphQlService();
    console.log('NEW instance GraphQlService !!');
  }
  return instance;
};

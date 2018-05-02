const Rx = require('rxjs');
const deviceEventConsumer = require('../../domain/DeviceEventConsumer')();
const eventSourcing = require('../../tools/EventSourcing')();

/**
 * Singleton instance
 */
let instance;

class EventStoreService {

    constructor() {
        this.functionMap = this.generateFunctionMap();
        this.subscriptions = [];
    }


    /**
     * Starts listening to the EventStore
     * Returns observable that resolves to each subscribe agregate/event
     *    emit value: { aggregateType, eventType, handlerName}
     */
    start$() {
        //default error handler
        const onErrorHandler = (error) => {
            console.error('Error handling  EventStore incoming event', error);
            procces.exit(1);
        };
        //default onComplete handler
        const onCompleteHandler = () => {
            () => console.log('EventStore incoming event subscription completed');
        }
        return Rx.Observable.from([
            { aggregateType: 'Device', eventType: 'DeviceNetworkStateReported', onErrorHandler, onCompleteHandler },
            { aggregateType: 'Device', eventType: 'DeviceModemStateReported', onErrorHandler, onCompleteHandler },
            { aggregateType: 'Device', eventType: 'DeviceVolumesStateReported', onErrorHandler, onCompleteHandler },
            { aggregateType: 'Device', eventType: 'DeviceSystemStateReported', onErrorHandler, onCompleteHandler },
            { aggregateType: 'Device', eventType: 'DeviceDisplayStateReported', onErrorHandler, onCompleteHandler },
            { aggregateType: 'Device', eventType: 'DeviceDeviceStateReported', onErrorHandler, onCompleteHandler },
            { aggregateType: 'Device', eventType: 'DeviceMainAppStateReported', onErrorHandler, onCompleteHandler },            
        ]).map(params => this.subscribeEventHandler(params));
    }

    /**
     * Stops listening to the Event store
     * Returns observable that resolves to each unsubscribed subscription as string     
     */
    stop$() {
        Rx.Observable.from(this.subscriptions)
            .map(subscription => {
                subscription.subscription.unsubscribe();
                return `Unsubscribed: aggregateType=${aggregateType}, eventType=${eventType}, handlerName=${handlerName}`;
            })
    }

    /**
     * Create a subscrition to the event store and returns the subscription info     
     * @param {{aggregateType, eventType, onErrorHandler, onCompleteHandler}} params
     * @return { aggregateType, eventType, handlerName  }
     */
    subscribeEventHandler({ aggregateType, eventType, onErrorHandler, onCompleteHandler }) {
        const handler = this.functionMap[eventType];

        const subscription = eventSourcing.eventStore.getEventListener$(aggregateType)
            .filter(evt => evt.et === eventType)
            .mergeMap(evt => handler.fn.call(handler.obj, evt))
            .subscribe(
                (evt) => console.log(`EventStoreService: ${eventType} process: ${evt}`),
                onErrorHandler,
                onCompleteHandler
            );
        this.subscriptions.push({ aggregateType, eventType, handlerName: handler.fn.name, subscription });
        return { aggregateType, eventType, handlerName: `${handler.obj.name}.${handler.fn.name}` };
    }

    /**
     * Generates a map that assocs each Event with its handler
     */
    generateFunctionMap() {
        return {
            'DeviceNetworkStateReported': { fn: deviceEventConsumer.handleDeviceEventReported$, obj: deviceEventConsumer },
            'DeviceModemStateReported': { fn: deviceEventConsumer.handleDeviceEventReported$, obj: deviceEventConsumer },
            'DeviceVolumesStateReported': { fn: deviceEventConsumer.handleDeviceEventReported$, obj: deviceEventConsumer },
            'DeviceSystemStateRepoted': { fn: deviceEventConsumer.handleDeviceEventReported$, obj: deviceEventConsumer },
            'DeviceDisplayStateReported': { fn: deviceEventConsumer.handleDeviceEventReported$, obj: deviceEventConsumer },
            'DeviceSystemStateReported': { fn: deviceEventConsumer.handleDeviceEventReported$, obj: deviceEventConsumer },
            'DeviceDeviceStateReported': { fn: deviceEventConsumer.handleDeviceEventReported$, obj: deviceEventConsumer },
            'DeviceMainAppStateReported': { fn: deviceEventConsumer.handleDeviceEventReported$, obj: deviceEventConsumer }
        };
    }

}



module.exports = () => {
    if (!instance) {
        instance = new EventStoreService();
        console.log('EventStoreService Singleton created');
    }
    return instance;
};
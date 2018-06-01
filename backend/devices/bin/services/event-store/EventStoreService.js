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
        this.aggregateEventsArray = this.generateAggregateEventsArray();
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
            process.exit(1);
        };
        //default onComplete handler
        const onCompleteHandler = () => {
            () => console.log('EventStore incoming event subscription completed');
        }
        return Rx.Observable.from(this.aggregateEventsArray)
            .map(aggregateEvent => { return { ...aggregateEvent, onErrorHandler, onCompleteHandler } })
            .map(params => this.subscribeEventHandler(params));
    }

    /**
     * Stops listening to the Event store
     * Returns observable that resolves to each unsubscribed subscription as string     
     */
    stop$() {
        return Rx.Observable.from(this.subscriptions)
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
        const subscription =
            //MANDATORY:  AVOIDS ACK REGISTRY DUPLICATIONS
            eventSourcing.eventStore.ensureAcknowledgeRegistry$(aggregateType)
                .mergeMap(() => eventSourcing.eventStore.getEventListener$(aggregateType))
                .filter(evt => evt.et === eventType)
                .mergeMap(evt => Rx.Observable.concat(
                    handler.fn.call(handler.obj, evt),
                    //MANDATORY:  ACKWOWLEDGE THIS EVENT WAS PROCESSED
                    eventSourcing.eventStore.acknowledgeEvent$(evt, 'ms-devices_mbe_devices'),
                ))
                .subscribe(
                    (evt) => console.log(``),
                    onErrorHandler,
                    onCompleteHandler
                );
        this.subscriptions.push({ aggregateType, eventType, handlerName: handler.fn.name, subscription });
        return { aggregateType, eventType, handlerName: `${handler.obj.name}.${handler.fn.name}` };
    }

    /**
    * Starts listening to the EventStore
    * Returns observable that resolves to each subscribe agregate/event
    *    emit value: { aggregateType, eventType, handlerName}
    */
    syncState$() {
        return Rx.Observable.from(this.aggregateEventsArray)
            .concatMap(params => this.subscribeEventRetrieval$(params))
    }



    /**
     * Create a subscrition to the event store and returns the subscription info     
     * @param {{aggregateType, eventType, onErrorHandler, onCompleteHandler}} params
     * @return { aggregateType, eventType, handlerName  }
     */
    subscribeEventRetrieval$({ aggregateType, eventType }) {
        const handler = this.functionMap[eventType];
        //MANDATORY:  AVOIDS ACK REGISTRY DUPLICATIONS
        return eventSourcing.eventStore.ensureAcknowledgeRegistry$(aggregateType)
            .switchMap(() => eventSourcing.eventStore.retrieveUnacknowledgedEvents$(aggregateType, 'ms-devices_mbe_devices'))
            .filter(evt => evt.et === eventType)
            .concatMap(evt => Rx.Observable.concat(
                handler.fn.call(handler.obj, evt),
                //MANDATORY:  ACKWOWLEDGE THIS EVENT WAS PROCESSED
                eventSourcing.eventStore.acknowledgeEvent$(evt, 'ms-devices_mbe_devices')
            ));
    }

    /**
     * Generates a map that assocs each Event with its handler
     */
    generateFunctionMap() {
        return {
            //STATE REPORTS
            'DeviceNetworkStateReported': { fn: deviceEventConsumer.handleDeviceEventReported$, obj: deviceEventConsumer },
            'DeviceModemStateReported': { fn: deviceEventConsumer.handleDeviceEventReported$, obj: deviceEventConsumer },
            'DeviceVolumesStateReported': { fn: deviceEventConsumer.handleDeviceEventReported$, obj: deviceEventConsumer },
            'DeviceSystemStateRepoted': { fn: deviceEventConsumer.handleDeviceEventReported$, obj: deviceEventConsumer },
            'DeviceDisplayStateReported': { fn: deviceEventConsumer.handleDeviceEventReported$, obj: deviceEventConsumer },
            'DeviceSystemStateReported': { fn: deviceEventConsumer.handleDeviceEventReported$, obj: deviceEventConsumer },
            'DeviceDeviceStateReported': { fn: deviceEventConsumer.handleDeviceEventReported$, obj: deviceEventConsumer },
            'DeviceMainAppStateReported': { fn: deviceEventConsumer.handleDeviceEventReported$, obj: deviceEventConsumer },
            'DeviceConnected': { fn: deviceEventConsumer.handleDeviceEventReported$, obj: deviceEventConsumer },
            'DeviceDisconnected': { fn: deviceEventConsumer.handleDeviceEventReported$, obj: deviceEventConsumer },
            //ALARM REPORTS
            'DeviceRamuUsageAlarmActivated': { fn: deviceEventConsumer.handleDeviceAlarmReported$, obj: deviceEventConsumer },
            'DeviceSdUsageAlarmActivated': { fn: deviceEventConsumer.handleDeviceAlarmReported$, obj: deviceEventConsumer },
            'DeviceCpuUsageAlarmActivated': { fn: deviceEventConsumer.handleDeviceAlarmReported$, obj: deviceEventConsumer },
            'DeviceTemperatureAlarmActivated': { fn: deviceEventConsumer.handleDeviceAlarmReported$, obj: deviceEventConsumer },
            'DeviceSdUsageAlarmDeactivated': { fn: deviceEventConsumer.handleDeviceAlarmReported$, obj: deviceEventConsumer },
            'DeviceCpuUsageAlarmDeactivated': { fn: deviceEventConsumer.handleDeviceAlarmReported$, obj: deviceEventConsumer },
            'DeviceTemperatureAlarmDeactivated': { fn: deviceEventConsumer.handleDeviceAlarmReported$, obj: deviceEventConsumer },
            'DeviceRamUsageAlarmDeactivated': { fn: deviceEventConsumer.handleDeviceAlarmReported$, obj: deviceEventConsumer },

        };
    }

    /**
     * Generates a map that assocs each AggretateType withs its events
     */
    generateAggregateEventsArray() {
        return [
        //STATE REPORTS
            { aggregateType: 'Device', eventType: 'DeviceNetworkStateReported' },
            { aggregateType: 'Device', eventType: 'DeviceModemStateReported' },
            { aggregateType: 'Device', eventType: 'DeviceVolumesStateReported' },
            { aggregateType: 'Device', eventType: 'DeviceSystemStateReported' },
            { aggregateType: 'Device', eventType: 'DeviceDisplayStateReported' },
            { aggregateType: 'Device', eventType: 'DeviceDeviceStateReported' },
            { aggregateType: 'Device', eventType: 'DeviceMainAppStateReported' },
            { aggregateType: 'Device', eventType: 'DeviceConnected' },
            { aggregateType: 'Device', eventType: 'DeviceDisconnected' },
            //ALARM REPORTS
            { aggregateType: 'Device', eventType: 'DeviceRamuUsageAlarmActivated' },
            { aggregateType: 'Device', eventType: 'DeviceSdUsageAlarmActivated' },
            { aggregateType: 'Device', eventType: 'DeviceCpuUsageAlarmActivated' },
            { aggregateType: 'Device', eventType: 'DeviceTemperatureAlarmActivated' },
            { aggregateType: 'Device', eventType: 'DeviceRamUsageAlarmDeactivated' },
            { aggregateType: 'Device', eventType: 'DeviceSdUsageAlarmDeactivated' },
            { aggregateType: 'Device', eventType: 'DeviceCpuUsageAlarmDeactivated' },
            { aggregateType: 'Device', eventType: 'DeviceTemperatureAlarmDeactivated' },
        ];
    }

}



module.exports = () => {
    if (!instance) {
        instance = new EventStoreService();
        console.log('EventStoreService Singleton created');
    }
    return instance;
};
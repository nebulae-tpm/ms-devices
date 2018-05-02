'use strict'

const Rx = require('rxjs');

class Event {
    constructor({eventType, eventTypeVersion, aggregateType, aggregateId, data, user, aggregateVersion}) {
        
        /**
         * Event type
         */
        this.et = eventType;
        /**
         * Event type version
         */
        this.etv = eventTypeVersion;        
        /**
         * Aggregate Type
         */
        this.at = aggregateType;
        /**
         * Aggregate ID
         */
        this.aid = aggregateId;         
        /**
         * Event data
         */
        this.data = data;
        /**
         * Responsible user
         */
        this.user = user;
        /**
         * TimeStamp
         */
        this.timestamp = (new Date).getTime();
        /**
         * Aggregate version
         */
        this.av = aggregateVersion;     
    }
}

module.exports = Event;
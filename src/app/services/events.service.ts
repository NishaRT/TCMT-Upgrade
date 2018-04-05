import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';

import { Symbol } from 'rxjs';


@Injectable()
export class EventsService {
    selectedTileEmitter;
    turbineTypeWiseInfoEmitter;
    processResponseEmitter;
    mapOfTurbinesEmitter;
    errorEmitter;
    stopSpinnersEventEmitter;
    confirmationEmitter;
    processResponseMapEmitter;
    globalPollingFunctionEmitter;
    globalPollingFuctionSleepEmitter;
    globalPollingStopFlagEmitter;
    siteChangeEmitter;
    userInfoEmitter;

    constructor() {
        this.selectedTileEmitter = new BehaviorSubject(1);
        this.turbineTypeWiseInfoEmitter = new Subject();
        this.processResponseEmitter = new BehaviorSubject([]);
        this.processResponseMapEmitter = new BehaviorSubject(undefined);
        this.globalPollingFunctionEmitter = new BehaviorSubject(undefined);
        this.mapOfTurbinesEmitter = new BehaviorSubject(undefined);
        this.errorEmitter = new Subject();
        this.stopSpinnersEventEmitter = new BehaviorSubject(null);
        this.confirmationEmitter = new Subject();
        this.globalPollingFuctionSleepEmitter = new BehaviorSubject(undefined);
        this.siteChangeEmitter = new BehaviorSubject(undefined);
        this.userInfoEmitter = new Subject();
        this.globalPollingStopFlagEmitter = new BehaviorSubject(undefined);
    }
}

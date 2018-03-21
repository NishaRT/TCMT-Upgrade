import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';

import { Symbol } from 'rxjs';


@Injectable()
export class EventsService {
    selectedTileEmitter;
    listOfTurbinesEmitter;
    turbineTypeWiseInfoEmitter;
    processResponseEmitter;
    mapOfTurbinesEmitter;
    errorEmitter;
    getVariableStatusWithTimeStampEmitter;
    stopSpinnersEventEmitter;
    confirmationEmitter;

    constructor() {
        this.listOfTurbinesEmitter = new BehaviorSubject(undefined);
        this.selectedTileEmitter = new BehaviorSubject(1);
        this.turbineTypeWiseInfoEmitter = new BehaviorSubject({});
        this.processResponseEmitter = new BehaviorSubject([]);
        this.mapOfTurbinesEmitter = new BehaviorSubject(undefined);
        this.errorEmitter = new Subject();
        this.getVariableStatusWithTimeStampEmitter=new BehaviorSubject(undefined);
        this.stopSpinnersEventEmitter = new BehaviorSubject(null);
        this.confirmationEmitter = new Subject();
    }
}
import { Injectable } from '@angular/core';
import { GlobalStorageService } from './globalstorage.service';
import { EventsService } from './events.service';
import { TimesService } from './times.service';




@Injectable()
export class GEUtils{

    constructor(private globalStorageService : GlobalStorageService,
                private eventsService: EventsService,
                private timesService: TimesService ) {
    
    }

   stopSpinnersForTurbines(turbineList , ngxMap) {
    var self = this;

    turbineList.forEach(function(value) {
        var systemNumber = value.systemNumber;
        ngxMap.get(systemNumber).set("spinner", null);
    });

    return ngxMap;
    }

    throwErrorMessageInUI(errorCode, isTimeoutError){
        var self = this;
        var errorMap = new Map();
        errorMap.set("errorCode",errorCode);
        errorMap.set("errorMessage",self.timesService.getErrorMessage(errorCode, isTimeoutError));
        self.eventsService.errorEmitter.next(errorMap);
    }

}
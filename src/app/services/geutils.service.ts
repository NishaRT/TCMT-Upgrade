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
    // var self = this;

    // turbineList.forEach(function(value) {
    //     var systemNumber = value.systemNumber;
    //     ngxMap.get(systemNumber).set("spinner", null);
    // });

    // return ngxMap;
    }

    throwErrorMessageInUI(errorCode, isTimeoutError, customeMessage, callBackFunction){
        var self = this;
        var errorMap = new Map();
        errorMap.set("errorCode",errorCode);
        if(customeMessage){
            errorMap.set("errorMessage", customeMessage);
        }else {
            errorMap.set("errorMessage",self.getErrorMessage(errorCode, isTimeoutError));
        }
        errorMap.set("callBackFunction", callBackFunction);
        self.eventsService.errorEmitter.next(errorMap);
    }

    getErrorMessage(errorCode, isTimeout){
        var errorTypesMap = this.globalStorageService.getErrorTypesMap();
        var errorMessagesMap = isTimeout ? errorTypesMap.get("timeOutMessages") : errorTypesMap.get("errorCodeMessages");
        var errorMessageText = errorMessagesMap.get(errorCode);
        if(!errorMessageText){
            errorMessageText = "An unidentified error has occured, please try again." + "\n"+ JSON.stringify(errorCode);
        }
        return errorMessageText;
    }

    public refreshWindow(){
        window.location.reload();
    }

    getInvalidBackupFoundMessageforTurbines(validationErrorTurbines) {
        var errorMsg = "No valid backup found for the following turbines: " + '\n';

        for(var i=0; i< validationErrorTurbines.length; i++){
            errorMsg = errorMsg + '\n' + validationErrorTurbines[i];
        }

        errorMsg = errorMsg + '\n' + "Please verify proper backup and try again";
        return errorMsg;
    }

}

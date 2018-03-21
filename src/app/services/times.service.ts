import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Http } from '@angular/http';
import 'rxjs/add/operator/catch';
import { GlobalStorageService } from './globalstorage.service';




@Injectable()
export class TimesService{
    timesMap = new Map();
    errorMessagesMap = new Map();

    constructor(private http: Http, private globalStorageService : GlobalStorageService) {
        this.getTimeOutConfigurationsFromFile();
        this.getErrorMessagesFromFile();
        this.getGeneralConfigurationsFromFile();
    }

     public getIntervalForId(val){
        var interval;
        var timesMap = this.globalStorageService.getTimesMap();
        if(timesMap.get(val)){
            interval = timesMap.get(val).get("interval");
        } else {
            interval = timesMap.get("default").get("interval");
        }
        return interval;
    }

    public getTimeOutBasedOnCallId(finallCall){
        var timeOut;
        if(this.globalStorageService.getTimesMap().get(finallCall)){
          timeOut = this.globalStorageService.getTimesMap().get(finallCall).get("timeOut");
        }

        if(!timeOut){
          timeOut =  this.globalStorageService.getTimesMap().get("default").get("timeOut");
        }

        return timeOut;
      }

    private getTimeOutConfigurationsFromFile(){
    var self = this;
    self.http.get("assets/timeConfigurations.json").map((res:any) => res.json()).subscribe(
        configurations => {
            for(var i=0; i<configurations.length; i++) {
                var detailsMap = new Map();
                var commandObj = configurations[i];
                detailsMap.set("timeOut", commandObj.timeOut);
                detailsMap.set("interval", commandObj.interval);
                self.timesMap.set(commandObj.id, detailsMap);
            }
            self.globalStorageService.setTimesMap(self.timesMap);
        },
        error => console.log(error)
    );
    }

    private getErrorMessagesFromFile(){
    var self = this;
    self.http.get("assets/errorMessages.json").map((res:any) => res.json()).subscribe(
        errorMessagesJSON => {
            for (var errorType in errorMessagesJSON) {
                var detailedMap = new Map();
                if (errorMessagesJSON.hasOwnProperty(errorType)) {
                    var errorTypeJSON = errorMessagesJSON[errorType];
                    for (var errorCode in errorTypeJSON) {
                        if (errorTypeJSON.hasOwnProperty(errorCode)) {
                            detailedMap.set(errorCode,errorTypeJSON[errorCode]);
                        }
                    }
                    self.errorMessagesMap.set(errorType,detailedMap);
                }
            }
            self.globalStorageService.setErrorTypesMap(self.errorMessagesMap);
        },
        error => console.log(error)
    );
    }

    private getGeneralConfigurationsFromFile(){
    var self = this;
    var generalConfigurationsMap = new Map();
    self.http.get("assets/generalConfigurations.json").map((res:any) => res.json()).subscribe(
        generalConfigurations => {
            for (var configurations in generalConfigurations) {
                if (generalConfigurations.hasOwnProperty(configurations)) {
                    generalConfigurationsMap.set(configurations, generalConfigurations[configurations]);
                }
            }
            self.globalStorageService.setGeneralConfigurationsMap(generalConfigurationsMap);
        },
        error => console.log(error)
    );
    }

    public getErrorMessage(key, isTimeout){
        var errorTypesMap = this.globalStorageService.getErrorTypesMap();
        var errorMessagesMap = isTimeout ? errorTypesMap.get("timeOutMessages") : errorTypesMap.get("errorCodeMessages");
        var errorMessageText = errorMessagesMap.get(key);
        return errorMessageText;
    }
}

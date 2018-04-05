import {Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/catch';
import { GlobalStorageService } from './globalstorage.service';
import { HttpClient } from '@angular/common/http';




@Injectable()
export class TimesService{
    timesMap = new Map();
    errorMessagesMap = new Map();

    constructor(private http: HttpClient, private globalStorageService : GlobalStorageService) {
        this.getTimeOutConfigurationsFromFile();
        this.getErrorMessagesFromFile();
        this.getGeneralConfigurationsFromFile();
    }

     public getIntervalForId(val){
       console.log("Inside timeService");
        var interval;
        var timesMap = this.globalStorageService.getTimesMap();
        console.log("------Time Map-----",timesMap);
        if(timesMap.get(val)){
            interval = timesMap.get(val).get("interval");
        } else {
            //interval = timesMap.get("default").get("interval");
            interval = 3000;
        }
        return interval;
    }

    public getTimeOutBasedOnCallId(finallCall){
        var timeOut;
        if(this.globalStorageService.getTimesMap().get(finallCall)){
          timeOut = this.globalStorageService.getTimesMap().get(finallCall).get("timeOut");
        }

        if(!timeOut){
          //timeOut =  this.globalStorageService.getTimesMap().get("default").get("timeOut");
              timeOut       = 180000;
        }

        return timeOut;
      }

    private getTimeOutConfigurationsFromFile(){
        var self = this;
        self.http.get("assets/timeConfigurations.json",{responseType : "json"}).subscribe(
            configurations => {
                for (var configuration in configurations) {
                    var detailedMap = new Map();
                    if (configurations.hasOwnProperty(configuration)) {
                        var details = configurations[configuration];
                        for (var detail in details) {
                            if (details.hasOwnProperty(detail)) {
                                detailedMap.set(detail,details[detail]);
                            }
                        }
                        self.timesMap.set(configuration,detailedMap);
                    }
                }
                self.globalStorageService.setTimesMap(self.timesMap);
            },
            error => console.log("Error in timeConfigurations.json file " + error.error)
        );
        }

    private getErrorMessagesFromFile(){
    var self = this;
    self.http.get("assets/errorMessages.json").map((res:any) => res).subscribe(
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
    self.http.get("assets/generalConfigurations.json").map((res:any) => res).subscribe(
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

}

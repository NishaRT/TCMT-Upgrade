import { Component, ViewEncapsulation} from '@angular/core';
import 'rxjs/add/operator/toPromise';
import { GlobalStorageService } from '../services/globalstorage.service';
import { DataService } from '../services/data.service';
import { EventsService } from '../services/events.service';
import { PrepareSiteComponent } from '../preparesite/preparesite.component';





@Component({
    moduleId: module.id,
    selector: 'sites-component',
    templateUrl: './sites.component.html',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['../css/common.css', '../css/ng2-select.css']
})

export class SitesComponent {
    constructor(private dataService: DataService, private globalStorageService : GlobalStorageService, private eventsService: EventsService) {
        this.getSitesForDropdown(this.ng2SelectItems);
        this.getTurbinesForDropdown(this.ng2SelectTurbines);
    }
    sitesJSON: any;

    //allSites = this.globalStorageService.getListOfFarms();

    ng2SelectItems = [];
    ng2SelectTurbines=[];
    GetVariableStatusWithTimeCmdParams;

    fetchingTurbines = false;
    isSiteSelected=false;

    onSiteSelect(selectedObject) {
      console.log("inside onSiteSelect", selectedObject);
      this.isSiteSelected = true;
        if(selectedObject && selectedObject.id && selectedObject.text) {
            this.fetchingTurbines = true;
            this.clearFewThingsRelatedToSite();
            var selectedParkId = selectedObject.id;
            this.globalStorageService.setSelectedParkId(selectedParkId);
            this.globalStorageService.setSelectedParkName(selectedObject.text);
            this.eventsService.siteChangeEmitter.next(true);
            if(!this.globalStorageService.getListOfTurbines()) {
              console.log("Inside onSiteSelect --Site--COmponent");
                this.callGetListOfTurbinesWithParkId(selectedParkId);
            }
        }
    }

    clearFewThingsRelatedToSite(){
        this.globalStorageService.setListOfTurbines(undefined);
        this.globalStorageService.setTurbineTypeWiseInfo({});
        if(this.globalStorageService.getMapOfTurbines()){
            this.globalStorageService.getMapOfTurbines().clear();
        }
        if(this.globalStorageService.getActiveTurbineMap()){
            this.globalStorageService.getActiveTurbineMap().clear();
        }
        if(this.globalStorageService.getActiveTurbineProcessListMap()){
            this.globalStorageService.getActiveTurbineProcessListMap().clear();
        }
        if(this.globalStorageService.getFailedTurbineMap()){
            this.globalStorageService.getFailedTurbineMap().clear();
        }
        if(this.globalStorageService.getMapOfprocessResponseArray()){
            this.globalStorageService.getMapOfprocessResponseArray().clear();
        }

    }


    callGetListOfTurbinesWithParkId(parkId) {
      console.log("inside callGetListOfTurbinesWithParkId",parkId);
        var self = this;
        var cmdParams = {"parkId" : parkId, "mode": 1};
        if(this.globalStorageService.needGRData){
          console.log("Inside if--for getting turbines");
            this.dataService.callPollAndGetResponseWhenSuccess("sendCommand","GetListOfWindTurbines",cmdParams,null,1,1,3000, self.setListOfTurbinesInGlobalStorage.bind(self), null);
        } else {
            //TODO - Remove this fake Data
            console.log("inside elsed for getting turbines");
            this.dataService.callPollAndGetResponseWhenSuccess("sendCommand","GetListOfWindTurbines",cmdParams,null,1,1,3000, self.setListOfTurbinesInGlobalStorage.bind(self), null);
          //  this.setListOfTurbinesInGlobalStorage({"cmdResponse":{"listOfTurbines" : this.getFakeListOfDMPTurbines()}});
        }
    }

    setListOfTurbinesInGlobalStorage(response) {
      console.log("Sites-Component---- Turbines",response);
        this.fetchingTurbines = false;
        var cmdResponse =  response.cmdResponse;
        var listOfDMPTurbines = [];
        var listOfTurbines = cmdResponse.listOfTurbines;
        console.log("turbine LLSSTTt",listOfTurbines);
        //this.globalStorageService.setAllTurbines(listOfTurbines);
        if(listOfTurbines && listOfTurbines.length){
            for(var i=0; i<listOfTurbines.length; i++) {
                var presentTurbineObj = listOfTurbines[i];
                if("DMP" == presentTurbineObj.platform) {
                    listOfDMPTurbines.push(presentTurbineObj);
                  //  this.ng2SelectTurbines.push({'name':presentTurbineObj.deviceName});
                }

            }

        }

        // Initializing the proces falgs to false
        this.globalStorageService.setAllTurbineInProcessMap(listOfDMPTurbines);
        //listOfDMPTurbines = this.getFakeListOfDMPTurbines();  // TODO - Should be removed after DEMO
        //this.globalStorageService.setListOfTurbines(listOfDMPTurbines);
        this.globalStorageService.setListOfTurbines(listOfTurbines);
        this.eventsService.globalPollingFunctionEmitter.next(true);

    }

    getFakeListOfDMPTurbines(){
        return [
            {
                "ReadWritePlist":null,
                "deviceName":"WTG154",
                "ipaddress":"172.16.71.154",
                "platform":"DMP",
                "systemNumber":"15022184",
                "turbineSerialNo":"15022184",
                "turbineType" : "1x"
            },
            {
                "ReadWritePlist":null,
                "deviceName":"WTG155",
                "ipaddress":"172.16.71.155",
                "platform":"DMP",
                "systemNumber":"105052230",
                "turbineSerialNo":"105052230",
                "turbineType" : "2x"
            },
         ];
    }


    getSitesForDropdown(ng2SelectItemsObject){
        var listOfSites = this.globalStorageService.getListOfFarms();
        for(var i=0 ; i<listOfSites.length; i++){
            ng2SelectItemsObject.push({"id" : listOfSites[i].parkId, "text": listOfSites[i].parkName});
        }
    }

    getTurbinesForDropdown(ng2SelectTurbinesOnject){
    var listofTurbines = this.globalStorageService.getListOfTurbines
    for(var i=0 ; i<listofTurbines.length; i++){
        ng2SelectTurbinesOnject.push({"id" : listofTurbines[i].deviceName, "text": listofTurbines[i].deviceName});
    }

}
}

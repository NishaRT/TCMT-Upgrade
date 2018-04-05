import {Component, AfterViewChecked} from '@angular/core';
import { GlobalStorageService} from '../services/globalstorage.service';

import { DataService} from '../services/data.service';
import {EventsService} from '../services/events.service';
import {DatePipe} from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { GEUtils } from '../services/geutils.service';



@Component({
    moduleId: module.id,
    selector: 'upgrade-component',
    templateUrl: './upgrade.component.html',
    styleUrls: ['./upgrade.component.css', '../css/common.css']
})

export class UpgradeComponent {
    constructor(private http: HttpClient, private globalStorageService: GlobalStorageService, private dataService: DataService, private eventsService: EventsService, private datePipe: DatePipe, private geUtils: GEUtils) {

         //Event emitter to display processResponse
         this.processResponseMapEmitter();

         //Event emitter to initate Upgrade
         this.globalPollingFuctionSleepEmitter();

         this.subscribeToselectedTileEmitter();

        // Event emitter to recognized the global polling
        this.subscribeForStopOfGlobalPollingEmitter();

    }

    pollBucketForUpgrade = new Map();
    tickedTurbinesForUpgrade = new Map();
    defaultSpinner = this.globalStorageService.defaultSpinner;
    gridLossTag = this.globalStorageService.gridLossTag;
    onlineTag = this.globalStorageService.onlineTag;
    ngxRows = [];
    ngxMap = new Map();
    mapOfTurbines = this.globalStorageService.getMapOfTurbines();

    isFileStatusPolling = false;

    pollBucket = [];
    isDataAvailable = false;
    isUpgradeInitiated = false;
    isPollBucketAddingFlag = true;
    isGlobalPollingStopped = false;




    onCheckboxChange(event) {
        if(event){
            var checkBox = event.target;
            var systemNumber = (checkBox.name).toString();
            if(!checkBox.checked){
                this.tickedTurbinesForUpgrade.delete(systemNumber);
                return;
            }
            var sizeOfPollBucket = this.pollBucketForUpgrade.size;
            var maxSelectedTurbineCount = this.globalStorageService.getGeneralConfigurationsMap().get("maxTurbinesToBeSelected");
            if(sizeOfPollBucket <= maxSelectedTurbineCount -1){
                this.isPollBucketAddingFlag = true;
            }else {
                this.isPollBucketAddingFlag = false;
            }
            // We can allow download when the size of the poll bucket less than max size and the adding flag is in the false position is Adding Scenario if not failure scenario
            if( (this.tickedTurbinesForUpgrade.size > maxSelectedTurbineCount -1) || !( ( this.isPollBucketAddingFlag ) && (sizeOfPollBucket < maxSelectedTurbineCount) ) ){
                alert("Please select max of " + maxSelectedTurbineCount +" Turbines");
                checkBox.checked = false;
            }
            if(checkBox.checked) {
                this.tickedTurbinesForUpgrade.set(systemNumber, this.globalStorageService.getMapOfTurbines().get(systemNumber));
            } else {
                this.tickedTurbinesForUpgrade.delete(systemNumber);
            }
            //this.globalStorageService.setSelectedTurbineMap(this.selectedTurbinesMap);
            console.log(this.tickedTurbinesForUpgrade.size + " turbines selected");
        }
    }


    //Refreshes enitre data table with whatever data is given - Given Map is the end data//
    refreshDataTableWithMap(ngxMap) {
        var self = this;
      //  self.ngxRows = [];

        ngxMap.forEach(function (value, key) {
            var systemNumber = key;
            var turbineObject = value;
            var spinner = turbineObject.get("spinner");
            var name = turbineObject.get("name");
            var ipAddress = turbineObject.get("ipAddress");
            var turbineStatus = turbineObject.get("turbineStatus");
            var swVersion = turbineObject.get("swVersion");
            var ramSize = turbineObject.get("ramSize");
            var cfc0Size = turbineObject.get("cfc0Size");
            //var taskVersion = turbineObject.get("taskVersion");
            var lastTaskRunTime = turbineObject.get("lastTaskRunTime");
            var progress = turbineObject.get("progress");
            var turbineInProcessMap = self.globalStorageService.getAllTurbineInProcessMap().get(systemNumber.toString());
            //var invalidTurbineError = self.validateTurbineRow(turbineObject);
            var singleRow = {
                "turbineInProcessMap" : turbineInProcessMap,
                "spinner": spinner,
                "name": name,
                "systemNumber": systemNumber,
                "ipAddress": ipAddress,
                "turbineStatus": turbineStatus,
                "swVersion": swVersion,
                "ramSize": ramSize,
                "cfc0Size": cfc0Size,
                "lastTaskRunTime": lastTaskRunTime,
                "progress": progress,
                //"invalidTurbineError" :invalidTurbineError,
            };
            self.ngxRows.push(singleRow);
        });

        self.ngxRows = [...self.ngxRows];
    }

    // vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv  DATA UPDATION CODE BLOCK vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv//



    // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^  SERVICE CALLS CODE START ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^//
    sendUpgradeCommand() {
        this.clearIrrelevantTableData();
        this.isUpgradeInitiated = true;
        var self = this;
        var validationErrorTurbines = [];
        this.tickedTurbinesForUpgrade.forEach(function(value, systemNumber){
            if(self.anyValidationError(systemNumber, value)){
                validationErrorTurbines.push(systemNumber);
            } else {
                self.pollBucketForUpgrade.set(systemNumber, value);
                self.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isUpgradeInProcess", true);
                self.tickedTurbinesForUpgrade.clear();
            }
        });
        self.refreshDataTableWithMap(self.ngxMap); //To run spinners for the turbine.

        // for Stopped turbines to hit global turbines polling
        if(!validationErrorTurbines.length) {
            if(this.isGlobalPollingStopped){
                this.upgradeCommandInitiatedAfterGlobalPolling();
                this.eventsService.globalPollingFunctionEmitter.next(true);
            }
        } else {
            var errorMsg = this.geUtils.getInvalidBackupFoundMessageforTurbines(validationErrorTurbines);
            this.geUtils.throwErrorMessageInUI("INVALID_BACKUP", false, errorMsg, null);
        }

    }

    upgradeCommandInitiatedAfterGlobalPolling(){
        var self = this;
        var listOfTurbinesToBeSent = [];
        this.pollBucketForUpgrade.forEach(function(value, systemNumber){
            var turbineBean = self.globalStorageService.getActiveTurbineMap().get(systemNumber);
            listOfTurbinesToBeSent.push(turbineBean);
            self.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isUpgradeInProcess", true);
        });
        //turbineBean.ipaddress = this.globalStorageService.getMapOfTurbines().get("ipAddress"); //Make sure inline edited data is fetched
        var cmdParams = {
            "turbineList": listOfTurbinesToBeSent,
            "platform": "DMP"
        }
        this.dataService.callPollAndGetResponseWhenSuccessWithPollingCount("sendCommand", "SendCommandToEdge", cmdParams, "Upgrade", 1, 1, 5000, this.globalStorageService.getGeneralConfigurationsMap().get("getStatusForSendCmdCount"), this.processSuccessUpgradeTurbines.bind(this), this.processFailedUpgradeTurbines.bind(this), this.processErrorUpgradeTurbines.bind(this));

    }

    processSuccessUpgradeTurbines(response) {
        var processResponseArray = response.cmdResponse.ProcessResponses;
        var ngxMap = this.ngxMap;
        if(processResponseArray  && processResponseArray.length) {
            for(var i=0; i<processResponseArray.length; i++) {
                var processResponse = processResponseArray[i];
                var systemNumber = processResponse.systemNumber;
                var responseData = processResponse.responseData;
                this.pollBucketForUpgrade.delete(systemNumber);
                var turbineRow = ngxMap.get(systemNumber);
                if(responseData) {
                    if(turbineRow) {
                        //turbineRow.set("taskVersion","-");
                        turbineRow.set("lastTaskRunTime", "-");
                        if(responseData.statusMessage) turbineRow.set("progress", responseData.statusMessage);
                        if(responseData.statusCode) turbineRow.set("statusCode",responseData.statusCode);
                        if(responseData.statusCode == "IN_PROGRESS") {
                             this.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isUpgradeInProcess", true);
                        }
                        if(responseData.statusCode == "SUCCESS") {
                            this.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isUpgradeInProcess", false);
                        }
                        if(responseData.statusCode == "FAILURE") {
                            if(responseData.statusMessage) turbineRow.set("progress", responseData.statusMessage);
                            this.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isUpgradeInProcess", false);
                        }
                        if(responseData.statusMessage) turbineRow.set("statusMessage",responseData.statusMessage);

                    }
                } else {
                    if(turbineRow) {
                        //turbineRow.set("taskVersion","-");
                        turbineRow.set("lastTaskRunTime", "-");
                        turbineRow.set("progress","");
                        this.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isUpgradeInProcess", false);
                    }
                }
                ngxMap.set(systemNumber, turbineRow);
            }
        }
        this.refreshDataTableWithMap(ngxMap);
    }

     // Processing of the failure turbine responses
     processFailedUpgradeTurbines(response) {
        var self = this;
        var ngxMap = this.ngxMap;
        this.pollBucketForUpgrade.forEach(function(value, key){
            var systemNumber = key;
            var turbineRow = ngxMap.get(systemNumber);
            if(turbineRow) {
                //turbineRow.set("taskVersion","-");
                turbineRow.set("lastTaskRunTime", "-");
                turbineRow.set("progress","Connection Failed");
                turbineRow.set("spinner" , null);
                self.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isUpgradeInProcess", false);
            }
            ngxMap.set(systemNumber, turbineRow);
        });
        this.pollBucketForUpgrade.clear();
        this.refreshDataTableWithMap(ngxMap);
    }

    processErrorUpgradeTurbines(response) {

    }


    // **********************************MISC CODE ***********************************************//
    updateTableWithProcessResponse(processResponsesArray) {
        var ngxMap = this.ngxMap;
        if (processResponsesArray && processResponsesArray.length) {
            for (var i = 0; i < processResponsesArray.length; i++) {
                var processResponse = processResponsesArray[i];
                var systemNumber = processResponse.systemNumber;
                var responseDataArray = processResponse.responseData;
                var responseData = null;
                var processName = null;
                if(Array.isArray(responseDataArray) && responseDataArray.length){
                    var responseDataMap = this.getMapFromArray(responseDataArray);
                    if(responseDataMap.get("Upgrade")){
                        responseData = responseDataMap.get("Upgrade");
                        processName = "Upgrade";
                    }
                }else{
                    responseData = processResponse.responseData;
                }
                var turbineRow = new Map();
                if(ngxMap.size && ngxMap.get(systemNumber)){
                    turbineRow = ngxMap.get(systemNumber);
                }
                if(processResponse.systemNumber) turbineRow.set("systemNumber",processResponse.systemNumber);
                if(processResponse.IpAddress) turbineRow.set("ipAddress",processResponse.IpAddress);
                if(processResponse.DeviceName) turbineRow.set("name",processResponse.DeviceName);

                if (responseData) {
                    if (turbineRow) {
                        if (responseData.cfc0Size) turbineRow.set("cfc0Size", (((responseData.cfc0Size) / (1024 * 1024)).toFixed(0)));
                        if (responseData.cpuVersion) turbineRow.set("cpuVersion", responseData.cpuVersion);
                        if (responseData.ramSize) turbineRow.set("ramSize", (((responseData.ramSize) / (1024 * 1024)).toFixed(0)));
                        if (responseData.swVersion) turbineRow.set("swVersion", responseData.swVersion);
                        if (responseData.turbineNumber) turbineRow.set("turbineNumber", responseData.turbineNumber);
                        if (responseData.turbineStatus) turbineRow.set("turbineStatus", this.globalStorageService.mapOfTurbineStatuses.get(responseData.turbineStatus));
                        //if (responseData.taskVersion) turbineRow.set("taskVersion", responseData.taskVersion);
                        if(responseData.lastTaskRunTime) turbineRow.set("lastTaskRunTime", this.datePipe.transform(responseData.lastTaskRunTime, "medium"));
                        if(responseData.statusMessage) turbineRow.set("progress", responseData.statusMessage);
                        if (responseData.statusCode) turbineRow.set("statusCode", responseData.statusCode);
                        if (responseData.statusCode == "IN_PROGRESS") {
                            this.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isUpgradeInProcess", true);
                        } else if(responseData.statusCode == "SUCCESS" && responseData.progress!=null && (responseData.progress).toFixed(0) == 100) {
                            // Not emitting the event if the present and received software version is same
                            var processResponseOfTurbineInfo = this.globalStorageService.getActiveTurbineProcessListMap().get(systemNumber);
                            var presentVersion = processResponseOfTurbineInfo.responseData.swVersion;
                            var receivedVersion = responseData.taskVersion;
                            this.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isUpgradeInProcess", false);
                            if(presentVersion != receivedVersion){
                                receivedVersion = receivedVersion;
                                this.globalStorageService.getActiveTurbineProcessListMap().set(systemNumber, processResponseOfTurbineInfo);
                                this.eventsService.processResponseMapEmitter.next(this.globalStorageService.getActiveTurbineProcessListMap());
                            }
                        }else{
                            this.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isUpgradeInProcess", false);
                        }
                        if (responseData.statusMessage) turbineRow.set("statusMessage", responseData.statusMessage);
                    }
                } else {
                    if (turbineRow) {
                        if(processName == "Upgrade"){
                            //turbineRow.set("taskVersion", "-");
                            turbineRow.set("lastTaskRunTime", "-");
                            turbineRow.set("progress", "-");
                            this.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isUpgradeInProcess", false);
                        }
                    }
                }

                //To get the backup version from backup object
                if(responseDataMap && responseDataMap.get("Backup")) turbineRow.set("backupVersion", responseDataMap.get("Backup").taskVersion);
                ngxMap.set(systemNumber, turbineRow);
            }
        }
        if(!this.isUpgradeInitiated){
            this.refreshDataTableWithMap(ngxMap);
        }
        this.isDataAvailable = true;

    }

    private clearIrrelevantTableData(){
        var self = this;
        var ngxMap = this.ngxMap;
        this.tickedTurbinesForUpgrade.forEach(function(value, key){
            var systemNumber = key;
            var turbineBean = value;
            var turbineRow = ngxMap.get(systemNumber);
            //turbineRow.set("taskVersion","-");
            turbineRow.set("lastTaskRunTime", "-");
            turbineRow.set("progress","Initiated");
            turbineRow.set("spinner" , self.defaultSpinner);
            ngxMap.set(systemNumber, turbineRow);
        });
        this.refreshDataTableWithMap(ngxMap);

    }

    anyValidationError(systemNumber, turbineBeanObject){
        var self=this;

        if(self.ngxMap.get(systemNumber).get("swVersion") != self.ngxMap.get(systemNumber).get("backupVersion")){
            return true;
        }

        var turbineTypeWiseMap = this.globalStorageService.getTurbineTypeWiseInfo();
        var turbineType = turbineBeanObject.turbineType.charAt(0) == "1" ? "1x" : "2x";

        //TODO - Uncomment this in production
        // if(turbineTypeWiseMap[turbineType].existingFiles < self.ngxMap.get(systemNumber).get("swVersion")) {
        //     return true;
        // }

        return false;
    }


    // validateTurbineRow(turbineObject){
    //     if(turbineObject.taskVersion && turbineObject.taskVersion != "-") {
    //         if(turbineObject.swVersion == turbineObject.taskVersion){
    //             return "Current and Backup versions cannot be same";
    //         }
    //     }else {
    //         return "No backup version available";
    //     }
    //     return "";
    // }


    private getMapFromArray(responseDataArray) {
        var responseDataMap = new Map();
        for(var i=0; i< responseDataArray.length; i++){
            responseDataMap.set(responseDataArray[i].taskProcess, responseDataArray[i])
        }
        return responseDataMap;
    }


    processResponseMapEmitter(){
        this.eventsService.processResponseMapEmitter.subscribe(processResponseMapArray => {
            if (!!processResponseMapArray) {
                this.updateTableWithProcessResponse( Array.from(processResponseMapArray.values()));
            }
        });
    }

    globalPollingFuctionSleepEmitter(){
        this.eventsService.globalPollingFuctionSleepEmitter.subscribe(isGlobalPollingInSleep => {
            if(isGlobalPollingInSleep){
                if(this.isUpgradeInitiated == true){
                    this.upgradeCommandInitiatedAfterGlobalPolling();
                }
               this.isUpgradeInitiated = false;
            }
        });
    }

    subscribeToselectedTileEmitter(){
        var self = this;
        this.eventsService.selectedTileEmitter.subscribe(selectedTile => {
            if(selectedTile == 3){
                var turbineInProcessMap = self.globalStorageService.getAllTurbineInProcessMap();
                var activeTurbineMap = self.globalStorageService.getActiveTurbineMap();
                if(activeTurbineMap.size){
                    activeTurbineMap.forEach(function(value, systemNumber){
                        if(turbineInProcessMap.get(systemNumber).get("isBackupInProcess") || turbineInProcessMap.get(systemNumber).get("isRestoreInProcess")) {
                            self.tickedTurbinesForUpgrade.delete(systemNumber);
                        }
                    });
                }
            }
        });
    }

    public subscribeForStopOfGlobalPollingEmitter(){
        this.eventsService.globalPollingStopFlagEmitter.subscribe( isPollingFlagStopped => {
            if (isPollingFlagStopped) {
                this.isGlobalPollingStopped = true;
                this.updateActiveTurbinesWithErrorMessage();
            }
        });
    }

    public updateActiveTurbinesWithErrorMessage(){
        var self = this;
        var ngxMap = this.ngxMap;
        this.globalStorageService.getActiveTurbineMap().forEach(function(value, key){
            var systemNumber = key;
            var turbineRow = ngxMap.get(systemNumber);
            if(turbineRow) {
                turbineRow.set("taskVersion","-");
                turbineRow.set("lastTaskRunTime", "-");
                turbineRow.set("progress","Unable to get status");
                turbineRow.set("spinner" , null);
                self.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isBackupInProcess", false);
            }
            ngxMap.set(systemNumber, turbineRow);
        });
        this.refreshDataTableWithMap(ngxMap);
    }

    // **********************************MISC CODE ***********************************************//

}

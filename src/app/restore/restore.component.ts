import { Component, ViewEncapsulation } from '@angular/core';
import { GlobalStorageService} from '../services/globalstorage.service';
import { DataService } from '../services/data.service';
import { Response,RequestOptions } from '@angular/http';
import {Headers} from '@angular/http';
import { EventsService } from '../services/events.service';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';



@Component({
    encapsulation: ViewEncapsulation.None,
    moduleId: module.id,
    selector: 'restore-component',
    templateUrl: './restore.component.html',
    styleUrls: ['./restore.component.css', '../css/common.css']
})

export class RestoreComponent {
    constructor(private http: HttpClient, private globalStorageService: GlobalStorageService, private dataService: DataService, private eventsService: EventsService, private datePipe : DatePipe) {

        //Event emitter to display processResponse
        this.processResponseMapEmitter();

        //Event emitter to initate restore
        this.globalPollingFuctionSleepEmitter();

        // Event emitter to recognized the global polling
        this.subscribeForStopOfGlobalPollingEmitter();

    }
    selectedTurbinesForRestore = [];
    gridLossTag = '<span class="badge badge-danger">Grid Loss</span>';
    onlineTag = '<span class="badge badge-success">Online</span>';
    faSpinner = this.globalStorageService.defaultSpinner;
    editing = {};
    ngXRows = [];
    mapOfTurbines = this.globalStorageService.getMapOfTurbines();
    mapOfTurbinesForRestore = new Map();
    arrayOfTurbinesForRestore = [];
    ngxMap = new Map();
    pollBucket = new Map();
    isRestoreStatusAlreadyPolling = false;
    processResponseArrayFromTurbineInfo = [];
    isDataAvailable=false;
    defaultSpinner = this.globalStorageService.defaultSpinner;
    isRestoreInitiated = false;

    pollBucketForRestore = new Map();

    tickedTurbinesForRestore = new Map();

    turbineTableMessages = { emptyMessage: "Only Upgraded turbines are displayed here"};
    isPollBucketAddingFlag = true;
    isGlobalPollingStopped = false;


    refreshDataTableWithMap(ngxMap) {
        var self = this;
        self.ngXRows = [];

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
            var restoreVersion = turbineObject.get("backupVersion");
            var lastTaskRunTime = turbineObject.get("lastTaskRunTime");
            var progress = turbineObject.get("progress");
            var turbineInProcessMap = self.globalStorageService.getAllTurbineInProcessMap().get(systemNumber);
            var singleRow = {
                "turbineInProcessMap" : turbineInProcessMap,
                "spinner" : spinner,
                "name": name,
                "systemNumber": systemNumber,
                "ipAddress": ipAddress,
                "turbineStatus": turbineStatus,
                "currentVersion": swVersion,
                "ramSize": ramSize,
                "cfc0Size": cfc0Size,
                "backupVersion": restoreVersion,
                "restoreTime": lastTaskRunTime,
                "retoreStatus": progress
            };
            self.ngXRows.push(singleRow);
        });

        self.ngXRows = [...self.ngXRows];
    }
    private sendRestoreCommand() {
        var self = this;
        this.clearIrrelevantTableData();
        this.isRestoreInitiated = true;

        //TODO - Need a better way to merge maps
        this.tickedTurbinesForRestore.forEach(function(value, systemNumber){
             self.pollBucketForRestore.set(systemNumber, value);
             self.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isRestoreInProcess", true);
        });
        self.tickedTurbinesForRestore.clear();
        self.refreshDataTableWithMap(self.ngxMap);

        // for Stopped turbines to hit global turbines polling
        if(this.isGlobalPollingStopped){
            this.restoreCommandInitiatedAfterGlobalPolling();
            this.eventsService.globalPollingFunctionEmitter.next(true);
        }
     }

    restoreCommandInitiatedAfterGlobalPolling(){
        var self = this;
        var listOfTurbinesToBeSent = [];
        this.pollBucketForRestore.forEach(function(value, systemNumber){
            // var systemNumber = this.pollBucketForRestore.get("systemNumber");
            var turbineBean = self.globalStorageService.getActiveTurbineMap().get(systemNumber);
            listOfTurbinesToBeSent.push(turbineBean);
            self.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isRestoreInProcess", true);
        });
        //turbineBean.ipaddress = this.globalStorageService.getMapOfTurbines().get("ipAddress"); //Make sure inline edited data is fetched
        var cmdParams = {
            "turbineList": listOfTurbinesToBeSent,
            "platform": "DMP"
        }
        this.dataService.callPollAndGetResponseWhenSuccessWithPollingCount("sendCommand", "SendCommandToEdge", cmdParams, "Restore", 1, 1, 5000, this.globalStorageService.getGeneralConfigurationsMap().get("getStatusForSendCmdCount"), this.processSuccessRestoreTurbines.bind(this), this.processFailedRestoreTurbines.bind(this), this.processErrorRestoreTurbines.bind(this));
    }
    processSuccessRestoreTurbines(response) {
        var processResponseArray = response.cmdResponse.ProcessResponses;
        var ngxMap = this.ngxMap;
        if(processResponseArray  && processResponseArray.length) {
            for(var i=0; i<processResponseArray.length; i++) {
                var processResponse = processResponseArray[i];
                var systemNumber = processResponse.systemNumber;
                var responseData = processResponse.responseData;
                this.pollBucketForRestore.delete(systemNumber);
                var turbineRow = ngxMap.get(systemNumber);
                if(responseData) {
                    if(turbineRow) {
                        turbineRow.set("taskVersion","-");
                        turbineRow.set("lastTaskRunTime", "-");
                        if(responseData.statusMessage) turbineRow.set("progress", responseData.statusMessage);
                        if(responseData.statusCode) turbineRow.set("statusCode",responseData.statusCode);
                        if(responseData.statusCode == "IN_PROGRESS") {
                             this.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isRestoreInProcess", true);
                        }
                        if(responseData.statusCode == "SUCCESS") {
                            this.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isRestoreInProcess", false);
                        }
                        if(responseData.statusCode == "FAILURE") {
                            if(responseData.statusMessage) turbineRow.set("progress",responseData.statusMessage);
                            this.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isRestoreInProcess", false);
                        }
                        if(responseData.statusMessage) turbineRow.set("statusMessage",responseData.statusMessage);

                    }
                } else {
                    if(turbineRow) {
                        turbineRow.set("taskVersion","-");
                        turbineRow.set("lastTaskRunTime", "-");
                        turbineRow.set("progress","-");
                        this.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isRestoreInProcess", false);
                    }
                }
                ngxMap.set(systemNumber, turbineRow);
            }
        }
        this.refreshDataTableWithMap(ngxMap);
    }

    // Processing of the failure turbine responses
    processFailedRestoreTurbines(response) {
        var self = this;
        var ngxMap = this.ngxMap;
        this.pollBucketForRestore.forEach(function(value, key){
            var systemNumber = key;
            var turbineRow = ngxMap.get(systemNumber);
            if(turbineRow) {
                turbineRow.set("taskVersion","-");
                turbineRow.set("lastTaskRunTime", "-");
                turbineRow.set("progress","Connection Failed");
                turbineRow.set("spinner" , null);
                self.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isRestoreInProcess", false);
            }
            ngxMap.set(systemNumber, turbineRow);
        });
        this.pollBucketForRestore.clear();
        this.refreshDataTableWithMap(ngxMap);
    }

    processErrorRestoreTurbines(response) {

    }

    updateTableWithProcessResponse(processResponseArray) {

        var ngxMap = this.ngxMap;
        var isResponseFromTurbineTaskStatus = false;
        var isResonseFromGetTurbineInfo = false;
        var processName = null;
        if (processResponseArray) {
            for (var i = 0; i < processResponseArray.length; i++) {
                var processResponse = processResponseArray[i];
                var systemNumber = processResponse.systemNumber;
                var responseDataArray = processResponse.responseData;
                var responseData = null;
                var restoreDataFlagBasedOnUpgrade = false;
                var isDataFromTurbineInfo = false;
                if(Array.isArray(responseDataArray) && responseDataArray.length){
                    isResponseFromTurbineTaskStatus = true;
                    isResonseFromGetTurbineInfo = false;
                    responseDataArray.forEach(function(element) {
                        if(element.taskProcess == "Restore"){
                            responseData = element;
                            processName = "Restore";
                        }
                        if(element.taskProcess == "Upgrade"){
                            var upgradeData = element;
                            if(upgradeData.statusCode == "SUCCESS" || upgradeData.statusCode == "FAILURE"){
                                restoreDataFlagBasedOnUpgrade = true;
                            }
                        }
                    });
                }else{
                    isResponseFromTurbineTaskStatus = false;
                    responseData = processResponse.responseData;
                    isResonseFromGetTurbineInfo = true;
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
                        if (responseData.taskVersion) turbineRow.set("backupVersion", responseData.taskVersion);
                        if(responseData.lastTaskRunTime) turbineRow.set("lastTaskRunTime", this.datePipe.transform(responseData.lastTaskRunTime, "medium"));
                        if(responseData.statusMessage) turbineRow.set("progress", responseData.statusMessage);
                        if (responseData.statusCode) turbineRow.set("statusCode", responseData.statusCode);
                        if (responseData.statusCode == "IN_PROGRESS") {
                            this.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isRestoreInProcess", true);
                        } else {
                            this.pollBucket.delete(systemNumber);
                            this.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isRestoreInProcess", false);
                        }
                        if (responseData.statusMessage) turbineRow.set("statusMessage", responseData.statusMessage);
                        ngxMap.set(systemNumber, turbineRow);
                        if(isResponseFromTurbineTaskStatus && !restoreDataFlagBasedOnUpgrade){
                            ngxMap.delete(systemNumber);
                        }
                    }

                } else {
                    if (turbineRow) {
                        if( processName == "Restore"){
                            turbineRow.set("backupVersion", "-");
                            turbineRow.set("lastTaskRunTime", "-");
                            turbineRow.set("progress","");
                            this.globalStorageService.setTurbineInProcessMapValue(systemNumber + "", "isRestoreInProcess", false);
                            ngxMap.set(systemNumber, turbineRow);
                            if(!restoreDataFlagBasedOnUpgrade){
                                ngxMap.delete(systemNumber);
                            }
                        }
                    }
                }
                if(this.globalStorageService.getTurbineInProcessMapValue(systemNumber + "", "isTurbineInProcess")){
                    turbineRow.set("spinner" , this.globalStorageService.defaultSpinner);
                } else {
                    turbineRow.set("spinner" , null);
                }


            }
        }
        if( isResponseFromTurbineTaskStatus && restoreDataFlagBasedOnUpgrade && !this.isRestoreInitiated){
            this.refreshDataTableWithMap(ngxMap);
            this.isDataAvailable = true;
        }
    }


    onCheckboxChange(event) {
        if(event){
            var checkBox = event.target;
            var systemNumber = (checkBox.name).toString();
            if(!checkBox.checked){
                this.tickedTurbinesForRestore.delete(systemNumber);
                return;
            }
            var sizeOfPollBucket = this.pollBucketForRestore.size;
            var maxSelectedTurbineCount = this.globalStorageService.getGeneralConfigurationsMap().get("maxTurbinesToBeSelected");
            if(sizeOfPollBucket <= maxSelectedTurbineCount -1){
                this.isPollBucketAddingFlag = true;
            }else {
                this.isPollBucketAddingFlag = false;
            }
            // We can allow download when the size of the poll bucket less than max size and the adding flag is in the false position is Adding Scenario if not failure scenario
            if( (this.tickedTurbinesForRestore.size > maxSelectedTurbineCount -1) || !( ( this.isPollBucketAddingFlag ) && (sizeOfPollBucket < maxSelectedTurbineCount) ) ){
                alert("Please select max of " + maxSelectedTurbineCount +" Turbines");
                checkBox.checked = false;
            }
            if(checkBox.checked) {
                this.tickedTurbinesForRestore.set(systemNumber, this.globalStorageService.getMapOfTurbines().get(systemNumber));
            } else {
                this.tickedTurbinesForRestore.delete(systemNumber);
            }
            //this.globalStorageService.setSelectedTurbineMap(this.selectedTurbinesMap);
            console.log(this.tickedTurbinesForRestore.size + " turbines selected");
        }
    }

    private clearIrrelevantTableData(){
        var self = this;
        var ngxMap = this.ngxMap;
        this.tickedTurbinesForRestore.forEach(function(value, key){
            var systemNumber = key;
            var turbineBean = value;
            var turbineRow = ngxMap.get(systemNumber);
            turbineRow.set("taskVersion","-");
            turbineRow.set("lastTaskRunTime", "-");
            turbineRow.set("progress","Initiated");
            turbineRow.set("spinner" , self.defaultSpinner);
            ngxMap.set(systemNumber, turbineRow);
        });
        this.refreshDataTableWithMap(ngxMap);
    }

    private processResponseMapEmitter(){
        this.eventsService.processResponseMapEmitter.subscribe(processResponseMapArray => {
            if (!!processResponseMapArray) {
                this.updateTableWithProcessResponse( Array.from(processResponseMapArray.values()) );
            }
        });
    }

    private globalPollingFuctionSleepEmitter(){
        this.eventsService.globalPollingFuctionSleepEmitter.subscribe(isGlobalPollingInSleep => {
            if(isGlobalPollingInSleep){
                if(this.isRestoreInitiated == true){
                    this.restoreCommandInitiatedAfterGlobalPolling();
                }
               this.isRestoreInitiated = false;
            }
        });
    }

    private subscribeToselectedTileEmitter(){
        var self = this;
        this.eventsService.selectedTileEmitter.subscribe(selectedTile => {
            if(selectedTile == 4){
                var turbineInProcessMap = self.globalStorageService.getAllTurbineInProcessMap();
                var activeTurbineMap = self.globalStorageService.getActiveTurbineMap();
                if(activeTurbineMap.size){
                    activeTurbineMap.forEach(function(value, systemNumber){
                        if(turbineInProcessMap.get(systemNumber).get("isBackupInProcess") || turbineInProcessMap.get(systemNumber).get("isUpgradeInProcess")) {
                            self.tickedTurbinesForRestore.delete(systemNumber);
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
}

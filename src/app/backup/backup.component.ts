import { Component, ViewEncapsulation } from '@angular/core';
import {GlobalStorageService} from '../services/globalstorage.service';
import {DataService} from '../services/data.service';
import { Response, RequestOptions } from '@angular/http';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Headers } from '@angular/http';
import { EventsService } from '../services/events.service';
import { DatePipe } from '@angular/common';
import { GEUtils } from '../services/geutils.service';


@Component({
    encapsulation: ViewEncapsulation.None,
    moduleId: module.id,
    selector: 'backup-component',
    templateUrl: './backup.component.html',
    styleUrls: ['./backup.component.css', '../css/common.css','../css/ngx-material.css']
})

export class BackupComponent {
    constructor(private http: HttpClient, private globalStorageService: GlobalStorageService, private dataService: DataService,private eventsService: EventsService, private datePipe : DatePipe, private geUtils : GEUtils) {

        //Event emitter to display processResponse
        this.processResponseMapEmitter();

        //Event emitter to initate Backup
        this.globalPollingFuctionSleepEmitter();

        this.subscribeToselectedTileEmitter();

        // Event emitter to recognized the global polling
        this.subscribeForStopOfGlobalPollingEmitter();
    }

    pollBucketForBackup = new Map();

    tickedTurbinesForBackup = new Map();

    gridLossTag = '<span class="badge badge-danger">Grid Loss</span>';
    onlineTag = '<span class="badge badge-success">Online</span>';
    // editedTextMsg;
    defaultSpinner = this.globalStorageService.defaultSpinner;
    ngxRows = [];
    ngxMap = new Map();
    isBackupStatusAlreadyPolling = false;
    isBackupButtonEnabled = false;
    isDataAvailable=false;
    isBackUpInitiated = false;
    isPollBucketAddingFlag = true;
    isGlobalPollingStopped = false;

    // vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv  DATA UPDATION CODE BLOCK vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv//


    private sendBackupCommand() {
        var self = this;
        this.clearIrrelevantTableData();
        this.isBackUpInitiated = true;

        this.tickedTurbinesForBackup.forEach(function(value, systemNumber){
            self.pollBucketForBackup.set(systemNumber, value);
            self.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isBackupInProcess", true);
        });
        self.tickedTurbinesForBackup.clear();
        self.refreshDataTableWithMap(self.ngxMap);
        // for Stopped turbines to hit global turbines polling
        if(this.isGlobalPollingStopped){
            this.backupCommandInitiatedAfterGlobalPolling();
            this.eventsService.globalPollingFunctionEmitter.next(true);
        }
    }

    backupCommandInitiatedAfterGlobalPolling(){
        var self=this;
        var listOfTurbinesToBeSent = [];
        this.pollBucketForBackup.forEach(function(value, systemNumber){
            // var systemNumber = self.pollBucketForBackup.get("systemNumber");
            var turbineBean = self.globalStorageService.getActiveTurbineMap().get(systemNumber);
            listOfTurbinesToBeSent.push(turbineBean);
            self.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isBackupInProcess", true);
        });
        //turbineBean.ipaddress = this.globalStorageService.getMapOfTurbines().get("ipAddress"); //Make sure inline edited data is fetched
        var cmdParams = {"turbineList" : listOfTurbinesToBeSent, "platform" : "DMP"}
        this.dataService.callPollAndGetResponseWhenSuccessWithPollingCount("sendCommand", "SendCommandToEdge", cmdParams, "Backup", 1, 1, 5000, this.globalStorageService.getGeneralConfigurationsMap().get("getStatusForSendCmdCount"), this.processSuccessBackUPTurbines.bind(this), this.processFailedBackUPTurbines.bind(this), this.processErrorBackUPTurbines.bind(this));

    }

    processSuccessBackUPTurbines(response) {
        var processResponseArray = response.cmdResponse.ProcessResponses;
        var ngxMap = this.ngxMap;
        if(processResponseArray  && processResponseArray.length) {
            for(var i=0; i<processResponseArray.length; i++) {
                var processResponse = processResponseArray[i];
                var systemNumber = processResponse.systemNumber;
                var responseData = processResponse.responseData;
                this.pollBucketForBackup.delete(systemNumber);
                var turbineRow = ngxMap.get(systemNumber);
                if(responseData) {
                    if(turbineRow) {
                        turbineRow.set("taskVersion","-");
                        turbineRow.set("lastTaskRunTime", "-");
                        if(responseData.statusMessage) turbineRow.set("progress", responseData.statusMessage);
                        if(responseData.statusCode) turbineRow.set("statusCode",responseData.statusCode);
                        if(responseData.statusCode == "IN_PROGRESS") {
                             this.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isBackupInProcess", true);
                        }
                        if(responseData.statusCode == "SUCCESS") {
                            this.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isBackupInProcess", false);
                        }
                        if(responseData.statusCode == "FAILURE") {
                            if(responseData.statusMessage) turbineRow.set("progress", responseData.statusMessage);
                            this.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isBackupInProcess", false);
                        }
                        if(responseData.statusMessage) turbineRow.set("statusMessage",responseData.statusMessage);

                    }
                } else {
                    if(turbineRow) {
                        turbineRow.set("taskVersion","-");
                        turbineRow.set("lastTaskRunTime", "-");
                        turbineRow.set("progress",{"progress" : "-", "statusMessage" : ""});
                        this.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isBackupInProcess", false);
                    }
                }
                ngxMap.set(systemNumber, turbineRow);
            }
        }
        this.refreshDataTableWithMap(ngxMap);
    }

    // Processing of the failure turbine responses
    processFailedBackUPTurbines(response) {
        var self = this;
        var ngxMap = this.ngxMap;
        this.pollBucketForBackup.forEach(function(value, key){
            var systemNumber = key;
            var turbineRow = ngxMap.get(systemNumber);
            if(turbineRow) {
                turbineRow.set("taskVersion","-");
                turbineRow.set("lastTaskRunTime", "-");
                turbineRow.set("progress",{"progress" : "Connection Failed", "statusMessage" : "Nucleus Connection Failed"});
                turbineRow.set("spinner" , null);
                self.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isBackupInProcess", false);
            }
            ngxMap.set(systemNumber, turbineRow);
        });
        this.pollBucketForBackup.clear();
        this.refreshDataTableWithMap(ngxMap);
    }

    processErrorBackUPTurbines(response) {

    }

    processResponseMapEmitter(){
        this.eventsService.processResponseMapEmitter.subscribe(processResponseMapArray => {
            if (!!processResponseMapArray) {
                this.updateTableWithProcessResponse( Array.from(processResponseMapArray.values()));
            }
        });
    };

    globalPollingFuctionSleepEmitter(){
        this.eventsService.globalPollingFuctionSleepEmitter.subscribe(isGlobalPollingInSleep => {
            if(isGlobalPollingInSleep){
                if(this.isBackUpInitiated == true){
                    this.backupCommandInitiatedAfterGlobalPolling();
                }
               this.isBackUpInitiated = false;
            }
        });
    };

    onCheckboxChange(event) {
        if(event){
            var checkBox = event.target;
            var systemNumber = (checkBox.name).toString();
            if(!checkBox.checked){
                this.tickedTurbinesForBackup.delete(systemNumber);
                return;
            }
            var sizeOfPollBucket = this.pollBucketForBackup.size;
            var maxSelectedTurbineCount = this.globalStorageService.getGeneralConfigurationsMap().get("maxTurbinesToBeSelected");
            if(sizeOfPollBucket <= maxSelectedTurbineCount -1){
                this.isPollBucketAddingFlag = true;
            }else {
                this.isPollBucketAddingFlag = false;
            }
            // We can allow download when the size of the poll bucket less than max size and the adding flag is in the false position is Adding Scenario if not failure scenario
            if( (this.tickedTurbinesForBackup.size > maxSelectedTurbineCount -1) || !( ( this.isPollBucketAddingFlag ) && (sizeOfPollBucket < maxSelectedTurbineCount) ) ){
                alert("Please select max of " + maxSelectedTurbineCount +" Turbines");
                checkBox.checked = false;
            }
            if(checkBox.checked) {
                this.tickedTurbinesForBackup.set(systemNumber, this.globalStorageService.getMapOfTurbines().get(systemNumber));
            } else {
                this.tickedTurbinesForBackup.delete(systemNumber);
            }
            //this.globalStorageService.setSelectedTurbineMap(this.selectedTurbinesMap);
            console.log(this.tickedTurbinesForBackup.size + " turbines selected");
        }
    }

    private clearIrrelevantTableData(){
        var self = this;
        var ngxMap = this.ngxMap;
        this.tickedTurbinesForBackup.forEach(function(value, key){
            var systemNumber = key;
            var turbineBean = value;
            var turbineRow = ngxMap.get(systemNumber);
            turbineRow.set("taskVersion","-");
            turbineRow.set("lastTaskRunTime", "-");
            turbineRow.set("progress",{"progress" : "0" + "%", "statusMessage" : "Initiated"});
            turbineRow.set("spinner" , self.defaultSpinner);
            ngxMap.set(systemNumber, turbineRow);
        });
        this.refreshDataTableWithMap(ngxMap);
    }



//******************* Upgrade copied Code  ***********//
    updateTableWithProcessResponse(processResponseArray) {
        var ngxMap = this.ngxMap;
        if(processResponseArray  && processResponseArray.length) {
            for(var i=0; i<processResponseArray.length; i++) {
                var processResponse = processResponseArray[i];
                var systemNumber = processResponse.systemNumber;
                var responseDataArray = processResponse.responseData;
                var processName = null;
                var responseData = null;
                if(Array.isArray(responseDataArray) && responseDataArray.length){
                    var sizeOfArray = responseDataArray.length;
                    for(i=0; i < sizeOfArray ; i++){
                        if(responseDataArray[i].taskProcess == "Backup"){
                            processName = "Backup";
                            responseData = responseDataArray[i];
                            break;
                        }
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
                if(responseData) {
                    if(turbineRow) {
                        if(responseData.cfc0Size) turbineRow.set("cfc0Size",(((responseData.cfc0Size)/(1024*1024)).toFixed(0)));
                        if(responseData.cpuVersion) turbineRow.set("cpuVersion",responseData.cpuVersion);
                        if(responseData.ramSize) turbineRow.set("ramSize",(((responseData.ramSize)/(1024*1024)).toFixed(0)));
                        if(responseData.swVersion) turbineRow.set("swVersion",responseData.swVersion);
                        if(responseData.turbineNumber) turbineRow.set("turbineNumber",responseData.turbineNumber);
                        if(responseData.turbineStatus) turbineRow.set("turbineStatus",this.globalStorageService.mapOfTurbineStatuses.get(responseData.turbineStatus) ? this.globalStorageService.mapOfTurbineStatuses.get(responseData.turbineStatus) : responseData.turbineStatus);
                        if(responseData.taskVersion) turbineRow.set("taskVersion",responseData.taskVersion);
                        if(responseData.lastTaskRunTime) turbineRow.set("lastTaskRunTime", this.datePipe.transform(responseData.lastTaskRunTime, "medium"));
                        if(responseData.statusMessage) turbineRow.set("progress", responseData.statusMessage);
                        if(responseData.statusCode) turbineRow.set("statusCode",responseData.statusCode);
                        if(responseData.statusCode == "IN_PROGRESS") {
                             this.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isBackupInProcess", true);
                        }
                        if(responseData.statusCode == "SUCCESS") this.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isBackupInProcess", false);
                        if(responseData.statusMessage) turbineRow.set("statusMessage",responseData.statusMessage);

                    }
                } else {
                    if(turbineRow) {
                        if(processName == "Backup"){
                            turbineRow.set("taskVersion","-");
                            turbineRow.set("lastTaskRunTime", "-");
                            turbineRow.set("progress",{"progress" : "-", "statusMessage" : ""});
                            // this.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isBackupInProcess", false);
                        }
                    }
                }
                if(this.globalStorageService.getTurbineInProcessMapValue(systemNumber, "isTurbineInProcess")){
                    turbineRow.set("spinner" , this.defaultSpinner);
                } else {
                    turbineRow.set("spinner" , null);
                }
                ngxMap.set(systemNumber, turbineRow);
            }
        }
        if(!this.isBackUpInitiated){
            this.refreshDataTableWithMap(ngxMap);
        }
        this.isDataAvailable = true;

    }

    //Refreshes enitre data table with whatever data is given - Given Map is the end data//
    refreshDataTableWithMap(ngxMap) {
        var self = this;
        self.ngxRows = [];

        ngxMap.forEach(function(value, key) {
            var systemNumber = key;
            var turbineObject= value;
            var spinner = turbineObject.get("spinner");
            var name = turbineObject.get("name");
            var ipAddress = turbineObject.get("ipAddress");
            var turbineStatus = turbineObject.get("turbineStatus");
            var swVersion = turbineObject.get("swVersion");
            var ramSize = turbineObject.get("ramSize");
            var cfc0Size = turbineObject.get("cfc0Size");
            var taskVersion = turbineObject.get("taskVersion");
            var lastTaskRunTime = turbineObject.get("lastTaskRunTime");
            var progress = turbineObject.get("progress");
            var turbineInProcessMap = self.globalStorageService.getAllTurbineInProcessMap().get(systemNumber.toString());
            var singleRow = {"turbineInProcessMap" : turbineInProcessMap, "spinner" : spinner, "name": name,"systemNumber" : systemNumber, "ipAddress" : ipAddress, "turbineStatus": turbineStatus, "swVersion":swVersion, "ramSize" : ramSize, "cfc0Size":cfc0Size,"taskVersion":taskVersion,"lastTaskRunTime":lastTaskRunTime, "progress":progress};
            self.ngxRows.push(singleRow);
        });

        self.ngxRows = [...self.ngxRows];
    }


    //Emitters and its subscription
    private subscribeToGlobalPollingFunctionSleepEmitter(){
        this.eventsService.globalPollingFuctionSleepEmitter.subscribe(isGlobalPollingInSleep => {
            if(isGlobalPollingInSleep){
                if(this.isBackUpInitiated == true){
                    this.backupCommandInitiatedAfterGlobalPolling();
                }
               this.isBackUpInitiated = false;
            }
        });
    }

    private subscribeToProcessResponse(){
        this.eventsService.processResponseMapEmitter.subscribe(processResponseMapArray => {
            if (!!processResponseMapArray) {
                this.updateTableWithProcessResponse( Array.from(processResponseMapArray.values()));
            }
        });
    }

    private subscribeToselectedTileEmitter(){
        var self = this;
        this.eventsService.selectedTileEmitter.subscribe(selectedTile => {
            if(selectedTile == 2){
                var turbineInProcessMap = self.globalStorageService.getAllTurbineInProcessMap();
                var activeTurbineMap = self.globalStorageService.getActiveTurbineMap();
                if(activeTurbineMap.size){
                    activeTurbineMap.forEach(function(value, systemNumber){
                        if(turbineInProcessMap.get(systemNumber).get("isUpgradeInProcess") || turbineInProcessMap.get(systemNumber).get("isRestoreInProcess")) {
                            self.tickedTurbinesForBackup.delete(systemNumber);
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
                turbineRow.set("progress",{"progress" : "Unable to get status", "statusMessage" : "Nucleus Connection Failed"});
                turbineRow.set("spinner" , null);
                self.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isBackupInProcess", false);
            }
            ngxMap.set(systemNumber, turbineRow);
        });
        this.refreshDataTableWithMap(ngxMap);
    }

}

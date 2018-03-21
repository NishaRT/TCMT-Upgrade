import { Component, ViewEncapsulation, Input} from '@angular/core';
import {GlobalStorageService} from '../services/globalstorage.service';
import {DataService} from '../services/data.service';
import { Http, Response, RequestOptions } from '@angular/http';
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
    constructor(private http: Http, private globalStorageService: GlobalStorageService, private dataService: DataService,private eventsService: EventsService, private datePipe : DatePipe, private geUtils : GEUtils) {
        this.eventsService.mapOfTurbinesEmitter.subscribe(mapOfTurbines => {
            if (mapOfTurbines) {
                this.populateTableWithTurbineInfo(mapOfTurbines);
            }
        });

        this.eventsService.processResponseEmitter.subscribe(processResponseArray => {
            if (!!processResponseArray) {
                this.updateTableWithProcessResponse(null, processResponseArray);
            }
        });

         this.eventsService.selectedTileEmitter.subscribe(selectedTile => {
             if(selectedTile == 2) {
                 this.pollBucket = this.globalStorageService.getListOfTurbines();
                 this.callAndPollBackupStatus(null);
             }
            });

                 //Event emitter to stop spinners in the turbineslist which are in error state
        this.eventsService.stopSpinnersEventEmitter.subscribe(listOfTurbines => {
            if(listOfTurbines){
                var ngxMap = this.geUtils.stopSpinnersForTurbines(listOfTurbines, this.ngxMap);
                this.refreshDataTableWithMap(ngxMap);
            }
        });

    }

    selectedTurbinesForBackup = [];

    gridLossTag = '<span class="badge badge-danger">Grid Loss</span>';
    onlineTag = '<span class="badge badge-success">Online</span>';
    // editedTextMsg;
    defaultSpinner = this.globalStorageService.defaultSpinner;
    editing = {};
    ngxRows = [];
    mapOfTurbines = this.globalStorageService.getMapOfTurbines();
    ngxMap = new Map();
    pollBucket = [];
    isBackupStatusAlreadyPolling = false;
    isBackupButtonEnabled = false;

    // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ DATA UPDATION CODE BLOCK  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^//
    private populateTableWithTurbineInfo(mapOfTurbines) {
        var self = this;
        mapOfTurbines.forEach(function(value, key) {
            var systemNumber = key;
            var turbineObject = value;
            var turbineDetailsMap = new Map();

            if(turbineObject){
                turbineDetailsMap.set("spinner", self.defaultSpinner);
                if(turbineObject.deviceName) {turbineDetailsMap.set("name",turbineObject.deviceName)}// else {turbineDetailsMap.set("name", self.defaultSpinner)}
                if(turbineObject.systemNumber) {turbineDetailsMap.set("systemNumber",turbineObject.systemNumber)} //else{turbineDetailsMap.set("systemNumber", self.defaultSpinner)}
                if(turbineObject.ipaddress) {turbineDetailsMap.set("ipAddress",turbineObject.ipaddress)} //else{turbineDetailsMap.set("ipAddress", self.defaultSpinner)}
                if(turbineObject.turbineStatus) {
                    turbineObject.turbineStatus == 6.000? turbineDetailsMap.set("turbineStatus",self.gridLossTag) :  turbineDetailsMap.set("turbineStatus",self.onlineTag);
                } else{
                    //turbineDetailsMap.set("turbineStatus", self.defaultSpinner);
                }
                if(turbineObject.swVersion) {turbineDetailsMap.set("swVersion",turbineObject.swVersion)} //else{turbineDetailsMap.set("swVersion", self.defaultSpinner)}
                if(turbineObject.ramSize) {turbineDetailsMap.set("ramSize",((turbineObject.ramSize)/(1024*1024)).toFixed(0))} //else{turbineDetailsMap.set("ramSize", self.defaultSpinner)}
                if(turbineObject.cfc0Size) {turbineDetailsMap.set("cfc0Size",((turbineObject.cfc0Size)/(1024*1024)).toFixed(0))} //else{turbineDetailsMap.set("cfc0Size", self.defaultSpinner)}
                if(turbineObject.taskVersion) {turbineDetailsMap.set("taskVersion",turbineObject.taskVersion)} //else{turbineDetailsMap.set("taskVersion", self.defaultSpinner)}
                if(turbineObject.lastTaskRunTime) {turbineDetailsMap.set("lastTaskRunTime",turbineObject.lastTaskRunTime)} //else{turbineDetailsMap.set("lastTaskRunTime", self.defaultSpinner)}
                if(turbineObject.progress) {turbineDetailsMap.set("progress",turbineObject.progress)} //else{turbineDetailsMap.set("progress", self.defaultSpinner)}
            }
            self.ngxMap.set(systemNumber,turbineDetailsMap);
          });
        self.refreshDataTableWithMap(self.ngxMap);
    }

    // vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv  DATA UPDATION CODE BLOCK vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv//


    private sendBackupCommand() {
        this.clearIrrelevantTableData();
        var listOfTurbinesToBeSent = [];
        for(var i=0; i<this.selectedTurbinesForBackup.length; i++) {
            var systemNumber = this.selectedTurbinesForBackup[i].systemNumber;
            var turbineBean = this.mapOfTurbines.get(systemNumber);
            turbineBean.ipaddress = this.selectedTurbinesForBackup[i].ipAddress; //Make sure inline edited data is fetched
            listOfTurbinesToBeSent.push(turbineBean);
            var turbineRowMap = this.ngxMap.get(systemNumber);
            turbineRowMap.set("isInProcess", true);
        }
        this.disableOrEnableBackupAction();
        var cmdParams = {"turbineList" : listOfTurbinesToBeSent, "platform" : "DMP"}
        this.dataService.callPollAndGetResponseWhenSuccess("sendCommand", "SendCommandToEdge", cmdParams, "Backup", null, 1, 1, 5000, this.callAndPollBackupStatus.bind(this));
    }

    callAndPollBackupStatus(response) {
        var self = this;
        var turbineList;
        var cmdParams ;
        if(response) {
            cmdParams = JSON.parse(response.json().cmdParams);
        } else {
            cmdParams = {"turbineList" : this.pollBucket, "platform" : "DMP"}
        }
        this.isBackupStatusAlreadyPolling = true;
        this.dataService.callPollAndGetResponseWhenSuccess("sendCommand", "SendCommandToEdge", cmdParams, "BackupStatus", true, 1, 1, 5000, this.updateTableWithProcessResponse.bind(this));

        //Making the turbines "inProcess" in the process map
        turbineList = cmdParams.turbineList;
        turbineList.forEach(function(value) {
            self.globalStorageService.setTurbineInProcessMapValue(value.systemNumber, "isBackupInProcess", true);
            self.ngxMap.get(value.systemNumber).set("spinner", self.defaultSpinner);
        });
        self.refreshDataTableWithMap(self.ngxMap);
    }

    onCheckboxChange({ selected } ) {
        if(selected) {
            this.selectedTurbinesForBackup = selected;
        }
        this.disableOrEnableBackupAction();
    }

    updateViaInline(event, cell, rowIndex) {
        console.log('inline editing rowIndex', rowIndex)
        this.editing[rowIndex + '-' + cell] = false;
        var systemNumber=this.ngxRows[rowIndex]["systemNumber"];
        if(true || !this.globalStorageService.getTurbineInProcessMapValue(systemNumber,"isTurbineInProcess")){
            this.ngxRows[rowIndex][cell] = event.target.value;
            this. updateTurbineDetails(systemNumber,event.target.value);
        }
        // }else{
        //     var tempValue=this.ngxRows[rowIndex][cell];
        //     this.ngxRows[rowIndex][cell]="Unable to update the Ip address";
        //     var _this=this;
        //     setTimeout(function(){_this.ngxRows[rowIndex][cell]=tempValue}, 2000);
        // }

        this.ngxRows = [...this.ngxRows];
        console.log('UPDATED!', this.ngxRows[rowIndex][cell]);
    }

    updateTurbineDetails(systemNumber,systemIpaddress){
        var behaviouralMap=new Map();
        var turbineArray=[];
        turbineArray.push(this.mapOfTurbines.get(systemNumber))
        behaviouralMap.set("listOfTurbines",turbineArray);
        behaviouralMap.set("isUpdateTurbineRequired",true);

        // Updating the turbine details
        var turbineDetails=this.mapOfTurbines.get(systemNumber);
        turbineDetails.ipaddress=systemIpaddress;
        turbineDetails.variableTimeStamp=undefined;

        // Updating gloabal turbine List
        var listOfTurbines=Array.from(this.mapOfTurbines.values());
        this.globalStorageService.setListOfTurbines(listOfTurbines,true);

        // Updating the processResponseArray
        var processResponseArray= this.globalStorageService.getMapOfprocessResponseArray();
        processResponseArray.delete(systemNumber);
        var listOfProcessResponses=Array.from(processResponseArray.values());
        this.globalStorageService.setProcessResponseArray(listOfProcessResponses);

        // Calling the GetVariableWithTimeStamp and GetTurbineInfo
        this.eventsService.getVariableStatusWithTimeStampEmitter.next(behaviouralMap);
    }

    private clearIrrelevantTableData(){
        var selectedTurbines = this.selectedTurbinesForBackup;
        for(var i=0; i<selectedTurbines.length; i++) {
            var turbineIP = selectedTurbines[i].turbineIP;
            var turbineId = selectedTurbines[i].turbineId;
            for(var k=0; k<this.ngxRows.length; k++) {
                //check if this is matching variable names
                if(turbineIP == this.ngxRows[k].ip) {
                    this.ngxRows[k].status_message = "-";
                    this.ngxRows[k].backup_status = "0%";
                }
            }
        }
        this.ngxRows = [...this.ngxRows];
    }



//******************* Upgrade copied Code  ***********//
    updateTableWithProcessResponse(response , processResponseArray) {
        var pollAgainForProgress = false;
        var presentProcess = "isGetTurbineInfoInProcess";
        if(response){
            processResponseArray = response.json().cmdResponse.ProcessResponses;
        	presentProcess = "isBackupInProcess";
        }
        var ngxMap = this.ngxMap;
        if(processResponseArray  && processResponseArray.length) {
            for(var i=0; i<processResponseArray.length; i++) {
                var processResponse = processResponseArray[i];
                var systemNumber = processResponse.systemNumber;
                var responseData = processResponse.responseData;
                var turbineRow = ngxMap.get(systemNumber);
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
                        if(responseData.progress!=null || responseData.progress!=undefined) turbineRow.set("progress",(responseData.progress).toFixed(0) + " %");
                        if(responseData.statusCode) turbineRow.set("statusCode",responseData.statusCode);
                        if(responseData.statusCode == "IN_PROGRESS") {
                             pollAgainForProgress = true;
                             this.globalStorageService.setTurbineInProcessMapValue(systemNumber, presentProcess, true);
                        }
                        if(responseData.statusCode == "SUCCESS") this.globalStorageService.setTurbineInProcessMapValue(systemNumber, presentProcess, false);
                        if(responseData && presentProcess=="isGetTurbineInfoInProcess") this.globalStorageService.setTurbineInProcessMapValue(systemNumber, presentProcess, false);
                        if(responseData.statusMessage) turbineRow.set("statusMessage",responseData.statusMessage);

                    }
                } else {
                    if(turbineRow) {
                        turbineRow.set("taskVersion","-");
                        turbineRow.set("lastTaskRunTime", "-");
                        turbineRow.set("progress","-");
                        this.globalStorageService.setTurbineInProcessMapValue(systemNumber, presentProcess, false);
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

        this.refreshDataTableWithMap(ngxMap);
        if(pollAgainForProgress) {
            this.callAndPollBackupStatus(response);
        }
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
            var singleRow = {"spinner" : spinner, "name": name,"systemNumber" : systemNumber, "ipAddress" : ipAddress, "turbineStatus": turbineStatus, "swVersion":swVersion, "ramSize" : ramSize, "cfc0Size":cfc0Size,"taskVersion":taskVersion,"lastTaskRunTime":lastTaskRunTime, "progress":progress};
            self.ngxRows.push(singleRow);
        });

        self.ngxRows = [...self.ngxRows];
    }

    private disableOrEnableBackupAction() {
        var selected = this.selectedTurbinesForBackup;
        for(var selectedTurbine of selected){
            var turbineRow = this.ngxMap.get(selectedTurbine.systemNumber);
            if(turbineRow.get("isInProcess")){
                this.isBackupButtonEnabled = false;
                return;
            }
        }
        this.isBackupButtonEnabled = true;
    }
}

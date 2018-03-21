import {
    Component,
    ViewEncapsulation
} from '@angular/core';
import {
    GlobalStorageService
} from '../services/globalstorage.service';
import {
    DataService
} from '../services/data.service';
import {
    Http,
    Response,
    RequestOptions
} from '@angular/http';
import {
    Headers
} from '@angular/http';
import {
    EventsService
} from '../services/events.service';
import { DatePipe } from '@angular/common';



@Component({
    encapsulation: ViewEncapsulation.None,
    moduleId: module.id,
    selector: 'restore-component',
    templateUrl: './restore.component.html',
    styleUrls: ['./restore.component.css', '../css/common.css']
})

export class RestoreComponent {
    constructor(private http: Http, private globalStorageService: GlobalStorageService, private dataService: DataService, private eventsService: EventsService, private datePipe : DatePipe) {

        this.eventsService.selectedTileEmitter.subscribe(selectedTile => {
            if (selectedTile == 4) {
                this.isDataAvailable=false;
                this.eventsService.mapOfTurbinesEmitter.subscribe(mapOfTurbines => {
                    if (mapOfTurbines) {
                        this.mapOfTurbines = mapOfTurbines;
                        var cmdParams = {
                            "turbineList": Array.from(mapOfTurbines.values()),
                            "platform": "DMP"
                        }
                        this.dataService.callPollAndGetResponseWhenSuccess("sendCommand", "SendCommandToEdge", cmdParams, "UpgradeStatus", true, 1, 1, 5000, this.updateTableWithProcessResponseFromUpgradeStatus.bind(this));

                    }
                });
            }
        });
    }
    selectedTurbinesForRestore = [];
    gridLossTag = '<span class="badge badge-danger">Grid Loss</span>';
    onlineTag = '<span class="badge badge-success">Online</span>';
    faSpinner = this.globalStorageService.defaultSpinner;
    editing = {};
    ngXRows = [];
    mapOfTurbines = new Map();
    mapOfTurbinesForRestore = new Map();
    arrayOfTurbinesForRestore = [];
    ngxMap = new Map();
    pollBucket = new Map();
    isRestoreStatusAlreadyPolling = false;
    processResponseArrayFromTurbineInfo = [];
    isDataAvailable=false;


    // rows = [
    //     { name: 'WTG154', system_number: '15022184', ip: '172.16.7.154', turbine_status: this.gridLossTag, current_version:'19050', backup_version: '-', restore_time: '-', ram_size: '128', cfc_space_size: '1720', restore_status: '-' },
    //     { name: 'WTG155', system_number: '105052230', ip: '172.16.7.155', turbine_status: this.gridLossTag, current_version:'19052', backup_version: '-', restore_time: '-', ram_size: '128', cfc_space_size: '764', restore_status: '-' },
    // ];



    ngOnInit() {
        // $("#r-loader1").rotator({
        //     starting: 0,
        //     ending: 100,
        //     percentage: true,
        //     color: 'green',
        //     lineWidth: 7,
        //     timer: 10,
        //     radius: 20,
        //     fontStyle: 'Calibri',
        //     fontSize: '10pt',
        //     fontColor: 'darkblue',
        //     backgroundColor: 'lightgray',
        // });
    }
    private populateTableWithTurbineInfo(mapOfTurbines) {
        var self = this;
        mapOfTurbines.forEach(function (value, key) {
            var systemNumber = key;
            var turbineObject = value;
            var turbineDetailsMap = new Map();

            if (turbineObject) {
                turbineDetailsMap.set("spinner", self.faSpinner);
                if (turbineObject.deviceName) {
                    turbineDetailsMap.set("name", turbineObject.deviceName)
                } else {
                    //turbineDetailsMap.set("name", self.faSpinner)
                }
                if (turbineObject.systemNumber) {
                    turbineDetailsMap.set("systemNumber", turbineObject.systemNumber)
                } else {
                    //turbineDetailsMap.set("systemNumber", self.faSpinner)
                }
                if (turbineObject.ipaddress) {
                    turbineDetailsMap.set("ipAddress", turbineObject.ipaddress)
                } else {
                   // turbineDetailsMap.set("ipAddress", self.faSpinner)
                }
                if (turbineObject.turbineStatus) {
                    turbineObject.turbineStatus == 6.000 ? turbineDetailsMap.set("turbineStatus", self.gridLossTag) : turbineDetailsMap.set("turbineStatus", self.onlineTag);
                } else {
                    //turbineDetailsMap.set("turbineStatus", self.faSpinner);
                }
                if (turbineObject.swVersion) {
                    turbineDetailsMap.set("swVersion", turbineObject.swVersion)
                } else {
                    //turbineDetailsMap.set("swVersion", self.faSpinner)
                }
                if (turbineObject.ramSize) {
                    turbineDetailsMap.set("ramSize", ((turbineObject.ramSize) / (1024 * 1024)).toFixed(0))
                } else {
                    //turbineDetailsMap.set("ramSize", self.faSpinner)
                }
                if (turbineObject.cfc0Size) {
                    turbineDetailsMap.set("cfc0Size", ((turbineObject.cfc0Size) / (1024 * 1024)).toFixed(0))
                } else {
                    //turbineDetailsMap.set("cfc0Size", self.faSpinner)
                }
                if (turbineObject.backupVersion) {
                    turbineDetailsMap.set("backupVersion", turbineObject.backupVersion)
                } else {
                    //turbineDetailsMap.set("backupVersion", self.faSpinner)
                }
                if (turbineObject.lastTaskRunTime) {
                    turbineDetailsMap.set("lastTaskRunTime", turbineObject.lastTaskRunTime)
                } else {
                    //turbineDetailsMap.set("lastTaskRunTime", self.faSpinner)
                }
                if (turbineObject.progress) {
                    turbineDetailsMap.set("progress", turbineObject.progress)
                } else {
                    //turbineDetailsMap.set("progress", self.faSpinner)
                }
            }
            self.ngxMap.set(systemNumber, turbineDetailsMap);
        });
        self.refreshDataTableWithMap(self.ngxMap);
    }
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
            var singleRow = {
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
        this.clearIrrelevantTableData();
        var listOfTurbinesToBeSent = [];
        var selectedTurbines = this.selectedTurbinesForRestore;
        var globalTurbineList = this.arrayOfTurbinesForRestore;
        for (var i = 0; i < selectedTurbines.length; i++) {
            var turbineBean = this.mapOfTurbinesForRestore.get(selectedTurbines[i].systemNumber);
            turbineBean.ipaddress = selectedTurbines[i].ipAddress; //Make sure inline edited data is fetched
            listOfTurbinesToBeSent.push(turbineBean);
        }
        var cmdParams = {
            "turbineList": listOfTurbinesToBeSent,
            "platform": "DMP"
        }
        this.dataService.callPollAndGetResponseWhenSuccess("sendCommand", "SendCommandToEdge", cmdParams, "Restore", null, 1, 1, 5000, this.callAndPollRestoreStatus.bind(this));
    }

    callAndPollRestoreStatus(response) {
        var self = this;
        var cmdParams;
        if (response) {
            cmdParams = JSON.parse(response.json().cmdParams);
        } else {
            cmdParams = {
                "turbineList": Array.from(this.pollBucket.values()),
                "platform": "DMP"
            }
        }
        this.isRestoreStatusAlreadyPolling = true;
        this.dataService.callPollAndGetResponseWhenSuccess("sendCommand", "SendCommandToEdge", cmdParams, "RestoreStatus", true, 1, 1, 5000, this.updateTableWithProcessResponse.bind(this));

        //Making the turbines "inProcess" in the process map
        var turbineList = cmdParams.turbineList;

        turbineList.forEach(function(value) {
            self.globalStorageService.setTurbineInProcessMapValue(value.systemNumber, "isRestoreInProcess", true);
        });
        self.refreshDataTableWithMap(self.ngxMap);

    }

    updateTableWithProcessResponseFromUpgradeStatus(response, processResponseArray) {
        if (response) {
            processResponseArray = response.json().cmdResponse.ProcessResponses;
        }
        if (processResponseArray) {
            for (var i = 0; i < processResponseArray.length; i++) {
                var processResponse = processResponseArray[i];
                var systemNumber = processResponse.systemNumber;
                var responseData = processResponse.responseData;
                if (responseData) {
                    this.mapOfTurbinesForRestore.set(systemNumber, this.mapOfTurbines.get(systemNumber));
                    this.arrayOfTurbinesForRestore.push(this.mapOfTurbines.get(systemNumber));
                }
            }
        }
        this.isDataAvailable=true;
        this.populateTableWithTurbineInfo(this.mapOfTurbinesForRestore);
        this.eventsService.processResponseEmitter.subscribe(processResponseArray => {
            if (!!processResponseArray) {
                this.processResponseArrayFromTurbineInfo = processResponseArray;
                this.updateTableWithProcessResponse(null, this.processResponseArrayFromTurbineInfo);
                this.pollBucket = this.mapOfTurbinesForRestore;
                this.callAndPollRestoreStatus(null);
            }
        });
    }

    updateTableWithProcessResponse(response, processResponseArray) {
        var pollAgainForProgress = false;
        var presentProcess = "isGetTurbineInfoInProcess";
        if (response) {
            processResponseArray = response.json().cmdResponse.ProcessResponses;
            presentProcess = "isRestoreInProcess";
        }
        var ngxMap = this.ngxMap;
        if (processResponseArray) {
            for (var i = 0; i < processResponseArray.length; i++) {
                var processResponse = processResponseArray[i];
                var systemNumber = processResponse.systemNumber;
                var responseData = processResponse.responseData;
                if (responseData) {
                    var turbineRow = ngxMap.get(systemNumber);
                    if (turbineRow) {
                        if (responseData.cfc0Size) turbineRow.set("cfc0Size", (((responseData.cfc0Size) / (1024 * 1024)).toFixed(0)));
                        if (responseData.cpuVersion) turbineRow.set("cpuVersion", responseData.cpuVersion);
                        if (responseData.ramSize) turbineRow.set("ramSize", (((responseData.ramSize) / (1024 * 1024)).toFixed(0)));
                        if (responseData.swVersion) turbineRow.set("swVersion", responseData.swVersion);
                        if (responseData.turbineNumber) turbineRow.set("turbineNumber", responseData.turbineNumber);
                        if (responseData.turbineStatus) turbineRow.set("turbineStatus", this.globalStorageService.mapOfTurbineStatuses.get(responseData.turbineStatus));
                        if (responseData.backupVersion) turbineRow.set("backupVersion", responseData.backupVersion);
                        if (responseData.lastTaskRunTime) turbineRow.set("lastTaskRunTime", this.datePipe.transform(responseData.lastTaskRunTime, "medium"));
                        if (responseData.progress != null || responseData.progress != undefined) turbineRow.set("progress", (responseData.progress).toFixed(0) + " %");
                        if (responseData.statusCode) turbineRow.set("statusCode", responseData.statusCode);
                        if (responseData.statusCode == "IN_PROGRESS") {
                            pollAgainForProgress = true;
                            this.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isRestoreInProcess", true);
                        } else {
                            this.pollBucket.delete(systemNumber);
                            this.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isRestoreInProcess", false);
                        }
                        if (responseData.statusMessage) turbineRow.set("statusMessage", responseData.statusMessage);
                        ngxMap.set(systemNumber, turbineRow);
                    }

                } else {
                    if (turbineRow) {
                        turbineRow.set("backupVersion", "-");
                        turbineRow.set("lastTaskRunTime", "-");
                        turbineRow.set("progress", "-");
                        this.globalStorageService.setTurbineInProcessMapValue(systemNumber, presentProcess, false);
                        ngxMap.set(systemNumber, turbineRow);
                    }
                }
                if(this.globalStorageService.getTurbineInProcessMapValue(systemNumber, "isTurbineInProcess")){
                    turbineRow.set("spinner" , this.globalStorageService.defaultSpinner);
                } else {
                    turbineRow.set("spinner" , null);
                }
            }
        }

        this.refreshDataTableWithMap(ngxMap);
        if (pollAgainForProgress) {
            this.callAndPollRestoreStatus(response);
        }
    }
    onCheckboxChange({selected}) {
        if (selected) {
            this.selectedTurbinesForRestore = selected;
        }
    }
    private clearIrrelevantTableData() {
        var selectedTurbines = this.selectedTurbinesForRestore;
        for (var i = 0; i < selectedTurbines.length; i++) {
            var turbineIP = selectedTurbines[i].turbineIP;
            var turbineId = selectedTurbines[i].turbineId;
            for (var k = 0; k < this.ngXRows.length; k++) {
                //check if this is matching variable names
                if (turbineIP == this.ngXRows[k].ip) {
                    this.ngXRows[k].status_message = "-";
                    this.ngXRows[k].backup_status = "0%";
                }
            }
        }
        this.ngXRows = [...this.ngXRows];
    }
    updateViaInline(event, cell, rowIndex) {
        console.log('inline editing rowIndex', rowIndex)
        this.editing[rowIndex + '-' + cell] = false;
        this.ngXRows[rowIndex][cell] = event.target.value;
        this.ngXRows = [...this.ngXRows];
        console.log('UPDATED!', this.ngXRows[rowIndex][cell]);
    }

}
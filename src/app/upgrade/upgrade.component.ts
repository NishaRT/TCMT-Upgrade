import {
    Component,
    AfterViewChecked
} from '@angular/core';
import {
    GlobalStorageService
} from '../services/globalstorage.service';
import {
    Http
} from '@angular/http';
import {
    DataService
} from '../services/data.service';
import {
    EventsService
} from '../services/events.service';
import {
    DatePipe
} from '@angular/common';



@Component({
    moduleId: module.id,
    selector: 'upgrade-component',
    templateUrl: './upgrade.component.html',
    styleUrls: ['./upgrade.component.css', '../css/common.css']
})

export class UpgradeComponent {
    constructor(private http: Http, private globalStorageService: GlobalStorageService, private dataService: DataService, private eventsService: EventsService, private datePipe: DatePipe) {
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
            if (selectedTile == 3) {
                this.pollBucket = this.globalStorageService.getListOfTurbines();
                this.callAndPollUpgradeStatus(null);
            }
        });
    }


    defaultSpinner = this.globalStorageService.defaultSpinner;
    gridLossTag = this.globalStorageService.gridLossTag;
    onlineTag = this.globalStorageService.onlineTag;
    ngxRows = [];
    ngxMap = new Map();
    selectedTurbinesForUpgrade = [];

    mapOfTurbines = this.globalStorageService.getMapOfTurbines();

    isFileStatusPolling = false;

    pollBucket = [];




    onCheckboxChange({
        selected
    }) {
        if (selected) {
            this.selectedTurbinesForUpgrade = selected;
            for (var i = 0; i < selected.length; i++) {
                if (selected[i].backendStatus == "taskRunning") {
                    //this.isUpgradeAvailable = false;
                }
            }
        }
    }


    // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ DATA UPDATION CODE BLOCK  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^//

    populateTableWithTurbineInfo(mapOfTurbines) {
        var self = this;
        mapOfTurbines.forEach(function (value, key) {
            //console.log(key + ' = ' + value);
            var systemNumber = key;
            var turbineObject = value;
            var turbineDetailsMap = new Map();

            if (turbineObject) {
                turbineDetailsMap.set("spinner", self.defaultSpinner);
                if (turbineObject.deviceName) {
                    turbineDetailsMap.set("name", turbineObject.deviceName)
                } // else {turbineDetailsMap.set("name", self.defaultSpinner)} 
                if (turbineObject.systemNumber) {
                    turbineDetailsMap.set("systemNumber", turbineObject.systemNumber)
                } //else{turbineDetailsMap.set("systemNumber", self.defaultSpinner)}
                if (turbineObject.ipaddress) {
                    turbineDetailsMap.set("ipAddress", turbineObject.ipaddress)
                } //else{turbineDetailsMap.set("ipAddress", self.defaultSpinner)}
                if (turbineObject.turbineStatus) {
                    turbineObject.turbineStatus == 6.000 ? turbineDetailsMap.set("turbineStatus", self.gridLossTag) : turbineDetailsMap.set("turbineStatus", self.onlineTag);
                } else {
                    // turbineDetailsMap.set("turbineStatus", self.defaultSpinner);
                }
                if (turbineObject.swVersion) {
                    turbineDetailsMap.set("swVersion", turbineObject.swVersion)
                } //else{turbineDetailsMap.set("swVersion", self.defaultSpinner)}
                if (turbineObject.ramSize) {
                    turbineDetailsMap.set("ramSize", ((turbineObject.ramSize) / (1024 * 1024)).toFixed(0))
                } //else{turbineDetailsMap.set("ramSize", self.defaultSpinner)}
                if (turbineObject.cfc0Size) {
                    turbineDetailsMap.set("cfc0Size", ((turbineObject.cfc0Size) / (1024 * 1024)).toFixed(0))
                } //else{turbineDetailsMap.set("cfc0Size", self.defaultSpinner)}
                if (turbineObject.taskVersion) {
                    turbineDetailsMap.set("taskVersion", turbineObject.taskVersion)
                } //else{turbineDetailsMap.set("taskVersion", self.defaultSpinner)}
                if (turbineObject.lastTaskRunTime) {
                    turbineDetailsMap.set("lastTaskRunTime", turbineObject.lastTaskRunTime)
                } // else{turbineDetailsMap.set("lastTaskRunTime", self.defaultSpinner)}
                if (turbineObject.progress) {
                    turbineDetailsMap.set("progress", turbineObject.progress)
                } //else{turbineDetailsMap.set("progress", self.defaultSpinner)}
            }
            self.ngxMap.set(systemNumber, turbineDetailsMap);
        });
        self.refreshDataTableWithMap(self.ngxMap);
    }

    //Refreshes enitre data table with whatever data is given - Given Map is the end data//
    refreshDataTableWithMap(ngxMap) {
        var self = this;
        self.ngxRows = [];

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
            var taskVersion = turbineObject.get("taskVersion");
            var lastTaskRunTime = turbineObject.get("lastTaskRunTime");
            var progress = turbineObject.get("progress");
            var singleRow = {
                "spinner": spinner,
                "name": name,
                "systemNumber": systemNumber,
                "ipAddress": ipAddress,
                "turbineStatus": turbineStatus,
                "swVersion": swVersion,
                "ramSize": ramSize,
                "cfc0Size": cfc0Size,
                "taskVersion": taskVersion,
                "lastTaskRunTime": lastTaskRunTime,
                "progress": progress
            };
            self.ngxRows.push(singleRow);
        });

        self.ngxRows = [...self.ngxRows];
    }

    // vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv  DATA UPDATION CODE BLOCK vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv//



    // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^  SERVICE CALLS CODE START ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^//
    sendUpgradeCommand() {
        var listOfTurbinesToBeSent = [];
        var selectedTurbines = this.selectedTurbinesForUpgrade;
        var globalTurbineList = this.globalStorageService.getListOfTurbines();
        for (var i = 0; i < selectedTurbines.length; i++) {
            var turbineBean = this.mapOfTurbines.get(selectedTurbines[i].systemNumber);
            //  turbineBean.ipAddress = selectedTurbines[i].ipAddress; //Make sure inline edited data is fetched
            listOfTurbinesToBeSent.push(turbineBean);
        }
        var cmdParams = {
            "turbineList": listOfTurbinesToBeSent,
            "platform": "DMP"
        }
        this.dataService.callPollAndGetResponseWhenSuccess("sendCommand", "SendCommandToEdge", cmdParams, "Upgrade", null, 1, 1, 5000, this.callAndPollUpgradeStatus.bind(this));
    }

    callAndPollUpgradeStatus(response) {
        var self = this;
        var cmdParams;

        if (response) {
            cmdParams = JSON.parse(response.json().cmdParams);
        } else {
            cmdParams = {
                "turbineList": this.pollBucket,
                "platform": "DMP"
            }
        }
        this.isFileStatusPolling = true;
        this.dataService.callPollAndGetResponseWhenSuccess("sendCommand", "SendCommandToEdge", cmdParams, "UpgradeStatus", null, 1, 1, 5000, this.updateTableWithProcessResponse.bind(this));

        //MAking the turbines "inProcess" in the process map
        var turbineList = cmdParams.turbineList;
        turbineList.forEach(function(value) {
            self.globalStorageService.setTurbineInProcessMapValue(value.systemNumber, "isUpgradeInProcess", true);
        });
        self.refreshDataTableWithMap(self.ngxMap);
    }


    //vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv SERVICE CALLS CODE BLOCK vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv //



    // **********************************MISC CODE ***********************************************//
    updateTableWithProcessResponse(response, processResponsesArray) {
        var pollAgainForProgress = false;
        var ngxMap = this.ngxMap;
        var presentProcess = "isGetTurbineInfoInProcess";
        if (response) {
            processResponsesArray = response.json().cmdResponse.ProcessResponses;
            presentProcess = "isUpgradeInProcess";
        }
        if (processResponsesArray && processResponsesArray.length) {
            for (var i = 0; i < processResponsesArray.length; i++) {
                var processResponse = processResponsesArray[i];
                var systemNumber = processResponse.systemNumber;
                var responseData = processResponse.responseData;
                var turbineRow = ngxMap.get(systemNumber);
                if (responseData) {
                    if (turbineRow) {
                        if (responseData.cfc0Size) turbineRow.set("cfc0Size", (((responseData.cfc0Size) / (1024 * 1024)).toFixed(0)));
                        if (responseData.cpuVersion) turbineRow.set("cpuVersion", responseData.cpuVersion);
                        if (responseData.ramSize) turbineRow.set("ramSize", (((responseData.ramSize) / (1024 * 1024)).toFixed(0)));
                        if (responseData.swVersion) turbineRow.set("swVersion", responseData.swVersion);
                        if (responseData.turbineNumber) turbineRow.set("turbineNumber", responseData.turbineNumber);
                        if (responseData.turbineStatus) turbineRow.set("turbineStatus", this.globalStorageService.mapOfTurbineStatuses.get(responseData.turbineStatus));
                        if (responseData.taskVersion) turbineRow.set("taskVersion", responseData.taskVersion);
                        if (responseData.lastTaskRunTime) turbineRow.set("lastTaskRunTime", this.datePipe.transform(responseData.lastTaskRunTime, "medium"));
                        if (responseData.progress != null || responseData.progress != undefined) turbineRow.set("progress", (responseData.progress).toFixed(0) + " %");
                        if (responseData.statusCode) turbineRow.set("statusCode", responseData.statusCode);
                        if (responseData.statusCode == "IN_PROGRESS") {
                            pollAgainForProgress = true;
                            this.globalStorageService.setTurbineInProcessMapValue(systemNumber, presentProcess, true);
                        } else {
                            this.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isUpgradeInProcess", true);
                        }
                        if (responseData.statusMessage) turbineRow.set("statusMessage", responseData.statusMessage);
                    }
                } else {
                    if (turbineRow) {
                        turbineRow.set("taskVersion", "-");
                        turbineRow.set("lastTaskRunTime", "-");
                        turbineRow.set("progress", "-");
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
        if (pollAgainForProgress) {
            this.callAndPollUpgradeStatus(response);
        }
    }

    // **********************************MISC CODE ***********************************************//



}
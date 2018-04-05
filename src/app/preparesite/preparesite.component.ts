import { Component, Injectable, Input, SimpleChanges, OnChanges, ViewEncapsulation } from '@angular/core';
import { DataService} from '../services/data.service';
import { GlobalStorageService } from '../services/globalstorage.service';
import { Response, RequestOptions } from '@angular/http';
import { EventsService } from '../services/events.service';
import { GEUtils } from '../services/geutils.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';



@Component({
    encapsulation: ViewEncapsulation.None,
    moduleId: module.id,
    selector: 'preparesite-component',
    templateUrl: './preparesite.component.html',
    styleUrls: ['./preparesite.component.css', '../css/common.css','../css/ngx-material.css']
})

export class PrepareSiteComponent {
    constructor(private http : HttpClient,
        private globalStorageService: GlobalStorageService,
        private dataService: DataService,
        private eventsService: EventsService,
        private geUtils: GEUtils,
        private cookieService: CookieService) {

        this.subscribeMapOfTurbinesEmitter();

        // Site change emitter
        this.subscribeToSiteChangeEmitter();
    }

    //Static Data
    selectedParkName = this.globalStorageService.selectedParkName;
    defaultSpinner = this.globalStorageService.defaultSpinner;
    turbineTableMessages = { emptyMessage: "-"}
    fileTableMessages = { emptyMessage: "-"}

    //Booleans
    isFileStatusPolling = false;
    isGetTurbineInfoButtonEnabled = true;


    finalFiles = {};

    //Table 1 for turbine types
    ngxRowsForTurbineTypes = [];
    ngxMapForTurbineTypes = new Map();
    chosenFile;
    is1xSelected;
    is2xSelected;
    tickedTurbineTypesMap = new Map();
    pollBucketForTurbineTypes = new Map();
    areAxisFilesAvailable = false;
    chooseFilesDisplayMessage = "";


    //Table 2 for turbines
    ngxRowsForTurbines = [];
    ngxMapForTurbines = new Map();
    editing = {};
    selectedTurbinesForPrepareSite = [];
    checkedTurbinesMap = new Map();
    ipPattern = new RegExp('^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$');
    isPollBucketAddingFlag = true;


    //PollBucketForTurbines
    pollBucketForTurbines = new Map();

    //Method call when clicked on choose files button
    callGetFilesInFolder() {
        if(Object.keys(this.finalFiles).length){
            return this.finalFiles;
        } else {
            var self = this;
            self.areAxisFilesAvailable = false;
            self.chooseFilesDisplayMessage = self.defaultSpinner +  " Fetching files please wait";
            var cmdParams = {"fetchFromAxisBoolean":true,"mode":1,"parkId": this.globalStorageService.selectedParkId,"files":[{	"turbineType": "1x"}, {	"turbineType": "2x"}]};
            this.dataService.callPollAndGetResponseWhenSuccess("sendCommand","GetFilesInFolder",cmdParams,null,1,1,3000, this.setFilesInModal.bind(this), null);
        }
    }

    private setFilesInModal(response, success, timeOut) {
        var self = this;
        if(success){
            self.areAxisFilesAvailable = true;
            var files = response.cmdResponse.files;
            self.finalFiles = {};
            if(files.length){
                for(var i=0; i<files.length; i++) {
                    self.finalFiles[files[i].turbineType] = files[i].files;
                }
            } else {
                self.areAxisFilesAvailable = false;
                self.chooseFilesDisplayMessage = "No files available";
            }
        } else if (timeOut){
            self.chooseFilesDisplayMessage = self.globalStorageService.exclamationTriangle + "Request timed out while fetching files, Please try again";
        } else {
            self.chooseFilesDisplayMessage =  self.globalStorageService.exclamationTriangle + "Error occurred while fetching files, Please try again";
        }
    }

    updatePercentageInTable(response, success, timeOut) {
        if(success){
            var self = this;
            this.isFileStatusPolling = false;
            var cmdParams = JSON.parse(response.cmdParams);
            var tempFilesList = response.cmdResponse.fileDetails;
            if(tempFilesList && tempFilesList.length) {
                for(var i=0; i<tempFilesList.length; i++) {
                    var fileCurrentStatus = tempFilesList[i].fileCurrentStatus;
                    var displayableStatus;
                    switch(fileCurrentStatus) {
                        case "DOWNLOAD_FILE_FAILED":
                            displayableStatus = fileCurrentStatus;
                            self.pollBucketForTurbineTypes.delete(tempFilesList[i].turbineType);
                            break;
                        case "DOWNLOAD_FILE_NOT_INITIATED":
                            displayableStatus = "-";
                            self.pollBucketForTurbineTypes.delete(tempFilesList[i].turbineType);
                            break;
                        case "DOWNLOAD_FILE_IN_PROGRESS":
                            displayableStatus = fileCurrentStatus; //tempFilesList[i].dataTransferStatusInPercentage + "%";
                            break;
                        case "DOWNLOAD_FILE_ALREADY_IN_PROGRESS":
                            displayableStatus = fileCurrentStatus; //tempFilesList[i].dataTransferStatusInPercentage + "%";
                            break;
                        case "DOWNLOAD_FILE_COMPLETED":
                            displayableStatus = fileCurrentStatus; //tempFilesList[i].dataTransferStatusInPercentage + "%";
                            self.pollBucketForTurbineTypes.delete(tempFilesList[i].turbineType);
                            break;
                        }
                        var turbineTypeMap = self.ngxMapForTurbineTypes.get(tempFilesList[i].turbineType);
                        if(turbineTypeMap){
                            turbineTypeMap.set("fileChosen", tempFilesList[i].fileName);
                            turbineTypeMap.set("uploadStatus", displayableStatus);
                            self.ngxMapForTurbineTypes.set(tempFilesList[i].turbineType,turbineTypeMap);
                        }
                    //self.ngxMapForTurbineTypes(tempFilesList[i].turbineType, null, tempFilesList[i].fileName, displayableStatus);

                    //If download complete, remove the turbine file from array and poll
                    // if(fileCurrentStatus == "DOWNLOAD_FILE_COMPLETED" || fileCurrentStatus == "DOWNLOAD_FILE_NOT_INITIATED" || fileCurrentStatus == "DOWNLOAD_FILE_FAILED" ) {
                    //     //this.pollBucketForTurbineTypes = this.pollBucketForTurbineTypes.filter(function(v) { return v.turbineType !== tempFilesList[i].turbineType }); //Returns only those arrays which doesnt match the present turbineTypes
                    //     self.pollBucketForTurbineTypes.delete(tempFilesList[i].turbineType);
                    // }
                }
                if(this.pollBucketForTurbineTypes.size && !this.isFileStatusPolling) {
                    self.callAndPollGetDownloadFileStatus(null);
                }
            }
        } else if(timeOut){

        } else {
            var cmdParams = JSON.parse(response["cmdParams"]);
            debugger;
        }
        self.refreshTurbineTypesTable(self.ngxMapForTurbineTypes);
    }

    private callAndPollGetDownloadFileStatus(response) {
        var tempListOfTurbineTypes;
        if(response){
            tempListOfTurbineTypes = JSON.parse(response.cmdParams).fileDetails;
        } else {
            tempListOfTurbineTypes = [{"turbineType":"1x", "fileName": ""}, {"turbineType":"2x", "fileName": ""}];
        }
        this.isFileStatusPolling = true;
        var self = this;
        var cmdParams = {"parkId":this.globalStorageService.selectedParkId,"parkName":this.globalStorageService.selectedParkName,"mode":1,"fileDetails": tempListOfTurbineTypes};
        self.dataService.callPollAndGetResponseWhenSuccess("sendCommand","DownloadFilesStatus",cmdParams,null,1,1,3000,self.updatePercentageInTable.bind(this), null);
    }


    private populateTurbineTypesTableAndCallGetFiles(mapOfTurbines) {
        var self = this;
        var filesTypesArray = [];
        mapOfTurbines.forEach(turbine => {
                    var defaultDetailedMap = new Map();
                    defaultDetailedMap.set("existingFiles" , self.defaultSpinner);
                    defaultDetailedMap.set("fileChosen", "-");
                    defaultDetailedMap.set("uploadStatus", "-");
            if(turbine.turbineType.charAt(0) == "1"){
                if(!self.ngxMapForTurbineTypes.get("1x")){
                    self.ngxMapForTurbineTypes.set("1x", defaultDetailedMap);
                    filesTypesArray.push({"turbineType": "1x"});
                }
            } else if (turbine.turbineType.charAt(0) == "2") {
                if(!self.ngxMapForTurbineTypes.get("2x")){
                    self.ngxMapForTurbineTypes.set("2x", defaultDetailedMap);
                    filesTypesArray.push({"turbineType": "2x"});
                }
            }
        });

        self.refreshTurbineTypesTable(self.ngxMapForTurbineTypes);
        this.callGetFilesInFolderWithParkIdForExistingFiles(filesTypesArray);
    }


    refreshTurbineTypesTable(ngxMap) {
        var self = this;
        self.ngxRowsForTurbineTypes = [];

        ngxMap.forEach(function(value, key) {
            var turbineType = key;
            var detailedMap = value;
            if(detailedMap){
                var existingFiles = detailedMap.get("existingFiles");
                var fileChosen = detailedMap.get("fileChosen");
                var uploadStatus = detailedMap.get("uploadStatus");
            }
            var isPolling = !!self.pollBucketForTurbineTypes.get(turbineType);
            var singleRow = {"isPolling": isPolling, "turbineType" : turbineType , "existingFiles" : existingFiles, "fileChosen": fileChosen, "uploadStatus" : uploadStatus};
            self.ngxRowsForTurbineTypes.push(singleRow);
        });

        self.ngxRowsForTurbineTypes = [...self.ngxRowsForTurbineTypes];
    }

    startPushToSite() {
        var call = true;
        var self = this;
        var tempListOfTurbineTypesToPush = [];
        self.pollBucketForTurbineTypes = new Map(self.tickedTurbineTypesMap);
        self.clearTickedTurbinesMapAndCheckboxes(self.tickedTurbineTypesMap);
        if(self.pollBucketForTurbineTypes.size) {
            self.pollBucketForTurbineTypes.forEach(function(value, key){
                var turbineType = key;
                var detailedMap = value;
                var fileChosen = detailedMap.get("fileChosen");
                if(fileChosen == "-") {
                    alert("Please choose a file for the selected version(s)");
                    self.pollBucketForTurbineTypes.delete(turbineType);
                    return;
                }
                tempListOfTurbineTypesToPush.push({"fileName" : fileChosen, "turbineType": turbineType});
                self.ngxMapForTurbineTypes.get(turbineType).set("uploadStatus", "0%");
            });

            //call to DownloadFiles and its polling
            var cmdParams = { "fileDetails" : tempListOfTurbineTypesToPush, "parkId" : self.globalStorageService.selectedParkId, "parkName": self.globalStorageService.selectedParkName, "mode" : 1};
            self.dataService.callPollAndGetResponseWhenSuccess("sendCommand","DownloadFiles",cmdParams,null,1,1,3000, self.callAndPollGetDownloadFileStatus.bind(this), null);
            tempListOfTurbineTypesToPush = [];
        }
        self.refreshTurbineTypesTable(self.ngxMapForTurbineTypes);
    }

    updateViaInlineIpAddress(event, cell, rowIndex) {
        //console.log('inline editing rowIndex', rowIndex)
        this.editing[rowIndex + '-' + cell] = false;
        var systemNumber=this.ngxRowsForTurbines[rowIndex]["systemNumber"];
        if(true || !this.globalStorageService.getTurbineInProcessMapValue(systemNumber,"isTurbineInProcess")){
            var tempValue=event.target.value;
            var ipDuplicateFlag = this.checkForIpDuplicates(tempValue);
            if(this.ipPattern.test(tempValue) && tempValue.length && !ipDuplicateFlag){
                this.ngxRowsForTurbines[rowIndex][cell] = tempValue;
                var turbineDetails =  this.globalStorageService.getMapOfTurbines().get(systemNumber);
                turbineDetails.ipaddress = tempValue;
                this.ngxMapForTurbines.get(systemNumber).set("ipAddress", tempValue);
                this.globalStorageService.getMapOfTurbines().set(systemNumber, turbineDetails);
            } else{
                var turbineDetails =  this.globalStorageService.getMapOfTurbines().get(systemNumber);
                this.ngxRowsForTurbines[rowIndex][cell] = turbineDetails.ipaddress;
            }
           // this. updateTurbineDetails(systemNumber,event.target.value);
        }
        this.ngxRowsForTurbines = [...this.ngxRowsForTurbines];
        //console.log('UPDATED!', this.ngxRows[rowIndex][cell]);
    }

    // Checking for the ip duplicates
    checkForIpDuplicates(editedValue){
        var ipDuplicateFlag = false;
        var turbineBeanValues: Array<any>;
        turbineBeanValues = Array.from(this.globalStorageService.getMapOfTurbines().values());
        var trubineBean = <any>{};
        for(let turbineBean of turbineBeanValues){
            if( editedValue ==  turbineBean.ipaddress){
                ipDuplicateFlag = true;
            }
        }
        return ipDuplicateFlag;
    }

    //Refreshes enitre data table with whatever data is given - Given Map is the end data//
    refreshDataTableWithMap(ngxMapOfTurbines) {
        var self = this;
        self.ngxRowsForTurbines = [];

        ngxMapOfTurbines.forEach(function(value, key) {
            var systemNumber = key;
            var turbineObject= value;
            var spinner = turbineObject.get("spinner");
            var name = turbineObject.get("name");
            var ipAddress = turbineObject.get("ipAddress");
            var turbineStatus = turbineObject.get("turbineStatus");
            var turbineInProcessMap = self.globalStorageService.getAllTurbineInProcessMap().get(systemNumber);
            var singleRow = {"turbineInProcessMap" : turbineInProcessMap, "spinner" : spinner, "name": name,"systemNumber" : systemNumber, "ipAddress" : ipAddress, "turbineStatus":turbineStatus};
            self.ngxRowsForTurbines.push(singleRow);
        });

        self.ngxRowsForTurbines = [...self.ngxRowsForTurbines];
    }

    private populateTurbineDetailsTable(mapOfTurbines) {
        var self = this;
        mapOfTurbines.forEach(function(value, key) {
            var systemNumber = key + "";
            var turbineObject = value;
            var turbineDetailsMap = new Map();

            if(turbineObject){
                turbineDetailsMap.set("spinner", self.defaultSpinner);
                if(turbineObject.deviceName) {turbineDetailsMap.set("name",turbineObject.deviceName)}// else {turbineDetailsMap.set("name", self.defaultSpinner)}
                if(turbineObject.systemNumber) {turbineDetailsMap.set("systemNumber",turbineObject.systemNumber)} //else{turbineDetailsMap.set("systemNumber", self.defaultSpinner)}
                if(turbineObject.ipaddress) {turbineDetailsMap.set("ipAddress",turbineObject.ipaddress)} //else{turbineDetailsMap.set("ipAddress", self.defaultSpinner)}
                turbineDetailsMap.set("turbineStatus","-")
            }
            self.ngxMapForTurbines.set(systemNumber,turbineDetailsMap);
          });
        self.refreshDataTableWithMap(self.ngxMapForTurbines);
    }

    private callGetTurbineInfo(){
        var self = this;
        this.checkedTurbinesMap.forEach(function(value, systemNumber){
            self.globalStorageService.getPollBucketForTurbines().set(systemNumber, self.globalStorageService.getMapOfTurbines().get(systemNumber));
            self.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isGetTurbineInfoInProcess", true);
            self.ngxMapForTurbines.get(systemNumber).set("turbineStatus", "-");
            self.checkedTurbinesMap.delete(systemNumber);
        });
        // Calling the getTurbineInfo API for the selected turbines
        this.getGetTurbineInfoOfTurbines(this.globalStorageService.getPollBucketForTurbines(), "GetTurbineInfo", this.processGetTurbineInfoOfTurbines.bind(this));
        this.refreshDataTableWithMap(this.ngxMapForTurbines);
    }

    getGetTurbineInfoOfTurbines(mapOfSelectedDMPTurbines, cmdAction, callbackFn) {
        if(mapOfSelectedDMPTurbines.size){

            var turbineCountMapForTurbineInfo = this.globalStorageService.getTurbineCountMapForTurbineInfo();
            mapOfSelectedDMPTurbines.forEach(function(value, key) {
                turbineCountMapForTurbineInfo.set(key, 0);
            });

            var cmdParams = {"turbineList" :  Array.from(mapOfSelectedDMPTurbines.values()), "platform" : "DMP"};
            this.dataService.callPollAndGetResponseWhenSuccessWithPollingCount("sendCommand", "SendCommandToEdge", cmdParams, cmdAction, 1, 1, 5000, this.globalStorageService.getGeneralConfigurationsMap().get("getStatusForSendCmdCount"), this.processGetTurbineInfoOfTurbines.bind(this), this.processGetTurbineInfoOfTurbines.bind(this), this.processGetTurbineInfoOfTurbines.bind(this));
        }
    }

    private processGetTurbineInfoOfTurbines(response) {
        // Success scenario

        if(response.cmdStatus){
            if(response.cmdStatus == 5){

            var processResponseArray = response.cmdResponse.ProcessResponses;
            var turbineListMap = this.globalStorageService.getPollBucketForTurbines();
            var activeTurbineProcessListMap = this.globalStorageService.getActiveTurbineProcessListMap();
            var activeTurbineMap = this.globalStorageService.getActiveTurbineMap();
            var failedTurbineListMap = this.globalStorageService.getFailedTurbineMap();
            var turbineCountMapForTurbineInfo = this.globalStorageService.getTurbineCountMapForTurbineInfo();

            if(processResponseArray  && processResponseArray.length) {
                for(var i=0; i<processResponseArray.length; i++) {
                    var processResponse = processResponseArray[i];
                    var systemNumber = processResponse.systemNumber;
                    var responseData = processResponse.responseData;
                    var turbineRow = this.ngxMapForTurbines.get(systemNumber);
                    if(responseData.turbineStatus<1000){
                        turbineRow.set("turbineStatus","CONNECTION - SUCCESS AND VALID");
                        activeTurbineProcessListMap.set(systemNumber, processResponse);
                        activeTurbineMap.set(systemNumber, turbineListMap.get(systemNumber));
                        turbineListMap.delete(systemNumber);
                        turbineCountMapForTurbineInfo.set(systemNumber, 0);
                        // Unwanted code lets see after it may required or not
                        //this.subscribeToGlobalPollingStopFlagEmitter();
                        // Emitting the process response of the turbines
                        this.eventsService.processResponseMapEmitter.next(activeTurbineProcessListMap);
                        this.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isGetTurbineInfoInProcess", false);
                    }else if(responseData.turbineStatus==2000){
                        turbineRow.set("turbineStatus","CONNECTION - FAILED");
                        failedTurbineListMap.set(systemNumber, turbineListMap.get(turbineListMap));
                        turbineListMap.delete(systemNumber);
                        turbineCountMapForTurbineInfo.set(systemNumber, 0);
                        this.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isGetTurbineInfoInProcess", false);
                    }else if(responseData.turbineStatus==3000){
                        turbineRow.set("turbineStatus","CONNECTION - SUCCESS AND UNKNOWN");
                        activeTurbineProcessListMap.set(systemNumber, processResponse);
                        activeTurbineMap.set(systemNumber, turbineListMap.get(systemNumber));
                        turbineListMap.delete(systemNumber);
                        turbineCountMapForTurbineInfo.set(systemNumber, 0);
                        this.eventsService.processResponseMapEmitter.next(activeTurbineProcessListMap);
                        this.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isGetTurbineInfoInProcess", false);
                    }else if(responseData.turbineStatus==4000){
                        turbineRow.set("turbineStatus","CONNECTION - WRONG CONFIGURATION");
                        failedTurbineListMap.set(systemNumber, turbineListMap.get(turbineListMap));
                        turbineListMap.delete(systemNumber);
                        turbineCountMapForTurbineInfo.set(systemNumber, 0);
                        this.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isGetTurbineInfoInProcess", false);
                    }

                    // Increasing of the count of the GetTurbineInfoStatus or remove from selected queue
                    if( turbineCountMapForTurbineInfo.get(systemNumber) > this.globalStorageService.getGeneralConfigurationsMap().get("countOfGetTurbineStausPerTurbine")){
                        failedTurbineListMap.set(systemNumber, turbineListMap.get(turbineListMap));
                        turbineListMap.delete(systemNumber);
                    }else{
                        turbineCountMapForTurbineInfo.set(systemNumber, turbineCountMapForTurbineInfo.get(systemNumber)+1);
                    }

                    if(turbineRow){
                        this.ngxMapForTurbines.set(systemNumber, turbineRow);
                    }

                }
            }

            }else if( response.cmdStatus == 2){
                var turbineListMap = this.globalStorageService.getPollBucketForTurbines();
                var turbineCountMapForTurbineInfo = this.globalStorageService.getTurbineCountMapForTurbineInfo();
                var self = this;
                turbineListMap.forEach(function(value ,key){
                    var systemNumber = key;
                    var turbineRow = self.ngxMapForTurbines.get(systemNumber);
                    turbineRow.set("turbineStatus","Unable to reach the controller");
                    turbineCountMapForTurbineInfo.set(systemNumber, 0);
                    self.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isGetTurbineInfoInProcess", false);
                    turbineListMap.delete(systemNumber);
                });

            }
        }else if(response.error){
            var turbineListMap = this.globalStorageService.getPollBucketForTurbines();
            var turbineCountMapForTurbineInfo = this.globalStorageService.getTurbineCountMapForTurbineInfo();
            var self = this;
                turbineListMap.forEach(function(value ,key){
                    var systemNumber = key;
                    var turbineRow = self.ngxMapForTurbines.get( systemNumber );
                    turbineRow.set("turbineStatus",response.errorDesc);
                    turbineCountMapForTurbineInfo.set(systemNumber, 0);
                    self.globalStorageService.setTurbineInProcessMapValue(systemNumber, "isGetTurbineInfoInProcess", false);
                    turbineListMap.delete(systemNumber);
                });
        }

        // Updating the selected list of the turbines globally
        // this.globalStorageService.setSelectedTurbineMap(turbineListMap);
        this.refreshDataTableWithMap(this.ngxMapForTurbines);


        // Calling for the GetTurbineInfoStatus
        if(this.globalStorageService.getPollBucketForTurbines().size){
            this.getGetTurbineInfoOfTurbines(this.globalStorageService.getPollBucketForTurbines(), "GetTurbineInfoStatus", this.processGetTurbineInfoOfTurbines.bind(this));
        }


    }

    // subscribeToGlobalPollingStopFlagEmitter(){
    //     this.eventsService.globalPollingStopFlagEmitter.subscribe(isGlobalPollingStopFlagEnabled => {
    //         if(isGlobalPollingStopFlagEnabled){
    //             this.eventsService.globalPollingFunctionEmitter.next(true);
    //         }
    //     });
    // }

    onCheckboxChangeForTurbines(event){
        if(event){
            var checkBox = event.target;
            var systemNumber = (checkBox.name).toString();
            if(!checkBox.checked){
                this.checkedTurbinesMap.delete(systemNumber);
                return;
            }
            this.pollBucketForTurbines = this.globalStorageService.getPollBucketForTurbines();
            var sizeOfPollBucket = this.pollBucketForTurbines.size;
            var maxSelectedTurbineCount = this.globalStorageService.getGeneralConfigurationsMap().get("maxTurbinesToBeSelected");
            if(sizeOfPollBucket <= maxSelectedTurbineCount -1){
                this.isPollBucketAddingFlag = true;
            }else {
                this.isPollBucketAddingFlag = false;
            }
            // We can allow download when the size of the poll bucket less than max size and the adding flag is in the false position is Adding Scenario if not failure scenario
            if( (this.checkedTurbinesMap.size > maxSelectedTurbineCount -1) || !( ( this.isPollBucketAddingFlag ) && (sizeOfPollBucket < maxSelectedTurbineCount) ) ){
                //var d = new Date();
                alert("Please select max of " + maxSelectedTurbineCount +" Turbines");
                //this.geUtils.throwErrorMessageInUI("Exceed Count" + d, false, "Please select max of " + maxSelectedTurbineCount +" Turbines");
                checkBox.checked = false;
            }
            if(checkBox.checked) {
                //this.globalStorageService.getSelectedTurbineMap().clear();
                this.checkedTurbinesMap.set(systemNumber, this.globalStorageService.getMapOfTurbines().get(systemNumber));
            } else {
                this.checkedTurbinesMap.delete(systemNumber);
            }
            console.log(this.checkedTurbinesMap.size + " turbines selected");
        }
    }

    onCheckboxChangeForTurbineTypes(event){
        var self = this;
        if(event){
            self.is1xSelected = false;
            self.is2xSelected = false;
            var checkBox = event.target;
            var turbineType = checkBox.name;
            if(checkBox.checked) {
                self.ngxMapForTurbineTypes.get(turbineType).set("checkBoxElement", checkBox);
                self.tickedTurbineTypesMap.set(turbineType, self.ngxMapForTurbineTypes.get(turbineType));
                self.is1xSelected = true;
                if(turbineType == "1x") {
                    self.is1xSelected = true;
                } else if( turbineType == "2x"){
                    self.is2xSelected = true;
                }
            } else {
                self.tickedTurbineTypesMap.delete(turbineType);
                if(turbineType == "1x") {
                    self.is1xSelected = true;
                } else if( turbineType == "2x"){
                    self.is2xSelected = true;
                }
            }
            console.log(this.tickedTurbineTypesMap.size + " turbines types selected");
        }

    }

    private clearTickedTurbinesMapAndCheckboxes(tickedTurbineTypesMap){
        var self = this;
        tickedTurbineTypesMap.forEach(function(value, key){
            var turbineType = key;
            var detailedMap = value;
            var checkBox = detailedMap.get("checkBoxElement");
            checkBox.checked =  false;
            tickedTurbineTypesMap.delete(key);
        });
    }

    callGetFilesInFolderWithParkIdForExistingFiles(fileTypesArray) {
        var cmdParams = {"fetchFromAxisBoolean": false,"mode": 1,"parkId": this.globalStorageService.selectedParkId,"files": fileTypesArray};
        this.dataService.callPollAndGetResponseWhenSuccess("sendCommand", "GetFilesInFolder", cmdParams, null, 1, 1,10000, this.setExistingFilesInTurbinesTypeTable.bind(this), null);
    }

    private setExistingFilesInTurbinesTypeTable(response, success, timeOut) {
        var self = this;
        if(success){
            var filesArray = response.cmdResponse.files;
            if (filesArray) {
                for (var i = 0; i < filesArray.length; i++) {
                    var file = filesArray[i];
                    if(file.errDescr || file.error) {
                        self.ngxMapForTurbineTypes.get(file.turbineType).set("existingFiles", "No control code found");
                    } else {
                        if(self.ngxMapForTurbineTypes.get(file.turbineType)){
                            self.ngxMapForTurbineTypes.get(file.turbineType).set("existingFiles", file.files[0].name);
                        }
                    }
                }
            }
        }else if (timeOut){
            self.geUtils.throwErrorMessageInUI("GetFilesInFolder", true, null, null);
            var fileTypes = JSON.parse(response.cmdParams).files;
            for(var i=0; i<fileTypes.length; i++){
                var file = fileTypes[i];
                self.ngxMapForTurbineTypes.get(file.turbineType).set("existingFiles", "-");
            }
        } else {
            var fileTypes = JSON.parse(response.cmdParams).files;
            for(var i=0; i<fileTypes.length; i++){
                var file = fileTypes[i];
                self.ngxMapForTurbineTypes.get(file.turbineType).set("existingFiles", "-");
            }
        }
        self.refreshTurbineTypesTable(self.ngxMapForTurbineTypes);
    }

    //Events subscription code
    subscribeMapOfTurbinesEmitter(){
        this.eventsService.mapOfTurbinesEmitter.subscribe(mapOfTurbines => {
            if(mapOfTurbines){
                this.populateTurbineTypesTableAndCallGetFiles(mapOfTurbines);
                this.populateTurbineDetailsTable(mapOfTurbines);
            }
        });
    }

    subscribeToSiteChangeEmitter(){
        this.eventsService.siteChangeEmitter.subscribe( isSiteChanged => {
            if(isSiteChanged) {
                //this.callAndPollGetDownloadFileStatus(null);
                this.ngxRowsForTurbineTypes = [];
                this.ngxRowsForTurbines = [];
                if(this.ngxMapForTurbines){
                    this.ngxMapForTurbines.clear();
                }
            }
        });
    }
}

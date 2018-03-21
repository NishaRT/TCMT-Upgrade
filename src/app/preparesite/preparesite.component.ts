import { Component, Injectable, Input, SimpleChanges, OnChanges, ViewEncapsulation } from '@angular/core';
import { DataService} from '../services/data.service';
import { GlobalStorageService } from '../services/globalstorage.service';
import { Http, Response, RequestOptions } from '@angular/http';
import { EventsService } from '../services/events.service';
import { GEUtils } from '../services/geutils.service';

@Component({
    encapsulation: ViewEncapsulation.None,
    moduleId: module.id,
    selector: 'preparesite-component',
    templateUrl: './preparesite.component.html',
    styleUrls: ['./preparesite.component.css', '../css/common.css','../css/ngx-material.css']
})

export class PrepareSiteComponent {
    constructor(private http : Http,
        private globalStorageService: GlobalStorageService,
        private dataService: DataService,
        private eventsService: EventsService,
        private geUtils: GEUtils) {
        this.eventsService.listOfTurbinesEmitter.subscribe(listOfTurbines => {
            if(listOfTurbines){
                this.populateTableWithTurbines(listOfTurbines);
            }
        });

        this.eventsService.turbineTypeWiseInfoEmitter.subscribe(turbineTypeWiseInfo => {
            this.updateExistingFilesInTable(turbineTypeWiseInfo);
        });

        this.eventsService.selectedTileEmitter.subscribe(selectedTile => {
            if(selectedTile == 1){
                 this.pollBucket = [{"turbineType":"1x", "fileName": ""}, {"turbineType":"2x", "fileName": ""}];
                 this.callAndPollGetDownloadFileStatus();}
        });

    }

    faSpinner = this.globalStorageService.defaultSpinner;
    finalFiles;
    ngxRows = [];
    prepareSiteTableData = true;
    chosenFile;
    selectedTurbineTypesForPush = [];
    pollBucket = [];
    isFileStatusPolling = false;
    selectedParkName = this.globalStorageService.selectedParkName;


    updateRowWithoutDeletion(type, existingFile, chosenFile, status) {
        for(var i=0; i< this.ngxRows.length; i++) {
            if(this.ngxRows[i].turbineType == type){
                if(chosenFile) this.ngxRows[i].fileChosen = chosenFile;
                if(status) this.ngxRows[i].uploadStatus = status;
                if(existingFile) this.ngxRows[i].existingFiles = existingFile;
                if(status) this.ngxRows[i].uploadStatus = status;
                this.ngxRows = [...this.ngxRows];
            }
        }
    }

    callGetFilesInFolder() {
        if(this.finalFiles){
            return this.finalFiles;
        } else {
            var _that = this;
            var cmdParams = {"fetchFromAxisBoolean":true,"mode":1,"parkId": this.globalStorageService.selectedParkId,"files":[{	"turbineType": "1x"}]};
            this.dataService.callPollAndGetResponseWhenSuccess("sendCommand","GetFilesInFolder",cmdParams,null,null,1,1,3000, this.setFilesInModal.bind(this));
        }
    }

    private setFilesInModal(response) {
        var files = response.json().cmdResponse.files;
        this.finalFiles = {};
        for(var i=0; i<files.length; i++) {
            this.finalFiles[files[i].turbineType] = files[i].files;
        }
    }

    updatePercentageInTable(response) {
      console.log("Inside updatePercentageInTable",response);
        var self = this;
        this.isFileStatusPolling = false;
        //commenting as not able to acess service APIs --Nisha
      //  var cmdParams = JSON.parse(response.json().cmdParams);
      //var tempFilesList = response.json().cmdResponse.fileDetails;
      var cmdParams;
        var tempFilesList = response.fileDetails;
        if(tempFilesList && tempFilesList.length) {
            for(var i=0; i<tempFilesList.length; i++) {
                var fileCurrentStatus = tempFilesList[i].fileCurrentStatus;
                var displayableStatus;
                switch(fileCurrentStatus) {
                    case "DOWNLOAD_FILE_FAILED":
                        displayableStatus = fileCurrentStatus;
                        break;
                    case "DOWNLOAD_FILE_NOT_INITIATED":
                        displayableStatus = "-";
                        break;
                    case "DOWNLOAD_FILE_IN_PROGRESS":
                        displayableStatus = tempFilesList[i].dataTransferStatusInPercentage + "%";
                        break;
                    case "DOWNLOAD_FILE_ALREADY_IN_PROGRESS":
                        displayableStatus = tempFilesList[i].dataTransferStatusInPercentage + "%";
                        break;
                    case "DOWNLOAD_FILE_COMPLETED":
                        displayableStatus = tempFilesList[i].dataTransferStatusInPercentage + "%";
                        break;
                    }
                self.updateRowWithoutDeletion(tempFilesList[i].turbineType, null, tempFilesList[i].fileName, displayableStatus);

                //If download complete, remove the turbine file from array and poll
                if(fileCurrentStatus == "DOWNLOAD_FILE_COMPLETED" || fileCurrentStatus == "DOWNLOAD_FILE_NOT_INITIATED" || fileCurrentStatus == "DOWNLOAD_FILE_FAILED" ) {
                    this.pollBucket = this.pollBucket.filter(function(v) { return v.turbineType !== tempFilesList[i].turbineType }); //Returns only those arrays which doesnt match the present turbineTypes

                    if(this.globalStorageService.turbineTypeWiseMap[tempFilesList[i].turbineType]){
                        var obj = this.globalStorageService.turbineTypeWiseMap[tempFilesList[i].turbineType];
                        obj.existingFiles = tempFilesList[i].fileName;
                        obj.uploadStatus = tempFilesList[i].dataTransferStatusInPercentage;
                        this.globalStorageService.turbineTypeWiseMap[tempFilesList[i].turbineType] = obj;
                        this.updateExistingFilesInTable(this.globalStorageService.turbineTypeWiseMap);
                    }
                }
            }
             if(this.pollBucket.length && !this.isFileStatusPolling) {
                self.callAndPollGetDownloadFileStatus();
            }
        }

    }

    private callAndPollGetDownloadFileStatus() {
        this.isFileStatusPolling = true;
        var self = this;
        var cmdParams = {"parkId":this.globalStorageService.selectedParkId,"parkName":this.globalStorageService.selectedParkName,"mode":1,"fileDetails":this.pollBucket};
      //  commenting as not able to access service APIS --Nisha
        //self.dataService.callPollAndGetResponseWhenSuccess("sendCommand","DownloadFilesStatus",cmdParams,null,null,1,1,3000,self.updatePercentageInTable.bind(this));
        //self.updatePercentageInTable(self.getFakeResponseforDownloadFilesStatus());
    }


    private populateTableWithTurbines(turbines) {
        this.ngxRows= [];
        var tempDataForRows = {};

        turbines.forEach(turbine => {
            if(turbine.turbineType.charAt(0) == "1"){
                tempDataForRows["1x"] = {};
            } else if (turbine.turbineType.charAt(0) == "2") {
                tempDataForRows["2x"] = {};
            }
        });

        //For updating rows
        for (var key in tempDataForRows) {
            if (tempDataForRows.hasOwnProperty(key)) {
                var existingFiles = this.globalStorageService.turbineTypeWiseMap[key] && this.globalStorageService.turbineTypeWiseMap[key].existingFiles? this.globalStorageService.turbineTypeWiseMap[key].existingFiles : this.faSpinner;
                var fileChosen = this.globalStorageService.turbineTypeWiseMap[key] && this.globalStorageService.turbineTypeWiseMap[key].fileChosen ? this.globalStorageService.turbineTypeWiseMap[key].fileChosen : "-";
                var uploadStatus = this.globalStorageService.turbineTypeWiseMap[key] && this.globalStorageService.turbineTypeWiseMap[key].uploadStatus ? this.globalStorageService.turbineTypeWiseMap[key].uploadStatus : "-";
                var singleRow = {turbineType : key, existingFiles: existingFiles, fileChosen: fileChosen, uploadStatus: "-" }
                this.ngxRows.push(singleRow);
            }
        }
    }

    private updateExistingFilesInTable(turbineTypeWiseInfo) {
        for (var type in turbineTypeWiseInfo) {
            if (turbineTypeWiseInfo.hasOwnProperty(type)) {
                var existingFiles = this.globalStorageService.turbineTypeWiseMap[type]? this.globalStorageService.turbineTypeWiseMap[type].existingFiles : "-";
                this.updateRowWithoutDeletion(type, existingFiles, null, null);
            }
        }
    }


    onCheckboxChange({ selected } ) {
        if(selected){
            this.selectedTurbineTypesForPush = selected;
        }
    }


    startPushToSite() {
        var call = true;
        var self = this;
        if(self.selectedTurbineTypesForPush.length) {
            for(var i=0; i<self.selectedTurbineTypesForPush.length; i++){
                var turbineType = self.selectedTurbineTypesForPush[i].turbineType;
                var fileChosen = self.selectedTurbineTypesForPush[i].fileChosen;
                if(fileChosen == "-") {
                    alert("Please choose a file for the selected version(s)");
                    return;
                }
                if(!self.pollBucketContainsTurbineType(turbineType)){
                    this.pollBucket.push({"fileName" : fileChosen, "turbineType": turbineType});
                }
                self.updateRowWithoutDeletion(turbineType,null,null,"0"+"%");
                }
            //call to DownloadFiles and its polling
            var cmdParams = { "fileDetails" : this.pollBucket, "parkId" : self.globalStorageService.selectedParkId, "parkName": self.globalStorageService.selectedParkName, "mode" : 1};
            self.dataService.callPollAndGetResponseWhenSuccess("sendCommand","DownloadFiles",cmdParams,null,null,1,1,3000, self.callAndPollGetDownloadFileStatus.bind(this));
        }
    }

    private pollBucketContainsTurbineType(turbineType) {
        for(var i=0; i<this.pollBucket.length; i++){
            if(turbineType == this.pollBucket[i].turbineType){
                return true;
            }
        }
        return false;
    }

getFakeResponseforDownloadFilesStatus(){
var fakeRes = {
    "errDescr": "",
    "error": "",
    "fileDetails": [
        {
            "byteArrayOfChunk": null,
            "chunkSizeInKBs": 0,
            "commandAction": null,
            "currentChunkNo": 0,
            "dataTransferStatusInPercentage": 0,
            "errDescr": "",
            "error": "",
            "fileCurrentStatus": "DOWNLOAD_FILE_NOT_INITIATED",
            "fileDirectoryPath": null,
            "fileName": "spring-tool-suite-3.8.4.RELEASE-e4.6.3-win32.zip",
            "hashCodeOfFile": null,
            "isHashCodeRequiredYesOrNo": null,
            "lastModifiedTime": null,
            "mode": 1,
            "parkId": "8547",
            "parkName": null,
            "pole_id": null,
            "pole_name": null,
            "requestStatusIeSuccessOrError": null,
            "totalNumberOfChunks": 0,
            "turbineType": "1x"
        }
    ],
    "mode": 0,
    "parkId": null,
    "parkName": null,
    "pole_id": null,
    "pole_name": null
}
return fakeRes;

}

}

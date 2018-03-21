import { Component } from '@angular/core';
import 'rxjs/add/operator/toPromise';
import { GlobalStorageService } from '../services/globalstorage.service';
import { DataService } from '../services/data.service';
import { EventsService } from '../services/events.service';




@Component({
    moduleId: module.id,
    selector: 'sites-component',
    templateUrl: './sites.component.html',
    styleUrls: ['../css/common.css']
})

export class SitesComponent {
    constructor(private dataService: DataService, private globalStorageService : GlobalStorageService, private eventsService: EventsService) {
        this.eventsService.getVariableStatusWithTimeStampEmitter.subscribe(behaviouralMap => {
            if (behaviouralMap) {
                this.getVariableStatusWithTimeOfTurbines(behaviouralMap.get("listOfTurbines"));
            }
        });


    }
    sitesJSON: any;

    allSites = this.globalStorageService.getListOfFarms();

    selected;

    GetVariableStatusWithTimeCmdParams;

    selectedSite(ev) {
      console.log('site selection competed',ev);
        if(ev.value){
            this.clearFewThingsRelatedToSite();
            var selectedParkId = ev.value;
            this.globalStorageService.setSelectedParkId(selectedParkId);
            this.globalStorageService.setSelectedParkName(ev.options[ev.selectedIndex].text);

            if(!this.globalStorageService.getListOfTurbines()) {
              console.log("Inside If...GetListOfTurbines");
                this.callGetListOfTurbinesWithParkId(selectedParkId);
            }
            this.callGetFilesInFolderWithParkIdForExistingFiles([{"turbineType": "1x"}, {"turbineType" : "2x"}]);
        }
    }

    clearFewThingsRelatedToSite(){
        this.globalStorageService.setListOfTurbines(undefined, false);
        this.globalStorageService.setTurbineTypeWiseInfo({});
    }

    callGetFilesInFolderWithParkIdForExistingFiles(filesArray) {
      console.log("--Inside filesArray---Site Component",filesArray);
        var _that = this;
        var cmdParams = {"fetchFromAxisBoolean": false,"mode": 1,"parkId": this.globalStorageService.selectedParkId,"files": filesArray};
//Commenting as not able to access service APIs --Nisha
        //this.dataService.callPollAndGetResponseWhenSuccess("sendCommand", "GetFilesInFolder", cmdParams, null, null, 1, 1,3000, this.setExistingFiles.bind(this));
            this.setExistingFiles(this.getFakeResponseForGetFilesInFolder());
    }

    private setExistingFiles(response) {
      console.log("Inside setExistingFiles");
      //commenting as Using Fake data --Nisha
      //  var filesArray = response.json().cmdResponse.files;
      //  var filesArray = response.cmdResponse.files;
      console.log("---files",response.cmdResponse);
      var filesArray = response.cmdResponse.fileDetails;
      console.log("--Array----",filesArray);
        if (filesArray) {
            for (var i = 0; i < filesArray.length; i++) {
                var file = filesArray[i];
                console.log("---single file",file);
                var turbineTypeWiseInfo = this.globalStorageService.getTurbineTypeWiseInfo();
                console.log("--turbineTypeWiseInfo",turbineTypeWiseInfo);
                console.log("#######",turbineTypeWiseInfo[file.turbineType]);
                if(turbineTypeWiseInfo[file.turbineType]) {
                    turbineTypeWiseInfo[file.turbineType].existingFiles = file.files[0].name;
                } else {
                  //remove these comments --Nisha
                //    if(file.files.length){
                      //  turbineTypeWiseInfo[file.turbineType] = {"existingFiles" : file.files[0].name};
                        turbineTypeWiseInfo[file.turbineType] = {"existingFiles" : file.turbineType};
                  //  }
                }
            }
        }
        this.globalStorageService.setTurbineTypeWiseInfo(turbineTypeWiseInfo);
    }


    callGetListOfTurbinesWithParkId(parkId) {
        var self = this;
        var cmdParams = {"parkId" : parkId, "mode": 1};
        if(this.globalStorageService.isProdEnvironment){
          console.log("GetListOfWindTurbines");
            this.dataService.callPollAndGetResponseWhenSuccess("sendCommand","GetListOfWindTurbines",cmdParams,null,null,1,1,3000, self.setListOfTurbinesInGlobalStorage.bind(self));
        } else {
            //TODO - Remove this fake Data
            //this.setListOfTurbinesInGlobalStorage({"cmdResponse":{"listOfTurbines" : this.getFakeListOfDMPTurbines()}});
			this.setListOfTurbinesInGlobalStorage(this.getFakeListOfDMPTurbines());
        }
    }

    setListOfTurbinesInGlobalStorage(response) {
		console.log("inside setListOfTurbinesInGlobalStorage",response);
        if(this.globalStorageService.isProdEnvironment){
            //TDOD - Put this back --> response.json().cmdResponse;
            var cmdResponse = response.json().cmdResponse;
        } else {
			console.log("inside else");
            //var cmdResponse =  response.cmdResponse;
			var cmdResponse = response;
			console.log("inside else",cmdResponse);
        }

        var listOfDMPTurbines = [];
       // var listOfTurbines = cmdResponse.listOfTurbines;
	   var listOfTurbines = cmdResponse;
		console.log("list of turbines",listOfTurbines);
        for(var i=0; i<listOfTurbines.length; i++) {
            var presentTurbineObj = listOfTurbines[i];
            if("DMP" == presentTurbineObj.platform) {
                listOfDMPTurbines.push(presentTurbineObj);
            }
        }

        //listOfDMPTurbines = this.getFakeListOfDMPTurbines();  // TODO - Should be removed after DEMO
        this.globalStorageService.setListOfTurbines(listOfDMPTurbines, true);
        // Initializing the proces falgs to false
        this.globalStorageService.setAllTurbineInProcessMap(listOfDMPTurbines);
        //Calling GetVariableStatusWithTime to get Salt key for further actions like "getTurbineInfo"
        this.getVariableStatusWithTimeOfTurbines(listOfDMPTurbines);
    }


    getVariableStatusWithTimeOfTurbines(listOfDMPTurbines) {
        var readWritePList = [{"Pname": "OpCtl_TurbineStatus","Pno": "01.13","deviceReadTime": "","readTime": "","readValue": "","utcOffset": "","writeTime": "","writeValue": "2322"}];

        //Adding ReadWritePList manually  to get status with time
        listOfDMPTurbines.forEach(turbine => {
            turbine.ReadWritePlist = readWritePList;
        });
          console.log("@@@@@@@@@@@@@ --GetVariableStatusWithTime");
          //commenting as not able to access service APIs --Nisha

        this.GetVariableStatusWithTimeCmdParams = this.dataService.getDefaultParkBean(listOfDMPTurbines,"DMP", null,null);
        console.log("----",this.GetVariableStatusWithTimeCmdParams);
        //this.dataService.callPollAndGetResponseWhenSuccess("sendCommand", "SendCommandToEdge", this.GetVariableStatusWithTimeCmdParams, "GetVariableStatusWithTime", null,1, 1, 5000, this.getStatusOfVariableStatus.bind(this, this.GetVariableStatusWithTimeCmdParams));
             this.getStatusOfVariableStatus(this.GetVariableStatusWithTimeCmdParams ,this.getFakeResponseforGetVariableStatusWithTime());
    }

    getStatusOfVariableStatus(cmdParams, response) {
      console.log("inside getStatusOfVariableStatus");
      console.log("cmdParams",cmdParams);
      console.log("response",response);
      //commenting as not able to access servie APIs --Nisha
      //  var cmdParams = JSON.parse(response.json().cmdParams);
      // this.dataService.callPollAndGetResponseWhenSuccess("sendCommand", "SendCommandToEdge", cmdParams, "GetStatus", null, 1, 1, 5000, this.setTimeStampAndCallGetTurbineInfo.bind(this));
         this.setTimeStampAndCallGetTurbineInfo(this.getFakeResponseforGetVariableStatusWithTime());
    }

    setTimeStampAndCallGetTurbineInfo(response) {
      console.log("Inside setTimeStampAndCallGetTurbineInfo",response);
      // cpmenting as not able to access service APIs --Nisha
        var successfulTurbines = [];
        var inProgressTurbines = [];
      //  var totalTurbines = JSON.parse(response.json().cmdParams);
        var totalTurbines;
        var globalTurbinesArray = this.globalStorageService.getListOfTurbines();
        //var processResponsesArray = response.json().cmdResponse.ProcessResponses;
        var processResponsesArray = response.ProcessResponses;

        for(var i=0; i<processResponsesArray.length; i++) {
            var processResponse = processResponsesArray[i];
            if(processResponse.StatusResponse == "GET_VARIABLE_STATUS_SUCCESS") {
                var systemNumber = processResponse.systemNumber;
                for(var j=0; j < globalTurbinesArray.length; j++) {
                    if(systemNumber == globalTurbinesArray[j].systemNumber) {
                        if(processResponse.Parameters) {
                            globalTurbinesArray[j].variableTimeStamp = processResponse.Parameters[0].deviceReadTime;
                            //Returns only those arrays which doesnt match the present turbine (i.e which are not completed);
                            inProgressTurbines = totalTurbines.turbineList.filter(function(v) { return v.systemNumber !== systemNumber});
                            successfulTurbines.push(globalTurbinesArray[j]);
                        }
                    }
                }
            }
        }
        this.globalStorageService.setListOfTurbines(globalTurbinesArray, false);
        if(successfulTurbines.length){
            var cmdParams = this.dataService.getDefaultParkBean(successfulTurbines, "DMP", "", "");
            this.dataService.callPollAndGetResponseWhenSuccess("sendCommand", "SendCommandToEdge", cmdParams, "GetTurbineInfo", null, 1, 1, 5000, this.processGetTurbineInfo.bind(this));
        }

        if(inProgressTurbines.length){
            this.getVariableStatusWithTimeOfTurbines(inProgressTurbines);
        }
    }

    private processGetTurbineInfo(response) {
        var processResponsesArray = response.json().cmdResponse.ProcessResponses;
        var processResponseArray = [];
        //var globalTurbinesList = this.globalStorageService.getListOfTurbines();

        for(var i=0; i<processResponsesArray.length; i++) {
            var processResponse = processResponsesArray[i];
            //Code to update global turbine list with detailed data
            //TODO - See if you can use map here
            // for(var k=0; k<globalTurbinesList.length; k++){
            //     if(processResponse.systemNumber == globalTurbinesList[k].systemNumber){
            //         globalTurbinesList[k].cfcSpaceSize = processResponse.responseData.cfc0Size;
            //         globalTurbinesList[k].cpuVersion = processResponse.responseData.cpuVersion;
            //         globalTurbinesList[k].ramSize = processResponse.responseData.ramSize;
            //         globalTurbinesList[k].currentVersion = processResponse.responseData.swVersion;
            //         globalTurbinesList[k].turbineNumber = processResponse.responseData.turbineNumber;
            //         globalTurbinesList[k].turbineStatus = processResponse.responseData.turbineStatus;
            //     }
            // }
            //Dont touch this code since backup is dependent on it
            processResponseArray.push(processResponse);
            // Changing the isGetTurbineInfoComplete to true
            this.globalStorageService.setTurbineInProcessMapValue(processResponse.systemNumber,"isGetTurbineInfoInProcess",false);
        }
        //this.globalStorageService.setListOfTurbines(globalTurbinesList);
        this.globalStorageService.setProcessResponseArray(processResponseArray);
    }


    getFakeListOfDMPTurbines(){
		console.log("Getting fake data");
        return [
            {
                "ReadWritePlist":null,
                "deviceName":"WTG154",
                "ipaddress":"172.16.71.154",
                "platform":"ESS",
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
			{
                "ReadWritePlist":null,
                "deviceName":"WTG155",
                "ipaddress":"172.16.71.155",
                "platform":"DMP",
                "systemNumber":"105052230",
                "turbineSerialNo":"105052230",
                "turbineType" : "3x"
            },
         ];
    }

    getFakeResponseForGetFilesInFolder(){
     var fakeresponse =  {
 "appName": "TCMT",
 "cmdAction": null,
 "cmdActionId": null,
 "cmdId": "jef8riiw",
 "cmdParams": "{\"parkId\":\"501\",\"parkName\":\"Callahan Divide\",\"mode\":1,\"fileDetails\":[{\"turbineType\":\"1x\",\"fileName\":\"\"},{\"turbineType\":\"2x\",\"fileName\":\"\"}]}",
 "cmdResponse": {
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
       "fileName": "",
       "hashCodeOfFile": null,
       "isHashCodeRequiredYesOrNo": null,
       "lastModifiedTime": null,
       "mode": 1,
       "parkId": "501",
       "parkName": null,
       "pole_id": null,
       "pole_name": null,
       "requestStatusIeSuccessOrError": null,
       "totalNumberOfChunks": 0,
       "turbineType": "1x"
     },
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
       "fileName": "",
       "hashCodeOfFile": null,
       "isHashCodeRequiredYesOrNo": null,
       "lastModifiedTime": null,
       "mode": 1,
       "parkId": "501",
       "parkName": null,
       "pole_id": null,
       "pole_name": null,
       "requestStatusIeSuccessOrError": null,
       "totalNumberOfChunks": 0,
       "turbineType": "2x"
     }
   ],
   "mode": 0,
   "parkId": null,
   "parkName": null,
   "pole_id": null,
   "pole_name": null
 },
 "cmdSender": "502692650",
 "cmdStatus": 5,
 "cmdStatusDescr": null,
 "mode": 1,
 "parkId": "501",
 "type": 1,
 "url": "DownloadFilesStatus"
}
      console.log("getting fake data for GetFilesInFolder");
      return fakeresponse;
    }

getFakeResponseforGetVariableStatusWithTime(){
var fakeResponse = {
    "ProcessResponses": [
        {
            "AdditionalMessage": null,
            "DeviceName": "WTG155",
            "IpAddress": "172.16.71.155",
            "LastRequestRecievedOn": null,
            "MessageCode": "NONE",
            "Parameters": null,
            "StatusResponse": "PARAMETER_PROCESS_IN_QUEUE",
            "allowedDownloadStates": "9,6",
            "allowedUploadStates": "1,2,3,6,7,8,9,10,11,12,13,14,15,16,1000,1000+",
            "responseData": null,
            "systemNumber": "105052230"
        }
    ],
    "errDescr": "",
    "error": ""
}

return fakeResponse;

}




}

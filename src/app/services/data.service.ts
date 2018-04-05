import { Injectable } from '@angular/core';
import { Response, RequestOptions } from '@angular/http';
import { Headers } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/catch';
import {GlobalStorageService} from '../services/globalstorage.service';
import { TimesService } from './times.service';
import { EventsService } from './events.service';
import { GEUtils } from './geutils.service';
import { HttpClient, HttpHeaders} from '@angular/common/http';



@Injectable()
export class DataService {
  constructor(private http: HttpClient,
    private globalStorageService: GlobalStorageService,
    private timesService : TimesService,
    private eventsService: EventsService,
    private geUtils: GEUtils
  ) {
  }


  failureDescriptionsEnum = ["NUCLEUS_UNKNOWNERROR", "SEND_COMMANDEDGE_FAILED"];

  call(endpoint, internalURL, cmdParams, cmdAction, type, mode) {
    var accessToken = this.globalStorageService.getAccessToken();
    let options = this.getOptions();
    var cmdId = (new Date().getTime()).toString(36);
    var body = this.getBodyWithCommandIdParamsAndAction(cmdId, internalURL, cmdParams, cmdAction, type, mode);
    return this.http.post(this.globalStorageService.getUrl()+"backend"+ '/'+ endpoint, body, {headers : options}).toPromise();
  }

  public callGetStatus(body) {
    var accessToken = this.globalStorageService.getAccessToken();
    let options = this.getOptions();
    return this.http.post(this.globalStorageService.getUrl()+"backend" + "/getStatus", body, {headers : options}).toPromise();
  }

  private getBodyWithCommandIdParamsAndAction(commandId, endPoint, cmdParams, cmdAction, type, mode) {
    return {
      "cmdId": commandId,
      "url": endPoint,
      "cmdParams": cmdParams,
      "cmdAction": cmdAction,
      "type": type,
      "mode": mode,
      "parkId" : this.globalStorageService.selectedParkId,
      "appName": "TCMT",
      "cmdActionId": null,
      "cmdResponse": "",
      "cmdSender": this.globalStorageService.userInfo.user_name,
      "cmdStatus": 0,
      "cmdStatusDescr": null
    };
  }


  getOptions() {
    let  headers  =  new  HttpHeaders().set('Content-Type','application/json').set('Authorization',"bearer" + " " + this.globalStorageService.getAccessToken());
    return headers;
  }



//A very generic method to call and poll a command
  callPollAndGetResponseWhenSuccess(endpoint, internalURL, cmdParams, cmdAction, type, mode, milliseconds, successCallBackFn, failureCallBackFn) {
    var finalCall = cmdAction ? cmdAction : internalURL;
    var self = this;
    self.call("sendCommand",internalURL,cmdParams,cmdAction,type,mode).then(
      sendCommandResp => {
        var startTime = new Date().getTime();
        if(self.globalStorageService.listOfAcceptedCommandStatus.indexOf(sendCommandResp["cmdStatus"]) > -1) {
          var pollAgain = true;
          var timeOut = self.timesService.getTimeOutBasedOnCallId(finalCall);
          var timerId = setInterval(function () {
            var currentTime = new Date().getTime();
            if(currentTime - startTime > timeOut) {
              clearInterval(timerId);
              if(finalCall != "GetFilesInFolder"){
                self.geUtils.throwErrorMessageInUI(finalCall, true, null, null);
              }
              successCallBackFn(sendCommandResp, false, true);
              return;
            }
            if(pollAgain) {
              pollAgain = false;
              self.callGetStatus({"cmdId" : sendCommandResp["cmdId"]}).then(
                getStatusResp => {
                  var statusResponse = getStatusResp;
                  if (statusResponse["cmdStatus"] == 5 && !statusResponse["cmdResponse"].error && !statusResponse["cmdResponse"].errDescr) {
                      clearInterval(timerId);
                      successCallBackFn(getStatusResp, true, false);
                      pollAgain = true;
                      return;
                  } else if(statusResponse["cmdStatus"] == 3 || statusResponse["cmdStatus"] == 2 || self.failureDescriptionsEnum.indexOf(statusResponse["cmdStatusDescr"])>-1 || statusResponse["cmdResponse"].error || statusResponse["cmdResponse"].errDescr) {
                      clearInterval(timerId);
                      if(statusResponse["url"]){ //&& statusResponse["cmdAction"]
                        successCallBackFn(statusResponse, false, false);
                        if(finalCall != "GetFilesInFolder"){
                          self.geUtils.throwErrorMessageInUI(statusResponse["cmdStatusDescr"], false, null, null);
                        }
                        pollAgain = false;
                        return;
                      }
                  }
                  pollAgain = true;
                }
              ).catch( catchResponse => {
                console.log(catchResponse);
                self.geUtils.throwErrorMessageInUI(catchResponse.error.error, false, null, null);
              }

              );
            }
          }, milliseconds);
        }
      }
    ).catch(
      catchResponse => {
        console.log(catchResponse);
        self.geUtils.throwErrorMessageInUI(catchResponse.error.error, false, null, null);
      }
    );
  }

  getToken() {
    return this.http.get(this.globalStorageService.getUrl() + 'getToken').toPromise();
  }

  getUserInfo(){
    return this.http.get(this.globalStorageService.getUrl()+ 'userinfo').toPromise();
  }

  getDefaultParkBean(turbineList, platform, poleId, poleName) {
    return {
      "parkId" : this.globalStorageService.selectedParkId,
      "parkName" : this.globalStorageService.selectedParkName,
      "turbineList" : turbineList,
      "platform" : platform,
      "poleId" : poleId,
      "poleName" : poleName
    }
  }

  // callDirectlyGetListOfWindFarms(cb) {
  //   this.getDirectlyAccessToken().then(
  //     response => {
  //       var accessToken = response["token"];
  //       let headers = new Headers({ 'Content-Type': 'application/json', 'Authorization': "Bearer" + " " + accessToken});
  //       let options = new RequestOptions({ headers: headers });
  //       return this.http.get("http://10.177.64.32:8080/WindTCMAxisServer/Rest/GetListOfWindFarms", {headers : options}).toPromise().then(data => cb(data));
  //     }
  //   )
  // }

  // getDirectlyAccessToken() {
  //   let headers = new Headers({ 'Content-Type': 'application/json'});
  //   let options = new RequestOptions({ headers: headers });
  //   var body = {"username": "105038475","password":"t5cp2v67cu"};
  //   return this.http.post("http://10.177.64.32:8080/WindTCMAxisServer/Rest/AuthenticateUsers", body, {headers : options}).toPromise();
  // }

  //A very generic method to call and poll a command and stops based on the polling count of the getStatus cmd
  callPollAndGetResponseWhenSuccessWithPollingCount(endpoint, internalURL, cmdParams, cmdAction, type, mode, milliseconds, countOfGetStatusPolling, callbackFn, callbackFnFailed, callbackFnError) {
    var finalCall = cmdAction ? cmdAction : internalURL;
    var self = this;
    self.call("sendCommand",internalURL,cmdParams,cmdAction,type,mode).then(
      sendCommandResp => {
        var getStatusCount = 0;
        if(self.globalStorageService.listOfAcceptedCommandStatus.indexOf(sendCommandResp["cmdStatus"]) > -1) {
          var pollAgain = true;
          var timerId = setInterval(function () {
            if(getStatusCount > countOfGetStatusPolling) {
              clearInterval(timerId);
                var response = {
                  "error" : "TIMEOUT",
                  "errorDesc" : "Unable to get the response in the predefined time"
                };
                callbackFn(response);
              //self.geUtils.throwErrorMessageInUI(finalCall, true);
              var turbineList = JSON.parse(sendCommandResp["cmdParams"]).turbineList;
              self.eventsService.stopSpinnersEventEmitter.next(turbineList);
              return;
            }

            if(pollAgain) {
              pollAgain = false;
              self.callGetStatus({"cmdId" : sendCommandResp["cmdId"]}).then(
                getStatusResp => {
                  var statusResponse = getStatusResp;
                  if (statusResponse["cmdStatus"] == 5 && !statusResponse["cmdResponse"].error && !statusResponse["cmdResponse"].errDescr) {
                      clearInterval(timerId);
                      callbackFn(getStatusResp);
                      pollAgain = true;
                      return;
                  } else if(statusResponse["cmdStatus"] == 3 || statusResponse["cmdStatus"] == 2 || self.failureDescriptionsEnum.indexOf(statusResponse["cmdStatusDescr"])>-1) {
                      clearInterval(timerId);
                      callbackFnFailed(getStatusResp);
                      return;
                      // if(statusResponse["url"] && statusResponse["cmdAction"]){
                      //   self.geUtils.throwErrorMessageInUI(statusResponse["cmdStatusDescr"], false);
                      //   pollAgain = false;
                      //   return;
                      // }
                  }
                  pollAgain = true;
                  getStatusCount=getStatusCount+1;
                }
              ).catch( error => {
                //self.geUtils.throwErrorMessageInUI(error, false);
                var response = {
                  "error" : "Exception",
                  "errorDesc" : "Unable to get the response"
                };
                callbackFnError(response);
              }
              );
            }
          }, milliseconds);
        }
      }
    )
    // .catch(
    //   catchResp => {
    //     self.geUtils.throwErrorMessageInUI(catchResp.error.error, false);
    //   }
    // );
  }


}

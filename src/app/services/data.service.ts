import { Injectable } from '@angular/core';
import { Http, Response, RequestOptions } from '@angular/http';
import { Headers } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/catch';
import {GlobalStorageService} from '../services/globalstorage.service';
import { TimesService } from './times.service';
import { EventsService } from './events.service';
import { GEUtils } from './geutils.service';



@Injectable()
export class DataService {
  constructor(private http: Http,
    private globalStorageService: GlobalStorageService,
    private timesService : TimesService,
    private eventsService: EventsService,
    private geUtils: GEUtils) {
  }


  failureDescriptionsEnum = ["NUCLEUS_UNKNOWNERROR", "SEND_COMMANDEDGE_FAILED"];

  call(endpoint, internalURL, cmdParams, cmdAction, type, mode) {
    var accessToken = this.globalStorageService.getAccessToken();
    let options = this.getOptions();
    var cmdId = (new Date().getTime()).toString(36);
    var body = this.getBodyWithCommandIdParamsAndAction(cmdId, internalURL, cmdParams, cmdAction, type, mode);
    console.log("data-service-endpoint",endpoint);
    console.log("data-service-body",body);
    console.log("data-service-options",options);
    return this.http.post("/backend"+ '/'+ endpoint, body, options).toPromise();
  }

  public callGetStatus(body) {
    var accessToken = this.globalStorageService.getAccessToken();
    let options = this.getOptions();
    return this.http.post("/backend" + "/getStatus", body, options).toPromise();

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
      // commenting as UAA is not configured
      //"cmdSender": this.globalStorageService.userInfo.user_name,
      "cmdSender": "Nisha",
      "cmdStatus": 0,
      "cmdStatusDescr": null
    };
  }


  getOptions() {
    let headers = new Headers({ 'Content-Type': 'application/json', 'Authorization': "bearer" + " " + this.globalStorageService.getAccessToken()});
    let options = new RequestOptions({ headers: headers });
    return options;
  }


//A very generic method to call and poll a command
  callPollAndGetResponseWhenSuccess(endpoint, internalURL, cmdParams, cmdAction, storeTimer, type, mode, milliseconds, callbackFn) {
  console.log("inside callPollAndGetResponseWhenSuccess--data-service");
    var finalCall = cmdAction ? cmdAction : internalURL;
    var self = this;
    self.call("sendCommand",internalURL,cmdParams,cmdAction,type,mode).then(
      sendCommandResp => {
        var startTime = new Date().getTime();
        if(self.globalStorageService.listOfAcceptedCommandStatus.indexOf(sendCommandResp.json().cmdStatus) > -1) {
          var pollAgain = true;
          var timeOut = self.timesService.getTimeOutBasedOnCallId(finalCall);
          var timerId = setInterval(function () {
            var currentTime = new Date().getTime();
            if(currentTime - startTime > timeOut) {
              clearInterval(timerId);
              self.geUtils.throwErrorMessageInUI(finalCall, true);
              var turbineList = JSON.parse(sendCommandResp.json().cmdParams).turbineList;
              self.eventsService.stopSpinnersEventEmitter.next(turbineList);
              return;
            }
            if(cmdAction === "PrepeSiteStatus" && self.globalStorageService.getSelectedTile()!=1){ clearInterval(timerId); return;}
            if(cmdAction === "BackupStatus" && self.globalStorageService.getSelectedTile()!=2) { clearInterval(timerId); return;}
            if(cmdAction === "UpgradeStatus" && ( self.globalStorageService.getSelectedTile()!=3 && self.globalStorageService.getSelectedTile()!=4)) { clearInterval(timerId); return;}
            if(cmdAction === "RestoreStatus" && self.globalStorageService.getSelectedTile()!=4) { clearInterval(timerId); return;}

            if(pollAgain) {
              pollAgain = false;
              self.callGetStatus({"cmdId" : sendCommandResp.json().cmdId}).then(
                getStatusResp => {
                  var statusResponse = getStatusResp.json();
                  if (statusResponse.cmdStatus == 5 && !statusResponse.cmdResponse.error && !statusResponse.cmdResponse.errDescr) {
                      clearInterval(timerId);
                      callbackFn(getStatusResp);
                      pollAgain = true;
                      return;
                  } else if(statusResponse.cmdStatus == 3 || statusResponse.cmdStatus == 2 || self.failureDescriptionsEnum.indexOf(statusResponse.cmdStatusDescr)>-1) {
                      clearInterval(timerId);
                      if(statusResponse.url && statusResponse.cmdAction){
                        self.geUtils.throwErrorMessageInUI(statusResponse.cmdStatusDescr, false);
                        pollAgain = false;
                        return;
                      }
                  }
                  pollAgain = true;
                }
              ).catch( error => {
                self.geUtils.throwErrorMessageInUI(error.json().error, false);
              }

              );
            }
          }, milliseconds);
        }
      }
    ).catch(
      error => {
        //self.geUtils.throwErrorMessageInUI(error.json(), false);
      }
    );
  }

  getToken() {
    return this.http.get('/getToken').toPromise();
  }

  getUserInfo(){
    return this.http.get('/userinfo').toPromise();
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

  callDirectlyGetListOfWindFarms(cb) {
    this.getDirectlyAccessToken().then(
      response => {
        var accessToken = response.json().token;
        let headers = new Headers({ 'Content-Type': 'application/json', 'Authorization': "Bearer" + " " + accessToken});
        let options = new RequestOptions({ headers: headers });
        return this.http.get("http://10.177.64.32:8080/WindTCMAxisServer/Rest/GetListOfWindFarms", options).toPromise().then(data => cb(data));
      }
    )
  }

  getDirectlyAccessToken() {
    let headers = new Headers({ 'Content-Type': 'application/json'});
    let options = new RequestOptions({ headers: headers });
    var body = {"username": "105038475","password":"t5cp2v67cu"};
    return this.http.post("http://10.177.64.32:8080/WindTCMAxisServer/Rest/AuthenticateUsers", body, options).toPromise();
  }


}

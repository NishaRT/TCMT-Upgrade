import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { EventsService } from './events.service';
import { TimesService } from './times.service';

@Injectable()
export class GlobalStorageService {
    constructor(private eventsService : EventsService){
        this.mapOfTurbineStatuses.set("6.000000", this.gridLossTag);
        this.mapOfTurbineStatuses.set("Connection failure", this.failureTag);
        this.mapOfTurbineStatuses.set("1", "OK");
        this.mapOfTurbineStatuses.set("16", "Int Curtailment");
        this.mapOfTurbineStatuses.set("7", "Weather Outage");
        this.mapOfTurbineStatuses.set("3", "Runup");
        this.mapOfTurbineStatuses.set("2", "Online");
        this.mapOfTurbineStatuses.set("12", "Ext Curtailment");
        this.mapOfTurbineStatuses.set("8", "External Stop");
        this.mapOfTurbineStatuses.set("6", "Grid Fault");
        this.mapOfTurbineStatuses.set("13", "Customer Stop");
        this.mapOfTurbineStatuses.set("11", "E-Stop");

        this.mapOfTurbineStatuses.set("1000", "Fault");
        this.mapOfTurbineStatuses.set("9", "Manual Stop");
        this.mapOfTurbineStatuses.set("14", "Manual Idle");
        this.mapOfTurbineStatuses.set("10", "Remote Stop");
        this.mapOfTurbineStatuses.set("15", "Remote Idle");
        this.mapOfTurbineStatuses.set("4", "Maintencance");
        this.mapOfTurbineStatuses.set("5", "Repair");

    }

    private selectedTile: number;

    defaultSpinner = '<i class="fa fa-spinner fa-pulse fa-fw"></i>';
    gridLossTag = '<span class="badge badge-danger">Grid Loss</span>';
    onlineTag = '<span class="badge badge-success">Online</span>';
    failureTag = '<span class="badge badge-dark">Connection Failed</span>';

    //Automatic Polling Ids
    prepareSiteStatusPollingId;
    backupStatusPollingId;
    upgradeStatusPollingId;
    retsoreStatusPollingId;

    accessToken;

    listOfFarms;

    selectedParkId;

    selectedParkName;

    listOfAcceptedCommandStatus = [0,1];

    listOfTurbines;

    turbineTypeWiseMap = {};

    processResponseArray = [];

    private mapOfTurbines; // To be filled

    private mapOfprocessResponseArray;

    mapOfTurbineStatuses = new Map();

    private allTurbineInProcessMap;

    isProdEnvironment;

    userInfo;

    private timesMap;

    private errorTypesMap;

    private generalConfigurationsMap;

    setAccessToken(val: string) {
        this.accessToken = val;
        return this.accessToken;
    }

    getAccessToken() {
        return this.accessToken;
    }

    setListOfFarms(val){
      this.listOfFarms = val;
      return this.listOfFarms;
    }

    getListOfFarms(){
        return this.listOfFarms;
    }


    setSelectedParkId(val){
        this.selectedParkId = val;
        return this.selectedParkId;
      }

    getSelectedParkId(){
        return this.selectedParkId;
    }

    setSelectedParkName(val){
        this.selectedParkName = val;
        return this.selectedParkName;
      }

    getSelectedParkName(){
        return this.selectedParkName;
    }

    setListOfTurbines(val, emitEvent) {
        this.listOfTurbines = val;
        if(emitEvent){
            this.eventsService.listOfTurbinesEmitter.next(val);
        }
        if(val) {
            var mapOfTurbines = new Map(val.map((i) => [i.systemNumber, i]));
            this.setMapOfTurbines(mapOfTurbines, emitEvent);
        }
      }

    getListOfTurbines(){
        return this.listOfTurbines;
    }

    getSelectedTile() {
        return this.selectedTile;
    }

    setSelectedTile(val) {
      console.log("inside SetSelectedTIle--globlaservice",val);
        this.selectedTile = val;
        this.eventsService.selectedTileEmitter.next(val);
        return this.selectedTile;
    }

    getTurbineTypeWiseInfo(){
        return this.turbineTypeWiseMap;
    }

    setTurbineTypeWiseInfo(val) {
        this.turbineTypeWiseMap = val;
        this.eventsService.turbineTypeWiseInfoEmitter.next(val);
        return this.turbineTypeWiseMap;
    }

    setProcessResponseArray(val) {
        this.processResponseArray = val;
        this.eventsService.processResponseEmitter.next(val);
        if(val) {
            var mapOfprocessResponseArray = new Map(val.map((i) => [i.systemNumber, i]));
            this.setMapOfprocessResponseArray(mapOfprocessResponseArray);
        }
        return this.processResponseArray;
    }

    getProcessResponseArray() {
        return this.processResponseArray;
    }

    setMapOfTurbines(val, emitEvent){
        this.mapOfTurbines = val;
        if(emitEvent){
            this.eventsService.mapOfTurbinesEmitter.next(val);
        }
    }

    getMapOfTurbines(){
        return this.mapOfTurbines;
    }

    setPrepareSitePollingId(val) {
        this.prepareSiteStatusPollingId = val;
    }

    getPrepareSitePollingId(){
        return this.prepareSiteStatusPollingId;
    }

    setBackupStatusPollingId(val) {
        this.backupStatusPollingId = val;
    }

    getBackupStatusPollingId(){
        return this.backupStatusPollingId;
    }

    setUpgradeStatusPollingId(val) {
        this.upgradeStatusPollingId = val;
    }

    getUpgradeStatusPollingId(){
        return this.upgradeStatusPollingId;
    }

    setRestoreStatusPollingId(val) {
        this.retsoreStatusPollingId = val;
    }

    getRestoreStatusPollingId(){
        return this.retsoreStatusPollingId;
    }

    setUserInfo(val) {
        this.userInfo = val;
        return this.userInfo;
    }
    getUserInfo(){
        return this.userInfo;
    }


    setTimesMap(val){
        this.timesMap = val;
        return this.timesMap;
    }
    getTimesMap(){
        return this.timesMap;
    }


    setErrorTypesMap(val){
        this.errorTypesMap = val;
        return this.errorTypesMap;
    }
    getErrorTypesMap(){
        return this.errorTypesMap;
    }

    setAllTurbineInProcessMap(val) {

        this.listOfTurbines = val;
        if(val) {
            var processMap=new Map();
            processMap.set("isGetTurbineInfoInProcess",true );
            processMap.set("isBackupInProcess",false );
            processMap.set("isUpgradeInProcess",false );
            processMap.set("isRestoreInProcess",false );
            processMap.set("isTurbineInProcess",true );
            this.allTurbineInProcessMap = new Map(val.map((i) => [i.systemNumber, processMap]));
        }

        return this.allTurbineInProcessMap;
    }

    getAllTurbineInProcessMap() {
        return this.allTurbineInProcessMap;
    }

    setTurbineInProcessMapValue(systemNumber, processName, porcessValue) {
        this.allTurbineInProcessMap.get(systemNumber).set(processName, porcessValue);
        if(this.allTurbineInProcessMap.get(systemNumber).get("isGetTurbineInfoInProcess")===true ||
        this.allTurbineInProcessMap.get(systemNumber).get("isBackupInProcess")===true ||
        this.allTurbineInProcessMap.get(systemNumber).get("isUpgradeInProcess")===true ||
        this.allTurbineInProcessMap.get(systemNumber).get("isRestoreInProcess")===true){
            this.allTurbineInProcessMap.get(systemNumber).set("isTurbineInProcess", true);
        } else{
            this.allTurbineInProcessMap.get(systemNumber).set("isTurbineInProcess", false);
        }
        return this.allTurbineInProcessMap;
    }

    getTurbineInProcessMapValue(systemNumber, processName) {
        return this.allTurbineInProcessMap.get(systemNumber).get(processName);
    }

    setMapOfprocessResponseArray(val){
        this.mapOfprocessResponseArray = val;
    }

    getMapOfprocessResponseArray(){
        return this.mapOfprocessResponseArray;
    }

    addTurbineListOfTurbines(val) {

    }

    setGeneralConfigurationsMap(val){
        this.generalConfigurationsMap = val;
        this.isProdEnvironment = this.generalConfigurationsMap.get("isProductionEnvironment");
        return this.generalConfigurationsMap;
    }
    getGeneralConfigurationsMap(){
        return this.generalConfigurationsMap;
    }
}

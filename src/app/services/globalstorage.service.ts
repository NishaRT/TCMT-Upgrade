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

    retryCountForGlobalPolling;

    selectedParkId;

    selectedParkName;
    selectedTurbinesForTreeView=[];

    listOfAcceptedCommandStatus = [0,1];

    listOfTurbines;

    turbineTypeWiseMap = {};

    private mapOfTurbines; // To be filled

    private mapOfprocessResponseArray;

    mapOfTurbineStatuses = new Map();

    pollBucketForTurbines = new Map();

    activeTurbineProcessListMap = new Map();

    activeTurbineMap = new Map();

    failedTurbineMap = new Map();

    turbineCountMapForTurbineInfo = new Map();

    timeOutFlagOfGlobalPolling = false;

    private allTurbineInProcessMap;

    needGRData;

    userInfo;

    private timesMap;

    private errorTypesMap;

    private generalConfigurationsMap;

    private isProductionEnvironment = true;

    //Symbols
    exclamationTriangle = '<i class="fa fa-exclamation-triangle error-color m-t-xs" aria-hidden="true"></i>';

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
    // setAllTurbines(val){
    //   //console.log("GlobalSe")
    // }

    setSelectedParkName(val){
        this.selectedParkName = val;
        return this.selectedParkName;
      }

    getSelectedParkName(){
        return this.selectedParkName;
    }
    setSelectedTurbinesForTreeView(val){
      console.log("set the turbines for tree view",val);
      for(var i=0; i<val.length; i++){
        this.selectedTurbinesForTreeView.push({"name":val[i]});
      }
      //this.selectedTurbinesForTreeView = val;

      // for(var i=0; i>val.length; i++){
      //   this.selectedTurbinesForTreeView.push({"Turbinename":val[i].name});
      // }
      // console.log("Global-Storage-service",this.selectedTurbinesForTreeView);


    }
    getSelectedTurbinesForTreeView(){
      return this.selectedTurbinesForTreeView;
    }

    setListOfTurbines(val) {
        this.listOfTurbines = val;
        var mapOfTurbines = new Map();
        if(this.listOfTurbines) {
            for(var i=0; i<this.listOfTurbines.length; i++){
                var turbineObject = this.listOfTurbines[i];
                turbineObject.systemNumber = turbineObject.systemNumber.toString(); //Converting to string when integer is present - since axis contains systemNumber as string
                mapOfTurbines.set(turbineObject.systemNumber, turbineObject);
            }
            this.setMapOfTurbines(mapOfTurbines);
        }
      }

    getListOfTurbines(){
        return this.listOfTurbines;
    }

    getSelectedTile() {
        return this.selectedTile;
    }

    setSelectedTile(val) {
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

    setMapOfTurbines(val){
        this.mapOfTurbines = val;
        this.eventsService.mapOfTurbinesEmitter.next(val);
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
        this.eventsService.userInfoEmitter.next(this.userInfo);
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
      console.log("Inside getTimesMap ---GlobalService");
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
        this.allTurbineInProcessMap = new Map();
        if(val){
            for(var i=0; i<val.length; i++) {
                var processMap = new Map();
                processMap.set("isGetFilesInFolderInProcess", false);
                processMap.set("isPushToSiteInProcess", false);
                processMap.set("isGetTurbineInfoInProcess",false );
                processMap.set("isTurbineInProcess",false );
                processMap.set("isBackupInProcess",false );
                processMap.set("isUpgradeInProcess",false );
                processMap.set("isRestoreInProcess",false );
                this.allTurbineInProcessMap.set((val[i].systemNumber.toString()), processMap); //Converting to string to maintain consistency with GR Data
            }
        }
        return this.allTurbineInProcessMap;
    }

    getAllTurbineInProcessMap() {
        return this.allTurbineInProcessMap;
    }

    setTurbineInProcessMapValue(systemNumber, processName, processValue) {
        var turbineProcessMap = this.allTurbineInProcessMap.get(systemNumber);
        turbineProcessMap.set(processName, processValue);
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
        return this.allTurbineInProcessMap.get(systemNumber.toString()).get(processName);
    }

    setMapOfprocessResponseArray(val){
        this.mapOfprocessResponseArray = val;
    }

    getMapOfprocessResponseArray(){
        return this.mapOfprocessResponseArray;
    }

    setGeneralConfigurationsMap(val){
        this.generalConfigurationsMap = val;
        this.needGRData = this.generalConfigurationsMap.get("needGRData");
        return this.generalConfigurationsMap;
    }
    getGeneralConfigurationsMap(){
        return this.generalConfigurationsMap;
    }

    getUrl() {
        if(window.location.hostname.indexOf("localhost") > -1 || window.location.hostname.indexOf("127.0.0.1") > -1){
            return "http://localhost:5000/";
        } else {
            return "/";
        }
    }

    setPollBucketForTurbines(val){
        this.pollBucketForTurbines = val;
    }

    getPollBucketForTurbines(){
        return this.pollBucketForTurbines;
    }

    setActiveTurbineProcessListMap(val){
        this.activeTurbineProcessListMap = val;
    }

    getActiveTurbineProcessListMap(){
        return this.activeTurbineProcessListMap;
    }

    setFailedTurbineMap(val){
        this.failedTurbineMap = val;
    }

    getFailedTurbineMap(){
        return this.failedTurbineMap;
    }

    setTurbineCountMapForTurbineInfo(val){
        this.turbineCountMapForTurbineInfo = val;
    }

    getTurbineCountMapForTurbineInfo(){
        return this.turbineCountMapForTurbineInfo;
    }

    setActiveTurbineMap(val){
        this.activeTurbineMap = val;
    }

    getActiveTurbineMap(){
        return this.activeTurbineMap;
    }

    setTimeOutFlagOfGlobalPolling(val){
        this.timeOutFlagOfGlobalPolling = val;
    }

    getTimeOutFlagOfGlobalPolling(){
        return this.timeOutFlagOfGlobalPolling;
    }

    setRetryCountForGlobalPolling(val){
        this.retryCountForGlobalPolling = val;
    }

    getRetryCountForGlobalPolling(){
        return this.retryCountForGlobalPolling;
    }

}

import { Component, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { AppService } from 'app/app.service';
import { LiveDataService } from 'app/app.liveDataService';
import { LiveDataItem } from 'app/data-classes/LiveData';
import { GlobalStorageService } from '../services/globalstorage.service';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
// import { TreeviewModule } from 'ngx-treeview';
import { EventsService } from '../services/events.service';
import { DataService } from '../services/data.service';
// import { TimesService } from '../services/times.service';
// import { GEUtils } from '../services/geutils.service';

@Component({
    encapsulation: ViewEncapsulation.None,
    selector: 'tree-view',
    templateUrl: 'tree-view.component.html',
    styleUrls: ['tree-view.component.css','../css/common.css','../css/ngx-material.css']
})

export class TreeViewComponent implements OnInit {
  rows = [
    { Name: 'WTG154', systemNumber: "15022184", ipAddress: '172.16.71.154' }
  ];
  columns = [
    { prop: 'Name' },
    { prop: 'System Number' },
    { prop: 'Ip Address' }
  ];
  constructor(private globalStorageService: GlobalStorageService,private eventsService : EventsService,private dataService: DataService){}
  data :any;
  public selectedSiteName: string;
  turbinesForTree =[];
  //ngxRowsForTurbineParameters =[];
  tableRows = [];
  isPLMDataLoading=false;
  isTurbineSelected =false;
  messageData;
  uploadReq = false;
  downloadReq = false;
  restoreReq = false;
  selectedTurbineForOperation =[];
  selectedTableRows = [];
@ViewChild('pxSiteTable') table: any;



ngOnInit(){

  this.selectedSiteName =this.globalStorageService.getSelectedParkName();
  console.log("site is",this.selectedSiteName);
  this.getTreeView();
  this.subscribeMapOfTurbinesEmitter();
  //this.loadingTableData();



}

private getTreeView(){
  console.log("Tree View Gettinng ready");
  var turbinesList = this.globalStorageService.getSelectedTurbinesForTreeView();
  console.log("In Treesss",turbinesList);
  this.turbinesForTree = turbinesList;
  console.log("This is tree",this.turbinesForTree);
  this.getDataTable();
}
private onSelectedChange(evt){
console.log("Hello Tree",evt);
}

subscribeMapOfTurbinesEmitter(){
  var   allRows =[];
this.eventsService.mapOfTurbinesEmitter.subscribe(mapOfTurbines =>{
  if(mapOfTurbines){
  var turbineList = this.globalStorageService.getListOfTurbines();
  var truebineforTree = this.globalStorageService.getSelectedTurbinesForTreeView();
  //var singleRow =[];
for(var i=0; i<truebineforTree.length; i++){
  for (var j=0; j<turbineList.length; j++){
  //  console.log("fulllll",turbineList[2]);
  //  console.log("treewala",truebineforTree[2]);
    if(truebineforTree[i].name === turbineList[j].systemNumber){
       var singleRow={"systemNumber":turbineList[j].systemNumber,"ipAddress":turbineList[j].ipaddress,"deviceName":turbineList[j].deviceName};
    }
  }
  allRows.push(singleRow);
  }
}
this.tableRows = allRows;
console.log("---tableRows",this.tableRows);

});
}

getDataTable(){
  console.log("Inside getDataTable");
  var turbinsList = this.globalStorageService.getListOfTurbines();


}
onCheckboxChange(event){
  console.log("onCheckboxChange",event.target.name);
  this.isTurbineSelected = true;
  //var selectedTurbineForOperation =[];
  this.selectedTurbineForOperation.push(event.target.name);
}
openDialogBox(event){
  console.log("Inside openDialogBox",event);
  if(event.target.id == 'uploadBtn'){
    this.restoreReq = false;
    this.downloadReq = false;
    this.uploadReq = true;
    this.messageData = "Parameters will be read from the turbine. Please confirm.";
  }
  else if(event.target.id == 'downloadBtn'){
      this.uploadReq = false;
      this.restoreReq = false;
      this.downloadReq = true;
      this.messageData = "Parameters will be downloaded to the turbine. Please confirm.";
  }
  else{
    this.uploadReq = false;
      this.downloadReq = false;
      this.restoreReq = true;
      this.messageData ="Parameters will be downloaded to the turbine. Please confirm..";

  }
}
getSelectedRows(){
  var totalRows = this.table.rows;
    for(var i =0; i<totalRows.length; i++){
      for(var k =0; k<this.selectedTurbineForOperation.length; k++){
        if(this.selectedTurbineForOperation[k] == totalRows[i].systemNumber){
  this.selectedTableRows.push({"systemNumber":totalRows[i].systemNumber,"deviceName":totalRows[i].deviceName,"ipAddress":totalRows[i].ipAddress});
        }

      }

    }
    return this.selectedTableRows;
}
sendCommand(event){

  var selectedRows = this.getSelectedRows();
  var totalRows = document.getElementById('uploadIcon');
  console.log("--------------",totalRows);
  var self =this;
  console.log("Inside Send Command",event);
   var cmdParams = {
  		                    	"parkName": self.globalStorageService.getSelectedParkName,
  		                    	"turbineList" : selectedRows,
  			                    "parkId": self.globalStorageService.getSelectedParkId,
								            "platform":"ESS",
  			                    "mode": 1
             			 };
                   if(this.uploadReq == true){
                console.log("This is for Upload");
                   }
                   else if(this.downloadReq == true){
              console.log("This is for download");
                   }
                   else {
                  console.log("This is for Restore");
                   }

                   self.dataService.callPollAndGetResponseWhenSuccess("sendCommand","UploadFromTurbines",cmdParams,null,1,1,3000, self.setUploadTurbines.bind(self), null);
}

setUploadTurbines(response){
  console.log("Inside setUploadTurbines",response);
}

}

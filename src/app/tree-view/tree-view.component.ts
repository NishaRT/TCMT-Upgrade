import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { AppService } from 'app/app.service';
import { LiveDataService } from 'app/app.liveDataService';
import { LiveDataItem } from 'app/data-classes/LiveData';
import { GlobalStorageService } from '../services/globalstorage.service';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
// import { TreeviewModule } from 'ngx-treeview';
// import { DataService} from '../services/data.service';
// import { EventsService } from '../services/events.service';
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
  constructor(private globalStorageService: GlobalStorageService){}
  data :any;
  public selectedSiteName: string;
  turbinesForTree =[];
  //ngxRowsForTurbineParameters =[];
  ngXRows = [];
  isPLMDataLoading=false;

ngOnInit(){

  this.selectedSiteName =this.globalStorageService.getSelectedParkName();
  console.log("site is",this.selectedSiteName);
  this.getTreeView();



}

private getTreeView(){
  console.log("Tree View Gettinng ready");
  var turbinesList = this.globalStorageService.getSelectedTurbinesForTreeView();
  console.log("In Treesss",turbinesList);
  this.turbinesForTree = turbinesList;
  // for (var i=0; i>turbinesList.length; i++){
  //   console.log("index",i);
  //   this.turbinesForTree.push({"turbine":turbinesList[i].name});
  //
  // }
  console.log("This is tree",this.turbinesForTree);
  this.getDataTable();
}
private onSelectedChange(evt){
console.log("Hello Tree",evt);
}
getDataTable(){
  console.log("Inside getDataTable");
  //var self = this;

  // self.ngxRows = [];
  // var singleRow = {
  //
  //     "Name": "WTG154",
  //     "systemNumber": "15022184",
  //     "ipAddress": "172.16.71.154",
  //     "platform": "DMP",
  //           //"invalidTurbineError" :invalidTurbineError,
  // };
  // self.ngxRows.push(singleRow);

  //self.ngxRows = [...self.ngxRows];
}

}

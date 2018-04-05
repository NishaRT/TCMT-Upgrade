import { Component, ViewEncapsulation} from '@angular/core';
//import {MdDialog, MdDialogRef} from '@angular/material';
import 'rxjs/add/operator/toPromise';
import { GlobalStorageService } from '../services/globalstorage.service';
import { DataService } from '../services/data.service';
import { EventsService } from '../services/events.service';
import { PrepareSiteComponent } from '../preparesite/preparesite.component';
import { TreeViewComponent } from '../tree-view/tree-view.component';
import { TurbineParametersComponent } from '../turbine-parameters/turbine-parameters.component';




@Component({
    moduleId: module.id,
    selector: 'turbines-component',
    templateUrl: './turbines.component.html',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['../css/common.css', '../css/ng2-select.css','turbines.component.css']
})

export class TurbinesComponent {
  selectTurbines =false;
  isTurbinesSelected=false;
  turbinesData = [];
  selectedTurbines =[];
    constructor(private dataService: DataService, private globalStorageService : GlobalStorageService, private eventsService: EventsService,private turbineParameter :TurbineParametersComponent) {

    }
    ngOnInit(){
      this.getTurbinesForDropDown();
    }
private getTurbinesForDropDown(){
  console.log("Inside getTurbinesForDropDown");
}
private openTurbineDialog(){
  console.log("oprn turbine dialog");
  this.selectTurbines = true;
  var  turbinesList = this.globalStorageService.getListOfTurbines();
  console.log("Helloooo",turbinesList);
  this.turbinesData = turbinesList;
 // for(var i=0; i>turbinesList.length; i++){
 //   this.turbinesData.push({name:turbinesList[i].deviceName, platform:turbinesList[i].platform})
 // }
  console.log("turbinesData",this.turbinesData);

}
private selectAll(){
  console.log("All items are selected");

}
private getSelectedTurbines(){
  console.log("Get all Selected turbines for Tree View");
  //this.isTurbinesSelected = true;
  console.log("okButton",this.selectedTurbines);
  this.globalStorageService.setSelectedTurbinesForTreeView(this.selectedTurbines);
  this.turbineParameter.slectedTurbinesForTree();
}
// private turbineSelection(){
//   console.log("Inside turbineSelection");
// }
private singleSelect(val, checked){
  console.log("sigleSelection",val, checked);
  if(checked == true){
    this.selectedTurbines.push({"name":val.systemNumber});
  }
  console.log("Sellll",this.selectedTurbines);
  // if(e.srcElement.checked == true){
  //   console.log("Element is checked");
  //   this.selectedTurbines.push({name:e.srcElement.id});
  // }
//  this.globalStorageService.setSelectedTurbinesForTreeView(this.selectedTurbines);
//  console.log("Selected Items",this.selectedTurbines);

}


}

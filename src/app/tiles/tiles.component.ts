import { Component, Output, EventEmitter } from '@angular/core';
import { GlobalStorageService } from '../services/globalstorage.service';
import {DataService} from '../services/data.service';


@Component({
    moduleId: module.id,
    selector: 'tiles-component',
    templateUrl: './tiles.component.html',
    styleUrls: ['./tiles.component.css', '../css/common.css']
})

export class TilesComponent{

    constructor(private globalStorageService : GlobalStorageService, private dataService : DataService) {

    }

    onTileSelect(val) {
      console.log("Inside OnTileSelect",val);
        this.globalStorageService.setSelectedTile(val);

        switch(val){
            case 1 :
                clearInterval(this.globalStorageService.getBackupStatusPollingId());
                clearInterval(this.globalStorageService.getUpgradeStatusPollingId());
                clearInterval(this.globalStorageService.getRestoreStatusPollingId());
                break;

            case 2 :
                clearInterval(this.globalStorageService.getPrepareSitePollingId());
                clearInterval(this.globalStorageService.getUpgradeStatusPollingId());
                clearInterval(this.globalStorageService.getRestoreStatusPollingId());
                break;
            case 3 :
                clearInterval(this.globalStorageService.getPrepareSitePollingId());
                clearInterval(this.globalStorageService.getBackupStatusPollingId());
                clearInterval(this.globalStorageService.getRestoreStatusPollingId());
                break;
            case 4 :
                clearInterval(this.globalStorageService.getPrepareSitePollingId());
                clearInterval(this.globalStorageService.getBackupStatusPollingId());
                clearInterval(this.globalStorageService.getUpgradeStatusPollingId());
            break;
        }

    }

}

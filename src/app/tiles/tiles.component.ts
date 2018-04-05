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
    selectedTile = 1;

    constructor(private globalStorageService : GlobalStorageService, private dataService : DataService) {

    }

    onTileSelect(val) {
        this.globalStorageService.setSelectedTile(val);
        this.selectedTile = val;
    }

}

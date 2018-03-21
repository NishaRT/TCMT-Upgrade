
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { IComponent } from 'app/app.icomponent';
import { AppService } from 'app/app.service';
import { LiveDataService } from 'app/app.liveDataService';
import { LiveDataItem } from 'app/data-classes/LiveData';

@Component({
    encapsulation: ViewEncapsulation.None,
    selector: 'turbine-parameters[class="flex"][style="flex:1"]',
    templateUrl: 'turbine-parameters.component.html',
    styleUrls: ['turbine-parameters.component.scss']
})

export class TurbineParametersComponent extends IComponent implements OnInit {
    data: any;
    public selectedSystem: any;
    public systemsData = [];
    public isSideBarOpened = false;
    constructor(private appService: AppService, private lds : LiveDataService) {
        super(lds);
        this.appService.sysChange.subscribe(sys => {
            this.selectedSystem = sys;
        });
    }

    ngOnInit() {
        var systems = this.appService.systems.getSystemsByCategoryID("1");
        systems.forEach(element => {
            this.systemsData.push({
                Group: element.Group,
                Name: element.DisplayName,
                Status: this.getRandomizer(1, 6)
            });
        });
    }

    onOpenSideBarClick() {
        this.isSideBarOpened = true;
    }

    onOverLayClick() {
        this.isSideBarOpened = false;
    }

    canChangeScreen() {
        return true;
    }

    onSysClick(system) {
        this.appService.onSelectedSystemChange(system);
    }

    onLiveDataResp(datapoints: LiveDataItem[]) {

      }


    getRandomizer(bottom, top) {
        return Math.floor(Math.random() * (1 + top - bottom)) + bottom;
    }
}

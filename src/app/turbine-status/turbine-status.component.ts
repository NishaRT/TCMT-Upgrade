
import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';
import { IComponent } from 'app/app.icomponent';
import { LiveDataService } from 'app/app.liveDataService';
import { LiveDataItem } from 'app/data-classes/LiveData';
import { AppService } from 'app/app.service';

@Component({
    encapsulation: ViewEncapsulation.None,
    selector: 'turbine-status[class="flex"]',
    templateUrl: 'turbine-status.component.html',
    styleUrls: [
        'turbine-status.component.css'
    ],
})

export class TurbineStatusComponent extends IComponent implements OnInit {

    public Total: string;
    public Online: string;
    public Available: string;
    public Impacted: string;
    public Tripped: string;
    public Stopped: string;
    public Nodata: string;

    public set data(value: any) {

    }


    constructor(private lds: LiveDataService, private appService: AppService) {
        super(lds);
    }

    ngOnInit() {
        this.Total = this.Online = this.Available = this.Impacted = this.Tripped = this.Stopped = this.Nodata = "-";
        var allTurbines = this.appService.systems.getSystemsByCategoryID("1");
        this.Total = allTurbines.length.toString();
        var allDatapoints = [];
        allTurbines.forEach(x=>{
            allDatapoints.push(x.SystemID +"."+1331);
        });
        this.regDataPoints(allDatapoints);
    }


    ngOnDestroy() {
        console.log("Turbine Status is being destroyed :( ");
    }

    canChangeScreen() {
        return true;
    }

    onLiveDataResp(datapoints: LiveDataItem[]) {
        var onlineCount = datapoints.filter(x=>x.value == "1").length;
        var impactedCount = datapoints.filter(x=>x.value == "2").length;
        var availableCount = datapoints.filter(x=>x.value == "3").length;
        var stoppedCount = datapoints.filter(x=>x.value == "4").length;
        var trippedCount = datapoints.filter(x=>x.value == "5").length;
        this.Online = onlineCount.toString();
        this.Impacted = impactedCount.toString();
        this.Available = availableCount.toString();
        this.Stopped = stoppedCount.toString();
        this.Tripped= trippedCount.toString();
        this.Nodata = (Number(this.Total) - (onlineCount + impactedCount + availableCount + stoppedCount + trippedCount)).toString();

    }
}
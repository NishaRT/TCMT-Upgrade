
import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';
import { IComponent } from 'app/app.icomponent';
import { AppService } from 'app/app.service';
import { LiveDataService } from 'app/app.liveDataService';
import { LiveDataItem } from 'app/data-classes/LiveData';
import { platform } from 'os';
import { DataTablePagerComponent } from '@swimlane/ngx-datatable';

@Component({
    encapsulation: ViewEncapsulation.None,
    selector: 'turbines-grid',
    templateUrl: 'turbines-grid.component.html',
    styleUrls: [
        'turbines-grid.component.css'
    ],
})

export class TurbinesGridComponent extends IComponent implements OnInit {
    private platformAndDPs = new Map<string, Map<string, string>>();
    public turbinesData = [];
    public cols = [];
    public colsDisplay = new Map<string, string>();
    @Input()
    public set data(value: any) {
        var signals = value.templateData.Signals;
        var allPlatforms = signals.Platform;
        allPlatforms.forEach(element => {
            var innerMap = new Map<string, string>();
            this.platformAndDPs.set(element.name, innerMap);
            var allSignals = element.Signal;
            allSignals.forEach(sig => {
                innerMap.set(sig.dataPointId, sig.displayName);
            });
        });
    }

    constructor(private appService: AppService, private lds: LiveDataService) {
        super(lds);
    }

    ngOnInit() {
        // this.colsDisplay.set("TurbineName", "1");
        // this.colsDisplay.set("TurbineID", "1");
        // this.colsDisplay.set("IPAddress", "1");
        var turbines = this.appService.systems.getSystemsByCategoryID("1");
        var allDataPoints = [];
        var allPlatforms = Array.from(this.platformAndDPs.keys());
        var temp = this;
        allPlatforms.forEach(platfrm => {
            var requiredSystems = turbines.filter(x => x.Platform === platfrm);
            requiredSystems.forEach(sys => {
                var sysToBePushed = {};
                sysToBePushed["TurbineID"] = sys.SystemID;
                sysToBePushed["TurbineName"] = sys.DisplayName;
                sysToBePushed["IPAddress"] = sys.IPAddress;

                var dps = temp.platformAndDPs.get(platfrm);
                Array.from(dps.keys()).forEach(dpId => {
                    allDataPoints.push(sys.SystemID + "." + dpId);
                    sysToBePushed[dps.get(dpId)] = "-";
                    if (temp.colsDisplay.get(dpId) == null)
                        temp.colsDisplay.set(dpId,dps.get(dpId))
                });
               
                temp.turbinesData.push(sysToBePushed);
            });
        });
        this.updateCols();
        this.regDataPoints(allDataPoints);
    }

    updateCols() {
        this.cols = [];
        var allValues = Array.from(this.colsDisplay.values());
        var dis = new Set(allValues);
        dis.add("TurbineName");
        dis.add("TurbineID");
        dis.add("IPAddress");
        dis.forEach(element => {
            if (element == "TurbineName" || element == "TurbineID" || element == "IPAddress") {
                this.cols.push({
                    "prop": element,
                    "sortable": true,
                    "frozenLeft": true,
                    "draggable": false
                });
            }
            else {
                this.cols.push({
                    "prop": element,
                    "sortable": "true",
                    "width": "200"

                });
            }
        });
        this.cols = [...this.cols];
    }


    onLiveDataResp(datapoints: LiveDataItem[]) {
        var temp = this;
        this.turbinesData.forEach(sys => {
           var requiredDPs = datapoints.filter(x=>x.systemId == sys.TurbineID);
           requiredDPs.forEach(dp =>{
                var prop = temp.colsDisplay.get(dp.dataPointId.split(".")[1]);
                if(sys[prop]!=undefined){
                    sys[prop] = dp.value;
                }

           });
        });
        this.turbinesData = [...this.turbinesData];
    }


    ngOnDestroy() {
        console.log("Turbines Grid is being destroyed :( ");
    }

    canChangeScreen() {
        return true;
    }


}
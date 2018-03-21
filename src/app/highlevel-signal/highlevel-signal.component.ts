
import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';
import { IComponent } from 'app/app.icomponent';
import { LiveDataService } from 'app/app.liveDataService';
import { LiveDataItem } from 'app/data-classes/LiveData';
import { AppService } from 'app/app.service';


@Component({
    encapsulation: ViewEncapsulation.None,
    selector: 'highlevel-signal',
    templateUrl: 'highlevel-signal.component.html',
    styleUrls: ['highlevel-signal.component.scss']
})

export class HighlevelSignalComponent extends IComponent implements OnInit {
    public classFromMenu: any;
    private dataPointId : string;

    @Input()
    public set data(value: any) {
        this.dataPointId = value.templateData.dataPointId;  
        var splits = this.dataPointId.split(".");
         var system = this.appService.systems.getSystemByID(splits[0]);
         if(system !=null){
             var signal = this.appService.signals.Signals.filter(x=>x.DataPointId == splits[1] && x.TypeID == system.TypeID);
             if(signal.length >0){
                 this.SignalName = signal[0].Description;
                 this.UnitsValue = signal[0].EU;
                 this.regDataPoint(this.dataPointId);
             }
         }

    }

    @Input('signalName') SignalName: String;
    @Input('signalValue') SignalValue: String; //tobe removed as an Input.
    @Input('unitsValue') UnitsValue: String;

    constructor(private livedataService : LiveDataService, private appService: AppService) { 
        super(livedataService);
        
    }

    ngOnInit() { 
        //this.livedataService.addDataPointForSubscription("1.1303");
        // this.regDataPoint("1.1303");
    }


    ngOnDestroy() {
        console.log("High Level Signal is being destroyed :( ");
    }

    canChangeScreen() {
        return true;
    }

    onLiveDataResp(datapoints: LiveDataItem[]) {
        this.SignalValue = datapoints[0].value;
      }
}
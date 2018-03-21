
import { Component, OnInit, ViewEncapsulation, Input } from '@angular/core';
import { IComponent } from 'app/app.icomponent';
import { LiveDataService } from 'app/app.liveDataService';
import { LiveDataItem } from 'app/data-classes/LiveData';

@Component({
    encapsulation: ViewEncapsulation.None,
    selector: 'highlevel-alarm[class="flex"]',
    templateUrl: 'highlevel-alarm.component.html',
    styleUrls: [
        'highlevel-alarm.component.scss'
      ],
})

export class HighLevelAlarmComponent extends IComponent implements OnInit {
    @Input()
    public set data(value:any){
    
    }
    classFromMenu: any;
    constructor(private lds: LiveDataService) {super(lds);
 }

    ngOnInit() { }


    ngOnDestroy(){
        console.log("High Level Alarms is being destroyed :( ");
    }

    canChangeScreen() {
        return true;
       }

       onLiveDataResp(datapoints: LiveDataItem[]) {
        
      }
}
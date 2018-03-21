
import { Injectable } from '@angular/core';
import { SCADAService } from 'app/app.scadaService';
import { Subject } from 'rxjs/Subject';
import { LiveDataResponse, LiveDataItem } from 'app/data-classes/LiveData';

@Injectable()
export class LiveDataService {

    public liveDataSubscriber = new Subject<LiveDataItem[]>();
    private currentListForSubscription = new Map();
    constructor(private scadaService : SCADAService) {
        this.fetchLiveData();
     }
    

    addDataPointsForSubscription(signals: string[]) {
        signals.forEach(element => {
            this.addDataPointForSubscription(element);
        });
    }

    addDataPointForSubscription(signal: string) {
        var point = this.currentListForSubscription.get(signal);
        if (point && point != undefined) {
            point["currentCount"] = point["currentCount"] + 1;
        }
        else {
            this.currentListForSubscription.set(signal, { "currentCount": 1 });
        }
    }


    removeDataPointsFromSubscription(signals: string[]) {
        signals.forEach(element => {
            this.removeDataPointFromSubscription(element);
        });
    }

    removeDataPointFromSubscription(signal: string) {
        var point = this.currentListForSubscription.get(signal);
        if (point && point != undefined) {
            var currentCount = point["currentCount"];
            currentCount = currentCount - 1;
            if (currentCount == 0) {
                this.currentListForSubscription.delete(signal);
            }
        }
    }

    private fetchLiveData(){
        var temp = this;
        var interval = 1000;
        setInterval(() => {
            if(this.currentListForSubscription.size >0){
                var dataPoints = Array.from(this.currentListForSubscription.keys());
                temp.scadaService.getLiveData(dataPoints).subscribe(x=>
                {
                    temp.liveDataSubscriber.next(x.Data);
                })
            }
        }, 1000);
    }
}
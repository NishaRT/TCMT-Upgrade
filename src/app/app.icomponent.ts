import { Observable } from 'rxjs/Observable';
import { LiveDataService } from 'app/app.liveDataService';
import { LiveDataItem } from 'app/data-classes/LiveData';

export abstract class IComponent {
   currentSubscribedPoints = Array<string>();
  abstract data: any;
  abstract canChangeScreen();

  constructor(private liveDataService) {
    var temp = this;
    // Can I write better than this dabba code ?? :( 
    liveDataService.liveDataSubscriber.subscribe(points=>{
      if(temp.currentSubscribedPoints.length >0){
        var required = points.filter(x=> temp.currentSubscribedPoints.indexOf(x.dataPointId)>-1);
        temp.onLiveDataResp(required);
      }
    });


    // liveDataService.liveDataSubscriber.filter(
    //   function(val, index) {
    //     return temp.currentSubscribedPoints.indexOf(val[index].dataPointId) > -1;
    //   }
    // ).subscribe(x=>{
    //   console.log(x);
    // })
  }

  abstract onLiveDataResp(datapoints : LiveDataItem[]);

   regDataPoints(dataPoints: string[]) {
    dataPoints.forEach(element => {
      if(this.currentSubscribedPoints[element]=== undefined){
        this.currentSubscribedPoints.push(element);
      }
    });
    this.liveDataService.addDataPointsForSubscription(dataPoints);
  }

   regDataPoint(datapoint: string) {
    if(this.currentSubscribedPoints[datapoint]=== undefined){
      this.currentSubscribedPoints.push(datapoint);
    }
    this.liveDataService.addDataPointForSubscription(datapoint);
  }

   unregDataPoints(dataPoints: string[]) {
    dataPoints.forEach(element => {
      if(this.currentSubscribedPoints[element] && this.currentSubscribedPoints[element]!= undefined){
        var index = this.currentSubscribedPoints.indexOf(element);
        this.currentSubscribedPoints.splice(index, 1);
      }
    });
    this.liveDataService.removeDataPointsFromSubscription(dataPoints);
  }

   unregDataPoint(datapoint: string) {
    if(this.currentSubscribedPoints[datapoint] && this.currentSubscribedPoints[datapoint]!= undefined){
      var index = this.currentSubscribedPoints.indexOf(datapoint);
      this.currentSubscribedPoints.splice(index, 1);
    }
    this.liveDataService.removeDataPointFromSubscription(datapoint);
  }



}

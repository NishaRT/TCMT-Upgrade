
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'TurbineStatus'
})

export class TurbineStatusPipe implements PipeTransform {
    transform(value: string, quality: any): any {
        switch (value) {
            case "1":
                return "turbineStatusOnline";
            case "2":
                return "turbineStatusImpacted";
            case "3":
                return "turbineStatusAvailable";
            case "4":
                return "turbineStatusStopped";
            case "5":
                return "turbineStatusTripped";
            default:
                return "turbineStatusNoData";

        }
    }
}
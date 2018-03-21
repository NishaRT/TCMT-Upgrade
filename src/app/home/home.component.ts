
import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import 'rxjs/add/operator/switchMap';
import { Observable } from 'rxjs/Observable';
import { IComponent } from 'app/app.icomponent';
import { LiveDataService } from 'app/app.liveDataService';
import { LiveDataItem } from 'app/data-classes/LiveData';

@Component({
    selector: 'home',
    templateUrl: 'home.component.html',
})

export class HomeComponent extends IComponent implements OnInit {
    public classFromMenu: any;

    @Input()
    public set data(value: any) {
        this.classFromMenu = value.$.class;
    }


    constructor(private route: ActivatedRoute, private lds : LiveDataService) {super(lds);
 }

    ngOnInit() {

    }

    canChangeScreen() {
        return false;
       }

       onLiveDataResp(datapoints: LiveDataItem[]) {
        
      }
}
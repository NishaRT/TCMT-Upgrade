
import { Component, OnInit, ViewEncapsulation, Output, EventEmitter, Input } from '@angular/core';
import { IComponent } from 'app/app.icomponent';
import { LiveDataService } from 'app/app.liveDataService';
import { LiveDataItem } from 'app/data-classes/LiveData';

@Component({
    selector: 'header-comp',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './header.component.html',
    styleUrls: [
        './header.component.scss'
    ],
})

export class HeaderComponent extends IComponent implements OnInit {
    canChangeScreen(){
        return true;
    }
    data: any;
    @Input() locales: any[];

    public isBlackThemeSelectedInCheckbox;

    @Output() showSideBar: EventEmitter<any> = new EventEmitter<any>();
    @Output() localeChange: EventEmitter<any> = new EventEmitter<any>();
    @Output() isBlackThemeSelected: EventEmitter<boolean> = new EventEmitter<boolean>();
    public servertime: number;
    constructor(private livedataService : LiveDataService) {super(livedataService);
 }

    ngOnInit() {
        this.setTimer();
    }

    onOpenSideBarClick() {
        this.showSideBar.emit();
    }

    localeChanged(lang) {
        this.localeChange.emit(lang);
    }

    themeChanged(isSelected) {
        this.isBlackThemeSelected.emit(isSelected);
    }

    setTimer() {
        var temp = this;
        setInterval(() => {
            var dat = new Date();
            temp.servertime = dat.getTime();
        }, 1000);
    }

    onLiveDataResp(datapoints: LiveDataItem[]) {
        
      }
}
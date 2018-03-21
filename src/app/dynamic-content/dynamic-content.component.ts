
import {
  Component, OnInit, ViewContainerRef, ViewChild, ViewChildren, ContentChildren,
  ReflectiveInjector, ComponentFactoryResolver, ViewEncapsulation, QueryList, Input,
  AfterViewInit, Renderer2, RendererStyleFlags2
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HomeComponent } from 'app/home/home.component';
import { NoContentComponent } from 'app/no-content';
import { HighlevelSignalComponent } from 'app/highlevel-signal/highlevel-signal.component';

import { forEach } from '@angular/router/src/utils/collection';
import { IComponent } from 'app/app.icomponent';
import { TurbineStatusComponent } from 'app/turbine-status/turbine-status.component';
import { HighLevelAlarmComponent } from 'app/highlevel-alarm/highlevel-alarm.component';
import { TurbinesGridComponent } from 'app/turbinesinfo/turbines-grid.component';
import { TurbineParametersComponent } from 'app/turbine-parameters/turbine-parameters.component';
import { LiveDataService } from 'app/app.liveDataService';
import { LiveDataItem } from 'app/data-classes/LiveData';
import { TurbineUpgradeComponent } from 'app/turbine-upgrade/turbine-upgrade.component';

//import "./dynamic-content.component.scss";



@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'dynamic-component[class="flex"]',
  entryComponents: [HomeComponent, HighlevelSignalComponent],
  template: `
    <div #dynamicDiv [ngClass]="classFromMenu" >
     <ng-template #dynamicComponentContainer></ng-template>
    </div>
  `,
  styleUrls: [
    './dynamic-content.component.scss'
  ],
})

export class DynamicComponent extends IComponent  implements OnInit, AfterViewInit {


  classFromMenu: any;
  private tempData;
  @Input()
  public set data(value: any) {
    this.tempData = value;
    this.buildComponent(value);
  }


  allComponents: any[];
  public childClass: string;
  public dynamicComps: any[];
  public innerDynamicComponent = false;
  private orderAndObjs: any[];
  private childComponents: any[];

  private mappings = {
    'HomeComponent': HomeComponent,
    'DynamicComponent': DynamicComponent,
    'NoContentComponent': NoContentComponent,
    'HighlevelSignalComponent': HighlevelSignalComponent,
    'TurbineStatusComponent': TurbineStatusComponent,
    'HighLevelAlarmComponent': HighLevelAlarmComponent,
    'TurbinesGridComponent': TurbinesGridComponent,
    'TurbineParametersComponent':TurbineParametersComponent
  }

  @ViewChild('dynamicComponentContainer', { read: ViewContainerRef }) dynamicComponentContainer: ViewContainerRef;


  constructor(private resolver: ComponentFactoryResolver, private route: Router,
    private activatedRoute: ActivatedRoute, private renderer2: Renderer2, private livedataService : LiveDataService) {
    super(livedataService);

  }

  ngOnInit() {
    var temp = this;
    if (this.data === undefined) {
      if (this.activatedRoute.data && this.activatedRoute.data != null && this.innerDynamicComponent == false) {
        this.activatedRoute.data.subscribe(x => {
          temp.buildComponent(x);
          console.log(x);
        });
      }
    }
  }

  buildComponent(passedData) {
    if (passedData && passedData != null) {
      if (passedData.class && passedData.class != null)
        this.classFromMenu = passedData.class;

      this.orderAndObjs = [];
      for (var key in passedData) {
        if (Object.prototype.hasOwnProperty.call(passedData, key)) {
          if (key == "class" || key == "order"|| key=="style")
            continue;

          var obj = passedData[key];

          if (key === "group") {
            if (obj instanceof Array === true) {
              for (var i = 0; i < obj.length; i++) {
                var order = obj[i].order;
                this.orderAndObjs[order] = { 'component': DynamicComponent, 'data': obj[i] };
              }
            }
            else{
              var order = obj.order;
              this.orderAndObjs[order] = { 'component': DynamicComponent, 'data': obj };
            }
            continue;
          }



          if (obj instanceof Array === true) {
            for (var i = 0; i < obj.length; i++) {
              var order = obj[i].order;
              this.orderAndObjs[order] = { 'component': this.mappings[key], 'data': obj[i] };
            }
          }
          else{
            var order = obj.order;
            this.orderAndObjs[order] = { 'component': this.mappings[key], 'data': obj };
          }

        }
      }

      var temp = this;
      this.orderAndObjs.forEach(obj => {
        var componentFactory = this.resolver.resolveComponentFactory(obj.component);
        var compRef = this.dynamicComponentContainer.createComponent(componentFactory);
        if (obj.data && obj.data != null && obj.data && obj.data != null && obj.data.class && obj.data.class != null)
          this.renderer2.addClass(compRef.location.nativeElement, obj.data.class);
        if (obj.data && obj.data != null && obj.data && obj.data != null && obj.data.style && obj.data.style != null) {
          var style = obj.data.style;
          var styles = style.split(';');
          styles.forEach(element => {
            var stylePropAndVal = element.split(':');
            if (stylePropAndVal && stylePropAndVal != null && stylePropAndVal.length == 2) {
              this.renderer2.setStyle(compRef.location.nativeElement, stylePropAndVal[0], stylePropAndVal[1]);
            }
          });
        }

        if (obj.component == DynamicComponent)
          (<DynamicComponent>compRef.instance).innerDynamicComponent = true;

        (<IComponent>compRef.instance).data = obj.data;

        if (temp.allComponents === undefined)
          temp.allComponents = [];
        if (obj.component == DynamicComponent) {

          var comps = (<DynamicComponent>compRef.instance).allComponents;
          if (comps && comps != null && comps.length > 0) {
            comps.forEach(element => {
              if (element && element != null)
                temp.allComponents.push(element);
            });
          }
        }
        else {
          temp.allComponents.push((<IComponent>compRef.instance));
        }

      });

    }
  }


  ngAfterViewInit(): void {

  }

  canChangeScreen() {
    var toBeReturned = false;
    var temp = this;
    this.allComponents.forEach(element => {
     toBeReturned  = toBeReturned || element.canChangeScreen();
    });
    return toBeReturned;
  }

  onLiveDataResp(datapoints: LiveDataItem[]) {

  }


  // checkChildElementsForChildScreen(childObjects): boolean {
  //   if (childObjects && childObjects != null) {
  //     childObjects.forEach(element => {
  //       if (element.allComponents && element.allComponents != null && element.allComponents.length > 0) {
  //         return this.checkChildElementsForChildScreen(element.allComponents);
  //       }
  //       else {
  //         return (<IComponent>childObjects).canChangeScreen();
  //       }
  //     });
  //   }
  //   return true;
  // }


}

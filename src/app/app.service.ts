import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { SCADAService } from 'app/app.scadaService';
import { Subject, Symbol } from 'rxjs';
import { Signal, SignalList } from 'app/data-classes/Signal';
import { SystemList, Systems, System } from 'app/data-classes/System';



@Injectable()
export class AppService {
  // Note the explicitArray... If there is only one child, it will be treated as an Object instead of Array.. 
  private xml2js = require('xml2js').Parser({ 'explicitArray': false, 'preserveChildrenOrder': true, 'mergeAttrs': true });

  constructor(private http: HttpClient, private scadaService: SCADAService) { }

  public systems: SystemList;
  public loginInfo: any;
  public signals: SignalList;
  public screensInfo: any;
  public sysChange  = new Subject<any>();

  getMenuData(): Subject<any> {
    var sub = new Subject();
    this.scadaService.getScreens().subscribe(screensInfo => {
      sub.next(screensInfo);
      sub.complete();
    }, error => {
      sub.error("Error during screens");
    });
    return sub;
  }

  getLoginInfo(): Subject<any> {
    var sub = new Subject();
    this.scadaService.getLoginInfo().subscribe(loginInfo => {
      this.loginInfo = this.extractData(loginInfo);
      sub.next(loginInfo);
      sub.complete();
    }, error => {
      sub.error("Error during Login Info");
      sub.complete();
    });
    return sub;
  }

  getSystemsInfo(): Subject<any> {
    var sub = new Subject();
    this.scadaService.getSystemsInfo().subscribe(sys => {
/*
We can directly assign the extracted Data to the object.. 
But the functions in the classes will be overwritten.. So we have to do all this crap :(
*/
      var extractedData = this.extractData(sys)
      var sysWithTypes = new SystemList();
      if (extractedData && extractedData != null && extractedData.SystemList && extractedData.SystemList != null) {
        var extSystems = extractedData.SystemList.Systems;
        extSystems.forEach(element => {
          var sysWithType = new Systems();
          sysWithType.SystemType = element.SystemType;
          if (element.System && element.System != null && element.System) {
            if (element.System instanceof Array) {
              element.System.forEach(sysInfo => {
                var sysWithInfo = new System();
                Object.assign(sysWithInfo, sysInfo);
                sysWithType.SystemCollec.push(sysWithInfo);
              });
            }
            else{
              var sysWithInfo = new System();
              Object.assign(sysWithInfo, element.System);
              sysWithType.SystemCollec.push(sysWithInfo);
            }
          }
          sysWithTypes.Systems.push(sysWithType);

        });

      }


      this.systems = sysWithTypes;
      sub.next(this.systems);
      sub.complete();
    }, error => {
      sub.error("Error during Systems Info");
      sub.complete();
    });
    return sub;
  }

  getSignalsInfo(): Subject<any> {
    var sub = new Subject();
    this.scadaService.getSymbolsList().subscribe(sig => {
      var extractedData = this.extractData(sig);
      this.signals = new SignalList();
      var allSymbols = extractedData.SymbolTable.Item;
      if(allSymbols!=null && allSymbols.length > 0){
        allSymbols.forEach(element => {
          var symbol = new Signal();
          Object.assign(symbol,element);
          this.signals.Signals.push(symbol);
        });
      }

      sub.next(this.signals);
      sub.complete();
    }, error => {
      sub.error("Error during Signals Info");
      sub.complete();
    });
    return sub;
  }

  extractData(data): any {
    var toBeReturned = {};
    var parsedData = data.replace(/&/g, "&amp;").replace(/-/g, "&#45;").replace(/[(]/g, "&#40;").replace(/[)]/g, "&#41;");
    var x = this.xml2js.parseString(parsedData, function (err, result) {
      toBeReturned = result;
    });
    return toBeReturned;
  }

onSelectedSystemChange(system){
  this.sysChange.next(system);
}

}

import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Injectable } from '@angular/core';
import { of } from 'rxjs/observable/of';
import {AppService} from './app.service';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class DataResolver implements Resolve<any> {
  constructor(private appState: AppService){
console.log("I am in constructor")
  }
 resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) : Observable<any> {
   return this.appState.getMenuData();
  }
}

/**
 * An array of services to resolve routes with data.
 */


// export const APP_RESOLVER_PROVIDERS = [
//   DataResolver
// ];

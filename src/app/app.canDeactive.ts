
import { Injectable } from '@angular/core';
import { IComponent } from 'app/app.icomponent';
import { ActivatedRouteSnapshot, RouterStateSnapshot ,CanDeactivate} from '@angular/router';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class CanDeactivateService implements CanDeactivate<IComponent> {
    canDeactivate(component: IComponent, currentRoute: ActivatedRouteSnapshot, 
        currentState: RouterStateSnapshot, nextState?: RouterStateSnapshot): boolean | Observable<boolean> | Promise<boolean> {
            return  component.canChangeScreen();
    }

    constructor() { }
}
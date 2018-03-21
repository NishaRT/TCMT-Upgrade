import { Routes, RouterModule } from '@angular/router';
import {DataResolver} from './app.resolver';
import { NoContentComponent } from './no-content';
import { AppComponent } from 'app/app.component';
import { HeaderComponent } from 'app/header/header.component';
import { HomeComponent } from 'app/home/home.component';
import { NgModule } from '@angular/core';
import { CanDeactivateService } from 'app/app.canDeactive';
 const ROUTES: Routes = [
  // { path: '', pathMatch: 'full', redirectTo: 'home' },
   { path: 'reports', component: HomeComponent, canDeactivate : [CanDeactivateService]},
  // { path: '**',    component: NoContentComponent }
];


@NgModule({
  imports: [
    RouterModule.forRoot(ROUTES,{
      useHash: false,
      enableTracing:false
    })
  ],
  exports: [
    RouterModule
  ],
  providers: [
    DataResolver
  ]
})
export class AppRoutingModule { }





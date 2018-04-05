import { NgModule, LOCALE_ID,APP_INITIALIZER } from '@angular/core';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import { BrowserModule} from '@angular/platform-browser';
import { CookieService } from 'ngx-cookie-service';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { RouterModule, PreloadAllModules } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import localeZh from '@angular/common/locales/zh';
import {SelectModule} from 'ng2-select';
import { DatePipe } from '@angular/common';


import {MatSidenavContainer, MatSidenavModule, MatCheckboxModule} from '@angular/material'

/*
 * Platform and Environment providers/directives/pipes
 */
import { environment } from 'environments/environment';
import { AppRoutingModule } from './app.routes';
// App is our top level component
import { AppComponent } from './app.component';
import {  DataResolver } from './app.resolver';
import { AppService } from './app.service';
import {HeaderComponent} from './header/header.component';
import {HighlevelSignalComponent} from './highlevel-signal/highlevel-signal.component';
import { NoContentComponent } from './no-content';
import {HomeComponent} from './home/home.component';

import * as $ from 'jquery';
import {NgxDatatableModule} from '@swimlane/ngx-datatable';
import { TreeviewModule } from 'ngx-treeview';

import 'bootstrap';
import '../../node_modules/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.js';
import '../../node_modules/xml2js/lib/xml2js.js';
import '../styles/styles.scss';

import { MappingsService } from 'app/app.mappings';
import { DynamicComponent } from 'app/dynamic-content/dynamic-content.component';
import { HighLevelAlarmComponent } from 'app/highlevel-alarm/highlevel-alarm.component';
import { TurbineStatusComponent } from 'app/turbine-status/turbine-status.component';
import {TurbinesGridComponent} from './turbinesinfo/turbines-grid.component';
import { CanDeactivateService } from 'app/app.canDeactive';
//addition for integration
//components
import { TurbineParametersComponent } from 'app/turbine-parameters/turbine-parameters.component';
import { TurbineUpgradeComponent } from 'app/turbine-upgrade/turbine-upgrade.component';
//import { TilesComponent } from './tiles/tiles.component';
import { TreeViewComponent } from './tree-view/tree-view.component';
import { SitesComponent } from './sites/sites.component';
import { TurbinesComponent } from './turbines/turbines.component';
import { TilesComponent } from './tiles/tiles.component';
import { PrepareSiteComponent } from './preparesite/preparesite.component';
import { BackupComponent } from './backup/backup.component';
import { UpgradeComponent } from './upgrade/upgrade.component';
import { RestoreComponent } from './restore/restore.component';
import { FooterComponent} from './footer/footer.component';
import { Modal } from './modal/modal.component';

//services
import { GlobalStorageService } from './services/globalstorage.service';
import { DataService } from './services/data.service';
import {EventsService} from './services/events.service';
import { GEUtils } from './services/geutils.service';
import { TimesService } from './services/times.service';

import {
  L10nConfig,
  L10nLoader,
  LocalizationModule,
  LocaleValidationModule,
  StorageStrategy,
  ProviderType
} from 'angular-l10n';
import { SCADAService } from 'app/app.scadaService';
import { TurbineStatusPipe } from 'app/pipes/turbine-status.pipe';
import { FilterPipe } from 'app/pipes/filterlist.pipe';
import { LiveDataService } from 'app/app.liveDataService';

const l10nConfig: L10nConfig = {
  locale: {
      languages: [
          { code: 'en', dir: 'ltr' },
          { code: 'de', dir: 'ltr' },
          { code: 'zh-Hans', dir: 'ltr' },
          { code: 'zh-Hant', dir: 'ltr' },

      ],
      defaultLocale: { languageCode: 'en', countryCode: 'US' },
      currency: 'USD',
      storage: StorageStrategy.Cookie,
      cookieExpiration: 30
  },
  translation: {
      providers: [
          { type: ProviderType.Static, prefix: './assets/i18n/' }
      ],
      caching: true,
      composedKeySeparator: '.',
      // missingValue: 'No key',
      i18nPlural: true
  }
};

// Application wide providers
const APP_PROVIDERS = [

  AppService
];

export function initL10n(l10nLoader: L10nLoader): Function {
  return () => l10nLoader.load();
}

// export function HttpLoaderFactory(http: HttpClient) {
//   return new TranslateHttpLoader(http, "assets/i18n/",".json");
// }


registerLocaleData(localeZh, 'zh-Hans');


/**
 * `AppModule` is the main entry point into Angular2's bootstraping process
 */
@NgModule({
  bootstrap: [ AppComponent ],
  entryComponents: [HomeComponent, DynamicComponent, HighLevelAlarmComponent, HighlevelSignalComponent, TurbineStatusComponent, TurbinesGridComponent, TurbineParametersComponent,TurbineUpgradeComponent],
  declarations: [
    AppComponent,
    HeaderComponent,
    NoContentComponent,
    HomeComponent,
    DynamicComponent,
    HighlevelSignalComponent,
    HighLevelAlarmComponent,
    TurbineStatusComponent,
    TurbinesGridComponent,
    TurbineParametersComponent,
    TurbineUpgradeComponent,
    TurbineStatusPipe,
    SitesComponent,
    TurbinesComponent,
    TreeViewComponent,
    TilesComponent,
    PrepareSiteComponent,
    BackupComponent,
    UpgradeComponent,
    RestoreComponent,
    FooterComponent,
    Modal,
    FilterPipe
    ],
  /**
   * Import Angular's modules.
   */
  imports: [
    BrowserModule,
    SelectModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    FormsModule,
    HttpModule,
    HttpClientModule,
    MatSidenavModule,
    MatCheckboxModule,
    NgxDatatableModule,
    TreeviewModule.forRoot(),
    NgbModule.forRoot(),
    LocalizationModule.forRoot(l10nConfig),
    LocaleValidationModule.forRoot()
    //   RouterModule.forRoot(ROUTES, {
    //   useHash: false,//Boolean(history.pushState) === false,
    //   preloadingStrategy: PreloadAllModules,

    // }),

    /**
     * This section will import the `DevModuleModule` only in certain build types.
     * When the module is not imported it will get tree shaked.
     * This is a simple example, a big app should probably implement some logic
     */
    // ...environment.showDevModule ? [ DevModuleModule ] : [],
  ],
  /**
   * Expose our Services and Providers into Angular's dependency injection.
   */
  providers: [
    // {provide:LOCALE_ID, useValue :'en-US'},
    {
      provide: APP_INITIALIZER,
      useFactory: initL10n,
      deps: [L10nLoader],
      multi: true
  },
    environment.ENV_PROVIDERS,
    AppService,
    SCADAService,
    LiveDataService,
    MappingsService,
    CanDeactivateService,
    GlobalStorageService,
    DataService,
    EventsService,
    TimesService,
    GEUtils,
    DatePipe,
    CookieService
  ]

})
export class AppModule {}

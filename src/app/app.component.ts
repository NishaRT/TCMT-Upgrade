
import { Component, OnInit, AfterViewInit, ViewEncapsulation, ViewChild, ElementRef, ComponentFactoryResolver, Injector, HostListener } from '@angular/core';
import { environment } from 'environments/environment';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppService } from './app.service';
import { Element } from '@angular/compiler';
import { Router, ActivatedRoute } from '@angular/router';
import { CanDeactivate } from '@angular/router'
import { MappingsService } from './app.mappings'
import { forEach } from '@angular/router/src/utils/collection';
import { L10nDecimalPipe, TranslationService, LocaleService } from 'angular-l10n'
import { error } from 'util';

@Component({
  selector: 'app',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './app.component.html',
  styleUrls: [
    './app.component.scss'
  ],

})
export class AppComponent implements OnInit, AfterViewInit {


  public isSideBarOpened = false;
  public isLoaded = false;
  public currentStatus = "";
  public isBlackThemeSelected = true;


  private xml2js = require('xml2js').Parser({'explicitArray': false,'preserveChildrenOrder':true,'mergeAttrs':true});
  public menuItems: any[];
  public locales: any[];

  constructor(private appState: AppService, private activatedRoute: Router, private route: ActivatedRoute,
    private componentFactoryResolver: ComponentFactoryResolver, private injector: Injector, private maps: MappingsService,
    public locale: LocaleService, public translation: TranslationService) {
    this.locales = [];
    this.locales.push({ 'text': 'US', 'langCode': 'en', 'countryCode': 'en' });
    this.locales.push({ 'text': 'GER', 'langCode': 'de', 'countryCode': 'de' });
    this.locales.push({ 'text': 'CHI-S', 'langCode': 'zh-Hans', 'countryCode': 'zh' });
    this.locales.push({ 'text': 'CHI-T', 'langCode': 'zh-Hant', 'countryCode': 'zh' });
    this.locale.setDefaultLocale('en', 'en');

  }

  onLocaleChange(locale: any) {
    var required = this.locales.filter(function (loc) {
      return loc.text === locale;
    })
    if (required.length == 1)
      this.locale.setDefaultLocale(required[0].langCode, required[0].countryCode);
  }

  onThemeChange(isBlackSelected: boolean) {
    this.isBlackThemeSelected = isBlackSelected;
  }

  @HostListener('window:unload', ['$event'])
  unloadHandler(event) {

  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHander(event) {
    // ...
  }

  ngOnInit() {
    // Change to default route.
    this.activatedRoute.navigate(['']);
    this.currentStatus = "Fetching Park Info...."
    var temp = this;
    console.log("I am in OnInit");
   setTimeout(()=>{
      this.appState.getLoginInfo().subscribe(loginResult => {
        setTimeout(()=>{
        this.currentStatus = "Fetching Screens Info...."
        this.appState.getMenuData().subscribe(menuResult => {
          setTimeout(()=>{
          this.currentStatus = "Fetching Systems Info...";
          this.appState.getSystemsInfo().subscribe(systemsResult => {
            setTimeout(()=>{
              this.currentStatus = "Fetching Signals Info...";
            this.appState.getSignalsInfo().subscribe(signalsResult => {
              this.extractMenuData(menuResult);
              this.isLoaded = true;
            }, error => {
              this.currentStatus = "Error while fetching Signals Info..";
            });},1000)
          }, error => {
            this.currentStatus = "Error while fetching Systems Info..";
          });},1000)
        }, error => {
          this.currentStatus = "Error while fetching Screens Info..";
        });},1000)
      }, error => {
        this.currentStatus = "Error while fetching Park Info..";
      });},1000)
  }

  public ngAfterViewInit() {
    // console.log("I am in After View Init");
  }

  extractMenuData(data) {
    var temp = this;
    var x = this.xml2js.parseString(data, function (err, result) {
      temp.menuItems = result["Menu"].MenuItem;
      // temp.isLoaded = true;
    })
    var routes = this.activatedRoute.config;
    temp.menuItems.forEach(element => {
      var href = element.href;
      var requiredhref = href.substring(href.indexOf('/') + 1);
      var requiredComponent = temp.maps.getComponentType(element.component);
      var data = undefined, canDeactivateComp = undefined;
      if (element.Screen && element.Screen != null)
        data = element.Screen;
      if (element.canDeactivate && element.canDeactivate != null)
        canDeactivateComp = temp.maps.getComponentType(element.canDeactivate);
      var toBePushed = {};
      toBePushed['path'] = requiredhref;
      toBePushed['component'] = requiredComponent;
      if (data && data != null)
        toBePushed['data'] = data;
      if (canDeactivateComp && canDeactivateComp != null) {
        var arr = [];
        arr.push(canDeactivateComp);
        toBePushed['canDeactivate'] = arr;
      }

      routes.push(toBePushed);
    });
    routes.push({ 'path': '**', 'component': temp.maps.getComponentType("NoContentComponent") })
    this.activatedRoute.resetConfig(routes);




  }


  onOpenSideBarClick() {
    this.isSideBarOpened = true;
  }

  onOverLayClick() {
    this.isSideBarOpened = false;
  }



}

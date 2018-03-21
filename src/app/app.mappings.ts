
import { Injectable } from '@angular/core';
import { HomeComponent } from 'app/home/home.component';
import { DynamicComponent } from 'app/dynamic-content/dynamic-content.component';
import { NoContentComponent } from 'app/no-content';
import { HighlevelSignalComponent } from 'app/highlevel-signal/highlevel-signal.component';
import { CanDeactivateService } from 'app/app.canDeactive';
import { HighLevelAlarmComponent } from 'app/highlevel-alarm/highlevel-alarm.component';
//added for integration
import { TurbineParametersComponent } from 'app/turbine-parameters/turbine-parameters.component';
import { TurbineUpgradeComponent } from 'app/turbine-upgrade/turbine-upgrade.component';
import { SitesComponent } from 'app/sites/sites.component';
import { TilesComponent } from 'app/tiles/tiles.component';
import { PrepareSiteComponent } from 'app/preparesite/preparesite.component';
import { BackupComponent } from 'app/backup/backup.component';
import { UpgradeComponent } from 'app/upgrade/upgrade.component';
import { RestoreComponent } from 'app/restore/restore.component';
import { FooterComponent} from 'app/footer/footer.component';
import { Modal } from 'app/modal/modal.component';


@Injectable()
export class MappingsService {
    private mappings={
        'HomeComponent': HomeComponent,
        'DynamicComponent':DynamicComponent,
        'NoContentComponent':NoContentComponent,
        'HighlevelSignalComponent':HighlevelSignalComponent,
        'CanDeactivateService': CanDeactivateService,
        'HighLevelAlarmComponent':HighLevelAlarmComponent,
        //added for integration
        'TurbineParametersComponent':TurbineParametersComponent,
        'TurbineUpgradeComponent':TurbineUpgradeComponent,
        'SitesComponent':SitesComponent,
        'TilesComponent':TilesComponent,
        'PrepareSiteComponent':PrepareSiteComponent,
        'BackupComponent':BackupComponent,
        'UpgradeComponent':UpgradeComponent,
        'RestoreComponent':RestoreComponent,
        'FooterComponent':FooterComponent,
        'Modal':Modal


    }
    constructor() { }

    public getComponentType(typeName: string) {
        let type = this.mappings[typeName];
        return type ;
    }

}

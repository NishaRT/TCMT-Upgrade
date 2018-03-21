export class System {
    Type: String;
    DisplayName: String;
    SystemID: String;
    TypeID: String;
    Group: String;
    IPAddress: String;
    Port: String;
    PlatformID: String;
    SystemType: String;
    CategoryID: String;
    Platform: String;
    ModelNo: String;
    version: String;
    WTGPowerCategory: String;
    RatedPower: String;
    SecureMode: String;
}


export class Systems {
    SystemType: String;
    SystemCollec: System[];

    constructor() {
        this.SystemCollec = new Array<System>();
    }

    public getSystemByID(id: string) {
        var requiredSystem = this.SystemCollec.filter(x => x.SystemID == id);
        if (requiredSystem && requiredSystem != null && requiredSystem.length > 0) {
            return requiredSystem[0];
        }
        return null;
    }
}


export class SystemList {
    Systems: Systems[];
    constructor() {
        this.Systems = new Array<Systems>();
    }

    public getSystemByID(id: string) {
        var toBeReturned = null;
        this.Systems.forEach(element => {
            var requiredElement = element.getSystemByID(id);
            if (requiredElement != null) {
                toBeReturned = requiredElement;
                return true;
            }
        });
        return toBeReturned;
    }

    public getSystemsByCategoryID(id: string) {

        var type = this.getCatByID(Number(id));
        if (type === "") {
            return null;
        }

        var requiredType = this.Systems.filter(x => x.SystemType === type);
        if (requiredType && requiredType != null && requiredType.length > 0) {
            return requiredType[0].SystemCollec;
        }
        return null;

    }

    public getSystemsByCategoryType(type: string) {
        var requiredType = this.Systems.filter(x => x.SystemType === type);
        if (requiredType && requiredType != null && requiredType.length > 0) {
            return requiredType[0].SystemCollec;
        }
        return null;
    }

    private getCatByID(id: number) {
        var type = "";
        switch (id) {
            case 1:
                type = "Turbines";
                break;
            case 2:
                type = "WFMS";
                break;
            case 3:
                type = "Metmast";
                break;
            case 4:
                type = "Site";
                break;
            case 5:
                type = "Master";
                break;
            case 6:
                type = "SCADA";
                break;
            case 7:
                type = "Substations";
                break;
            case 10:
                type = "SCM";
                break;
            case 12:
                type = "External Applications";
                break;
            case 13:
                type = "Customer IO";
                break;
        }
        return type;
    }
}
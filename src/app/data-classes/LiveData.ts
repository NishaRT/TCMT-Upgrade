export class LiveDataItem {
    dataPointId: string;
    value: string;
    timeStamp: string;
    quality: string;
    systemId : string;
    constructor(data:string){
        var splits = data.split(",");
        this.dataPointId = splits[0];
        this.value = splits[1];
        this.timeStamp = splits[2];
        this.quality = splits[3];
        this.systemId = this.dataPointId.split(".")[0];
    }
}

export class LiveDataResponse {
    Status: boolean;
    Msg: string;
    RTServerTime: number;
    OffSet: number;
    Data : LiveDataItem[];

  
    constructor() {
       this.Data = new Array<LiveDataItem>();

    }
}
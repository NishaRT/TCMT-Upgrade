export class Signal {
    DataPointId: String;
    Name: String;
    TypeID: String;
    Type: String; EU: String;
    Low: String;
    High: String;
    Prec: String;
    Description: String;
    SignalName: String;
    ComponentName: String;
}

export class SignalList{
    Signals:Signal[];
    
    constructor() {
    this.Signals = new Array<Signal>();    

    }
}
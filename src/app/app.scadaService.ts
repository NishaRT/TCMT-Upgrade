
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
// import { Observable } from 'rxjs/Observable';
import {Observable} from 'rxjs/Rx';
import * as rxjs from 'rxjs';


import { LiveDataItem, LiveDataResponse } from 'app/data-classes/LiveData';


@Injectable()
export class SCADAService {
    private ranges;
    constructor(private httpClient: HttpClient) {
        if (this.isMockService === true) {
            this.httpClient.get('assets/mock-data/DataPointValueRanges.json', { responseType: 'json' }).subscribe(x => {
                this.ranges = x;
            })
        }
    }
    private isMockService = true;
    private mockDelay = 3000;
    private xml2js = require('xml2js').Parser({ 'explicitArray': false, 'preserveChildrenOrder': true, 'mergeAttrs': true });
    private CallSOAPService(methodName, body): Observable<any> {
        if (this.isMockService === false) {
            var temp = this;
            let headers = new HttpHeaders().set('Accept', '*/*')
                .set('Content-Type', 'application/x-www-form-urlencoded');
            var response = this.httpClient.post("http://localhost/WindSCADAWebService/WindSCADAWebService.asmx/" + methodName,
                body, { headers: headers });
            return response
        }
        else {
            switch (methodName) {
                case 'GetLoginInfo': {
                    return this.httpClient.get('assets/mock-data/GetLoginInfo.xml', { responseType: 'text' });
                }
                case 'GetUserScreens': {
                    return this.httpClient.get('assets/mock-data/mock-data.xml', { responseType: 'text' });
                }
                case 'GetSystemList': {
                    return this.httpClient.get('assets/mock-data/GetSystemList.xml', { responseType: 'text' });
                }
                case 'GetSymbolTable': {
                    return this.httpClient.get('assets/mock-data/GetSymbolTable.xml', { responseType: 'text' });
                }
                case 'GetLiveData': {
                    return this.getDummyLiveData(body);
                }
            }
        }
    }

    getDummyLiveData(dataPoints: string[]) {
        var temp = this;
        return Observable.from(
            new Promise(resolve => {
                this.httpClient.get('assets/mock-data/GetLiveData.xml', { responseType: 'text' }).subscribe(data => {
                    var parsedData = data.replace(/&/g, "&amp;").replace(/-/g, "&#45;").replace(/[(]/g, "&#40;").replace(/[)]/g, "&#41;");
                    var x = this.xml2js.parseString(parsedData, function (err, result) {
                        var ldResponse = result.GetLiveDataResult.LiveData;
                        var toBeReturned = new LiveDataResponse();
                        toBeReturned.Status = ldResponse.Status;
                        toBeReturned.Msg = ldResponse.Msg;
                        toBeReturned.RTServerTime = new Date().getTime();
                        toBeReturned.OffSet = ldResponse.OffSet;
                     
                        dataPoints.forEach(element => {
                            var value;
                            var dataPoint = element.split(".")[1];
                            var isRangePresent = temp.ranges.datapoints[dataPoint] && temp.ranges.datapoints[dataPoint] != null;
                            if (isRangePresent == true) {
                                value = temp.getRandomizer(temp.ranges.datapoints[dataPoint].High, temp.ranges.datapoints[dataPoint].Low)
                            }
                            else {
                                value = temp.getRandomizer(100, 0)
                            }
                            var d = element + "," + value + "," + toBeReturned.RTServerTime + ",0";
                            var toBeAdded = new LiveDataItem(d);
                            toBeReturned.Data.push(toBeAdded);
                        });
                        resolve(toBeReturned);
                    });
                });
            })
        );
    }

    getRandomizer(bottom, top) {
        return Math.floor(Math.random() * (1 + top - bottom)) + bottom;
    }


    getLoginInfo(): Observable<any> {
        return this.CallSOAPService('GetLoginInfo', null);
    }

    getSystemsInfo(): Observable<any> {
        return this.CallSOAPService('GetSystemList', null);
    }

    getSymbolsList(): Observable<any> {
        return this.CallSOAPService('GetSymbolTable', null);
    }

    getScreens(): Observable<any> {
        return this.CallSOAPService('GetUserScreens', null);
    }

    getLiveData(dataPoints: string[]): Observable<LiveDataResponse> {
        return this.CallSOAPService('GetLiveData', dataPoints);
    }

}
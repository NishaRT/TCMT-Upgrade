import {Component, ViewChild, ElementRef} from '@angular/core';

import {NgbModal, ModalDismissReasons, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { EventsService } from '../services/events.service';
import { DataService } from '../services/data.service';
import { GlobalStorageService } from '../services/globalstorage.service';

@Component({
  selector: 'modal-component',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css', '../css/common.css']
})
export class Modal {
  @ViewChild('content') content;
  @ViewChild('confirmationBox') confirmationBox;

  closeResult: string;
  errorMessage: string;
  errorCode: string;
  errorCallBackFunction : any;
  errorMap : any;

  ngbModalOptions;

  constructor(private modalService: NgbModal, private eventsService : EventsService, private dataService : DataService,
              private globalStorageService : GlobalStorageService) {

    var self = this;
    self.eventsService.errorEmitter.subscribe(errorMap => {
      self.openErrorBoxWithMap(errorMap);
    });

    let op: NgbModalOptions = {
      backdrop : 'static',
      beforeDismiss : this.beforeModalClose.bind(this),
      keyboard : false
    };
    this.ngbModalOptions = op;
  }

  open(content) {
    const modalRef = this.modalService.open(content, this.ngbModalOptions).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return  `with: ${reason}`;
    }
  }

  beforeModalClose(){
    var self = this;
    if("invalid_token" == this.errorCode){
      this.dataService.getToken().then(getTokenResp => self.globalStorageService.setAccessToken(getTokenResp["access_token"]));
    }

    if(["invalid_token", "INVALID_BACKUP"].indexOf(this.errorCode) > -1){
      self.errorCode = null;
      self.errorMessage = null;
    }
    if(self.errorCallBackFunction){
      self.errorCallBackFunction(self.errorMap);
    }
  }

  openErrorBoxWithMap(errorMap){
    var self = this;
    if(errorMap) {
      self.errorMap = errorMap;
      if(self.errorCode != errorMap.get("errorCode")) {
        self.errorCode = errorMap.get("errorCode");
        self.errorMessage = errorMap.get("errorMessage");
        self.errorCallBackFunction = errorMap.get("callBackFunction")
        self.open(this.content);
      }
    }
  }
}

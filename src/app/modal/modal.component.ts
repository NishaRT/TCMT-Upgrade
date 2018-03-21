import {Component, ViewChild, ElementRef} from '@angular/core';

import {NgbModal, ModalDismissReasons} from '@ng-bootstrap/ng-bootstrap';
import { EventsService } from '../services/events.service';

@Component({
  selector: 'modal-component',
  templateUrl: './modal.component.html'
})
export class Modal {
  @ViewChild('content') content;
  @ViewChild('confirmationBox') confirmationBox;

  closeResult: string;
  errorMessage: string;
  errorCode: string;

  modalDefaultOptions = {
  //  backdrop : 'static',
    beforeDismiss : this.beforeModalClose.bind(this),
    keyboard : false
  }

  constructor(private modalService: NgbModal, private eventsService : EventsService) {
    var self = this;
    self.eventsService.errorEmitter.subscribe(errorMap => {
      self.openErrorBoxWithMap(errorMap);
    });

    self.eventsService.confirmationEmitter.subscribe(errorMap => {
      self.openConfirmationBoxWithMap(errorMap);
    });
  }

  open(content) {
    const modalRef = this.modalService.open(content, this.modalDefaultOptions).result.then((result) => {
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
    if("invalid_token" == this.errorCode){
      window.location.reload();
    }
  }

  openErrorBoxWithMap(errorMap){
    var self = this;
    if(errorMap) {
      self.errorCode = errorMap.get("errorCode");
      self.errorMessage = errorMap.get("errorMessage");
      self.open(this.content);
    } else {
      self.errorMessage = "An unexpected error has occured, Please contact Administrator."
    }
  }

  openConfirmationBoxWithMap(confirmationMap){
    var message = confirmationMap.get("message");
    var callBackFunction

  }
}

import {Component, ElementRef, ViewChildren, QueryList, Output, EventEmitter, Input} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router'

@Component({
  selector: 'app-success-popup',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './success-popup.component.html',
  styleUrl: './success-popup.component.scss'
})
export class SuccessPopupComponent {
  @Input() confirmMessage: string = 'Your message has been successfully sent!';
  @Input() title: string = 'Congratulations';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm() {
    this.confirm.emit();
  }
}

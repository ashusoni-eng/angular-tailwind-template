import {Component, EventEmitter, Input, input, Output} from '@angular/core';

@Component({
  selector: 'app-delete-record-popup',
  imports: [],
  templateUrl: './delete-record-popup.component.html',
  styleUrl: './delete-record-popup.component.scss'
})
export class DeleteRecordPopupComponent {
  @Input() confirmMessage: string = 'Are you sure you want to delete this record?';
  @Input() title: string = 'Confirmation';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}

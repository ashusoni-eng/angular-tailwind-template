import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appTrimInput]'
})
export class TrimInputDirective {

  constructor(private el: ElementRef) {}

  @HostListener('blur') onBlur() {
    this.el.nativeElement.value = this.el.nativeElement.value.trim();
  }

}

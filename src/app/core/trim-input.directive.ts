import { Directive, ElementRef, HostListener, Inject } from '@angular/core';

@Directive({
  selector: '[appTrimInput]'
})
export class TrimInputDirective {

  constructor(@Inject(ElementRef) private el: ElementRef) {}

  @HostListener('blur') onBlur() {
    this.el.nativeElement.value = this.el.nativeElement.value.trim();
  }

}

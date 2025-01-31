import { Directive, ElementRef, HostBinding, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: 'img[placeholder]'
})
export class PlaceholderImageDirective {
  @Input() placeholder?: string;

  constructor(private el: ElementRef, private renderer: Renderer2) {
    this.setPlaceholder();
  }

  private setPlaceholder() {
    const img = this.el.nativeElement;
    img.onerror = () => {
      if (this.placeholder)
        this.renderer.setAttribute(img, 'src', this.placeholder);
    }
  }
}

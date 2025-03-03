import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[inspectable]'
})
export class InspectableDirective {
  private readonly element: HTMLElement;

  constructor(el: ElementRef) {
    this.element = el.nativeElement;
    this.resetTransform();
    this.element.style.transition = 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)';
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    const rect = this.element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const rotateY = (e.clientX - centerX) / 20;
    const rotateX = (centerY - e.clientY) / 20;

    this.applyTransform(rotateX, rotateY);
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.resetTransform();
  }

  private applyTransform(rotateX: number, rotateY: number): void {
    this.element.style.transform = `
      perspective(1000px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      scale(1.05)
    `;
  }

  private resetTransform(): void {
    this.element.style.transform = 'none';
  }
}

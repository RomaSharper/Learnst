import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: '[inspectable]'
})
export class InspectableDirective {
  private readonly element: HTMLElement;
  private readonly sensitivity = 15;
  private readonly transitionTime = '0.25s';
  private lightSpot: HTMLElement;

  constructor(el: ElementRef, private renderer: Renderer2) {
    this.element = el.nativeElement;
    this.lightSpot = this.createLightSpot();
    this.initStyles();
  }

  private initStyles(): void {
    this.renderer.setStyle(this.element, 'position', 'relative');
    this.renderer.setStyle(this.element, 'overflow', 'hidden');
    this.renderer.setStyle(this.element, 'transition',
      `transform ${this.transitionTime} cubic-bezier(0.18, 0.89, 0.32, 1.28)`);
  }

  private createLightSpot(): HTMLElement {
    const spot = this.renderer.createElement('div');
    this.renderer.setStyle(spot, 'position', 'absolute');
    this.renderer.setStyle(spot, 'width', '200px'); // Увеличено для большего распространения
    this.renderer.setStyle(spot, 'height', '200px');
    this.renderer.setStyle(spot, 'background',
      'radial-gradient(circle at center, rgba(255,255,255,0.15) 0%, transparent 80%)'); // Мягче градиент
    this.renderer.setStyle(spot, 'pointer-events', 'none');
    this.renderer.setStyle(spot, 'opacity', '0');
    this.renderer.setStyle(spot, 'transition', 'opacity 0.3s, transform 0.3s');
    this.renderer.setStyle(spot, 'mix-blend-mode', 'soft-light'); // Добавлен режим наложения
    this.renderer.appendChild(this.element, spot);
    return spot;
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    const rect = this.element.getBoundingClientRect();
    const rotateY = (e.clientX - rect.left - rect.width/2) / this.sensitivity;
    const rotateX = (rect.top + rect.height/2 - e.clientY) / this.sensitivity;

    // Точное позиционирование относительно элемента
    const x = e.clientX - rect.left - 100; // Центрирование по ширине пятна
    const y = e.clientY - rect.top - 100;  // Центрирование по высоте пятна

    this.renderer.setStyle(this.lightSpot, 'transform', `translate(${x}px, ${y}px)`);
    this.renderer.setStyle(this.lightSpot, 'opacity', '0.8'); // Уменьшена непрозрачность

    this.applyTransform(rotateX, rotateY);
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.renderer.setStyle(this.lightSpot, 'opacity', '0');
    this.resetTransform();
  }

  private applyTransform(rotateX: number, rotateY: number): void {
    this.renderer.setStyle(this.element, 'transform', `
      perspective(1200px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      scale(1.02)
    `);
  }

  private resetTransform(): void {
    this.renderer.setStyle(this.element, 'transform', 'perspective(1200px) translateZ(0) scale(1)');
  }
}

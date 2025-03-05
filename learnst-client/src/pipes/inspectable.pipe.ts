import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: '[inspectable]'
})
export class InspectableDirective {
  private readonly element: HTMLElement;
  private readonly sensitivity = 18;
  private readonly transitionTime = '0.15s';
  private lightSpot: HTMLElement;

  constructor(el: ElementRef, private renderer: Renderer2) {
    this.element = el.nativeElement;
    this.lightSpot = this.createLightSpot();
    this.initStyles();
  }

  private initStyles(): void {
    this.renderer.setStyle(this.element, 'position', 'relative');
    this.renderer.setStyle(this.element, 'overflow', 'visible'); // Изменено на visible
    this.renderer.setStyle(this.element, 'transform-style', 'preserve-3d');
    this.renderer.setStyle(this.element, 'backface-visibility', 'hidden');
    this.renderer.setStyle(this.element, 'will-change', 'transform');
    this.renderer.setStyle(this.element, 'transition',
      `transform ${this.transitionTime} cubic-bezier(0.18, 0.89, 0.32, 1.28)`);

    // Добавляем псевдо-элемент для маскировки артефактов
    const borderCover = this.renderer.createElement('div');
    this.renderer.setStyle(borderCover, 'position', 'absolute');
    this.renderer.setStyle(borderCover, 'inset', '-2px');
    this.renderer.setStyle(borderCover, 'box-shadow', 'inset 0 0 8px 2px rgba(0,0,0,0.08)');
    this.renderer.setStyle(borderCover, 'pointer-events', 'none');
    this.renderer.setStyle(borderCover, 'z-index', '1');
    this.renderer.appendChild(this.element, borderCover);
  }

  private createLightSpot(): HTMLElement {
    const spot = this.renderer.createElement('div');
    this.renderer.setStyle(spot, 'position', 'absolute');
    this.renderer.setStyle(spot, 'width', '200px');
    this.renderer.setStyle(spot, 'height', '200px');
    this.renderer.setStyle(spot, 'background',
      'radial-gradient(circle at center, rgba(255,255,255,0.4) 0%, transparent 70%)');
    this.renderer.setStyle(spot, 'pointer-events', 'none');
    this.renderer.setStyle(spot, 'opacity', '0');
    this.renderer.setStyle(spot, 'transition', 'opacity 0.15s, transform 0.15s');
    this.renderer.setStyle(spot, 'mix-blend-mode', 'soft-light');
    this.renderer.setStyle(spot, 'z-index', '2');
    this.renderer.setStyle(spot, 'filter', 'blur(12px)'); // Увеличено размытие
    this.renderer.appendChild(this.element, spot);
    return spot;
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    const rect = this.element.getBoundingClientRect();

    // Курсорные координаты относительно элемента
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Позиционируем "свет" прямо под курсором
    const spotRadius = 100; // радиус половины светового пятна
    const x = Math.max(-spotRadius, Math.min(mouseX - spotRadius, rect.width - spotRadius));
    const y = Math.max(-spotRadius, Math.min(mouseY - spotRadius, rect.height - spotRadius));

    this.renderer.setStyle(this.lightSpot, 'transform', `translate(${x}px, ${y}px)`);
    this.renderer.setStyle(this.lightSpot, 'opacity', '0.8');

    const rotateY = (mouseX - rect.width / 2) / this.sensitivity;
    const rotateX = (rect.top + rect.height / 2 - e.clientY) / this.sensitivity;

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
      scale(1.015)
    `);
  }

  private resetTransform(): void {
    this.renderer.setStyle(this.element, 'transform', 'perspective(1200px) translateZ(0) scale(1)');
  }
}

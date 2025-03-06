import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
  selector: '[inspectable]'
})
export class InspectableDirective {
  private readonly element: HTMLElement;
  private readonly sensitivity = 18;
  private readonly transitionTime = '0.2s';  // Увеличим время для плавности
  private lightSpot: HTMLElement;

  private currentClicksCount = 0;
  private clicksCount = this.getRandomClicksCount();

  constructor(el: ElementRef, private renderer: Renderer2) {
    this.element = el.nativeElement;
    this.lightSpot = this.createLightSpot();
    this.initStyles();
  }

  private getRandomClicksCount(): number {
    return Math.floor(Math.random() * 8) + 3; // Генерируем от 3 до 10
  }

  private initStyles(): void {
    this.renderer.setStyle(this.element, 'position', 'relative');
    this.renderer.setStyle(this.element, 'overflow', 'visible');
    this.renderer.setStyle(this.element, 'transform-style', 'preserve-3d');
    this.renderer.setStyle(this.element, 'backface-visibility', 'hidden');
    this.renderer.setStyle(this.element, 'will-change', 'transform');
    this.renderer.setStyle(this.element, 'transition',
      `transform ${this.transitionTime} cubic-bezier(0.18, 0.89, 0.32, 1.28)`);

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
    this.renderer.setStyle(spot, 'filter', 'blur(12px)');
    this.renderer.appendChild(this.element, spot);
    return spot;
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    const rect = this.element.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const spotRadius = 100;
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

  @HostListener('click')
  onClick(): void {
    this.currentClicksCount++;
    if (this.currentClicksCount === this.clicksCount) {
      this.animateCard();
      this.currentClicksCount = 0;
      this.clicksCount = this.getRandomClicksCount();
    } else {
      // Случайная анимация откидывания на случайный угол
      const randomAngle = (Math.random() * 30) - 15; // Угол от -15 до 15
      const randomAxis = Math.random() < 0.5 ? 'X' : 'Y'; // Случайная ось (X или Y)

      this.renderer.setStyle(this.element, 'transform', `rotate${randomAxis}(${randomAngle}deg)`);
      setTimeout(() => {
        this.renderer.setStyle(this.element, 'transform', 'perspective(1200px) scale(1)'); // Восстановление
      }, parseFloat(this.transitionTime) * 1000); // Восстанавливаем после окончания анимации
    }
  }

  private animateCard(): void {
    this.renderer.setStyle(this.element, 'transition', `transform ${this.transitionTime} ease`);
    this.renderer.setStyle(this.element, 'transform', 'rotateY(360deg)');

    setTimeout(() => {
      this.resetTransform(); // Восстановление исходного состояния после анимации
    }, parseFloat(this.transitionTime) * 1000);
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
    this.renderer.setStyle(this.element, 'transition', `transform ${this.transitionTime} cubic-bezier(0.18, 0.89, 0.32, 1.28)`);
  }
}

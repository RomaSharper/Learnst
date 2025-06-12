import {Directive, ElementRef, HostListener, Renderer2} from '@angular/core';

@Directive({
  selector: '[inspectable]'
})
export class InspectableDirective {
  private readonly element: HTMLElement;
  private readonly sensitivity = 18;
  private readonly lightSpot: HTMLElement;
  private readonly transitionTime = '0.25s';

  constructor(el: ElementRef, private renderer: Renderer2) {
    this.element = el.nativeElement;
    this.lightSpot = this.createLightSpot();
    this.initStyles();
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    const rect = this.element.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Анимация светового пятна
    this.renderer.setStyle(this.lightSpot, 'transform',
      `translate(${mouseX - 100}px, ${mouseY - 100}px)`);
    this.renderer.setStyle(this.lightSpot, 'opacity', '0.8');

    // Плавное отклонение элемента
    const rotateY = (mouseX - rect.width / 2) / this.sensitivity;
    const rotateX = (rect.height / 2 - mouseY) / this.sensitivity;

    this.applyTransform(rotateX, rotateY, 1.02);
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.renderer.setStyle(this.lightSpot, 'opacity', '0');
    this.resetTransform();
  }

  private initStyles(): void {
    const styles = {
      position: 'relative',
      overflow: 'visible',
      transformStyle: 'preserve-3d',
      backfaceVisibility: 'hidden',
      willChange: 'transform',
      transition: `transform ${this.transitionTime} cubic-bezier(0.25, 0.46, 0.45, 0.94)`
    };

    Object.entries(styles).forEach(([key, value]) =>
      this.renderer.setStyle(this.element, key, value)
    );

    this.addBorderCover();
  }

  private addBorderCover(): void {
    const borderCover = this.renderer.createElement('div');
    const coverStyles = {
      position: 'absolute',
      inset: '-2px',
      'box-shadow': 'inset 0 0 12px 3px rgba(0,0,0,0.1)',
      'pointer-events': 'none',
      'z-index': '1'
    };

    Object.entries(coverStyles).forEach(([key, value]) =>
      this.renderer.setStyle(borderCover, key, value)
    );

    this.renderer.appendChild(this.element, borderCover);
  }

  private createLightSpot(): HTMLElement {
    const spot = this.renderer.createElement('div');
    const spotStyles = {
      position: 'absolute',
      width: '200px',
      height: '200px',
      background: 'radial-gradient(circle at center, rgba(255,255,255,0.5) 0%, transparent 70%)',
      'pointer-events': 'none',
      opacity: '0',
      transition: 'opacity 0.2s, transform 0.2s',
      'mix-blend-mode': 'soft-light',
      'z-index': '2',
      filter: 'blur(15px)'
    };

    Object.entries(spotStyles).forEach(([key, value]) =>
      this.renderer.setStyle(spot, key, value)
    );

    this.renderer.appendChild(this.element, spot);
    return spot;
  }

  private applyTransform(rotateX: number, rotateY: number, scale: number): void {
    this.renderer.setStyle(this.element, 'transform', `
      perspective(1200px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      scale(${scale})
    `);
  }

  private resetTransform(): void {
    this.renderer.setStyle(this.element, 'transform',
      'perspective(1200px) translateZ(0) scale(1)');
  }
}

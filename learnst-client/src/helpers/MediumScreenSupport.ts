import {Directive, HostListener} from "@angular/core";
import {WindowService} from "../services/window.service";

@Directive({
  selector: '[appMediumScreenSupport]'
})
export class MediumScreenSupport {
  isMediumScreen!: boolean;

  constructor() {
    this.isMediumScreen = WindowService.isMediumScreen();
  }

  @HostListener('window:resize', ['$event'])
  resizeHandler(_event: Event): void {
    this.isMediumScreen = WindowService.isMediumScreen();
  }
}

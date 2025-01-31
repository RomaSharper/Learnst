import { Directive, HostBinding } from '@angular/core';

@Directive({
  selector: '[noDownloading]'
})
export class NoDownloadingDirective {
  @HostBinding('attr.draggable') draggable = 'false';
  @HostBinding('attr.oncontextmenu') onContextMenu = 'return false;';
}

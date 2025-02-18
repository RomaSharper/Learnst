import { RouterLink } from '@angular/router';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { NoDownloadingDirective } from '../../directives/NoDownloadingDirective';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss'],
  imports: [RouterLink, MatButtonModule, NoDownloadingDirective]
})
export class NotFoundComponent implements AfterViewInit, OnInit, OnDestroy {
  oldColor!: string;
  notFoundColor = '#191919';

  constructor(private elementRef: ElementRef) { }

  ngOnInit(): void {
    this.oldColor = this.elementRef.nativeElement.ownerDocument.body.style.backgroundColor;
  }
  ngOnDestroy(): void {
    this.elementRef.nativeElement.ownerDocument.body.style.backgroundColor = this.oldColor;
  }

  ngAfterViewInit(): void {
    this.elementRef.nativeElement.ownerDocument.body.style.backgroundColor = this.notFoundColor;
  }
}

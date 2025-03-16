import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class ColorsService {
  public static generateColor(): string {
    return `#${(0x1000000 + Math.random() * 0xffffff).toString(16).slice(1,6)}`;
  }
}

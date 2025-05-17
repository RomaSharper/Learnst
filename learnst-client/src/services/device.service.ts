import {Injectable} from "@angular/core";
import {DeviceType} from "../models/DeviceType";

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private readonly mobileAgentRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

  getDeviceType = () => this.mobileAgentRegex.test(navigator.userAgent)
    ? DeviceType.Mobile
    : DeviceType.Desktop;
}

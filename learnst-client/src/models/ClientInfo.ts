import { BrowserInfo } from "./BrowserInfo";
import { NetworkInfo } from "./NetworkInfo";
import { GeolocationInfo } from "./GeolocationInfo";

export interface ClientInfo {
  browserInfo: BrowserInfo;
  networkInfo: NetworkInfo;
  geolocationInfo: GeolocationInfo;
}

import {encrypt, decrypt} from 'crypto-js/aes';
import utf8 from 'crypto-js/enc-utf8';

export class CryptoService {
  public static readonly encryptData = (data: any, key: string): string => {
    return encrypt(JSON.stringify(data), key).toString();
  };

  public static readonly decryptData = <T>(data: string, key: string): T | null => {
    try {
      const bytes = decrypt(data, key);
      return JSON.parse(bytes.toString(utf8)) as T;
    } catch (e) {
      return null;
    }
  };
}

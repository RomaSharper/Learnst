import {Location} from '@angular/common';
import {Router} from '@angular/router';

export function Return() {
  return function <T extends { new(...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      goBack: () => void;

      constructor(...args: any[]) {
        super(...args);

        // Добавляем метод goBack
        this['goBack'] = () => {
          const location = args.find((arg) => arg instanceof Location);
          const router = args.find((arg) => arg instanceof Router);

          if (location && router)
            if (window.history.length > 0)
              location.back();
            else
              router.navigate(['/']);
        };
      }
    };
  };
}

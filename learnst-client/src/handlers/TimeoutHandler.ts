import { mergeMap, retryWhen, timer } from "rxjs";

export class TimeoutHandler {
  /**
   * Метод для повторения запросов при ошибке code.
   * Повторяет запрос с задержкой в 1 секунду.
   */
  static retryOnCode(code: number | null = null) {
    return (source: any) =>
      source.pipe(
        retryWhen(errors =>
          errors.pipe(
            mergeMap((error, _index) => {
              if (!code || error.status === code)
                return timer(1000);
              throw error;
            })
          )
        )
      );
  }

  static retryOnCodes(codes: number[]) {
    return (source: any) =>
      source.pipe(
        retryWhen(errors =>
          errors.pipe(
            mergeMap((error, _index) => {
              if (codes.includes(error.status))
                return timer(1000);
              throw error;
            })
          )
        )
      )
  }
}

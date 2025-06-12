export class Arrays {

  public static random<T>(...array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  public static split(str: string, separator: string, count: number): string[] {
    if (count < 1)
      throw new Error('Количество должно быть больше или равно 1');

    // Если разделитель не найден, возвращаем исходную строку в массиве
    if (!str.includes(separator))
      return [str];

    // Если count = 1, возвращаем всю строку
    if (count === 1)
      return [str];

    // Разбиваем строку с учетом максимального количества частей
    const parts = str.split(separator);
    const result: string[] = [];

    // Собираем результат
    for (let i = 0; i < parts.length; i++)
      if (i < count - 1)
        result.push(parts[i]);
      else {
        // Объединяем оставшиеся части в одну
        result.push(parts.slice(i).join(separator));
        break;
      }

    return result;
  }

}

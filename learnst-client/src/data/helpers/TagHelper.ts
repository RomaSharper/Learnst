export class TagHelper {
  /**
   * Преобразует тег из URL-формата в читаемый формат.
   * Пример: "процедурное-программирование" -> "Процедурное программирование"
   */
  static toDisplayFormat(tag: string): string {
    return tag
      .split('-') // Разделяем по дефисам
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Каждое слово с заглавной буквы
      .join(' '); // Объединяем слова пробелами
  }

  /**
   * Преобразует тег из читаемого формата в URL-формат.
   * Пример: "Процедурное программирование" -> "процедурное-программирование"
   */
  static toUrlFormat(tag: string): string {
    return tag
      .toLowerCase() // Приводим к нижнему регистру
      .replace(/\s+/g, '-') // Заменяем пробелы на дефисы
      .trim();
  }
}

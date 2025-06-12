import {MatPaginatorIntl} from '@angular/material/paginator';

export const getRussianPaginatorIntl = () => {
  const paginatorIntl = new MatPaginatorIntl();
  paginatorIntl.firstPageLabel = 'Первая страница';
  paginatorIntl.lastPageLabel = 'Последняя страница';
  paginatorIntl.itemsPerPageLabel = 'Количество элементов:';
  paginatorIntl.nextPageLabel = 'Следующая страница';
  paginatorIntl.previousPageLabel = 'Предыдущая страница';
  paginatorIntl.getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length == 0 || pageSize == 0)
      return `0 из ${length}`;

    length = Math.max(length, 0);
    const startIndex = page * pageSize;
    const currentPosition = startIndex + pageSize;
    const endIndex = startIndex < length ? Math.min(currentPosition, length) : currentPosition;
    return `${startIndex + 1} - ${endIndex} из ${length}`;
  };
  return paginatorIntl;
}

using System.Linq.Expressions;
using Learnst.Application.Extensions;
using Learnst.Domain.Exceptions;
using Learnst.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Learnst.Application.Interfaces;

/// <summary>
/// Интерфейс синхронного репозитория для работы с сущностями.
/// </summary>
/// <typeparam name="T">Тип сущности.</typeparam>
/// <typeparam name="TKey">Тип первичного ключа.</typeparam>
public interface IRepository<T, in TKey> : IBaseRepository<T, TKey> where T : IBaseEntity<TKey> where TKey : IEquatable<TKey>
{
    /// <summary>
    /// Добавляет новую сущность в контекст.
    /// </summary>
    /// <param name="entity">Сущность для добавления.</param>
    /// <returns>Добавленная сущность.</returns>
    /// <remarks>
    /// Этот метод не сохраняет изменения в базе данных. Для сохранения изменений используйте метод <see cref="Save"/>.
    /// </remarks>
    T Add(T entity);

    /// <summary>
    /// Сохраняет все изменения в базе данных.
    /// </summary>
    /// <remarks>
    /// Этот метод вызывает <see cref="DbContext.SaveChanges()"/> из Entity Framework Core.
    /// </remarks>
    void Save();

    /// <summary>
    /// Возвращает сущность по указанному идентификатору.
    /// </summary>
    /// <param name="noTracking">
    /// Флаг, указывающий, нужно ли отключить отслеживание изменений.
    /// Если установлено в <c>true</c>, EF Core не будет отслеживать изменения сущностей.
    /// По умолчанию: <c>true</c>.
    /// </param>
    /// <param name="id">Идентификатор сущности.</param>
    /// <param name="includes">Массив выражений для загрузки связанных данных (Include).</param>
    /// <returns>Сущность или null, если она не найдена.</returns>
    /// <exception cref="NotFoundException">Если сущность не найдена.</exception>
    T? GetById(TKey id, bool noTracking = true, params Expression<Func<T, object?>>[]? includes);

    /// <summary>
    /// Выполняет запрос к базе данных с возможностью фильтрации, сортировки, пагинации и загрузки связанных данных.
    /// </summary>
    /// <param name="noTracking">
    /// Флаг, указывающий, нужно ли отключить отслеживание изменений.
    /// Если установлено в <c>true</c>, EF Core не будет отслеживать изменения сущностей.
    /// По умолчанию: <c>true</c>.
    /// </param>
    /// <param name="where">Условие фильтрации результатов.</param>
    /// <param name="distinct">Флаг, указывающий, нужно ли применить уникальность результатов.</param>
    /// <param name="orderBy">Поле для сортировки результатов.</param>
    /// <param name="descending">Флаг, указывающий, нужно ли выполнить сортировку в обратном порядке.</param>
    /// <param name="skip">Количество записей для пропуска.</param>
    /// <param name="take">Количество записей для возврата.</param>
    /// <param name="includes">Массив выражений для загрузки связанных данных (Include).</param>
    /// <returns>Коллекция сущностей, соответствующих условиям запроса.</returns>
    IEnumerable<T> Get(
        bool noTracking = true,
        Expression<Func<T, bool>>? where = null,
        bool distinct = false,
        Expression<Func<T, object?>>? orderBy = null,
        bool descending = false,
        int? skip = null,
        int? take = null,
        params Expression<Func<T, object?>>[]? includes);

    /// <summary>
    /// Возвращает первую запись из результата запроса.
    /// </summary>
    /// <param name="noTracking">
    /// Флаг, указывающий, нужно ли отключить отслеживание изменений.
    /// Если установлено в <c>true</c>, EF Core не будет отслеживать изменения сущностей.
    /// По умолчанию: <c>true</c>.
    /// </param>
    /// <param name="where">Условие фильтрации результатов.</param>
    /// <param name="orderBy">Поле для сортировки результатов.</param>
    /// <param name="descending">Флаг, указывающий, нужно ли выполнить сортировку в обратном порядке.</param>
    /// <param name="includes">Массив выражений для загрузки связанных данных (Include).</param>
    /// <returns>Первая сущность из результатов запроса.</returns>
    /// <exception cref="NotFoundException">Если результат запроса пуст.</exception>
    T GetFirst(
        bool noTracking = true,
        Expression<Func<T, bool>>? where = null,
        Expression<Func<T, object?>>? orderBy = null,
        bool descending = false,
        params Expression<Func<T, object?>>[]? includes);

    /// <summary>
    /// Возвращает последнюю запись из результата запроса.
    /// </summary>
    /// <param name="noTracking">
    /// Флаг, указывающий, нужно ли отключить отслеживание изменений.
    /// Если установлено в <c>true</c>, EF Core не будет отслеживать изменения сущностей.
    /// По умолчанию: <c>true</c>.
    /// </param>
    /// <param name="where">Условие фильтрации результатов.</param>
    /// <param name="orderBy">Поле для сортировки результатов.</param>
    /// <param name="descending">Флаг, указывающий, нужно ли выполнить сортировку в обратном порядке.</param>
    /// <param name="includes">Массив выражений для загрузки связанных данных (Include).</param>
    /// <returns>Последняя сущность из результатов запроса.</returns>
    /// <exception cref="NotFoundException">Если результат запроса пуст.</exception>
    T GetLast(
        bool noTracking = true,
        Expression<Func<T, bool>>? where = null,
        Expression<Func<T, object?>>? orderBy = null,
        bool descending = false,
        params Expression<Func<T, object?>>[]? includes);

    /// <summary>
    /// Проверяет существование сущности по указанному условию.
    /// </summary>
    /// <param name="predicate">Условие для проверки существования.</param>
    /// <returns><c>true</c>, если хотя бы одна сущность удовлетворяет условию; иначе <c>false</c>.</returns>
    bool Exists(Expression<Func<T, bool>> predicate);
    
    /// <summary>
    /// Удаляет сущность из контекста.
    /// </summary>
    /// <param name="id">Первичный ключ сущности для удаления.</param>
    void Delete(TKey id);

    /// <summary>
    /// Выполняет указанную агрегатную функцию T-SQL.
    /// </summary>
    /// <param name="function">Тип агрегатной функции.</param>
    /// <param name="where">Условие фильтрации.</param>
    /// <param name="selector">Выражение для выбора поля.</param>
    /// <returns>Результат выполнения агрегатной функции.</returns>
    TResult? Aggregate<TResult>(
        EFHelper.AggregateFunction function,
        Expression<Func<T, bool>>? where = null,
        Expression<Func<T, TResult?>>? selector = null);
}
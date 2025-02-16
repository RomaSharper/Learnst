using System.Linq.Expressions;
using Learnst.Domain.Extensions;
using Learnst.Infrastructure.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace Learnst.Infrastructure.Interfaces;

/// <summary>
/// Интерфейс асинхронного репозитория для работы с сущностями.
/// </summary>
/// <typeparam name="T">Тип сущности.</typeparam>
/// <typeparam name="TKey">Тип первичного ключа.</typeparam>
public interface IAsyncRepository<T, in TKey> : IBaseRepository<T, TKey> where T : class, IBaseEntity<TKey>
    where TKey : IEquatable<TKey>
{
    /// <summary>
    /// Асинхронно добавляет новую сущность в контекст.
    /// </summary>
    /// <param name="entity">Сущность для добавления.</param>
    /// <returns>Завершение операции добавления.</returns>
    /// <remarks>
    /// Этот метод не сохраняет изменения в базе данных. Для сохранения изменений используйте метод <see cref="SaveAsync"/>.
    /// </remarks>
    Task<T> AddAsync(T entity);

    /// <summary>
    /// Асинхронно сохраняет все изменения в базе данных.
    /// </summary>
    /// <returns>Завершение операции сохранения.</returns>
    /// <remarks>
    /// Этот метод вызывает <see cref="DbContext.SaveChangesAsync(CancellationToken)"/> из Entity Framework Core.
    /// </remarks>
    Task SaveAsync();

    /// <summary>
    /// Асинхронно возвращает сущность по указанному идентификатору.
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
    Task<T?> GetByIdAsync(TKey id, bool noTracking = true, params Expression<Func<T, object?>>[]? includes);

    /// <summary>
    /// Асинхронно выполняет запрос к базе данных с возможностью фильтрации, сортировки, пагинации и загрузки связанных данных.
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
    Task<IEnumerable<T>> GetAsync(
        bool noTracking = true,
        Expression<Func<T, bool>>? where = null,
        bool distinct = false,
        Expression<Func<T, object?>>? orderBy = null,
        bool descending = false,
        int? skip = null,
        int? take = null,
        params Expression<Func<T, object?>>[]? includes);

    /// <summary>
    /// Асинхронно возвращает первую запись из результата запроса.
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
    Task<T> GetFirstAsync(
        bool noTracking = true,
        Expression<Func<T, bool>>? where = null,
        Expression<Func<T, object?>>? orderBy = null,
        bool descending = false,
        params Expression<Func<T, object?>>[]? includes);

    /// <summary>
    /// Асинхронно возвращает последнюю запись из результата запроса.
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
    Task<T> GetLastAsync(
        bool noTracking = true,
        Expression<Func<T, bool>>? where = null,
        Expression<Func<T, object?>>? orderBy = null,
        bool descending = false,
        params Expression<Func<T, object?>>[]? includes);

    /// <summary>
    /// Асинхронно проверяет существование сущности по указанному условию.
    /// </summary>
    /// <param name="predicate">Условие для проверки существования.</param>
    /// <returns><c>true</c>, если хотя бы одна сущность удовлетворяет условию; иначе <c>false</c>.</returns>
    Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate);
    
    /// <summary>
    /// Асинхронно удаляет сущность из контекста.
    /// </summary>
    /// <param name="id">Первичный ключ сущности для удаления.</param>
    Task DeleteAsync(TKey id);

    /// <summary>
    /// Асинхронно выполняет указанную агрегатную функцию T-SQL.
    /// </summary>
    /// <param name="function">Тип агрегатной функции.</param>
    /// <param name="where">Условие фильтрации.</param>
    /// <param name="selector">Выражение для выбора поля.</param>
    /// <returns>Результат выполнения агрегатной функции.</returns>
    Task<TResult?> AggregateAsync<TResult>(
        EFHelper.AggregateFunction function,
        Expression<Func<T, bool>>? where = null,
        Expression<Func<T, TResult?>>? selector = null);
}
using System.ComponentModel.DataAnnotations;
using System.Linq.Expressions;
using System.Reflection;
using AutoMapper;
using Learnst.Application.Interfaces;
using Learnst.Domain.Exceptions;
using Learnst.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Learnst.Infrastructure.Repositories;

/// <summary>
/// Базовый класс для всех репозиториев.
/// </summary>
/// <typeparam name="T">Тип сущности.</typeparam>
/// <typeparam name="TKey">Тип первичного ключа.</typeparam>
public abstract class BaseRepository<T, TKey>(ApplicationDbContext context, IMapper mapper) : IBaseRepository<T, TKey>
    where T : class, IBaseEntity<TKey> where TKey : IEquatable<TKey>
{
    protected readonly DbSet<T> DbSet = context.Set<T>();
    
    /// <summary>
    /// Обновляет существующую сущность.
    /// </summary>
    /// <param name="existingEntity">Сущность для обновления.</param>
    /// <param name="modifiedEntity">Обновленная сущность.</param>
    /// <param name="propertyNames">Названия свойств для обновления.</param>
    /// <returns>Обновленная сущность.</returns>
    /// <exception cref="NotFoundException">
    /// Выбрасывается, если сущность с указанным ID не найдена.
    /// </exception>
    public T Update(T existingEntity, T modifiedEntity, params string[]? propertyNames)
    {
        if (existingEntity is null || modifiedEntity is null)
            throw new ArgumentNullException(null, "Сущности не могут быть null.");
        mapper.Map(modifiedEntity, existingEntity, opt => 
        {
            if (propertyNames is { Length: > 0 })
                opt.Items["PropertiesToMap"] = propertyNames;
        });
        return DbSet.Update(existingEntity).Entity;
    }

    /// <summary>
    /// Строит запрос с учетом параметров include и noTracking.
    /// </summary>
    /// <param name="includes">
    /// Массив выражений для загрузки связанных данных (Include).
    /// Если null, связанные данные не загружаются.
    /// </param>
    /// <param name="noTracking">
    /// Флаг, указывающий, нужно ли отключить отслеживание изменений.
    /// Если установлено в <c>true</c>, EF Core не будет отслеживать изменения сущностей.
    /// По умолчанию: <c>true</c>.
    /// </param>
    /// <returns>Построенный запрос.</returns>
    protected IQueryable<T> BuildQuery(
        bool noTracking = true,
        params Expression<Func<T, object?>>[]? includes)
    {
        var query = DbSet.AsQueryable();
        if (includes is { Length: > 0 })
            query = includes.Aggregate(query, (current, include) => current.Include(include));
        if (noTracking)
            query = query.AsNoTracking();
        return query;
    }

    /// <summary>
    /// Находит все свойства с атрибутом [Key] для указанного типа сущности.
    /// </summary>
    /// <param name="entityType">Тип сущности.</param>
    /// <returns>Список свойств с атрибутом [Key].</returns>
    /// <exception cref="NoKeyException">
    /// Выбрасывается, если ни одно свойство с атрибутом [Key] не найдено.
    /// </exception>
    protected static IEnumerable<PropertyInfo> GetKeyProperties(Type entityType) =>
        entityType.GetProperties().Where(p => Attribute.IsDefined(p, typeof(KeyAttribute)))
        ?? throw new NoKeyException(entityType);

    /// <summary>
    /// Находит первое свойство с атрибутом [Key] для указанного типа сущности.
    /// </summary>
    /// <param name="entityType">Тип сущности.</param>
    /// <returns>Первое свойство с атрибутом [Key].</returns>
    /// <exception cref="NoKeyException">
    /// Выбрасывается, если свойство с атрибутом [Key] не найдено.
    /// </exception>
    protected static PropertyInfo GetKeyProperty(Type entityType) =>
        entityType.GetProperties().FirstOrDefault(p => Attribute.IsDefined(p, typeof(KeyAttribute)))
        ?? throw new NoKeyException(entityType);
}
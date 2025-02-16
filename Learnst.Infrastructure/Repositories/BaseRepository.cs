using System.ComponentModel.DataAnnotations;
using System.Linq.Expressions;
using System.Reflection;
using AutoMapper;
using Learnst.Infrastructure.Exceptions;
using Learnst.Infrastructure.Interfaces;
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
    public virtual DbSet<T> DbSet { get; } = context.Set<T>();
    
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
    public virtual T Update(T existingEntity, T modifiedEntity, params string[]? propertyNames)
    {
        if (existingEntity is null || modifiedEntity is null)
            throw new ArgumentNullException(null, "Сущности не могут быть null.");
        mapper.Map(modifiedEntity, existingEntity, opt => 
        {
            if (propertyNames is { Length: > 0 })
                opt.Items["PropertiesToMap"] = propertyNames;
        });
        return existingEntity;
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
    protected virtual IQueryable<T> BuildQuery(
        bool noTracking = true, 
        params Expression<Func<T, object?>>[]? includes)
    {
        var query = DbSet.AsQueryable();

        if (noTracking)
            query = query.AsNoTracking();

        if (includes is not null)
            foreach (var include in includes)
                query = query.Include(IncludeParser.GetIncludePath(include)!);

        return query;
    }

    /// <summary>
    /// Находит первое свойство с атрибутом [Key] для указанного типа сущности.
    /// </summary>
    /// <returns>Первое свойство с атрибутом [Key].</returns>
    /// <exception cref="NoKeyException">
    /// Выбрасывается, если свойство с атрибутом [Key] не найдено.
    /// </exception>
    protected static PropertyInfo GetKeyProperty()
    {
        var entityType = typeof(T);
        return entityType.GetProperties()
            .FirstOrDefault(p => p.GetCustomAttribute<KeyAttribute>() is not null)
            ?? throw new NoKeyException(entityType);
    }
    
    private static class IncludeParser
    {
        public static string? GetIncludePath(Expression<Func<T, object?>>? expression)
        {
            if (expression is null) return null;
            IncludeVisitor visitor = new();
            visitor.Visit(expression.Body);
            visitor.PathParts.Reverse();
            return string.Join('.', visitor.PathParts);
        }

        private class IncludeVisitor : ExpressionVisitor
        {
            public List<string> PathParts { get; } = [];

            protected override Expression VisitMember(MemberExpression node)
            {
                PathParts.Add(node.Member.Name);
                return base.VisitMember(node);
            }

            protected override Expression VisitMethodCall(MethodCallExpression node)
            {
                if (node.Method.Name is not "Select" || node.Arguments.Count != 2)
                    throw new ArgumentException("Неверное include выражение");
                Visit(node.Arguments[0]);
                VisitLambda(node.Arguments[1]);
                return node;
            }

            private void VisitLambda(Expression expression)
            {
                if (expression is not UnaryExpression { Operand: LambdaExpression lambda })
                    throw new ArgumentException("Неверное лямбда выражение");
                Visit(lambda.Body);
            }
        }
    }
}
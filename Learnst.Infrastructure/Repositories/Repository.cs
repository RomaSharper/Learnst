using System.Linq.Expressions;
using AutoMapper;
using Learnst.Infrastructure.Exceptions;
using Learnst.Infrastructure.Extensions;
using Learnst.Infrastructure.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Learnst.Infrastructure.Repositories;

/// <summary>
/// Базовая реализация универсального репозитория
/// </summary>
/// <param name="context">Контекст БД</param>
/// <param name="mapper">AutoMapper для классов</param>
/// <typeparam name="T">Тип сущности</typeparam>
/// <typeparam name="TKey">Тип первичного ключа</typeparam>
public class Repository<T, TKey>(ApplicationDbContext context, IMapper mapper) : BaseRepository<T, TKey>
    (context, mapper), IRepository<T, TKey> where T : class, IBaseEntity<TKey> where TKey : IEquatable<TKey>
{
    private readonly ApplicationDbContext _context = context;
        
    public virtual T Add(T entity) => DbSet.Add(entity).Entity;

    public virtual void Delete(TKey id) => DbSet.Remove(GetById(id) ?? throw new NotFoundException<T, TKey>(id));

    public virtual void Save() => _context.SaveChanges();
    
    public virtual T? GetById(
        TKey id,
        bool noTracking = true,
        params Expression<Func<T, object?>>[]? includes)
    {
        var query = BuildQuery(noTracking, includes);

        if (typeof(ICompositeKeyEntity<TKey>).IsAssignableFrom(typeof(T)))
        {
            // Если сущность имеет составной ключ
            var compositeKeyEntity = (ICompositeKeyEntity<TKey>)Activator.CreateInstance<T>();
            var keyPropertyNames = compositeKeyEntity.GetKeyPropertyNames().ToArray();

            // Проверяем, что переданный идентификатор — это кортеж
            var tupleValues = id.GetType().GetFields()
                .OrderBy(p => Array.IndexOf(keyPropertyNames, p.Name)) // Сортируем по порядку ключей
                .Select(p => p.GetValue(id))
                .ToList();

            if (tupleValues.Count != keyPropertyNames.Length)
                throw new InvalidOperationException("Количество значений ключа не соответствует количеству свойств.");

            // Создаем условие через EF.Property
            var parameter = Expression.Parameter(typeof(T), "e");
            var conditions = keyPropertyNames.Zip(tupleValues, (propertyName, value)
                => Expression.Equal(Expression.Call(
                        typeof(EF),
                        nameof(EF.Property),
                        [value!.GetType()],
                        parameter,
                        Expression.Constant(propertyName)
                    ),
                    Expression.Constant(value, value.GetType())
                ));

            var andExpression = conditions.Aggregate(Expression.AndAlso);
            var lambda = Expression.Lambda<Func<T, bool>>(andExpression, parameter);

            return query.SingleOrDefault(lambda);
        }
        else
        {
            // Для простых ключей
            var keyProperty = GetKeyProperty();
            if (keyProperty is null)
                throw new NoKeyException<T>();

            var parameter = Expression.Parameter(typeof(T), "e");
            var propertyAccess = Expression.MakeMemberAccess(parameter, keyProperty);
            var equality = Expression.Equal(propertyAccess, Expression.Constant(id, typeof(TKey)));
            var lambda = Expression.Lambda<Func<T, bool>>(equality, parameter);

            return query.SingleOrDefault(lambda);
        }
    }

    public virtual IEnumerable<T> Get(
        bool noTracking = true,
        Expression<Func<T, bool>>? where = null,
        bool distinct = false,
        Expression<Func<T, object?>>? orderBy = null,
        bool descending = false,
        int? skip = null,
        int? take = null,
        params Expression<Func<T, object?>>[]? includes)
    {
        var query = BuildQuery(noTracking, includes);

        if (where is not null)
            query = query.Where(where);

        if (distinct)
            query = query.Distinct();

        if (orderBy is not null)
            query = descending ? query.OrderByDescending(orderBy) : query.OrderBy(orderBy);

        if (skip is > 0)
            query = query.Skip(skip.Value);

        if (take is > 0)
            query = query.Take(take.Value);

        return query.ToList();
    }

    public virtual T GetFirst(
        bool noTracking = true,
        Expression<Func<T, bool>>? where = null,
        Expression<Func<T, object?>>? orderBy = null,
        bool descending = false,
        params Expression<Func<T, object?>>[]? includes)
    {
        var query = BuildQuery(noTracking, includes);
        if (where is not null)
            query = query.Where(where);
        if (orderBy is not null)
            query = descending ? query.OrderByDescending(orderBy) : query.OrderBy(orderBy);
        return query.FirstOrDefault() ?? throw new NotFoundException("Запрос оказался пустым.");
    }

    public virtual T GetLast(
        bool noTracking = true,
        Expression<Func<T, bool>>? where = null,
        Expression<Func<T, object?>>? orderBy = null,
        bool descending = false,
        params Expression<Func<T, object?>>[]? includes)
    {
        var query = BuildQuery(noTracking, includes);

        if (where is not null)
            query = query.Where(where);

        if (orderBy is not null)
            query = descending ? query.OrderBy(orderBy) : query.OrderByDescending(orderBy);

        return query.FirstOrDefault() ?? throw new NotFoundException("Запрос оказался пустым.");
    }
        
    public virtual bool Exists(Expression<Func<T, bool>> predicate) => DbSet.Any(predicate);
    
    public virtual TResult? Aggregate<TResult>(
        EFHelper.AggregateFunction function,
        Expression<Func<T, bool>>? where = null,
        Expression<Func<T, TResult?>>? selector = null)
    {
        var query = DbSet.AsQueryable();

        if (where is not null)
            query = query.Where(where);

        switch (function)
        {
            case EFHelper.AggregateFunction.Count:
                if (selector is not null)
                    Console.WriteLine("Warning: Selector is ignored for Count function");
                
                if (typeof(TResult) != typeof(int))
                    throw new InvalidOperationException("TResult must be int for Count function");
                
                return EFHelper.Count<T, TResult>(query);

            case EFHelper.AggregateFunction.CountBig:
                if (selector is not null)
                    Console.WriteLine("Warning: Selector is ignored for CountBig function");
                
                if (typeof(TResult) != typeof(long))
                    throw new InvalidOperationException("TResult must be long for CountBig function");

                return EFHelper.LongCount<T, TResult>(query);

            case EFHelper.AggregateFunction.Avg:
                if (selector is null)
                    throw new ArgumentNullException(nameof(selector), "Selector is required for Avg");
                
                return EFHelper.Average(query, selector);

            case EFHelper.AggregateFunction.Sum:
                if (selector is null)
                    throw new ArgumentNullException(nameof(selector), "Selector is required for Sum");
                
                return EFHelper.Sum(query, selector);

            case EFHelper.AggregateFunction.Max:
                if (selector is null)
                    throw new ArgumentNullException(nameof(selector), "Selector is required for Max");
                
                return EFHelper.Max(query, selector);

            case EFHelper.AggregateFunction.Min:
                if (selector is null)
                    throw new ArgumentNullException(nameof(selector), "Selector is required for Min");
                
                return EFHelper.Min(query, selector);

            default:
                throw new NotSupportedException($"Function {function} is not supported");
        }
    }
}
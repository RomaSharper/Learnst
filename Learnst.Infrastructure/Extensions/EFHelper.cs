using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;

namespace Learnst.Domain.Extensions;

public static class EFHelper
{
    private const string SelectorNeeded = "Для операции {0} необходим селектор.";
    private const string ReturnTypeMustBe = "Возвращаемый тип должен быть {0} или {0}? для операции {1}";
    
    public enum AggregateFunction
    {
        Avg,
        Count,
        CountBig,
        Max,
        Min,
        Sum
    }
    
    public static TResult? Count<T, TResult>(IQueryable<T> query)
    {
        if (typeof(TResult) != typeof(int) && typeof(TResult) != typeof(int?))
            throw new InvalidOperationException(string.Format(ReturnTypeMustBe, "int", "Count"));
        
        var count = query.Count();
        return (TResult)(object)count;
    }

    public static TResult? LongCount<T, TResult>(IQueryable<T> query)
    {
        if (typeof(TResult) != typeof(long) && typeof(TResult) != typeof(long?))
            throw new InvalidOperationException(string.Format(ReturnTypeMustBe, "long", "CountBig"));
        
        var count = query.LongCount();
        return (TResult)(object)count;
    }

    public static TResult? Average<T, TResult>(
        IQueryable<T> query,
        Expression<Func<T, TResult>> selector)
    {
        // Получаем тип значения селектора
        var valueType = typeof(TResult);
        var nullableUnderlyingType = Nullable.GetUnderlyingType(valueType);
        var underlyingType = nullableUnderlyingType ?? valueType;

        // Получаем правильный метод Average через рефлексию
        var method = typeof(Queryable).GetMethods()
            .First(m => m.Name == "Average" 
                        && m.GetParameters().Length == 2
                        && m.GetParameters()[1].ParameterType.GetGenericArguments().Length == 1)
            .MakeGenericMethod(typeof(T), underlyingType);

        // Создаем правильное выражение с учетом nullable типов
        var parameter = selector.Parameters[0];
        var body = selector.Body;

        if (nullableUnderlyingType != null)
        {
            body = Expression.Convert(body, nullableUnderlyingType);
        }

        var lambdaType = typeof(Expression<>).MakeGenericType(
            typeof(Func<,>).MakeGenericType(typeof(T), underlyingType));

        var lambda = Expression.Lambda(
            typeof(Func<,>).MakeGenericType(typeof(T), underlyingType),
            body,
            parameter);

        var typedLambda = Convert.ChangeType(lambda, lambdaType);

        var result = method.Invoke(null, [query, typedLambda]);

        return (TResult?)result;
    }

    public static TResult? Sum<T, TResult>(
        IQueryable<T> query,
        Expression<Func<T, TResult>> selector)
    {
        var sumMethod = typeof(Queryable).GetMethods()
            .First(m => m.Name == "Sum" 
                        && m.GetParameters().Length == 2
                        && m.GetParameters()[1].ParameterType.GetGenericArguments().Length == 1)
            .MakeGenericMethod(typeof(T), typeof(TResult));

        var lambda = Expression.Lambda<Func<T, TResult>>(selector.Body, selector.Parameters);
        
        var result = sumMethod.Invoke(null, [query, lambda]);
        
        return (TResult?)result;
    }

    public static TResult? Max<T, TResult>(
        IQueryable<T> query,
        Expression<Func<T, TResult>>? selector)
    {
        if (selector is null)
            throw new ArgumentNullException(nameof(selector), string.Format(SelectorNeeded, "Max"));
        
        return query.Max(selector);
    }

    public static TResult? Min<T, TResult>(
        IQueryable<T> query,
        Expression<Func<T, TResult>>? selector)
    {
        if (selector is null)
            throw new ArgumentNullException(nameof(selector), string.Format(SelectorNeeded, "Min"));
        
        return query.Min(selector);
    }
    
    public static async Task<TResult?> CountAsync<T, TResult>(IQueryable<T> query)
    {
        if (typeof(TResult) != typeof(int) && typeof(TResult) != typeof(int?))
            throw new InvalidOperationException(string.Format(ReturnTypeMustBe, "int", "Count"));
        
        var count = await query.CountAsync();
        return (TResult)(object)count;
    }

    public static async Task<TResult?> LongCountAsync<T, TResult>(IQueryable<T> query)
    {
        if (typeof(TResult) != typeof(long) && typeof(TResult) != typeof(long?))
            throw new InvalidOperationException(string.Format(ReturnTypeMustBe, "long", "CountBig"));
        
        var count = await query.LongCountAsync();
        return (TResult)(object)count;
    }

    public static async Task<TResult?> AverageAsync<T, TResult>(
        IQueryable<T> query,
        Expression<Func<T, TResult>> selector)
    {
        // Получаем тип значения селектора
        var valueType = typeof(TResult);
        var nullableUnderlyingType = Nullable.GetUnderlyingType(valueType);
        var underlyingType = nullableUnderlyingType ?? valueType;

        // Получаем правильный метод Average через рефлексию
        var method = typeof(Queryable).GetMethods()
            .First(m => m.Name == "Average" 
                        && m.GetParameters().Length == 2
                        && m.GetParameters()[1].ParameterType.GetGenericArguments().Length == 1)
            .MakeGenericMethod(typeof(T), underlyingType);

        // Создаем правильное выражение с учетом nullable типов
        var parameter = selector.Parameters[0];
        var body = selector.Body;

        if (nullableUnderlyingType != null)
        {
            body = Expression.Convert(body, nullableUnderlyingType);
        }

        var lambdaType = typeof(Expression<>).MakeGenericType(
            typeof(Func<,>).MakeGenericType(typeof(T), underlyingType));

        var lambda = Expression.Lambda(
            typeof(Func<,>).MakeGenericType(typeof(T), underlyingType),
            body,
            parameter);

        var typedLambda = Convert.ChangeType(lambda, lambdaType);

        // Вызываем асинхронно
        var result = await Task.Run(() => 
            method.Invoke(null, [query, typedLambda]));

        return (TResult?)result;
    }

    public static async Task<TResult?> SumAsync<T, TResult>(
        IQueryable<T> query,
        Expression<Func<T, TResult>> selector)
    {
        var sumMethod = typeof(Queryable).GetMethods()
            .First(m => m.Name == "Sum" 
                        && m.GetParameters().Length == 2
                        && m.GetParameters()[1].ParameterType.GetGenericArguments().Length == 1)
            .MakeGenericMethod(typeof(T), typeof(TResult));

        var lambda = Expression.Lambda<Func<T, TResult>>(selector.Body, selector.Parameters);
        
        var result = await Task.Run(() => 
            sumMethod.Invoke(null, [query, lambda]));
        
        return (TResult?)result;
    }

    public static async Task<TResult?> MaxAsync<T, TResult>(
        IQueryable<T> query,
        Expression<Func<T, TResult>>? selector)
    {
        if (selector is null)
            throw new ArgumentNullException(nameof(selector), string.Format(SelectorNeeded, "Max"));
        
        return await query.MaxAsync(selector);
    }

    public static  async Task<TResult?> MinAsync<T, TResult>(
        IQueryable<T> query,
        Expression<Func<T, TResult>>? selector)
    {
        if (selector is null)
            throw new ArgumentNullException(nameof(selector), string.Format(SelectorNeeded, "Min"));
        
        return await query.MinAsync(selector);
    }
}
using System.ComponentModel.DataAnnotations;
using AutoMapper;
using Learnst.Domain.Interfaces;

namespace Learnst.Domain.Mappings;

public class FullUpdateProfile<T, TKey> : Profile where T : class, IBaseEntity<TKey>
    where TKey : IEquatable<TKey>
{
    public FullUpdateProfile()
    {
        // Маппинг для любого типа T
        CreateMap<T, T>()
            .ForAllMembers(opt => opt.PreCondition(context =>
            {
                var optionsItems = context.Items;
                var propertiesToMap = optionsItems.TryGetValue("PropertiesToMap", out var props)
                    ? (string[])props : null;

                // Проверяем, является ли свойство первичным ключом
                List<string> keyProperties = [.. typeof(T).GetProperties()
                    .Where(p => Attribute.IsDefined(p, typeof(KeyAttribute)))
                    .Select(p => p.Name)];

                return !keyProperties.Contains(opt.DestinationMember.Name) &&
                       (propertiesToMap is null || propertiesToMap.Contains(opt.DestinationMember.Name));
            }));
    }
}

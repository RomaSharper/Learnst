using AutoMapper;
using App = Learnst.Domain.Models.Application;

namespace Learnst.Domain.Mappings;

public class ApplicationUpdateProfile : Profile
{
    public ApplicationUpdateProfile()
    {
        CreateMap<App, App>()
            .ForMember(dest => dest.ClientId, opts => opts.Ignore())
            .ForMember(dest => dest.ClientSecret, opts => opts.Ignore())
            .ForMember(dest => dest.UserId, opts => opts.Ignore())
            .ForMember(dest => dest.User, opts => opts.Ignore())
            .ForMember(dest => dest.CreatedAt, opts => opts.Ignore())
            .ForAllMembers(opts => opts.MapFrom((src, _) => src));
    }
}
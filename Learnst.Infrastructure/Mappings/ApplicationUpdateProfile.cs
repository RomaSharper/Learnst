using AutoMapper;
using Learnst.Infrastructure.Models;

namespace Learnst.Infrastructure.Mappings;

public class ApplicationUpdateProfile : Profile
{
    public ApplicationUpdateProfile()
    {
        CreateMap<Application, Application>()
            .ForMember(dest => dest.ClientId, opts => opts.Ignore())
            .ForMember(dest => dest.ClientSecret, opts => opts.Ignore())
            .ForMember(dest => dest.UserId, opts => opts.Ignore())
            .ForMember(dest => dest.User, opts => opts.Ignore())
            .ForMember(dest => dest.CreatedAt, opts => opts.Ignore())
            .ForMember(dest => dest.Name, opts => opts.MapFrom(src => src.Name))
            .ForMember(dest => dest.RedirectUri, opts => opts.MapFrom(src => src.RedirectUri))
            .ForMember(dest => dest.AllowedScopes, opts => opts.MapFrom(src => src.AllowedScopes));
    }
}
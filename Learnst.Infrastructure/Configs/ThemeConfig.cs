using Learnst.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Learnst.Infrastructure.Configs;

public class ThemeConfig : IEntityTypeConfiguration<Theme>
{
    public void Configure(EntityTypeBuilder<Theme> builder)
    {
        builder.HasData([
            new Theme { Id = "light" },
            new Theme { Id = "dark" },
            new Theme { Id = "mint-apple" },
            new Theme { Id = "citrus-sherbet" },
            new Theme { Id = "retro-raincloud" },
            new Theme { Id = "hanami" },
            new Theme { Id = "sunrise" },
            new Theme { Id = "cotton-candy" },
            new Theme { Id = "lofi-vibes" },
            new Theme { Id = "desert-khaki" },
            new Theme { Id = "sunset" },
            new Theme { Id = "chroma-glow" },
            new Theme { Id = "forest" },
            new Theme { Id = "crimson-moon" },
            new Theme { Id = "midnight-blurple" },
            new Theme { Id = "mars" },
            new Theme { Id = "dusk" },
            new Theme { Id = "under-the-sea" },
            new Theme { Id = "retro-storm" },
            new Theme { Id = "neon-nights" },
            new Theme { Id = "strawberry-lemonade" },
            new Theme { Id = "aurora" },
            new Theme { Id = "sepia" },
            new Theme { Id = "blurple-twilight" }
        ]);
    }
}

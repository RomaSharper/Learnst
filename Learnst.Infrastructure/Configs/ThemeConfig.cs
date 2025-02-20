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
            new Theme { Id = "aurora", Premium = true },
            new Theme { Id = "blurple-twilight", Premium = true },
            new Theme { Id = "chroma-glow", Premium = true },
            new Theme { Id = "citrus-sherbet", Premium = true },
            new Theme { Id = "cotton-candy", Premium = true },
            new Theme { Id = "crimson-moon", Premium = true },
            new Theme { Id = "desert-khaki", Premium = true },
            new Theme { Id = "dusk", Premium = true },
            new Theme { Id = "forest", Premium = true },
            new Theme { Id = "hanami", Premium = true },
            new Theme { Id = "lofi-vibes", Premium = true },
            new Theme { Id = "mars", Premium = true },
            new Theme { Id = "midnight-blurple", Premium = true },
            new Theme { Id = "mint-apple", Premium = true },
            new Theme { Id = "neon-nights", Premium = true },
            new Theme { Id = "retro-raincloud", Premium = true },
            new Theme { Id = "retro-storm", Premium = true },
            new Theme { Id = "sepia", Premium = true },
            new Theme { Id = "strawberry-lemonade", Premium = true }
        ]);
    }
}

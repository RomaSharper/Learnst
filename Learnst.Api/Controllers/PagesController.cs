using System.Text;
using Microsoft.AspNetCore.Mvc;

namespace Learnst.Api.Controllers;

[Controller]
public class PagesController : ControllerBase
{
    [HttpGet("/Error")]
    public IActionResult Error() =>
        Content("""
                <!DOCTYPE html>
                <html lang="ru">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Блокировка</title>
                    <style>
                        body {
                            margin: 0;
                            padding: 0;
                            height: 100vh;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            background-color: #f4f4f4;
                            font-family: Roboto, Helvetica-Neue, Consolas, system-ui, Arial, sans-serif;
                        }
                        .container {
                            padding: 20px;
                            text-align: center;
                            border-radius: 8px;
                            background-color: white;
                            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                        }
                        h1 {
                            color: #d9534f;
                        }
                        p {
                            color: #555;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Ошибка доступа</h1>
                        <p>Вы не имеете право доступа к этому сайту.</p>
                    </div>
                </body>
                </html>
                """, "text/html", Encoding.UTF8);
}
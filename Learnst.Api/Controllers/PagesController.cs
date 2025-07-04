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
                <html lang="ru" data-theme="light">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Ошибка - Learnst</title>
                    <style>
                        :root {
                            --twitch-purple: #9146ff;
                            --twitch-purple-light: #a970ff;
                            --twitch-dark: #0f0f23;
                            --twitch-gray: #efeff1;
                            --twitch-border: #e1e1e8;
                            --twitch-error: #ff4d4d;
                            --twitch-bg: #f7f7f8;
                            --twitch-card: #ffffff;
                            --twitch-text: #0f0f23;
                            --twitch-text-light: #6a6a8a;
                            --twitch-icon-fill: #0f0f23;
                            --twitch-theme-icon: #ffffff;
                        }
                
                        [data-theme="dark"] {
                            --twitch-dark: #f7f7f8;
                            --twitch-gray: #1f1f23;
                            --twitch-border: #343437;
                            --twitch-bg: #0f0f23;
                            --twitch-card: #18182c;
                            --twitch-text: #efeff1;
                            --twitch-text-light: #adadb8;
                            --twitch-icon-fill: #efeff1;
                            --twitch-theme-icon: #ffffff;
                        }
                
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                            transition: background-color 0.3s, color 0.3s, border-color 0.3s;
                        }
                
                        body {
                            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            background-color: var(--twitch-bg);
                            color: var(--twitch-text);
                            min-height: 100vh;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            padding: 20px;
                            line-height: 1.5;
                        }
                
                        .container {
                            max-width: 600px;
                            width: 100%;
                            background: var(--twitch-card);
                            border-radius: 8px;
                            border: 1px solid var(--twitch-border);
                            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
                            overflow: hidden;
                            position: relative;
                        }
                
                        .header {
                            padding: 30px;
                            text-align: center;
                            position: relative;
                            background: linear-gradient(90deg, var(--twitch-purple), var(--twitch-purple-light));
                        }
                
                        .header h1 {
                            color: white;
                            font-size: 32px;
                            font-weight: 700;
                            margin-bottom: 10px;
                            letter-spacing: -0.5px;
                        }
                
                        .header p {
                            font-size: 18px;
                            font-weight: 500;
                            color: rgba(255, 255, 255, 0.9);
                        }
                
                        .content {
                            padding: 40px;
                            text-align: center;
                        }
                
                        .error-icon {
                            margin-bottom: 8px;
                        }
                
                        .error-icon svg {
                            width: 80px;
                            height: 80px;
                            fill: var(--twitch-error);
                        }
                
                        .error-title {
                            font-size: 28px;
                            font-weight: 700;
                            margin-bottom: 20px;
                            color: var(--twitch-error);
                        }
                
                        .error-description {
                            font-size: 18px;
                            line-height: 1.6;
                            margin-bottom: 30px;
                            color: var(--twitch-text-light);
                        }
                
                        .error-code {
                            font-size: 18px;
                            padding: 12px 24px;
                            border-radius: 6px;
                            margin-bottom: 24px;
                            display: inline-block;
                            font-family: monospace;
                            color: var(--twitch-error);
                            background: rgba(255, 77, 77, 0.1);
                            border: 1px solid var(--twitch-error);
                        }
                
                        .action-buttons {
                            gap: 15px;
                            display: flex;
                            flex-wrap: wrap;
                            margin-top: 30px;
                            justify-content: center;
                        }
                
                        .btn {
                            gap: 8px;
                            border: none;
                            cursor: pointer;
                            font-size: 16px;
                            font-weight: 600;
                            padding: 14px 28px;
                            border-radius: 6px;
                            align-items: center;
                            display: inline-flex;
                            transition: all 0.2s;
                            text-decoration: none;
                            justify-content: center;
                        }
                
                        .btn-primary {
                            color: white;
                            background: var(--twitch-purple);
                        }
                
                        .btn-primary:hover {
                            background: var(--twitch-purple-light);
                        }
                
                        .btn-secondary {
                            background: transparent;
                            color: var(--twitch-purple);
                            border: 1px solid var(--twitch-purple);
                        }
                
                        .btn-secondary:hover {
                            background: rgba(145, 70, 255, 0.1);
                        }
                
                        .footer {
                            padding: 25px;
                            font-size: 14px;
                            text-align: center;
                            color: var(--twitch-text-light);
                            border-top: 1px solid var(--twitch-border);
                        }
                
                        .theme-switch {
                            top: 20px;
                            right: 20px;
                            width: 44px;
                            height: 44px;
                            display: flex;
                            cursor: pointer;
                            position: absolute;
                            border-radius: 50%;
                            align-items: center;
                            justify-content: center;
                            backdrop-filter: blur(4px);
                            background: rgba(255, 255, 255, 0.1);
                            border: 1px solid rgba(255, 255, 255, 0.2);
                        }
                
                        .theme-switch svg {
                            width: 24px;
                            height: 24px;
                            fill: var(--twitch-theme-icon);
                        }
                
                        @media (max-width: 600px) {
                            .header {
                                padding: 25px 20px;
                            }
                            
                            .content {
                                padding: 30px 20px;
                            }
                            
                            .error-icon svg {
                                width: 60px;
                                height: 60px;
                            }
                            
                            .error-title {
                                font-size: 24px;
                            }
                            
                            .error-description {
                                font-size: 16px;
                            }
                            
                            .action-buttons {
                                flex-direction: column;
                            }
                            
                            .btn {
                                width: 100%;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <div class="theme-switch" id="themeToggle">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                                    <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm40-83q119-15 199.5-104.5T800-480q0-123-80.5-212.5T520-797v634Z"/>
                                </svg>
                            </div>
                            <h1>Learnst</h1>
                            <p>Платформа онлайн-обучения</p>
                        </div>
                        
                        <div class="content">
                            <div class="error-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                                    <path d="M280-320q17 0 28.5-11.5T320-360q0-17-11.5-28.5T280-400q-17 0-28.5 11.5T240-360q0 17 11.5 28.5T280-320Zm-40-120h80v-200h-80v200Zm160 80h320v-80H400v80Zm0-160h320v-80H400v80ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-480H160v480Zm0 0v-480 480Z"/>
                                </svg>
                            </div>
                            <h2 class="error-title">Произошла ошибка</h2>
                            <p class="error-description">
                                К сожалению, мы не смогли обработать ваш запрос. Возможно, страница была удалена или у вас недостаточно прав для доступа.
                            </p>
                            <div class="error-code">КОД ОШИБКИ: 500</div>
                            
                            <div class="action-buttons">
                                <a href="https://learnst.runasp.net" class="btn btn-primary">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 -960 960 960" style="margin-right: 8px;">
                                        <path d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z"/>
                                    </svg>
                                    <span>Вернуться на платформу</span>
                                </a>
                                <a href="mailto:support@learnst.runasp.net" class="btn btn-secondary">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 -960 960 960" style="margin-right: 8px;">
                                        <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm320-280L160-640v400h640v-400L480-440Zm0-80 320-200H160l320 200ZM160-640v-80 480-400Z"/>
                                    </svg>
                                    <span>Написать в поддержку</span>
                                </a>
                            </div>
                        </div>
                        
                        <div class="footer">
                            <p>© 2025 Learnst · Все права защищены</p>
                            <p>Тип ошибки: Внутренняя ошибка сервера</p>
                        </div>
                    </div>
                
                    <script>
                        // Определение темы системы
                        function updateTheme() {
                            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                            document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
                        }
                        
                        // Переключение темы по клику
                        document.getElementById('themeToggle').addEventListener('click', () => {
                            const currentTheme = document.documentElement.getAttribute('data-theme');
                            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                            document.documentElement.setAttribute('data-theme', newTheme);
                        });
                        
                        // Инициализация темы
                        updateTheme();
                        
                        // Следим за изменениями системной темы
                        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTheme);
                    </script>
                </body>
                </html>
                """, "text/html", Encoding.UTF8);
}
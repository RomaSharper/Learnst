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
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

                        :root {
                            --main-color: #8abeb7;
                            --accent-color: #3a6b88;
                            --bg-color: #0a0a1a;
                            --glow: rgba(138, 190, 183, 0.15);
                        }

                        body {
                            margin: 0;
                            padding: 0;
                            height: 100vh;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            background: var(--bg-color);
                            font-family: 'Consolas', monospace;
                            position: relative;
                            overflow: hidden;
                        }

                        .scanlines {
                            position: fixed;
                            width: 100%;
                            height: 100%;
                            background: repeating-linear-gradient(
                                180deg,
                                rgba(0, 0, 0, 0) 0px,
                                rgba(0, 0, 0, 0) 2px,
                                rgba(255, 255, 255, 0.03) 3px,
                                rgba(255, 255, 255, 0.03) 4px
                            );
                            pointer-events: none;
                            z-index: 1;
                            animation: scanline-flicker 0.15s infinite;
                        }

                        .container {
                            padding: 2rem 3rem;
                            border: 4px solid var(--accent-color);
                            background: rgba(12, 20, 31, 0.95);
                            box-shadow: 0 0 35px var(--glow),
                                        inset 0 0 15px var(--glow);
                            position: relative;
                            z-index: 2;
                            text-align: center;
                            overflow: hidden;
                        }

                        .container::before {
                            content: '';
                            position: absolute;
                            top: -50%;
                            left: -50%;
                            width: 200%;
                            height: 200%;
                            background: linear-gradient(
                                45deg,
                                transparent 45%,
                                var(--glow) 50%,
                                transparent 55%
                            );
                            animation: glitch-beam 6s infinite;
                            mix-blend-mode: overlay;
                        }

                        .container::after {
                            content: '';
                            position: absolute;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            background: repeating-linear-gradient(
                                0deg,
                                rgba(0,0,0,0.15) 0px,
                                rgba(0,0,0,0.15) 1px,
                                transparent 2px,
                                transparent 3px
                            );
                            pointer-events: none;
                        }

                        h1 {
                            font-family: 'Press Start 2P', cursive;
                            color: var(--main-color);
                            text-shadow: 0 0 15px var(--accent-color);
                            margin: 0 0 1.5rem;
                            font-size: 1.8rem;
                            position: relative;
                            animation: text-flicker 3s ease-in-out infinite;
                        }

                        p {
                            color: var(--main-color);
                            margin: 0;
                            font-size: 1.1rem;
                            line-height: 1.6;
                            text-shadow: 0 0 8px var(--accent-color);
                            letter-spacing: 1px;
                        }

                        .error-code {
                            margin-top: 2rem;
                            font-size: 0.9rem;
                            opacity: 0.8;
                            position: relative;
                        }

                        .error-code::after {
                            content: '_';
                            animation: blink 1s step-end infinite;
                            margin-left: 2px;
                        }

                        @keyframes glitch-beam {
                            0% { transform: translate(-5%, -10%) rotate(45deg); }
                            50% { transform: translate(5%, 10%) rotate(45deg); }
                            100% { transform: translate(-5%, -10%) rotate(45deg); }
                        }

                        @keyframes text-flicker {
                            0%, 18%, 22%, 25%, 53%, 57%, 100% { opacity: 0.95; }
                            20%, 24%, 55% { opacity: 0.1; }
                        }

                        @keyframes blink {
                            50% { opacity: 0; }
                        }

                        @keyframes scanline-flicker {
                            0% { opacity: 0.9; }
                            50% { opacity: 0.7; }
                            100% { opacity: 0.9; }
                        }

                        .terminal-effect {
                            position: fixed;
                            width: 100%;
                            height: 4px;
                            background: linear-gradient(
                                to bottom,
                                rgba(138, 190, 183, 0) 0%,
                                var(--main-color) 50%,
                                rgba(138, 190, 183, 0) 100%
                            );
                            animation: scan 10s linear infinite;
                            box-shadow: 0 0 15px var(--main-color);
                            opacity: 0.6;
                            top: -10px;
                            left: 0;
                        }

                        @keyframes scan {
                            0% { transform: translateY(-10px); } /* Старт выше экрана */
                            100% { transform: translateY(100vh); } /* Заканчиваем ниже экрана */
                        }
                    </style>
                </head>
                <body>
                    <div class="scanlines"></div>
                    <div class="terminal-effect"></div>

                    <div class="container">
                        <h1>SYSTEM LOCKED</h1>
                        <p>ACCESS VIOLATION DETECTED</p>
                        <p class="error-code">ERROR CODE: 0x7B-PR0T0C0L</p>
                    </div>
                </body>
                </html>
                """, "text/html", Encoding.UTF8);
}
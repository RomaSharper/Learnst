import { inject, Signal, signal } from "@angular/core";
import { ThemeService } from "../services/theme.service";
import { EditorState } from "@codemirror/state";

// Базовый класс для всех редакторов
export abstract class BaseCodeEditorComponent {
  code = signal('');
  error = signal('');
  output = signal('');
  protected themeService = inject(ThemeService);

  // Конфигурация редактора (будет переопределена в дочерних классах)
  abstract editorConfig: Signal<EditorState>;

  // Метод выполнения кода (переопределяется для каждого языка)
  abstract runCode(): void;

  protected clearOutput() {
    this.output.set('');
    this.error.set('');
  }

  protected safeEval(code: string) {
    try {
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args) => logs.push(args.join(' '));

      const result = eval(code);

      if (result !== undefined) {
        logs.push(result.toString());
      }

      this.output.set(logs.join('\n'));
      console.log = originalLog;
    } catch (e) {
      this.error.set(`Error: ${e instanceof Error ? e.message : e}`);
    }
  }
}

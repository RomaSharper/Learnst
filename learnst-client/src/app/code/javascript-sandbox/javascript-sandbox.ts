import { Component, computed, signal } from '@angular/core';
import { CodemirrorModule } from '@ctrl/ngx-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { BaseCodeEditorComponent } from '../../../models/BaseCodeEditorComponent';
import { FormsModule } from '@angular/forms';
import { githubLight } from '@uiw/codemirror-theme-github';
import { MatButtonModule } from '@angular/material/button';
import { EditorState } from '@codemirror/state';
import { keymap, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, indentOnInput } from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-javascript-sandbox',
  templateUrl: './javascript-sandbox.html',
  imports: [FormsModule, MatIconModule, MatButtonModule, CodemirrorModule]
})
export class JavaScriptSandboxComponent extends BaseCodeEditorComponent {
  // Сигнал для управления темой
  isDarkTheme = signal(this.themeService.currentTheme().dark);

  // Динамическая конфигурация редактора
  editorConfig = computed(() => {
    const theme = this.isDarkTheme() ? oneDark : githubLight;

    return EditorState.create({
      extensions: [
        theme,
        javascript(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        indentOnInput(),
        bracketMatching(),
        keymap.of([...defaultKeymap, indentWithTab]),
      ],
      doc: this.code() || '// Начните писать код здесь...\nconsole.log("Добро пожаловать!");\n'
    });
  });

  constructor() {
    super();
    // Инициализация начального кода
    this.code.set('console.log("Привет, мир!");\n');
  }

  runCode() {
    this.clearOutput();
    this.safeEval(this.code());
  }

  toggleTheme() {
    this.isDarkTheme.update(theme => !theme);
  }

  updateCode(target: EventTarget | null): void {
    this.code.set((target as HTMLTextAreaElement).value);
  }
}

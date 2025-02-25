import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-javascript-sandbox',
  templateUrl: './javascript-sandbox.html',
  imports: [MonacoEditorModule, FormsModule],
})
export class JavaScriptSandboxComponent {
  themeService = inject(ThemeService);
  code: string = `
console.log("Hello, JavaScript!");
`;
  output: string = '';
  editorOptions = { theme: this.themeService.currentTheme().dark ? 'vs-dark' : 'vs-light', language: 'javascript' };

  onEditorInit(editor: any) {
    // Дополнительные настройки редактора, если нужно
  }

  runCode() {
    try {
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args) => {
        logs.push(args.join(' '));
        originalLog(...args);
      };
      
      eval(this.code);
      this.output = logs.join('\n');
      console.log = originalLog;
    } catch (error) {
      this.output = `Error: ${error}`;
    }
  }
}
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor';
import { ThemeService } from '../../../services/theme.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-csharp-sandbox',
  templateUrl: './csharp-sandbox.html',
  imports: [MonacoEditorModule, FormsModule],
})
export class CSharpSandboxComponent {
  private http = inject(HttpClient);
  themeService = inject(ThemeService);
  code: string = `using System;

public class Program
{
    public static void Main()
    {
        Console.WriteLine("Hello, C#!");
    }
}
`;
  output: string = '';
  editorOptions = { theme: this.themeService.currentTheme().dark ? 'vs-dark' : 'vs-light', language: 'csharp' };

  onEditorInit(editor: any) {
    // Дополнительные настройки редактора, если нужно
  }

  async runCode() {
    try {
      const result = await this.http.post<any>('https://dotnetfiddle.net/api/v2/compile', {
        code: this.code,
        language: "csharp",
        console: true
      }).toPromise();

      this.output = result.result || result.errors;
    } catch (error) {
      this.output = `Error: ${error}`;
    }
  }
}
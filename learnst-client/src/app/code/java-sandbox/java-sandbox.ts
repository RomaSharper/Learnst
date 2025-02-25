import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor';
import { ThemeService } from '../../../services/theme.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-java-sandbox',
  templateUrl: './java-sandbox.html',
  imports: [MonacoEditorModule, FormsModule],
})
export class JavaSandboxComponent {
  http = inject(HttpClient);
  themeService = inject(ThemeService);
  code: string = `
class Program {
    public static void main(String[] args) {
        System.out.println("Hello, Java!");
    }
}
`;
  output: string = '';
  editorOptions = { theme: this.themeService.currentTheme().dark ? 'vs-dark' : 'vs-light', language: 'java' };

  onEditorInit(editor: any) {
    // Дополнительные настройки редактора, если нужно
  }

  async runCode() {
    try {
      const result = await this.http.post<any>('https://api.jdoodle.com/v1/execute', {
        clientId: 'f875a6dcb98c973c4f2cc9a6d70b9f78',
        clientSecret: 'cd8d0fe5179d5af95408042f27dc0836523c5a85da45bd33a36aade43899e081',
        script: this.code,
        language: "java",
        versionIndex: 0
      }).toPromise();

      this.output = result.output || result.error;
    } catch (error) {
      this.output = `Error: ${error}`;
    }
  }
}
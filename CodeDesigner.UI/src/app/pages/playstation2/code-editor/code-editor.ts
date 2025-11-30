import { AfterViewInit, Component, OnDestroy, OnInit } from "@angular/core";
import { AppSettings } from '../../../service/app-settings.service';
import { SignalrService } from "../../../service/signalr.service";
import { HttpClient } from '@angular/common/http';
import * as monaco from 'monaco-editor';

@Component({
  selector: 'code-editor',
  templateUrl: './code-editor.html',
  standalone: false
})
export class CodeEditor implements OnInit, AfterViewInit, OnDestroy {
  model = 1;
  code7: any;
  code: string = ``;
  debugMessages: string[];
  editor: monaco.editor.IStandaloneCodeEditor;

  constructor(public appSettings: AppSettings, private http: HttpClient, public signalrService: SignalrService) {

  }
  ngOnInit(): void {
    this.signalrService.startConnection();
    this.http.get('assets/data/ui-widget-boxes/code-7.json', { responseType: 'text' }).subscribe(data => { this.code7 = data; });
  }

  ngAfterViewInit() {
    // Register the custom language
    monaco.languages.register({ id: 'codescript' });

    monaco.languages.setMonarchTokensProvider('codescript', {
      tokenizer: {
        root: [
          // Comments
          [/\/\/.*/, 'comment'],
          [/\/\*/, { token: 'comment', next: '@comment' }],

          // Strings
          [/".*?"/, 'string'],

          // Custom keywords
          [/\b(include|setreg|string|address|hexcode|mem)\b/, 'custom-keyword'],

          // Registers
          [/\b(a[0-3])\b/, 'register.arg'],
          [/\b(t[0-9])\b/, 'register.temp'],
          [/\b(s[0-7])\b/, 'register.saved'],
          [/\b(v[0-1]|ra|sp|zero)\b/, 'register.special'],

          // Hex values: $12345678 or 0x1234
          [/\$[0-9A-Fa-f]+|0x[0-9A-Fa-f]+/, 'number.hex'],

          // Labels
          [/:\w+/, 'label'],

          // Identifiers (default color for MIPS ops like lw, sw, etc.)
          [/\b[a-zA-Z_][a-zA-Z0-9_]*\b/, ''],

          // Numbers
          [/\b\d+\b/, 'number']
        ],

        comment: [
          [/[^\/*]+/, 'comment'],
          [/\/\*/, 'comment', '@push'],
          [/\*\//, 'comment', '@pop'],
          [/[\/*]/, 'comment']
        ]
      }
    });

    monaco.editor.defineTheme('codescriptTheme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'custom-keyword', foreground: 'FFD700', fontStyle: 'bold' }, // gold
        { token: 'register.arg', foreground: '4EC9B0' }, // teal
        { token: 'register.temp', foreground: 'C586C0' }, // pink/purple
        { token: 'register.saved', foreground: '9CDCFE' }, // light blue
        { token: 'register.special', foreground: 'DCDCAA' }, // yellowish
        { token: 'number.hex', foreground: 'B5CEA8' }, // greenish
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'string', foreground: 'CE9178' }, // peach
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'label', foreground: 'D7BA7D' } // tan
      ],
      colors: {
        'editor.background': '#1e1e1e'
      }
    });

    this.editor = monaco.editor.create(document.getElementById('container')!, {
      value: this.code,
      language: 'codescript',
      theme: 'codescriptTheme',
      automaticLayout: true
    });
  }

  ngOnDestroy() {

  }

  onGenerateClick(){

    this.signalrService.sendAssemblerMessage({  
      filePath: 'Resources/test.cds',
      source: this.editor.getValue() 
    })
    .then((response: any) => {
      this.code = response.cheatCodes;
      this.debugMessages = response.debugMessages;
      console.log('Got response from server:', response);
    })
    .catch(err => console.error('Error sending message:', err));

  }
}

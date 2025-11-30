import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { HLJSApi, Language } from 'highlight.js';
import hljs from 'highlight.js/lib/core'; 

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));

const CodeScript: (hljs: HLJSApi) => Language = function (hljs) {
  return {
    name: 'CodeScript',
    case_insensitive: false,
    contains: [
      hljs.COMMENT('//', '$'),
      hljs.COMMENT('/\\*', '\\*/', {
        contains: ['self']
      }),
      {
        className: 'string',
        begin: /"/, end: /"/,
        contains: [hljs.BACKSLASH_ESCAPE]
      },
      {
        className: 'keyword',
        begin: /\b(include|setreg|string|address|hexcode|mem)\b/
      },
      {
        className: 'register-arg',
        begin: /\b(a[0-3])\b/
      },
      {
        className: 'register-temp',
        begin: /\b(t[0-9])\b/
      },
      {
        className: 'register-saved',
        begin: /\b(s[0-7])\b/
      },
      {
        className: 'register-special',
        begin: /\b(v[0-1]|ra|sp|zero)\b/
      },
      {
        className: 'number',
        begin: /\$[0-9A-Fa-f]+|0x[0-9A-Fa-f]+/
      },
      {
        className: 'symbol',
        begin: /:\w+/
      },
      {
        className: 'title',
        begin: /\b[a-zA-Z_][a-zA-Z0-9_]*\b/
      },
      {
        className: 'number',
        begin: /\b\d+\b/
      }
    ]
  };
};

hljs.registerLanguage('codescript', CodeScript);

export default CodeScript;
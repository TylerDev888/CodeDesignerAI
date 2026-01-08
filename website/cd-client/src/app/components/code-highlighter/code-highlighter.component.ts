import { AfterViewInit, Component, ElementRef, Input, ViewEncapsulation } from '@angular/core';
import hljs from 'highlight.js';

@Component({
  selector: 'code-highlighter',
  inputs: ['code'],
  templateUrl: './code-highlighter.component.html',
  standalone: false,
  encapsulation: ViewEncapsulation.None 
})
export class CodeHighLighterComponent implements AfterViewInit {
    @Input() code: string = '';
    highlightedCode: string = '';
  
    constructor(private elRef: ElementRef) {}
  
    ngAfterViewInit(): void {
      this.highlightedCode = hljs.highlightAuto(this.code).value;
    }
  }
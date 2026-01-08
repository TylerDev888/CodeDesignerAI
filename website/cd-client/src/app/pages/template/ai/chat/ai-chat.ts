import { Component, OnDestroy, ElementRef, ViewChild, AfterViewInit, Renderer2 } from '@angular/core';
import { AppSettings } from '../../../../service/app-settings.service';

@Component({
  selector: 'ai-chat',
  templateUrl: './ai-chat.html',
  standalone: false,
  host: {
  	'class': 'h-100 d-flex position-relative bg-body'
  }
})

export class AIChatPage implements OnDestroy {
  public isCollapsed = true;
  
  @ViewChild('aiChatIntro') aiChatIntro!: ElementRef;
  @ViewChild('aiChatNew') aiChatNew!: ElementRef;
  @ViewChild('aiChatNewContent') aiChatNewContent!: ElementRef;
  @ViewChild('aiChatPrev') aiChatPrev!: ElementRef;
  @ViewChild('userInput') userInput!: ElementRef;
  @ViewChild('sendButton') sendButton!: ElementRef;

  ngAfterViewInit(): void {
    this.sendButton.nativeElement.addEventListener('click', () => this.sendMessage());
    this.userInput.nativeElement.addEventListener('keypress', (event: KeyboardEvent) => {
      if (event.key === 'Enter') this.sendMessage();
    });
  }

  toggleAiTab(tabActive: string, input?: string): void {
    const tabArray = [this.aiChatIntro, this.aiChatNew, this.aiChatPrev];

    tabArray.forEach(tab => {
      if (tabActive === tab.nativeElement.id) {
        this.renderer.removeClass(tab.nativeElement, 'd-none');
        this.renderer.addClass(tab.nativeElement, 'show');
        this.renderer.addClass(tab.nativeElement, 'active');
        tab.nativeElement.scrollTop = tab.nativeElement.scrollHeight;

        if (input) this.sendMessage(input);
      } else {
        this.renderer.removeClass(tab.nativeElement, 'show');
        this.renderer.removeClass(tab.nativeElement, 'active');
        this.renderer.addClass(tab.nativeElement, 'd-none');
      }
    });
  }

  toggleAiTabClick(event: Event, tabActive: string, input?: string): void {
    event.preventDefault();
    this.toggleAiTab(tabActive, input);
    
    if (tabActive === 'aiChatPrev') {
      const targetDiv = (event.target as HTMLElement).closest('div');
      targetDiv?.classList.toggle('bg-body');
      
      const prevTabs = document.querySelectorAll('[data-toggle-ai-tab="aiChatPrev"]');
			prevTabs.forEach(el => {
				const parentDiv = el.closest('div');
				if (parentDiv && parentDiv != targetDiv) {
					parentDiv.classList.remove('bg-body');
				}
			});
    } else {
    	const prevTabs = document.querySelectorAll('[data-toggle-ai-tab="aiChatPrev"]');
			prevTabs.forEach(el => {
				const parentDiv = el.closest('div');
				if (parentDiv) {
					parentDiv.classList.remove('bg-body');
				}
			});
    }
  }

  sendMessage(inputValue?: string): void {
    const input = inputValue || this.userInput.nativeElement.value;
		if (!input.trim()) return;
	
		const messages = this.aiChatNewContent.nativeElement;
		messages.innerHTML += `
			<div class="d-flex justify-content-end align-items-end mb-3">
				<div class="rounded-4 px-3 py-2 bg-component text-body fw-bold">${input}</div>
				<div class="w-30px h-30px ms-2 fs-20px me-2 rounded-circle text-white bg-inverse d-flex align-items-center justify-content-center">S</div>
			</div>
		`;
		
		this.userInput.nativeElement.value = '';
		messages.scrollTop = messages.scrollHeight;
		
		const typingIndicator = document.createElement('div');
		typingIndicator.className = "d-flex justify-content-start mb-3 ai-spinner";
		typingIndicator.innerHTML = `<div class="px-2"><div class="spinner-grow spinner-grow-sm"></div></div>`;
		messages.appendChild(typingIndicator);
		
		messages.scrollTop = messages.scrollHeight;
	
		setTimeout(() => {
			document.querySelector('.ai-spinner')?.remove();
	
			const aiResponses = [
				"That's an interesting question! Let me think...",
				"Good point! What else do you think about this?",
				"That makes sense. Can you clarify a bit more?",
				"Great perspective! Here’s my take on it...",
				"Good question! I believe the answer is...",
			];
			const aiResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
			messages.innerHTML += `
				<div class="d-flex justify-content-start align-items-end mb-3">
					<div class="w-30px h-30px ms-2 fs-16px me-2 rounded-circle bg-gradient-to-r bg-gradient-from-blue bg-gradient-to-teal text-white d-flex align-items-center justify-content-center">
						<i class="fa fa-shekel-sign"></i>
					</div>
					<div class="rounded-4 px-3 py-2 bg-component text-body fw-bold mw-75"><div class="typing-animation" style="animation-duration: .5s;">${aiResponse}</div></div>
				</div>
			`;
			messages.scrollTop = messages.scrollHeight;
			
			setTimeout(() => {
				document.querySelector('.typing-animation')?.classList.remove('typing-animation');
			}, 500);
		}, 2000);
  }

  constructor(public appSettings: AppSettings, private renderer: Renderer2) {
    this.appSettings.appContentFullHeight = true;
    this.appSettings.appContentClass = 'p-0';
  }

  ngOnDestroy() {
    this.appSettings.appContentFullHeight = false;
    this.appSettings.appContentClass = '';
  }
}

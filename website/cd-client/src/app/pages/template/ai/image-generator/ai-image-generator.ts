import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import Masonry from 'masonry-layout';

@Component({
  selector: 'ai-image-generator',
  templateUrl: './ai-image-generator.html',
  standalone: false
})

export class AIImageGeneratorPage implements OnInit {
	@ViewChild('aiGeneratedContainer') aiGeneratedContainer!: ElementRef;
  @ViewChild('aiGeneratingResult') aiGeneratingResult!: ElementRef;
  @ViewChild('aiGeneratedResult') aiGeneratedResult!: ElementRef;
  @ViewChild('aiRatioText') aiRatioText!: ElementRef;
  @ViewChild('aiStyleText') aiStyleText!: ElementRef;
  @ViewChild('previewImage') previewImage!: ElementRef;

  isGenerating = false;
  isGenerated = false;

  toggleAiGenerateImage(event: Event): void {
    event.preventDefault();

    if (this.aiGeneratedContainer && this.aiGeneratingResult && this.aiGeneratedResult) {
      this.isGenerating = true;
      this.isGenerated = false;

      this.aiGeneratedContainer.nativeElement.classList.remove('d-none');
      this.aiGeneratingResult.nativeElement.classList.remove('d-none');
      this.aiGeneratingResult.nativeElement.classList.add('show');

      const aiContainerPosition = this.aiGeneratedContainer.nativeElement.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: aiContainerPosition - 100, behavior: "smooth" });

      setTimeout(() => {
        this.aiGeneratingResult.nativeElement.classList.add('d-none');
        this.aiGeneratedResult.nativeElement.classList.remove('d-none');
        this.isGenerating = false;
        this.isGenerated = true;
      }, 1500);
    }
  }

  toggleAiDropdownSelection(event: Event,targetValue: string, targetContainer: HTMLElement): void {
  	event.preventDefault();
    targetContainer.innerHTML = targetValue;
  }

  previewImageFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (this.previewImage) {
          this.previewImage.nativeElement.src = e.target?.result;
          this.previewImage.nativeElement.classList.remove('d-none');
        }
      };
      reader.readAsDataURL(input.files[0]);
    }
  }
  
	ngOnInit() {
		setTimeout(function() {
			new Masonry('[data-masonry]');
		}, 100);
	}
}

import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { AppSettings } from '../../../service/app-settings.service';
import 'lity';

@Component({
  selector: 'landing',
  templateUrl: './landing.html',
  encapsulation: ViewEncapsulation.None,
  styleUrls: [ './landing.css' ],
  standalone: false
})

export class LandingPage implements OnDestroy {
  constructor(private router: Router, public appSettings: AppSettings) {
    this.appSettings.appEmpty = true;
  }

  ngOnDestroy() {
    this.appSettings.appEmpty = false;
  }

  formSubmit(f: NgForm) {
    this.router.navigate(['']);
  }
  
  scrollToTarget(targetId: string) {
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      const scrollPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - 72;
      window.scrollTo({ top: scrollPosition, behavior: 'smooth' });
    }
  }
}

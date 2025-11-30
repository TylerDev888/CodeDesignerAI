import { Component, ViewEncapsulation, OnDestroy } from '@angular/core';
import { AppSettings } from '../../../../service/app-settings.service';

@Component({
  selector: 'email-detail',
  templateUrl: './email-detail.html',
  standalone: false
})

export class EmailDetailPage implements OnDestroy {
  public isCollapsed = true;

  constructor(public appSettings: AppSettings) {
    this.appSettings.appContentFullHeight = true;
    this.appSettings.appContentClass = 'p-0';
  }

  ngOnDestroy() {
    this.appSettings.appContentFullHeight = false;
    this.appSettings.appContentClass = '';
  }
}

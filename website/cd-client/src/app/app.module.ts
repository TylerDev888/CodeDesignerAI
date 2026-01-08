// Core Module
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { BrowserAnimationsModule }               from '@angular/platform-browser/animations';
import { BrowserModule, Title }                  from '@angular/platform-browser';
import { HttpClientModule }                      from '@angular/common/http';
import { AppRoutingModule }                      from './app-routing.module';
import { NgModule }                              from '@angular/core';
import { FormsModule, ReactiveFormsModule }      from '@angular/forms';

// Main Component
import { AppComponent }                    from './app.component';
import { HeaderComponent }                 from './components/header/header.component';
import { SidebarComponent }                from './components/sidebar/sidebar.component';
import { SidebarRightComponent }           from './components/sidebar-right/sidebar-right.component';
import { TopMenuComponent }                from './components/top-menu/top-menu.component';
import { PanelComponent }                  from './components/panel/panel.component';
import { FloatSubMenuComponent }           from './components/float-sub-menu/float-sub-menu.component';
import { ThemePanelComponent }             from './components/theme-panel/theme-panel.component';

// Component Module
import { NgScrollbarModule, NG_SCROLLBAR_OPTIONS } from 'ngx-scrollbar';
import { provideHighlightOptions, HighlightAuto }  from 'ngx-highlightjs';

// Plugins
import { NgbDatepickerModule, NgbTimepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgxDaterangepickerMd }            from 'ngx-daterangepicker-material';
import { NgxEditorModule }                 from 'ngx-editor';
import { ColorSketchModule }               from 'ngx-color/sketch';
import { NgxDatatableModule }              from '@swimlane/ngx-datatable';
import { FullCalendarModule }              from '@fullcalendar/angular';
import { CountdownModule }                 from 'ngx-countdown';
import { NgxChartsModule }                 from '@swimlane/ngx-charts';
import { NgApexchartsModule }              from 'ng-apexcharts';
import { NgChartsModule }                  from 'ng2-charts';
import { CalendarModule, DateAdapter }     from 'angular-calendar';
import { adapterFactory }                  from 'angular-calendar/date-adapters/date-fns';
import { TrendModule }                     from 'ngx-trend';

// Pages
import { DashboardV1Page }          from './pages/template/dashboard/v1/dashboard-v1';
import { DashboardV2Page }          from './pages/template/dashboard/v2/dashboard-v2';
import { DashboardV3Page }          from './pages/template/dashboard/v3/dashboard-v3';

// AI
import { AIChatPage }               from './pages/template/ai/chat/ai-chat';
import { AIImageGeneratorPage }     from './pages/template/ai/image-generator/ai-image-generator';

// Email
import { EmailInboxPage }           from './pages/template/email/inbox/email-inbox';
import { EmailComposePage }         from './pages/template/email/compose/email-compose';
import { EmailDetailPage }          from './pages/template/email/detail/email-detail';

// Widgets
import { WidgetPage }               from './pages/template/widget/widget';

// UI Element
import { UIGeneralPage }            from './pages/template/ui-elements/general/general';
import { UITypographyPage }         from './pages/template/ui-elements/typography/typography';
import { UITabsAccordionsPage }     from './pages/template/ui-elements/tabs-accordions/tabs-accordions';
import { UIModalNotificationPage }  from './pages/template/ui-elements/modal-notification/modal-notification';
import { UIWidgetBoxesPage }        from './pages/template/ui-elements/widget-boxes/widget-boxes';
import { UIMediaObjectPage }        from './pages/template/ui-elements/media-object/media-object';
import { UIButtonsPage }            from './pages/template/ui-elements/buttons/buttons';
import { UIIconFontAwesomePage }    from './pages/template/ui-elements/icon-fontawesome/icon-fontawesome';
import { UIIconDuotonePage }        from './pages/template/ui-elements/icon-duotone/icon-duotone';
import { UIIconSimpleLineIconsPage }from './pages/template/ui-elements/icon-simple-line-icons/icon-simple-line-icons';
import { UIIconBootstrapPage }      from './pages/template/ui-elements/icon-bootstrap/icon-bootstrap';
import { UILanguageIconPage }       from './pages/template/ui-elements/language-icon/language-icon';
import { UISocialButtonsPage }      from './pages/template/ui-elements/social-buttons/social-buttons';

// Bootstrap 5
import { Bootstrap5Page }           from './pages/template/bootstrap-5/bootstrap-5';

// Form
import { FormElementsPage }         from './pages/template/form/form-elements/form-elements';
import { FormWizardsPage }          from './pages/template/form/form-wizards/form-wizards';
import { FormPluginsPage }         from './pages/template/form/form-plugins/form-plugins';

// Table
import { TableBasicPage }           from './pages/template/tables/table-basic/table-basic';
import { TableDataPage }            from './pages/template/tables/table-data/table-data';

// Pos
import { PosCounterCheckoutPage }   from './pages/template/pos/counter-checkout/counter-checkout';
import { PosKitchenOrderPage }      from './pages/template/pos/kitchen-order/kitchen-order';
import { PosCustomerOrderPage }     from './pages/template/pos/customer-order/customer-order';
import { PosMenuStockPage }         from './pages/template/pos/menu-stock/menu-stock';
import { PosTableBookingPage }      from './pages/template/pos/table-booking/table-booking';

// Chart
import { ChartNgxPage }             from './pages/template/chart/chart-ngx/chart-ngx';
import { ChartApexPage }            from './pages/template/chart/chart-apex/chart-apex';
import { ChartJsPage }              from './pages/template/chart/chart-js/chart-js';

// Landing
import { LandingPage }              from './pages/template/landing/landing';

// Calendar
import { CalendarPage }             from './pages/template/calendar/calendar';

// Map
import { MapPage }                  from './pages/template/map/map';

// Gallery
import { GalleryV1Page }            from './pages/template/gallery/gallery-v1/gallery-v1';
import { GalleryV2Page }            from './pages/template/gallery/gallery-v2/gallery-v2';

// Page Options
import { PageBlank }                from './pages/template/page-options/page-blank/page-blank';
import { PageFooter }               from './pages/template/page-options/page-with-footer/page-with-footer';
import { PageFixedFooter }          from './pages/template/page-options/page-with-fixed-footer/page-with-fixed-footer';
import { PageWithoutSidebar }       from './pages/template/page-options/page-without-sidebar/page-without-sidebar';
import { PageSidebarRight }         from './pages/template/page-options/page-with-right-sidebar/page-with-right-sidebar';
import { PageSidebarMinified }      from './pages/template/page-options/page-with-minified-sidebar/page-with-minified-sidebar';
import { PageFullHeight }           from './pages/template/page-options/page-full-height/page-full-height';
import { PageTwoSidebar }           from './pages/template/page-options/page-with-two-sidebar/page-with-two-sidebar';
import { PageSidebarWide }          from './pages/template/page-options/page-with-wide-sidebar/page-with-wide-sidebar';
import { PageSidebarLight }         from './pages/template/page-options/page-with-light-sidebar/page-with-light-sidebar';
import { PageSidebarTransparent }   from './pages/template/page-options/page-with-transparent-sidebar/page-with-transparent-sidebar';
import { PageTopMenu }              from './pages/template/page-options/page-with-top-menu/page-with-top-menu';
import { PageMixedMenu }            from './pages/template/page-options/page-with-mixed-menu/page-with-mixed-menu';
import { PageMegaMenu }             from './pages/template/page-options/page-with-mega-menu/page-with-mega-menu';
import { PageBoxedLayout }          from './pages/template/page-options/page-with-boxed-layout/page-with-boxed-layout';
import { PageBoxedLayoutMixedMenu } from './pages/template/page-options/page-boxed-layout-with-mixed-menu/page-boxed-layout-with-mixed-menu';
import { PageSidebarSearch }        from './pages/template/page-options/page-with-search-sidebar/page-with-search-sidebar';

// Extra Pages
import { ExtraTimelinePage }        from './pages/template/extra/extra-timeline/extra-timeline';
import { ExtraComingSoonPage }      from './pages/template/extra/extra-coming-soon/extra-coming-soon';
import { ExtraSearchResultsPage }   from './pages/template/extra/extra-search-results/extra-search-results';
import { ExtraInvoicePage }         from './pages/template/extra/extra-invoice/extra-invoice';
import { ExtraErrorPage }           from './pages/template/extra/extra-error/extra-error';
import { ExtraProfilePage }         from './pages/template/extra/extra-profile/extra-profile';
import { ExtraScrumBoardPage }      from './pages/template/extra/extra-scrum-board/extra-scrum-board';
import { ExtraCookieAcceptanceBannerPage } from './pages/template/extra/extra-cookie-acceptance-banner/extra-cookie-acceptance-banner';
import { ExtraOrdersPage }          from './pages/template/extra/extra-orders/extra-orders';
import { ExtraOrderDetailsPage }    from './pages/template/extra/extra-order-details/extra-order-details';
import { ExtraProductsPage }        from './pages/template/extra/extra-products/extra-products';
import { ExtraProductDetailsPage }  from './pages/template/extra/extra-product-details/extra-product-details';
import { ExtraFileManagerPage }     from './pages/template/extra/extra-file-manager/extra-file-manager';
import { ExtraPricingPage }         from './pages/template/extra/extra-pricing-page/extra-pricing-page';
import { ExtraMessengerPage }       from './pages/template/extra/extra-messenger-page/extra-messenger-page';
import { ExtraDataManagementPage }  from './pages/template/extra/extra-data-management/extra-data-management';
import { ExtraSettingsPage }        from './pages/template/extra/extra-settings-page/extra-settings-page';

// User Login / Register
import { LoginV1Page }              from './pages/template/login/login-v1/login-v1';
import { LoginV2Page }              from './pages/template/login/login-v2/login-v2';
import { LoginV3Page }              from './pages/template/login/login-v3/login-v3';
import { RegisterV3Page }           from './pages/template/register/register-v3/register-v3';

// Helper
import { HelperCssPage }            from './pages/template/helper/helper-css/helper-css';

// Error
import { ErrorPage }                from './pages/template/error/error';
import { CodeEditor }               from './pages/playstation2/code-editor/code-editor';
import { MonacoEditorModule }       from 'ngx-monaco-editor-v2';
import { CodeHighLighterComponent } from './components/code-highlighter/code-highlighter.component';
import { Disassembler } from './pages/playstation2/disassembler/disassembler';
import { BreadcrumbsComponent } from './components/breadcrumbs/breadcrumbs.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    SidebarComponent,
    SidebarRightComponent,
    TopMenuComponent,
    PanelComponent,
    FloatSubMenuComponent,
    ThemePanelComponent,
    
    DashboardV1Page,
    DashboardV2Page,
    DashboardV3Page,
    
    AIChatPage,
    AIImageGeneratorPage,
    
    EmailInboxPage,
    EmailComposePage,
    EmailDetailPage,
    
    WidgetPage,
    
    UIGeneralPage,
    UITypographyPage,
    UITabsAccordionsPage,
    UIModalNotificationPage,
    UIWidgetBoxesPage,
    UIMediaObjectPage,
    UIButtonsPage,
    UIIconFontAwesomePage,
  	UIIconDuotonePage,
    UIIconSimpleLineIconsPage,
   	UIIconBootstrapPage,
    UILanguageIconPage,
    UISocialButtonsPage,
    
    Bootstrap5Page,
   
    FormElementsPage,
    FormWizardsPage,
    FormPluginsPage,
    
    TableBasicPage,
    TableDataPage,
    
    PosCounterCheckoutPage,
    PosKitchenOrderPage,
    PosCustomerOrderPage,
    PosTableBookingPage,
    PosMenuStockPage,
    
    ChartNgxPage,
    ChartApexPage,
    ChartJsPage,
    
    LandingPage,
    
    CalendarPage,
    
    MapPage,
    
    GalleryV1Page,
    GalleryV2Page,
    
    PageBlank,
    PageFooter,
    PageFixedFooter,
    PageWithoutSidebar,
    PageSidebarRight,
    PageSidebarMinified,
    PageFullHeight,
    PageTwoSidebar,
    PageSidebarWide,
    PageSidebarLight,
    PageSidebarTransparent,
    PageSidebarSearch,
    PageTopMenu,
    PageMixedMenu,
    PageBoxedLayout,
    PageMegaMenu,
    PageBoxedLayoutMixedMenu,
    
    ExtraTimelinePage,
    ExtraComingSoonPage,
    ExtraSearchResultsPage,
    ExtraInvoicePage,
    ExtraErrorPage,
    ExtraProfilePage,
    ExtraScrumBoardPage,
    ExtraCookieAcceptanceBannerPage,
    ExtraOrdersPage,
    ExtraOrderDetailsPage,
    ExtraProductsPage,
    ExtraProductDetailsPage,
    ExtraFileManagerPage,
    ExtraPricingPage,
    ExtraMessengerPage,
    ExtraDataManagementPage,
    ExtraSettingsPage,
    
    LoginV1Page,
    LoginV2Page,
    LoginV3Page,
    RegisterV3Page,
    
    HelperCssPage,

    //Code Designer
    CodeEditor,
    Disassembler,
    
    //Components
    CodeHighLighterComponent,
    BreadcrumbsComponent,

    ErrorPage
  ],
  imports: [
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    NgScrollbarModule,
    FormsModule,
    
    MonacoEditorModule.forRoot(), // <-- root config here

    // plugins
    HighlightAuto,
    ColorSketchModule,
    NgbDatepickerModule,
    NgbTimepickerModule,
    NgxEditorModule,
    NgxDaterangepickerMd.forRoot(),
    NgxDatatableModule,
    FullCalendarModule,
    CountdownModule,
    NgxChartsModule,
    NgApexchartsModule,
    NgChartsModule,
    TrendModule,
    CalendarModule.forRoot({
      provide: DateAdapter,
      useFactory: adapterFactory
    })
  ],
  providers: [ Title, 
		{
			provide: NG_SCROLLBAR_OPTIONS,
			useValue: { visibility: 'hover' }
		}, 
		provideHighlightOptions({
			fullLibraryLoader: () => import('highlight.js'),
			lineNumbersLoader: () => import('ngx-highlightjs/line-numbers'),
		})
	],
  bootstrap: [ AppComponent ]
})

export class AppModule {
  constructor(private router: Router, private titleService: Title, private route: ActivatedRoute) {
    router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        var title = 'Code Designer | ' + this.route.snapshot.firstChild.data['title'];
        this.titleService.setTitle(title);
      }
    });
  }
}

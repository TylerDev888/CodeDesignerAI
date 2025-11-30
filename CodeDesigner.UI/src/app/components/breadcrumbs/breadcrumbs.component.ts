import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

interface Breadcrumb {
  label: string;
  url: string;
}

/* Example route config with breadcrumb metadata (recommended for pretty names):
ts
Copy
Edit
{
  path: 'admin',
  data: { breadcrumb: 'Admin' },
  children: [
    {
      path: 'users',
      data: { breadcrumb: 'Users' },
      children: [
        {
          path: 'edit',
          data: { breadcrumb: 'Edit User' },
          component: EditUserComponent,
        },
      ],
    },
  ],
}
If no data.breadcrumb is given, the component will auto-generate one like:
edit-user → Edit User */

@Component({
  selector: 'breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  standalone: false,
})
export class BreadcrumbsComponent implements OnInit {
  breadcrumbs: Breadcrumb[] = [];

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.breadcrumbs = this.buildBreadcrumbs(this.route.root);
      });

    // Build immediately on first load
    this.breadcrumbs = this.buildBreadcrumbs(this.route.root);
  }

  private buildBreadcrumbs(route: ActivatedRoute, url: string = '', breadcrumbs: Breadcrumb[] = []): Breadcrumb[] {
    const children = route.children;

    for (const child of children) {
      const routeSegment = child.snapshot.url.map(segment => segment.path).join('/');
      if (routeSegment) {
        url += `/${routeSegment}`;
        const label = child.snapshot.data['breadcrumb'] || this.formatLabel(routeSegment);
        breadcrumbs.push({ label, url });
      }
      return this.buildBreadcrumbs(child, url, breadcrumbs); // recurse into next child
    }

    return breadcrumbs;
  }

  private formatLabel(str: string): string {
    return str
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }
}

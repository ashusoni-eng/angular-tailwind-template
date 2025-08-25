import { Component, HostListener, inject, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { AuthService } from "../../../core/services/auth.service";
import {
  faPieChart,
  faArrowLeft,
  faArrowRight,
  faChevronLeft,
  faChevronRight,
  faBars,
  faUserGroup,
  faCar,
  faFolder,
  faHeadset,
  faX,
} from "@fortawesome/free-solid-svg-icons";

@Component({
  selector: "app-sidebar",
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: "./sidebar.component.html",
  styleUrl: "./sidebar.component.scss",
})
export class SidebarComponent implements OnInit {
  protected readonly faPieChart = faPieChart;
  protected readonly faArrowLeft = faArrowLeft;
  protected readonly faArrowRight = faArrowRight;
  protected readonly faChevronLeft = faChevronLeft;
  protected readonly authService = inject(AuthService);
  protected readonly faChevronRight = faChevronRight;
  protected readonly faUserGroup = faUserGroup;
  protected readonly faCar = faCar;
  protected readonly faFolder = faFolder;
  protected readonly faHeadset = faHeadset;
  protected readonly faBars = faBars;
  protected readonly faX = faX;

  isExpanded = false;
  isMobileOpen = false;
  isSuperAdmin = false;

  constructor(private router: Router) { }

  navItems = [
    {
      img: "/assets/images/Sidebaricon/Dashboard.png",
      label: "Dashboard",
      href: "/dashboard",
      active: true,
      relatedRoutes: [],
    },   
  ];

  ngOnInit() {
    const savedState = localStorage.getItem("sidebarExpanded");
    this.isSuperAdmin = this.authService.isSuperAdmin();
    if (savedState !== null) {
      this.isExpanded = JSON.parse(savedState);
    }
  }

  toggleSidebar() {
    this.isExpanded = !this.isExpanded;
    localStorage.setItem("sidebarExpanded", JSON.stringify(this.isExpanded));
  }

  closeSidebar() {
    this.isExpanded = false;
    this.isMobileOpen = false;
    localStorage.setItem("sidebarExpanded", JSON.stringify(this.isExpanded));
  }

  toggleMobileSidebar() {
    this.isMobileOpen = !this.isMobileOpen;
  }

  @HostListener("window:resize", ["$event"])
  onResize(event: any) {
    if (event.target.innerWidth >= 768) {
      this.isMobileOpen = false;
    }
  }

  isActiveRoute(href: string): boolean {
    const currentRoute = this.router.url;
    const navItem = this.navItems.find((item) => item.href === href);
    if (!navItem) return false;
    const relatedRoutes = navItem.relatedRoutes || [];
    return [href, ...relatedRoutes].includes(currentRoute);
  }
}

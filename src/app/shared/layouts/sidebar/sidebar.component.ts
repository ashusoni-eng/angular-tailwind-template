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
    },
    // {
    //   img: "/assets/images/Sidebaricon/admin.png",
    //   label: "Admin",
    //   href: "/admin",
    //   relatedRoutes: ["/add-user"],
    //   showToUsers: false,
    // },
    {
      img: "/assets/images/Sidebaricon/Peoples.png",
      label: "Owners",
      href: "/owners",
      relatedRoutes: ["/add-owner"],
    },
    // {
    //   img: "/assets/images/Sidebaricon/transaction.svg",
    //   label: "Transactions",
    //   href: "/transactions",
    //   // relatedRoutes: ["/transactions"],
    // },
    // {
    //   img: "/assets/images/Sidebaricon/communication.svg",
    //   label: "Communication",
    //   href: "/communication",
    //   // relatedRoutes: ["/transactions"],
    // },
    // {
    //   img: "/assets/images/Sidebaricon/car.png",
    //   label: "New Vechiles",
    //   href: "/new-vechiles",
    //   // relatedRoutes: ["/transactions"],
    // },
    {
      img: "/assets/images/Sidebaricon/natis.svg",
      label: "Natis",
      href: "/natis",
      showToSuperAdmin: true,
      // relatedRoutes: ["/transactions"],
    },
    // {
    //   img: "/assets/images/Sidebaricon/bell.svg",
    //   label: "Critical Notifications",
    //   href: "/critical-notifications",
    //   // relatedRoutes: ["/transactions"],
    // },
    // {
    //   img: "/assets/images/Sidebaricon/dealer.svg",
    //   label: "Dealer Agents Influence",
    //   href: "/dealer-agents-influence",
    //   // relatedRoutes: ["/transactions"],
    // },
    // {
    //   img: "/assets/images/Sidebaricon/audit-trail.svg",
    //   label: "Audit Trail",
    //   href: "/audit-trail",
    //   // relatedRoutes: ["/transactions"],
    // },
    // {
    //   img: "/assets/images/Sidebaricon/user-profiles.svg",
    //   label: "User Profiles",
    //   href: "/user-profiles",
    //   // relatedRoutes: ["/transactions"],
    // },
    // {
    //   img: "/assets/images/Sidebaricon/admin-targets.svg",
    //   label: "Admin Targets",
    //   href: "/admin-targets",
    //   // relatedRoutes: ["/transactions"],
    // },
    {
      img: "/assets/images/Sidebaricon/upload-renewal.svg",
      label: "Upload Renewal Prices",
      href: "/upload-renewal-prices",
      showToSuperAdmin: true,
      // relatedRoutes: ["/transactions"],
    },
    {
      img: "/assets/images/Sidebaricon/history.svg",
      label: "Upload Renewal Price History",
      href: "/upload-renewal-prices-history",
      showToSuperAdmin: true,
      // relatedRoutes: ["/transactions"],
    },
    {
      img: "/assets/images/Sidebaricon/note 2.png",
      label: "Product Pricing",
      href: "/product/pricing",
      showToSuperAdmin: true,
    },
    {
      img: "/assets/images/Sidebaricon/agent.png",
      label: "Agents/Influencers",
      href: "/agents/influencers",
      showToSuperAdmin: true,
    },
    {
      img: "/assets/images/Sidebaricon/car.png",
      label: "Vehicles",
      href: "/vehicles",
      relatedRoutes: ["/add-vehicle"],
    },
    {
      img: "/assets/images/Sidebaricon/Documentpng.png",
      label: "Documents",
      href: "/documents",
      relatedRoutes: ["/add-document"],
    },
    // {
    //   img: "/assets/images/Sidebaricon/social.png",
    //   label: "Social Page",
    //   href: "/socialpage",
    //   showToUsers: false,
    // },
    {
      img: "/assets/images/Sidebaricon/document-text.png",
      label: "Transfer Doc",
      href: "/generate-transfer-document",
    },
    {
      img: "/assets/images/Sidebaricon/Contact-us.png",
      label: "Contact Us",
      href: "/contact-us",
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

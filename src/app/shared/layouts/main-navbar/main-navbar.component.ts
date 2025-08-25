import {
  ChangeDetectorRef,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  ViewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { faBell } from "@fortawesome/free-regular-svg-icons";
import { AuthService } from "../../../core/services/auth.service";
import { filter, map } from "rxjs/operators";
import { NavigationEnd, Router, ActivatedRoute } from "@angular/router";
import { Title } from "@angular/platform-browser";
import { NotificationsService } from "../../../core/services/notifications.service";
import { formatTime } from "../../../core/utils/api.utils";

@Component({
  selector: "app-main-navbar",
  imports: [CommonModule],
  templateUrl: "./main-navbar.component.html",
  styleUrl: "./main-navbar.component.scss",
})
export class MainNavbarComponent {
  showPanel = false;
  @ViewChild('notificationPanel', { static: false }) notificationPanelRef!: ElementRef;

  pageTitle: string = "Dashboard"; // Default title
  faBell = faBell;
  isExpanded = false;
  dropdownOpen = false;
  user = computed(() => this.authService.currentUser());
  userDataStorage = computed(() => this.authService.currentUserData());
  profileImage = computed(() => this.authService.profileImage()); //
  protected readonly notificationService = inject(NotificationsService);
  recentNotifications: any;
  formatTime = formatTime;
  hasUnreadNotifications: boolean = false;

  constructor(
    protected authService: AuthService,
    private el: ElementRef,
    private cdRef: ChangeDetectorRef,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private titleService: Title,
  ) { }
  @HostListener("document:click", ["$event"])
  clickOutside(event: MouseEvent) {
    // If the click is outside the dropdown, close it
    const clickedInside = this.dropdownContainer.nativeElement.contains(
      event.target
    );
    if (!clickedInside) {
      this.dropdownOpen = false;
    }
  }

  ngOnInit(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd)) //Explicitly return the condition
      .subscribe(() => {
        this.updateTitle();
      });

    //Immediately update title when component initializes
    this.updateTitleFromRoute();

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this.getTitleFromRoute())
      )
      .subscribe((title) => {
        this.pageTitle = title;
        this.updateTitle();
        this.titleService.setTitle(title); //Set browser title
      });
    this.loadRecentNotification();
  }
  //Extract logic into a function to run at startup
  private updateTitleFromRoute(): void {
    const title = this.getTitleFromRoute();
    this.pageTitle = title;
    this.updateTitle();
    this.titleService.setTitle(title);
  }

  //Function to get the title from the route
  private getTitleFromRoute(): string {
    let route = this.activatedRoute.firstChild;
    while (route?.firstChild) {
      route = route.firstChild;
    }
    return route?.snapshot.data["title"] || "Dashboard";
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }
  @ViewChild("dropdownContainer")
  dropdownContainer!: ElementRef;

  logout() {
    this.router.navigate(["/login"]).then(() => {
      this.authService.logout();
    });
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent) {
    const clickedInsidePanel = this.notificationPanelRef?.nativeElement.contains(event.target);
    const clickedBell = (event.target as HTMLElement).closest('button');

    if (!clickedInsidePanel && !clickedBell) {
      this.showPanel = false;
    }
  }


  updateTitle() {
    const routeUrl = this.router.url;

    // Check for URL pattern match
    if (routeUrl.includes("motivation-statement/")) {
      this.pageTitle = "Invite Friends";
      return;
    }
    const routeData = this.activatedRoute.firstChild?.snapshot.data;
    this.pageTitle = routeData?.["title"] || "Dashboard"; // Fallback to 'Dashboard' if no title is set
  }
  togglePanel() {
    this.showPanel = !this.showPanel;
    if (this.showPanel) {
      this.markNotificationsAsRead();
    }
  }

  closePanel() {
    this.showPanel = false;
  }

  navigateTo(url: any) {
    this.closePanel();
    this.cdRef.detectChanges();
    setTimeout(() => {
      this.router.navigate([url]);
    }, 50);
  }

  loadRecentNotification() {
    this.notificationService.getlatestNotification().subscribe({
      next: (response: any) => {
        this.recentNotifications = response;
        this.hasUnreadNotifications = this.recentNotifications.some((n: any) => !n.is_read);
      },
      error: (error) => {
        console.error("Error loading vehicles:", error);
      },
    });
  }

  markNotificationsAsRead() {
    this.hasUnreadNotifications = false;
    this.notificationService.markAllAsRead().subscribe();
  }


}

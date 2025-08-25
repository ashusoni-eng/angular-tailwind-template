import {
  Component,
  ElementRef,
  ViewChildren,
  QueryList,
  Output,
  EventEmitter,
  signal,
  computed,
  Input,
  OnInit,
  inject,
  ChangeDetectorRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";
import { VerifyOtp } from "../../../core/interfaces/verify-otp";
import { NgOtpInputComponent } from "ng-otp-input";
import { OtpInputConfig } from "../../../core/interfaces/otp-input-config";
import { TimerPipe } from "./timer-pipe/timer.pipe";
import { ToastrService } from "ngx-toastr";
import Swal from "sweetalert2";
import { FormDataService } from "../../../core/services/formdata.service";
import { take } from "rxjs";
@Component({
  selector: "app-otp-verification",
  imports: [
    CommonModule,
    FormsModule,
    NgOtpInputComponent,
    ReactiveFormsModule,
    TimerPipe,
  ],
  templateUrl: "./otp-verification.component.html",
  styleUrl: "./otp-verification.component.scss",
})
export class OtpVerificationComponent implements OnInit {
  @ViewChildren("otpInput") otpInputs!: QueryList<ElementRef>;
  @Input({ required: true }) email!: string;
  @Input({ required: true }) password!: string;
  @Input() rememberMe!: boolean;
  @Output() otpSubmitted = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
  protected readonly toastr = inject(ToastrService);
  protected readonly formDataService = inject(FormDataService);
  hasUnsavedData: boolean = false;

  showMessage = false;
  otpInputConfig: OtpInputConfig = {
    length: 6,
    allowNumbersOnly: true,
    showError: true,
    inputClass:
      "w-12 h-12 text-center text-xl font-semibold border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all disabled:bg-gray-100",
  };

  // Signals
  otpControl = new FormControl("", {
    validators: [
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(6),
    ],
    nonNullable: true,
  });
  errorMessage = signal<string>("");
  loading = signal<boolean>(false);
  resendTimer = signal<number>(0);
  protected formErrors: { [key: string]: string } = {};

  // Computed values
  isDisabled = computed(
    () => this.loading() || this.otpControl.invalid || !this.otpControl.value
  );

  private readonly RESEND_TIMEOUT =
    Number(localStorage.getItem("otp_expiry_time")) || 30; // seconds
  private resendTimeout?: number;

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) // protected formDataService: FormDataService,
  {
    this.startResendTimer();
  }
  ngOnInit(): void {
    this.otpControl.valueChanges.subscribe(() => {
      if (this.errorMessage()) {
        this.errorMessage.set("");
      }
    });
  }

  ngOnDestroy() {
    if (this.resendTimeout) {
      window.clearTimeout(this.resendTimeout);
    }
  }

  private startResendTimer() {
    this.resendTimer.set(this.RESEND_TIMEOUT);
    const countdown = () => {
      const currentTime = this.resendTimer();
      if (currentTime > 0) {
        this.resendTimer.set(currentTime - 1);
        this.resendTimeout = window.setTimeout(countdown, 1000);
      } else {
        // this.toastr.error('OTP session failed!');
        setTimeout(() => {
          this.showMessage = true;
          this.cdr.detectChanges(); // Trigger change detection
        }, 200);
      }
    };

    this.resendTimeout = window.setTimeout(countdown, 1000);
  }

  maskEmail(email: string): string {
    const [username, domain] = email.split("@");
    const maskedUsername =
      username.charAt(0) +
      "*".repeat(username.length - 2) +
      username.charAt(username.length - 1);
    return `${maskedUsername}@${domain}`;
  }

  onClose() {
    this.close.emit();
  }

  onOtpChange(value: string): void {
    this.otpControl.setValue(value, { emitEvent: true });
    this.otpControl.markAsTouched();
  }

  verifyOtp() {
    if (this.otpControl.invalid) {
      this.otpControl.markAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set("");

    const verifyOtpData: VerifyOtp = {
      email: this.email,
      password: this.password,
      rememberMe: this.rememberMe || false,
      otp: this.otpControl.value || "",
    };

    this.authService.verifyOTP(verifyOtpData).subscribe({
      next: (res: any) => {
        this.toastr.success("Login successful! Redirecting...", "Success", {
          timeOut: 3000,
        });
        this.otpSubmitted.emit();
        this.router.navigate(["/dashboard"]);
        if (res && res?.user?.avatar_url) {
          localStorage.setItem('profileImage', res?.user?.avatar_url)
        }
        if (res?.hasMidwayOCRData) {
          setTimeout(() => {
            Swal.fire({
              icon: "warning",
              title: "Unsaved Data",
              text: "You have unsaved data. Do you want to continue filling the form?",
              showCancelButton: true,
              showDenyButton: true, // ✅ Adds a third button
              confirmButtonColor: "#3FA748",
              confirmButtonText: "Yes, continue",
              denyButtonText: "Reset", // ✅ Reset button text
              cancelButtonColor: "#007BFF",
              cancelButtonText: "No",
            }).then((result) => {
              if (result.isConfirmed) {
                this.router.navigate(["/new-vehicle-owner"]); // ✅ User chose "Yes"
              } else if (result.isDenied) {
                this.resetForm(); // ✅ Call your reset function
              }
            });
          }, 3000);
        } else if (res?.user?.is_partial_saved == 1) {
          setTimeout(() => {
            Swal.fire({
              text: "You have filled out the owner information midway. Do you want to complete it?",
              icon: "info",
              showCancelButton: true,
              confirmButtonColor: "#3085d6",
              cancelButtonColor: "#d33",
              confirmButtonText: "Yes",
            }).then((result) => {
              if (result.isConfirmed) {
                this.router.navigate(["/owners/edit", res?.user?.owner_id]);
              }
            });
          }, 3000);
        }
      },
      error: (error) => {
        this.errorMessage.set(
          error.message || "Invalid code. Please try again."
        );
        this.loading.set(false);
      },
    });
  }

  resetForm() {
    this.formDataService.reset().subscribe({
      next: () => {
        this.formDataService.clearData();
        this.router.navigate(["/dashboard"], { queryParams: { reset: true } }).then(() => {
          // window.location.reload(); // Force full page reload
        });
      },
    })
  }


  // checkIncompletData(){
  //   this.formDataService.unsavedData$.subscribe((hasData) => {
  //     this.hasUnsavedData = hasData;
  //     console.log("Has unsaved data:", this.hasUnsavedData);

  //     const hasShownPopup = localStorage.getItem('unsavedDataPopupShown');

  //     console.log("Has hasShownPopup:", hasShownPopup);

  //     if (this.hasUnsavedData && !hasShownPopup) {
  //       localStorage.setItem('unsavedDataPopupShown', 'true'); // ✅ Prevent duplicate popups

  //       setTimeout(() => {
  //         Swal.fire({
  //           icon: 'warning',
  //           title: 'Unsaved Data',
  //           text: 'You have unsaved data. Do you want to continue filling the form?',
  //           showCancelButton: true,
  //           confirmButtonColor: "#3FA748",
  //           confirmButtonText: 'Yes, continue',
  //           cancelButtonText: 'No',
  //         }).then((result) => {
  //           if (result.isConfirmed) {
  //             this.router.navigate(['/new-vehicle-owner']);
  //           } else if (result.dismiss === Swal.DismissReason.cancel) {
  //             // this.formDataService.clearFormData();
  //             // localStorage.removeItem('unsavedDataPopupShown'); // ✅ Reset flag on cancel
  //           }
  //         });
  //       }, 3000);
  //     }
  //   });
  // }

  onSendOtp(): void {
    this.showMessage = false;
    let loginoForm = {
      email: this.email,
      password: this.password,
    };
    this.authService.login(loginoForm).subscribe({
      next: () => {
        this.startResendTimer();
      },
      error: () => this.handleError(),
    });
  }

  handleError(): void {
    let error = this.authService.error();
    if (!error) return;

    if (error.code === "VALIDATION_ERROR" && error.details) {
      for (const [field, messages] of Object.entries(error.details)) {
        if (Array.isArray(messages) && messages.length > 0) {
          this.formErrors[field] = messages[0];
        }
      }
    } else {
      // Handle other error codes
      this.formErrors["general"] =
        error.message || "An error occurred during registration";
    }

    setTimeout(() => {
      this.authService.resetError();
    }, 3000);
  }
}

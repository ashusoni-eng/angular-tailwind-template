import { computed, inject, Injectable, Signal, signal } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { ToastrService } from "ngx-toastr";
import { PaginationInfo } from "../interfaces/pagination-info";
import { environment } from "../../../environments/environment";
import { QueryParams } from "../interfaces/query-params";
import {
  catchError,
  finalize,
  map,
  Observable,
  of,
  Subject,
  takeUntil,
  tap,
  throwError,
} from "rxjs";
import { ApiResponse } from "../interfaces/api-response";
import { PaginatedData } from "../interfaces/paginated-data";
import { PaginatedResponse } from "../interfaces/paginated-response";
import { handleApiResponse } from "../utils/api.utils";
import { EnhancedError } from "../interfaces/enhanced-error";
import { VerifyOtp } from "../interfaces/verify-otp";
import Swal from "sweetalert2";
import { Router } from "@angular/router";

@Injectable({
  providedIn: "root",
})
export abstract class BaseApiService<T extends { id: number }> {
  protected abstract endpoint: string;

  protected readonly http = inject(HttpClient);
  protected readonly toastr = inject(ToastrService);
  private router = inject(Router);
  protected readonly loading = signal(false);
  protected readonly errors = signal<Record<string, string[]>>({});
  protected readonly items = signal<T[]>([]);
  protected readonly selectedItem = signal<T | null>(null);
  protected readonly pagination = signal<PaginationInfo | null>(null);

  readonly isLoading: Signal<boolean> = computed(() => this.loading());
  readonly getErrors: Signal<Record<string, string[]>> = computed(() =>
    this.errors()
  );
  readonly getItems: Signal<T[]> = computed(() => this.items());
  readonly getSelectedItem: Signal<T | null> = computed(() =>
    this.selectedItem()
  );
  readonly getPagination: Signal<PaginationInfo | null> = computed(() =>
    this.pagination()
  );

  errorMessage = signal<string>("");
  isSubmitting = signal(false); // You can now track isSubmitting from anywhere
  readonly pollingStatus = signal<"idle" | "polling" | "completed">("idle");

  protected get apiUrl(): string {
    return `${environment.apiUrl}/${this.endpoint}`;
  }

  addVehicleEnabled = signal(false);
  scrapVehicleButtons = signal(false);
  searchImage = signal("assets/images/vehicle-search.gif");
  private destroyPolling$ = new Subject<void>();
  private isPollingCancelled = false;

  protected createHttpParams(params: QueryParams): HttpParams {
    return Object.entries(params).reduce((httpParams, [key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        return httpParams.set(key, String(value));
      }
      return httpParams;
    }, new HttpParams());
  }

  protected handleRequest<T>(
    request: Observable<ApiResponse<T>>
  ): Observable<T> {
    this.loading.set(true);

    return request.pipe(
      map((response) => handleApiResponse<T>(response)),
      catchError((error) => this.handleError(error)),
      finalize(() => this.loading.set(false))
    );
  }

  // protected handleSuccess(message: string): void {
  //   this.toastr.success(message, 'Success', {
  //     closeButton: true,
  //     progressBar: true,
  //     timeOut: 3000
  //   });
  // }
  protected handleSuccess(message: string): void {
    Swal.fire({
      title: "Success",
      text: message,
      icon: "success",
      confirmButtonText: "OK",
      confirmButtonColor: "#28a745",
      // cancelButtonColor: '#007bff',
    });
  }

  // protected handleSuccessWithUndo(message: string, undoAction: () => void): void {
  //   const toast = this.toastr.success(
  //     `<div><span>${message}</span>`,
  //     'Success',
  //     {
  //       enableHtml: true,
  //       closeButton: true,
  //       progressBar: true,
  //       timeOut: 5000,
  //     }
  //   );
  //
  //   setTimeout(() => {
  //     const undoButton = document.getElementById('toast-container');
  //     if (undoButton) {
  //       const toastMessageElement = undoButton.querySelector('.toast-message');
  //       if (toastMessageElement) {
  //         toastMessageElement.innerHTML = `<span>${message}</span> <button id="undoBtn" style="display: block; color: blue; border-bottom: 1px solid blue;">Undo</button>`;
  //         const undoBtn = document.getElementById('undoBtn');
  //         if(undoBtn){
  //           undoBtn.addEventListener('click', () => {
  //             undoAction();
  //           });
  //         }
  //       }
  //     }
  //   }, 100);
  // }
  protected handleSuccessWithUndo(
    message: string,
    undoAction: () => void
  ): void {
    Swal.fire({
      title: "Success",
      text: message,
      icon: "success",
      showCancelButton: true,
      confirmButtonText: "Undo",
      cancelButtonText: "OK",
      confirmButtonColor: "#007bff",
      cancelButtonColor: "#28a745",
    }).then((result) => {
      if (result.isConfirmed) {
        undoAction();
        Swal.fire({
          title: "Restored",
          text: "Item has been restored successfully.",
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: "#28a745",
        });
      }
    });
  }

  // protected handleError(error: EnhancedError): Observable<never> {
  //   ("error", error)
  //   if (error.status === 0) {
  //     error.details.message = 'Something went wrong. Please try again later.';
  //     this.toastr.error(error.details.message, 'Network Error');
  //     this.errorMessage.set(error.details.message);
  //     // return throwError(() => new Error('Unauthenticated'));
  //     return throwError(() => error?.details?.errors);
  //   }
  //   if (error.status === 401) {
  //     this.toastr.error('Session expired. Please login again.', 'Authentication Error');
  //     this.errorMessage.set(error.details.message);
  //     // return throwError(() => new Error('Unauthenticated'));
  //     return throwError(() => error?.details?.errors);
  //   }
  //
  //   if (error.status === 404) {
  //     this.toastr.error(error.details.message);
  //     this.errorMessage.set(error.details.message);
  //     // return throwError(() => new Error('Unauthenticated'));
  //     return throwError(() => error?.details?.errors);
  //   }
  //
  //   if (error.status === 422 && error?.details && error?.details?.errors) {
  //     this.errorMessage.set(error.details.message);
  //     this.errors.set(error.details.errors);
  //     const firstError = Object.values(error.details.errors)[0]?.[0];
  //     this.toastr.error(firstError || error.details.message, 'Validation failed');
  //     return throwError(() => error.details.errors);
  //   }
  //
  //   // const message = error.details?.message || 'An unexpected error occurred';
  //   // return throwError(() => new Error(message));
  //
  //   // this.toastr.error('An unexpected error occurred', 'Error');
  //   return throwError(() => error.details?.errors);
  // }

  protected handleError(error: EnhancedError): Observable<never> {
    console.log("error ashish, ", error);
    const clonedError = { ...error, details: { ...error.details } };
    const showError = (title: string, message: string, icon: any = "error") => {
      Swal.fire({
        icon: icon,
        title: title,
        text: message,
        confirmButtonText: "OK",
        confirmButtonColor: "#28a745",
      });
    };
    if (error.status === 0) {
      error.details.message = "Something went wrong. Please try again later.";
      showError("Network Error", error.details.message);
      this.errorMessage.set(error.details.message);
      return throwError(() => error?.details?.errors);
    }
    if (error.status === 400 && error.details?.message) {
      showError("Error", error.details.message);
      this.errorMessage.set(error.details.message);
      return throwError(() => error?.details?.errors);
    }
    if (error.status === 401) {
      // showError('Authentication Error', 'Session expired. Please login again.');
      showError("Logged out", "Session expired. Please login again.");
      this.errorMessage.set(error.details.message);
      return throwError(() => error?.details?.errors);
    }
    if (error.status === 404) {
      showError("Not Found", error.details.message);
      this.errorMessage.set(error.details.message);
      return throwError(() => error?.details?.errors);
    }
    if (error.status === 422 && error?.details && error?.details?.errors) {
      this.errorMessage.set(error.details.message);
      this.errors.set(error.details.errors);
      const firstError = Object.values(error.details.errors)[0]?.[0];
      showError("Validation failed", firstError || error.details.message);
      return throwError(() => error.details.errors);
    }
    // showError('Error', error.details?.message || 'An unexpected error occurred');
    return throwError(() => error.details?.errors);
  }

  list(params?: QueryParams): Observable<T[]> {
    this.loading.set(true);
    this.errors.set({});

    const httpParams = params ? this.createHttpParams(params) : undefined;

    const isRenewal = params && params["page_type"] === "renewal";
    const apiUrl = isRenewal
      ? `${this.apiUrl}/get-vehicles-by-ids`
      : this.apiUrl;

    return this.handleRequest(
      this.http.get<ApiResponse<T[]>>(apiUrl, { params: httpParams })
    ).pipe(
      tap((data) => {
        this.items.set(data);
      }),
      finalize(() => this.loading.set(false)),
      catchError((error) => this.handleError(error))
    );
  }

  listPaginated(params?: QueryParams): Observable<PaginatedData<T>> {
    this.loading.set(true);
    this.errors.set({});

    const httpParams = params ? this.createHttpParams(params) : undefined;

    return this.handleRequest(
      this.http.get<PaginatedResponse<T>>(this.apiUrl, { params: httpParams })
    ).pipe(
      tap(({ items, pagination }) => {
        this.items.set(items);
        this.pagination.set(pagination);
      }),
      finalize(() => this.loading.set(false)),
      catchError((error) => this.handleError(error))
    );
  }

  get(id: number): Observable<T> {
    this.loading.set(true);
    this.errors.set({});

    return this.handleRequest(
      this.http.get<ApiResponse<T>>(`${this.apiUrl}/${id}`)
    ).pipe(
      tap((data) => {
        this.selectedItem.set(data);
      }),
      finalize(() => this.loading.set(false)),
      catchError((error) => this.handleError(error))
    );
  }

  getOnceOffFee(id: number): Observable<T> {
    this.loading.set(true);
    this.errors.set({});

    return this.handleRequest(
      this.http.get<ApiResponse<T>>(`${this.apiUrl + "/get-onceoff-fee"}/${id}`)
    ).pipe(
      tap((data) => {
        this.selectedItem.set(data);
      }),
      finalize(() => this.loading.set(false)),
      catchError((error) => this.handleError(error))
    );
  }

  create(data: Omit<T, "id"> | FormData): Observable<T> {
    this.loading.set(true);
    this.errors.set({});

    return this.handleRequest(
      this.http.post<ApiResponse<T>>(this.apiUrl, data)
    ).pipe(
      tap((item) => {
        this.items.update((current) => [...current, item]);
        // this.handleSuccess('Created successfully');
      }),
      finalize(() => this.loading.set(false)),
      catchError((error) => this.handleError(error))
    );
  }

  update(id: number, data: Partial<Omit<T, "id">> | FormData): Observable<T> {
    this.loading.set(true);
    this.errors.set({});

    return this.handleRequest(
      this.http.put<ApiResponse<T>>(`${this.apiUrl}/${id}`, data)
    ).pipe(
      tap((item) => {
        this.items.update((current) =>
          current.map((existing) =>
            existing.id && existing.id === id ? item : existing
          )
        );
        this.handleSuccess("Updated successfully");
      }),
      finalize(() => this.loading.set(false)),
      catchError((error) => this.handleError(error))
    );
  }

  delete(id: number): Observable<void> {
    this.loading.set(true);
    this.errors.set({});

    return this.handleRequest(
      this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
    ).pipe(
      tap(() => {
        this.items.update((current) =>
          current.filter((item) => item.id !== id)
        );
        this.handleSuccess("Deleted successfully");
      }),
      finalize(() => this.loading.set(false)),
      catchError((error) => this.handleError(error))
    );
  }

  getOwnerVehicles(data: any | FormData): Observable<any> {
    this.loading.set(true);
    this.errors.set({});
    this.isSubmitting.set(true);
    this.pollingStatus.set("polling");

    return this.http.post<{ data: any }>(this.apiUrl + "/scrape", data).pipe(
      tap((response) => {
        console.log("trackingId checking....", response);
        const trackingId = (response as any).tracking_id;
        console.log("trackingId", trackingId);

        if (trackingId) {
          this.pollStatus(trackingId); // Call external polling method
        }
      }),
      map((res) => res.data), // ✅ Pass only the useful data to the component
      finalize(() => {
        this.loading.set(false);
        console.log("finalizing ....");
        // Do NOT touch isSubmitting here — handled in pollStatus
      }),
      catchError((error) => this.handleError(error))
    );
  }

  pollStatus(trackingId: string) {
    this.isPollingCancelled = false;

    const check = () => {
      if (this.isPollingCancelled) {
        console.log("Polling has been cancelled");
        return;
      }

      this.http
        .get<any>(`${this.apiUrl}/scrape-status/${trackingId}`)
        .pipe(takeUntil(this.destroyPolling$))
        .subscribe({
          next: (statusRes) => {
            if (this.isPollingCancelled) return;
            if (!statusRes.success) {
              this.isSubmitting.set(false);
              Swal.fire({
                title: "Error",
                text: statusRes.message,
                icon: "error",
                confirmButtonColor: "#28a745",
                allowOutsideClick: false,
                allowEscapeKey: false,
                allowEnterKey: false,
              });

              return;
            }

            const status = statusRes.data.status;
            const error = statusRes.data.error;
            const msg = statusRes.data.message;

            if (status === "completed") {
              this.http
                .get<any>(`${this.apiUrl}/scrape-result/${trackingId}`)
                .pipe(takeUntil(this.destroyPolling$))
                .subscribe({
                  next: (resultRes) => {
                    if (!resultRes.success) {
                      this.isSubmitting.set(false);
                      Swal.fire({
                        title: "Error",
                        text: resultRes.message,
                        icon: "error",
                        confirmButtonColor: "#28a745",
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        allowEnterKey: false,
                      });
                      return;
                    }

                    // const results = resultRes.data.result;

                    // const resultArray = Object.values(results);

                    // const hasError = resultArray.some(
                    //   (item: any) => item.error
                    // );

                    // if (hasError) {
                    //   Swal.fire({
                    //     title: "Error",
                    //     text: "Failed to extract vehicle data",
                    //     icon: "error",
                    //     confirmButtonColor: "#28a745",
                    //     allowOutsideClick: false,
                    //     allowEscapeKey: false,
                    //     allowEnterKey: false,
                    //   });
                    // } else {
                    Swal.fire({
                      title: "Success",
                      html:
                        `${msg}` && `${msg}`.trim() !== ""
                          ? `${msg}`
                          : "Vehicle data extracted successfully",
                      icon: "success",
                      confirmButtonColor: "#28a745",
                      allowOutsideClick: false,
                      allowEscapeKey: false,
                      allowEnterKey: false,
                    }).then(() => {
                      let insertedIds = resultRes.data.inserted_ids ?? [];
                      if (insertedIds.length > 0) {
                        this.router.navigate(["/renewal"], {
                          state: { selectedVehicleIds: insertedIds },
                        });
                      } else {
                        this.router.navigate(["/dashboard"]);
                      }
                    });
                    // }
                  },
                  error: (err) => {
                    this.isSubmitting.set(false);
                    Swal.fire({
                      title: "Error",
                      text: "Failed to fetch result",
                      icon: "error",
                      confirmButtonColor: "#28a745",
                      allowOutsideClick: false,
                      allowEscapeKey: false,
                      allowEnterKey: false,
                    });
                    console.error("getScrapeResult error:", err);
                  },
                });
            } else if (status === "failed") {
              const err = error?.trim();
              Swal.fire({
                title: "Info",
                html: `${err}` || "Vehicle Data Not Found",
                icon: "info",
                confirmButtonColor: "#28a745",
                allowOutsideClick: false,
                allowEscapeKey: false,
                allowEnterKey: false,
              }).then((result) => {
                if (result.isConfirmed) {
                  this.addVehicleEnabled.set(true);
                  this.scrapVehicleButtons.set(true);
                  this.searchImage.set("assets/images/opps_not_found.svg");
                }
              });
            } else {
              setTimeout(check, 3000); // Keep polling
            }
          },
          error: (err) => {
            this.isSubmitting.set(false);
            Swal.fire({
              title: "Error",
              text: "Failed to check status",
              icon: "error",
              confirmButtonColor: "#28a745",
              allowOutsideClick: false,
              allowEscapeKey: false,
              allowEnterKey: false,
            });
            if (this.isPollingCancelled) return;
            console.error("checkStatus error:", err);
          },
        });
    };

    check();
  }

  decodeHtml(html: any) {
    var txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  }

  cancelPolling() {
    this.isPollingCancelled = true;
    this.destroyPolling$.next();
    this.destroyPolling$.complete();
    console.log("Polling cancelled");
  }

  createRenewalOrder(data: Omit<T, "id"> | any): Observable<T> {
    this.loading.set(true);
    this.errors.set({});

    return this.handleRequest(
      this.http.post<ApiResponse<T>>(
        this.apiUrl + `/renewal-order-create`,
        data
      )
    ).pipe(
      tap((item) => {
        this.items.update((current) => [...current, item]);
      }),
      finalize(() => this.loading.set(false)),
      catchError((error) => this.handleError(error))
    );
  }

  updateRenewalOrder(data: Omit<T, "id"> | any): Observable<T> {
    this.loading.set(true);
    this.errors.set({});

    return this.handleRequest(
      this.http.post<ApiResponse<T>>(
        this.apiUrl + `/renewal-order-update/${data.order_id}`,
        data
      )
    ).pipe(
      tap((item) => {
        this.items.update((current) => [...current, item]);
      }),
      finalize(() => this.loading.set(false)),
      catchError((error) => this.handleError(error))
    );
  }

  deleteWithUndo(id: number, reloadCallback?: () => void): Observable<void> {
    this.loading.set(true);
    this.errors.set({});

    return this.handleRequest(
      this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
    ).pipe(
      tap(() => {
        const deletedItem = this.items().find((item) => item.id === id);
        this.items.update((current) =>
          current.filter((item) => item.id !== id)
        );

        const undoAction = () => {
          if (deletedItem) {
            this.toastr.clear();
            this.restoreItem(deletedItem.id).subscribe({
              next: () => {
                this.items.update((current) => [...current, deletedItem]);
                this.toastr.success(
                  "Item restored successfully",
                  "Undo Successful",
                  {
                    closeButton: true,
                    progressBar: true,
                    timeOut: 3000,
                  }
                );
                // ✅ Call `reloadCallback()` to refresh the list
                if (reloadCallback) {
                  reloadCallback();
                }
              },
              error: (err) => {
                console.error("Failed to restore item:", err);
                this.toastr.error(
                  "Failed to restore the item. Please try again.",
                  "Undo Failed",
                  {
                    closeButton: true,
                    progressBar: true,
                    timeOut: 3000,
                  }
                );
              },
            });
          }
        };

        this.handleSuccessWithUndo("Deleted successfully", undoAction);
      }),
      finalize(() => this.loading.set(false)),
      catchError((error) => this.handleError(error))
    );
  }

  private restoreItem(id: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(
      `${this.apiUrl}/restore/${id}`,
      {}
    );
  }

  bulkDelete(ids: number[]): Observable<void> {
    this.loading.set(true);
    this.errors.set({});

    return this.handleRequest(
      this.http.post<ApiResponse<void>>(`${this.apiUrl}/bulk-delete`, { ids })
    ).pipe(
      tap(() => {
        this.items.update((current) =>
          current.filter((item) => !ids.includes(item.id))
        );
        this.handleSuccess("Items deleted successfully");
      }),
      finalize(() => this.loading.set(false)),
      catchError((error) => this.handleError(error))
    );
  }

  clearErrors(): void {
    this.errors.set({});
    this.errorMessage.set("");
  }

  getSingleBySearch(params?: QueryParams): Observable<T[]> {
    this.loading.set(true);
    this.errors.set({});

    const httpParams = params ? this.createHttpParams(params) : undefined;

    return this.handleRequest(
      this.http.get<ApiResponse<T[]>>(this.apiUrl + "/get-single-search", {
        params: httpParams,
      })
    ).pipe(
      tap((data) => {
        this.items.set(data);
      }),
      finalize(() => this.loading.set(false)),
      catchError((error) => this.handleError(error))
    );
  }

  //vehicle owner verification
  sendOtp(email: any): Observable<void> {
    this.loading.set(true);
    this.errors.set({});

    return this.http
      .post<ApiResponse<void>>(`${this.apiUrl}/send-otp`, email)
      .pipe(
        tap(() => this.handleSuccess("OTP sent successfully to Owner EmailID")),
        map(() => void 0),
        catchError((error) => this.handleError(error)),
        finalize(() => this.loading.set(false))
      );
  }

  verifyOTPOwner(credentials: VerifyOtp): Observable<void> {
    this.loading.set(true);
    this.errors.set({});

    return this.http
      .post<ApiResponse<void>>(`${this.apiUrl}/verify-otp`, credentials)
      .pipe(
        tap(() => this.handleSuccess("OTP verified successfully")),
        map(() => void 0),
        catchError((error) => this.handleError(error)),
        finalize(() => this.loading.set(false))
      );
  }

  getCount(): Observable<T> {
    this.loading.set(true);
    this.errors.set({});

    return this.handleRequest(
      this.http.get<ApiResponse<T>>(`${this.apiUrl}/get-total-count`)
    ).pipe(
      tap((data) => { }),
      finalize(() => this.loading.set(false)),
      catchError((error) => this.handleError(error))
    );
  }

  partiallyUpdate(id: number, data: Partial<Omit<T, "id">>): Observable<T> {
    this.loading.set(true);
    this.errors.set({});

    return this.handleRequest(
      this.http.put<ApiResponse<T>>(`${this.apiUrl}/${id}`, data)
    ).pipe(
      tap((item) => {
        this.items.update((current) =>
          current.map((existing) =>
            existing.id && existing.id === id ? item : existing
          )
        );
      }),
      finalize(() => this.loading.set(false)),
      catchError((error) => this.handleError(error))
    );
  }

  partiallyCreate(data: Omit<T, "id">): Observable<T> {
    this.loading.set(true);
    this.errors.set({});

    return this.handleRequest(
      this.http.post<ApiResponse<T>>(this.apiUrl, data)
    ).pipe(
      tap((item) => {
        this.items.update((current) => [...current, item]);
      }),
      finalize(() => this.loading.set(false)),
      catchError((error) => this.handleError(error))
    );
  }

  getTextFromImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append("image", file);

    return this.handleRequest(
      this.http.post<ApiResponse<T>>(`${this.apiUrl}/extract-text`, formData)
    ).pipe(
      tap(),
      finalize(() => this.loading.set(false)),
      catchError((error) => this.handleError(error))
    );
  }

  getSingleBySearchWoError(params?: QueryParams): Observable<T[]> {
    this.loading.set(true);
    this.errors.set({});

    const httpParams = params ? this.createHttpParams(params) : undefined;

    return this.http
      .get<ApiResponse<T[]>>(this.apiUrl + "/get-single-search", {
        params: httpParams,
      })
      .pipe(
        map((response) => response.data || []), // ✅ Extract data or return an empty array
        catchError(() => of([])), // ✅ Return empty array if API fails
        tap((data) => this.items.set(data)),
        finalize(() => this.loading.set(false))
      );
  }
}

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
import Swal from "sweetalert2";

@Injectable({
  providedIn: "root",
})
export abstract class BaseApiService<T extends { id: number }> {
  protected abstract endpoint: string;

  protected readonly http = inject(HttpClient);
  protected readonly toastr = inject(ToastrService);
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

  protected handleSuccess(message: string): void {
    Swal.fire({
      title: "Success",
      text: message,
      icon: "success",
      confirmButtonText: "OK",
      confirmButtonColor: "#28a745",
    });
  }

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

  decodeHtml(html: any) {
    var txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  }
}

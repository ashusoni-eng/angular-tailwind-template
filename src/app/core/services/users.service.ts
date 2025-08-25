import { Injectable } from '@angular/core';
import {Observable } from 'rxjs';
import { ApiResponse } from '../interfaces/api-response';
import { User } from '../interfaces/user';
import {UserProfile} from '../interfaces/user-profile';
import {BaseApiService} from './base-api.service';

@Injectable({
  providedIn: 'root'
})
export class UsersService extends BaseApiService<User>{

  protected readonly endpoint = `users`;

  getUserProfile(): Observable<UserProfile> {
    return this.handleRequest<UserProfile>(
      this.http.get<ApiResponse<UserProfile>>(`${this.apiUrl}/profile`)
    );
  }

  updateUserProfile(profile: UserProfile): Observable<UserProfile> {
    return this.handleRequest<UserProfile>(
      this.http.post<ApiResponse<UserProfile>>(`${this.apiUrl}/profile`, profile)
    );
  }
  uploadProfileImage(file: File): Observable<UserProfile> {
    const formData = new FormData();
    formData.append('avatar', file);

    return this.handleRequest<UserProfile>(
      this.http.post<ApiResponse<UserProfile>>(`${this.apiUrl}/profile-image`, formData)
    );
  }
}

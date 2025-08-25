import {PaginationInfo} from './pagination-info';

export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationInfo;
}

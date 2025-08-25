import {BaseResponse} from './base-response';
import {PaginatedData} from './paginated-data';

export interface PaginatedResponse<T> extends BaseResponse {
  data?: PaginatedData<T>;
}

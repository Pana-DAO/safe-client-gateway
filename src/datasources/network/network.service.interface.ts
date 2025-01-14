import { NetworkRequest } from '@/datasources/network/entities/network.request.entity';
import { NetworkResponse } from '@/datasources/network/entities/network.response.entity';

export const NetworkService = Symbol('INetworkService');

export interface INetworkService {
  get<T = any, R = NetworkResponse<T>>(
    url: string,
    networkRequest?: NetworkRequest,
  ): Promise<R>;

  post<T = any, R = NetworkResponse<T>>(
    url: string,
    data: object,
    networkRequest?: NetworkRequest,
  ): Promise<R>;

  delete<T = any, R = NetworkResponse<T>>(
    url: string,
    data?: object,
  ): Promise<R>;
}

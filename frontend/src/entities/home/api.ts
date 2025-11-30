import { http } from '../../utils/http';
import { HomeResponse } from './types';

export const homeApi = {
  getHomeData: (): Promise<HomeResponse> => {
    return http.get('/home');
  },
};
import { http } from '../../utils/http';
import { UserDetails, CreateUserDetailsParams, UpdateUserDetailsParams, UserDetailsResponse } from './types';

export const userDetailsApi = {
  getUserInfo: (): Promise<UserDetails> => {
    return http.get('/userDetails/info');
  },

  createUserInfo: (params: CreateUserDetailsParams): Promise<UserDetailsResponse> => {
    return http.post('/userDetails', { json: params });
  },

  updateUserInfo: (params: UpdateUserDetailsParams): Promise<UserDetailsResponse> => {
    return http.put('/userDetails', { json: params });
  },

  deleteAccount: (): Promise<{ message: string }> => {
    return http.delete('/userDetails/delete');
  },
};
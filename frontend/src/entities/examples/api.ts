import { http } from '../../utils/http';
import { CreateExampleParams, CreateExampleResponse, GetExamplesResponse } from './types';

export const exampleApi = {
  createExample: (params: CreateExampleParams): Promise<CreateExampleResponse> => {
    const formData = new FormData();
    formData.append('image', params.image);
    
    return fetch('/api/example', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    }).then(res => {
      if (!res.ok) {
        throw new Error('Failed to create example');
      }
      return res.json();
    });
  },

  getExamplesByUserId: (userId: number): Promise<GetExamplesResponse> => {
    return http.get(`/example/${userId}`);
  },
};
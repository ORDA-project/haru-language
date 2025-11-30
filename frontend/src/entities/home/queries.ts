import { useGetQuery } from '../../hooks/useQuery';
import { HomeResponse } from './types';

export const useGetHomeData = () => {
  return useGetQuery<HomeResponse>(
    '/home',
    {
      queryKey: ['home'],
    }
  );
};
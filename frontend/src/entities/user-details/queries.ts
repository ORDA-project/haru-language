import {
  useGetQuery,
  usePostMutation,
  usePutMutation,
} from "../../hooks/useQuery";
import {
  UserDetails,
  CreateUserDetailsParams,
  UpdateUserDetailsParams,
  UserDetailsResponse,
} from "./types";

export const useGetUserInfo = () => {
  return useGetQuery<UserDetails>("/userDetails/info", {
    queryKey: ["userDetails", "info"],
    refetchOnMount: true, // 컴포넌트 마운트 시 항상 최신 데이터 가져오기
    staleTime: 0, // 캐시 사용 안함 (항상 최신 데이터)
  });
};

export const useCreateUserInfo = () => {
  return usePostMutation<UserDetailsResponse, CreateUserDetailsParams>(
    "/userDetails",
    {
      showSuccessMessage: "User Info Created Successfully",
      invalidateQueries: [["userDetails"]],
    }
  );
};

export const useUpdateUserInfo = () => {
  return usePutMutation<UserDetailsResponse, UpdateUserDetailsParams>(
    "/userDetails",
    {
      showSuccessMessage: "User Info Updated Successfully",
      invalidateQueries: [["userDetails"]],
    }
  );
};

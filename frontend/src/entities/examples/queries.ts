import { useGetQuery, usePostMutation, useQuery } from "../../hooks/useQuery";
import { http, isHttpError } from "../../utils/http";
import { CreateExampleParams, GetExamplesResponse } from "./types";

export const useGetExamplesByUserId = (userId: number) => {
  return useGetQuery<GetExamplesResponse>(`/example/${userId}`, {
    queryKey: ["examples", userId],
    enabled: !!userId,
  });
};

export const useGetExampleHistory = () => {
  return useQuery<GetExamplesResponse>(
    async () => {
      try {
        return await http.get<GetExamplesResponse>("/example/history");
      } catch (error) {
        if (isHttpError(error) && error.status === 404) {
          return await http.get<GetExamplesResponse>("/example");
        }
        throw error;
      }
    },
    {
      queryKey: ["examples", "current"],
      retry: false,
      refetchOnWindowFocus: false,
      showErrorToast: false,
    }
  );
};

export const useCreateExample = () => {
  return usePostMutation<any, CreateExampleParams>("/example", {
    showSuccessMessage: "Example Created Successfully",
    invalidateQueries: [["examples"], ["examples", "current"]],
  });
};

import { useGetQuery, usePostMutation, useQuery } from "../../hooks/useQuery";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
    invalidateQueries: [["examples"], ["examples", "current"], ["friends"]],
  });
};

// 예문 기록 삭제
export const useDeleteExample = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (exampleId: number) => {
      return await http.delete<{ message: string }>(`/example/${exampleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["examples"] });
      queryClient.invalidateQueries({ queryKey: ["examples", "current"] });
    },
  });
};

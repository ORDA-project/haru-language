import { useGetQuery, usePostMutation } from "../../hooks/useQuery";
import { exampleApi } from "./api";
import { CreateExampleParams, GetExamplesResponse } from "./types";

export const useGetExamplesByUserId = (userId: number) => {
  return useGetQuery<GetExamplesResponse>(`/example/${userId}`, {
    queryKey: ["examples", userId],
    enabled: !!userId,
  });
};

export const useCreateExample = () => {
  return usePostMutation<any, CreateExampleParams>("/example", {
    showSuccessMessage: "Example Created Successfully",
    invalidateQueries: [["examples"]],
  });
};

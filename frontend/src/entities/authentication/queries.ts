import { useGetQuery, useMutation } from "../../hooks/useQuery";
import { AuthCheckResponse } from "./types";

export const useCheckAuth = () => {
  return useGetQuery<AuthCheckResponse>("/auth/check", {
    queryKey: ["auth", "check"],
    refetchOnWindowFocus: true,
  });
};

export const useLogout = () => {
  return useMutation<string, void>(
    () =>
      fetch("/api/auth/logout", {
        method: "GET",
        credentials: "include",
      }).then((res) => {
        if (!res.ok) {
          throw new Error("Logout failed");
        }
        return res.text();
      }),
    {
      onSuccess: () => {
        window.location.href = "/";
      },
      showSuccessMessage: "Logout Successfully",
      invalidateQueries: [["auth"]],
    }
  );
};

export const useGoogleLogin = () => {
  return useMutation<{ redirectUrl: string }, string>(
    (code) =>
      fetch(`/api/auth/google/callback?code=${code}`, {
        method: "GET",
        credentials: "include",
      }).then((res) => {
        if (!res.ok) {
          throw new Error("Google login failed");
        }
        return res.json();
      }),
    {
      onSuccess: (data) => {
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        }
      },
      showSuccessMessage: "Google Login Successfully",
      invalidateQueries: [["auth"]],
    }
  );
};

export const useKakaoLogin = () => {
  return useMutation<{ redirectUrl: string }, string>(
    (code) =>
      fetch(`/api/auth/kakao/callback?code=${code}`, {
        method: "GET",
        credentials: "include",
      }).then((res) => {
        if (!res.ok) {
          throw new Error("Kakao login failed");
        }
        return res.json();
      }),
    {
      onSuccess: (data) => {
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        }
      },
      showSuccessMessage: "Kakao Login Successfully",
      invalidateQueries: [["auth"]],
    }
  );
};

import React, { createContext, useContext, useState, useEffect } from "react";
import type { UserResponse } from "../types/user.ts";
import userService from "../service/userService.ts";
// import { tokenService } from "../service/tokenService.ts";
// import websocketService from "../service/websocketService";

interface AuthContextType {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: UserResponse) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // useEffect(() => {
  //   if (user && user.userId) {
  //     const token = tokenService.getAccessToken();
  //     const wsUrl = import.meta.env.VITE_WS_URL;
  //     console.log("Đường dẫn WS thực tế đang gọi là:", wsUrl);
  //
  //     if (!websocketService.isConnected()) {
  //       websocketService.connect(wsUrl, token);
  //     }
  //   } else {
  //     if (websocketService.isConnected()) {
  //       websocketService.disconnect();
  //     }
  //   }
  // }, [user]);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const response: any = await userService.getMyInfo();

      const actualData = response?.data ?? response;

      if (actualData?.result) {
        setUser(actualData.result);
      } else {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setUser(null);
      }
    } catch (error) {
      console.error("Fetch user thất bại:", error);

      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = (userData: UserResponse) => {
    setUser(userData);
    setIsLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    // Ngắt đường truyền ngay lập tức bằng hàm thủ công cho an toàn
    // websocketService.disconnect();
    setIsLoading(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshProfile: fetchCurrentUser,
      }}
    >
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

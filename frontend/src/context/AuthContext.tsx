import React, { createContext, useContext, useState, useEffect } from "react";
import { userService, type UserResponse } from "../services/usersService";
import websocketService from "../services/websocketService";
import { tokenService } from "../services/auth/tokenService";

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

    useEffect(() => {
        if (user && user.userId) {
            const token = tokenService.getAccessToken();
            const wsUrl =
                import.meta.env.VITE_WS_URL ||
                "http://localhost:8080/api/v1/rent-room/ws";

            if (!websocketService.isConnected()) {
                websocketService.connect(wsUrl, token);
            }
        }

        return () => {
            if (!user && websocketService.isConnected()) {
                websocketService.disconnect();
            }
        };
    }, [user]);

    const fetchCurrentUser = async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            setUser(null);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const response: any = await userService.getMe();
            const actualData = response.data ? response.data : response;
            if (actualData?.result) {
                setUser(actualData.result);
            }
        } catch (error) {
            console.error("Fetch user thất bại...");
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
        // 3. Khi setUser(null), useEffect phía trên sẽ tự động gọi disconnect()
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

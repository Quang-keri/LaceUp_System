// Token Service - JWT token management

export const tokenService = {
    getAccessToken: (): string | null => {
        try {
            return localStorage.getItem('accessToken');
        } catch {
            return null;
        }
    },

    setAccessToken: (token: string): void => {
        try {
            localStorage.setItem('accessToken', token);
        } catch (error) {
            console.error('Error setting access token:', error);
        }
    },

    removeAccessToken: (): void => {
        try {
            localStorage.removeItem('accessToken');
        } catch (error) {
            console.error('Error removing access token:', error);
        }
    },

    isTokenExpired: (): boolean => {
        const token = tokenService.getAccessToken();
        if (!token) return true;

        try {
            // Decode JWT token (simple decode, not verification)
            const payload = JSON.parse(atob(token.split('.')[1]));
            const exp = payload.exp;
            if (!exp) return true;

            // Check if token is expired
            return Date.now() >= exp * 1000;
        } catch {
            return true;
        }
    }
};

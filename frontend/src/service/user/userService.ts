export interface UserResponse {
  userId: string;
  userName: string;
  email: string;
  gender: string;
  phone: string;
  dateOfBirth: string;
  age: number;
  role: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

// 2. Định nghĩa Wrapper (ApiResponse)
export interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

export const userService = {
  getMe: () => {
    return api.get<any, ApiResponse<UserResponse>>("/users/my-info");
  },
};

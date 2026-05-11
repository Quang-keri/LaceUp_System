import api from "../config/axios";
export interface ReviewData {
  reviewId?: string;
  rating: number;
  comment: string;
  createdAt?: string;
  userName?: string; 
}

const reviewService = {

  getReviewsByRentalArea: (rentalId: string, page = 0, size = 10) => {
    return api.get(
      `/reviews/rental/${rentalId}?page=${page}&size=${size}`,
    );
  },

  getMyReview: (rentalId: string) => {
    return api.get(`/reviews/me/rental/${rentalId}`);
  },

  checkEligibility: (rentalId: string) => {
    return api.get(`/reviews/check-eligibility/${rentalId}`);
  },
  
  submitReview: (
    rentalId: string,
    data: { rating: number; comment: string },
  ) => {
    return api.post(`/reviews/rental/${rentalId}`, data);
  },
};

export default reviewService;

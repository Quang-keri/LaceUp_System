package org.sport.backend.constant;

public class RankHelper {

    // Trả về tên Rank đầy đủ (Ví dụ: "Đồng 3", "Kim Cương 1", "Thách Đấu")
    public static String getDisplayRank(int points, Integer leaderboardPosition) {
        if (points >= 3000) {
            // Xử lý Rank Cao Thủ trở lên dựa vào Leaderboard Position
            if (leaderboardPosition != null) {
                if (leaderboardPosition <= 20) return "Thách Đấu";
                if (leaderboardPosition <= 50) return "Đại Cao Thủ";
                if (leaderboardPosition <= 100) return "Cao Thủ";
            }
            // Nếu trên 3000 điểm nhưng không lọt Top 100, bị kẹt lại ở Kim Cương 1
            return "Kim Cương 1";
        }

        // Xử lý Rank thường (Dưới 3000 điểm)
        String[] tiers = {"Sắt", "Đồng", "Bạc", "Vàng", "Bạch Kim", "Kim Cương"};
        int tierIndex = points / 500; // Mỗi Tier cách nhau 500 điểm

        // Tính Division (từ 5 đến 1).
        // Ví dụ: 500-599 là Đồng 5, 900-999 là Đồng 1
        int divisionPoints = points % 500;
        int division = 5 - (divisionPoints / 100);

        return tiers[tierIndex] + " " + division;
    }
}
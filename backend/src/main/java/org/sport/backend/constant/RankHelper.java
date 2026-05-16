package org.sport.backend.constant;

public class RankHelper {

    public static String getDisplayRank(int points, Integer leaderboardPosition) {
        if (points >= 3000) {
            if (leaderboardPosition != null) {
                if (leaderboardPosition <= 20) return "Thách Đấu";
                if (leaderboardPosition <= 50) return "Đại Cao Thủ";
                if (leaderboardPosition <= 100) return "Cao Thủ";
            }
            return "Kim Cương 1";
        }

        String[] tiers = {"Sắt", "Đồng", "Bạc", "Vàng", "Bạch Kim", "Kim Cương"};
        int tierIndex = points / 500; // Mỗi Tier cách nhau 500 điểm

        int divisionPoints = points % 500;
        int division = 5 - (divisionPoints / 100);

        return tiers[tierIndex] + " " + division;
    }
}
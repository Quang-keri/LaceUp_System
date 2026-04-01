package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.sport.backend.dto.base.BaseEntity;
import org.sport.backend.constant.RankHelper;

import java.util.UUID;

@Entity
@Table(
        name = "user_category_ranks",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"user_id", "category_id"}) // Đảm bảo 1 user chỉ có 1 rank cho mỗi môn
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class UserCategoryRank extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Builder.Default
    @Column(name = "rank_point", nullable = false)
    private Integer rankPoint = 0;

    // Các thông số thống kê CỦA RIÊNG MÔN NÀY (Tùy chọn)
    // Nếu môn nào cũng tính win/loss riêng thì nên dời từ UserStats sang đây
    @Builder.Default
    private int currentWinStreak = 0;

    @Builder.Default
    private int totalWins = 0;

    @Builder.Default
    private int totalMatches = 0;

    @Transient
    private String displayRank;

    public String resolveDisplayRank(Integer leaderboardPosition) {
        return RankHelper.getDisplayRank(this.rankPoint != null ? this.rankPoint : 0, leaderboardPosition);
    }
}
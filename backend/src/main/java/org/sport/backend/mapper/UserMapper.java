package org.sport.backend.mapper;

import org.mapstruct.*;
import org.sport.backend.dto.response.user.CategoryRankResponse;
import org.sport.backend.dto.response.user.UserResponse;
import org.sport.backend.entity.Role;
import org.sport.backend.entity.User;

import java.time.LocalDate;
import java.time.Period;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring", uses = {PermissionMapper.class})
public interface UserMapper {
    @Mapping(target = "userId", source = "userId")
    @Mapping(source = "role", target = "role", qualifiedByName = "mapRoleName")
    @Mapping(source = "dateOfBirth", target = "age", qualifiedByName = "calculateAge")
    @Mapping(target = "permissions", expression = "java(mergePermissions(user))")
    @Mapping(target = "categoryRank", expression = "java(mapAllRanks(user))")
    UserResponse toUserResponse(User user);

    default Set<String> mergePermissions(User user) {
        Set<String> allPerms = new HashSet<>();

        if (user.getRole() != null && user.getRole().getPermissions() != null) {
            user.getRole().getPermissions().forEach(p -> allPerms.add(p.getPermissionName()));
        }

        if (user.getExtraPermissions() != null) {
            user.getExtraPermissions().forEach(p -> allPerms.add(p.getPermissionName()));
        }

        return allPerms;
    }

    default List<CategoryRankResponse> mapAllRanks(User user) {
        if (user.getCategoryRanks() == null || user.getCategoryRanks().isEmpty()) {
            return Collections.emptyList();
        }

        return user.getCategoryRanks().stream()
                .map(topRank -> CategoryRankResponse.builder()
                        .categoryName(topRank.getCategory().getCategoryName())
                        .rankPoint(topRank.getRankPoint())
                        .build())
                .collect(Collectors.toList());
    }

    List<UserResponse> toUserResponseList(List<User> users);

    @Named("mapRoleName")
    default String mapRoleName(Role role) {
        return role != null ? role.getRoleName() : null;
    }

    @Named("calculateAge")
    default int calculateAge(LocalDate dateOfBirth) {
        if (dateOfBirth == null) {
            return 0;
        }
        return Period.between(dateOfBirth, LocalDate.now()).getYears();
    }
}

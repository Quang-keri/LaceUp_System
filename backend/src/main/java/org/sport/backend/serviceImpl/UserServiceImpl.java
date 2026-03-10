package org.sport.backend.serviceImpl;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sport.backend.dto.request.user.CreateUserRequest;
import org.sport.backend.dto.request.user.UpdateUserRequest;
import org.sport.backend.dto.response.user.UserResponse;
import org.sport.backend.entity.Permission;
import org.sport.backend.entity.Role;
import org.sport.backend.entity.User;
import org.sport.backend.exception.AppException;
import org.sport.backend.exception.ErrorCode;
import org.sport.backend.mapper.UserMapper;
import org.sport.backend.repository.PermissionRepository;
import org.sport.backend.repository.RoleRepository;
import org.sport.backend.repository.UserRepository;
import org.sport.backend.service.UserService;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordEncoder passwordEncoder;

    private final UserMapper userMapper;

    // --- CRUD OPERATIONS ---

    @Transactional
    @Override
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        Role role = roleRepository.findByRoleName(request.getRoleName())
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        User user = User.builder()
                .userName(request.getUserName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .passwordHash(request.getPassword())
                .gender(request.getGender())
                .phone(request.getPhone())
                .dateOfBirth(request.getDateOfBirth())
                .role(role)
                .active(true)
                .build();

        return userMapper.toUserResponse(userRepository.save(user));
    }

    @Override
    public UserResponse getMyInfo() {

        String email = SecurityContextHolder.getContext().getAuthentication().getName();

        return userMapper.toUserResponse(
                userRepository.findByEmail(email).orElseThrow(
                        () -> new AppException(ErrorCode.USER_NOT_FOUND))
        );
    }

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(userMapper::toUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    public UserResponse getUserById(UUID userId) {
        User user = getUserEntity(userId);
        return userMapper.toUserResponse(user);
    }

    @Transactional
    @Override
    public UserResponse updateUser(UUID userId, UpdateUserRequest request) {
        User user = getUserEntity(userId);

        if (request.getUserName() != null) user.setUserName(request.getUserName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getGender() != null) user.setGender(request.getGender());
        if (request.getDateOfBirth() != null) user.setDateOfBirth(request.getDateOfBirth());

        return userMapper.toUserResponse(userRepository.save(user));
    }

    @Transactional
    @Override
    public void deleteUser(UUID userId) {
        User user = getUserEntity(userId);
        user.setActive(false);
        userRepository.save(user);
    }

    // --- RBAC & PERMISSION LOGIC ---

    @Override
    public Set<String> getUserAuthorities(UUID userId) {
        User user = getUserEntity(userId);
        Set<String> authorities = new HashSet<>();

        if (user.getRole() != null) {
            user.getRole().getPermissions().forEach(p -> authorities.add(p.getPermissionName()));
        }
        if (user.getExtraPermissions() != null) {
            user.getExtraPermissions().forEach(p -> authorities.add(p.getPermissionName()));
        }

        return authorities;
    }

    @Transactional
    @Override
    public UserResponse assignRole(UUID userId, Long roleId) {
        User user = getUserEntity(userId);
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role không tồn tại"));

        user.setRole(role);
        return userMapper.toUserResponse(userRepository.save(user));
    }

    @Transactional
    @Override
    public UserResponse addExtraPermissions(UUID userId, Set<Integer> permissionIds) {
        User user = getUserEntity(userId);
        List<Permission> permissions = permissionRepository.findAllById(permissionIds);

        // Khắc phục lỗi NullPointerException
        if (user.getExtraPermissions() == null) {
            user.setExtraPermissions(new ArrayList<>());
        }

        user.getExtraPermissions().addAll(permissions);
        return userMapper.toUserResponse(userRepository.save(user));
    }

    @Transactional
    @Override
    public UserResponse removeExtraPermissions(UUID userId, Set<Integer> permissionIds) {
        User user = getUserEntity(userId);

        if (user.getExtraPermissions() != null && !user.getExtraPermissions().isEmpty()) {
            user.getExtraPermissions().removeIf(p -> permissionIds.contains(p.getPermissionId()));
        }

        return userMapper.toUserResponse(userRepository.save(user));
    }

    private User getUserEntity(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

}
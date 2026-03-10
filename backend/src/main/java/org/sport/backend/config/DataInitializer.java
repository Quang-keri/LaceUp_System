package org.sport.backend.config;

import lombok.RequiredArgsConstructor;
import org.sport.backend.entity.Role;
import org.sport.backend.entity.User;
import org.sport.backend.repository.RoleRepository;
import org.sport.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {

        if (roleRepository.count() == 0) {
            List<Role> roles = List.of(
                    Role.builder().roleName("ADMIN").description("Quản trị hệ thống").active(true).build(),
                    Role.builder().roleName("OWNER").description("Chủ trọ").active(true).build(),
                    Role.builder().roleName("RENTER").description("Người thuê phòng").active(true).build()
            );
            roleRepository.saveAll(roles);
        }

        Role adminRole = roleRepository.findByRoleName("ADMIN").orElse(null);
        Role ownerRole = roleRepository.findByRoleName("OWNER").orElse(null);
        Role renterRole = roleRepository.findByRoleName("RENTER").orElse(null);

        if (userRepository.count() == 0) {
            List<User> users = new ArrayList<>();
            String commonPass = "123456";

            users.add(User.builder()
                    .userName("System Admin")
                    .email("admin@gmail.com")
                    .passwordHash(passwordEncoder.encode(commonPass))
                    .role(adminRole)
                    .active(true)
                    .build());

            users.add(User.builder()
                    .userName("Best Owner")
                    .email("owner@gmail.com")
                    .passwordHash(passwordEncoder.encode(commonPass))
                    .role(ownerRole)
                    .active(true)
                    .build());

            users.add(User.builder()
                    .userName("Happy Renter")
                    .email("renter@gmail.com")
                    .passwordHash(passwordEncoder.encode(commonPass))
                    .role(renterRole)
                    .active(true)
                    .build());

            for (int i = 1; i <= 7; i++) {
                users.add(User.builder()
                        .userName("User Test " + i)
                        .email("user" + i + "@gmail.com")
                        .passwordHash(passwordEncoder.encode(commonPass))
                        .role(renterRole)
                        .active(true)
                        .dateOfBirth(LocalDate.of(2000, 1, i))
                        .build());
            }

            userRepository.saveAll(users);
        }
    }
}
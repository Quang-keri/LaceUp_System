package org.sport.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.Set;

@Entity
@Table(name = "permissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Permission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer permissionId;

    @Column(nullable = false, unique = true)
    private String permissionName;

    private String description;

    @ManyToMany(mappedBy = "permissions")
    private Set<Role> roles;

    @ManyToMany(mappedBy = "extraPermissions")
    private Set<User> users;
}

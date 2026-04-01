package org.sport.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.*;
import lombok.*;
@Entity
@Table(name = "item_groups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long itemGroupId;
    private String name;
}
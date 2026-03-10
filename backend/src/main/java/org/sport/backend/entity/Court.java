package org.sport.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "courts")
@Builder
@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class Court {
    @Id
    private UUID courtId;
    @Column(name = "name")
    private String name;
    @Column(name = "location")
    private String location;
    @Column(name = "surface_type")
    private String surfaceType;
    @Column(name = "indoor")
    private boolean indoor;
}

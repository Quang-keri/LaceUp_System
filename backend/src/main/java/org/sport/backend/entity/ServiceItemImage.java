package org.sport.backend.entity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "service_item_images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceItemImage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private Long id;

    private String imageUrl;

    @ManyToOne
    @JoinColumn(name = "service_item_id")
    private ServiceItem serviceItem;
}

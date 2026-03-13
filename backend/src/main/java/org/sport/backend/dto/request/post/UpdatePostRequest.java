package org.sport.backend.dto.request.post;

import lombok.*;
import org.sport.backend.constant.PostStatus;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePostRequest {

    private String title;

    private String description;

    private PostStatus postStatus;

}

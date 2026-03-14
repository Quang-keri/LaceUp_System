package org.sport.backend.dto.internal;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CloudinaryUploadResult {
    String url;
    String publicId;
    String format;
    Long bytes;
}
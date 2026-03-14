import type {UploadOptions, UploadResult, MediaMetadata} from "../types/upload.ts";

export const uploadToCloudinary = async (
    file: File,
    options: UploadOptions = {}
): Promise<UploadResult> => {
    // TODO: Implement Cloudinary upload
    return {
        success: true,
        data: {
            resourceType: file.type.startsWith('video/') ? 'video' : 'image',
            url: URL.createObjectURL(file),
            format: file.type.split('/')[1],
            size: file.size
        }
    };
};

export const uploadMultipleFiles = async (
    files: File[],
    options: UploadOptions = {}
): Promise<UploadResult[]> => {
    // TODO: Implement multiple file upload
    return Promise.all(files.map(file => uploadToCloudinary(file, options)));
};

export const createMediaMessageContent = (
    resourceType: string,
    url: string,
    text: string = '',
    metadata: MediaMetadata = {}
): string => {
    // Create JSON string for media message
    return JSON.stringify({
        type: resourceType,
        url: url,
        text: text,
        metadata: metadata
    });
};

export const parseMessageContent = (content: string): any => {
    try {
        return JSON.parse(content);
    } catch {
        return {type: 'text', text: content};
    }
};

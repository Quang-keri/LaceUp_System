export interface UploadOptions {
    folder?: string;
    [key: string]: any;
}

export interface UploadResult {
    success: boolean;
    data: {
        resourceType: string;
        url: string;
        width?: number;
        height?: number;
        format?: string;
        size?: number;
        duration?: number;
        thumbnail?: string;
    };
}

export interface MediaMetadata {
    width?: number;
    height?: number;
    format?: string;
    size?: number;
    duration?: number;
    thumbnail?: string;
}
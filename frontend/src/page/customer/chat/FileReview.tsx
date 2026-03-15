import { FaTimes, FaFile } from "react-icons/fa";

interface FileItem {
    file: File;
    dataURL?: string;
}

interface FilePreviewProps {
    imagePreview?: string | null;
    selectedFiles: FileItem[];
    onRemoveImagePreview?: () => void;
    onRemoveFile: (index: number) => void;
    onClearAllFiles: () => void;
}

// Utility function for file size formatting
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FilePreview = ({
                         imagePreview,
                         selectedFiles,
                         onRemoveImagePreview,
                         onRemoveFile,
                         onClearAllFiles
                     }: FilePreviewProps) => {
    if (!imagePreview && selectedFiles.length === 0) return null;

    return (
        <>
            {/* Image Preview */}
            {imagePreview && (
                <div className="mb-4 relative">
                    <div className="relative inline-block">
                        <img
                            src={imagePreview}
                            alt="Preview"
                            className="max-w-xs max-h-48"
                        />
                        <button
                            onClick={onRemoveImagePreview}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                            <FaTimes className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            )}

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && !imagePreview && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">Files đã chọn:</span>
                        <button
                            onClick={onClearAllFiles}
                            className="text-xs text-red-500 hover:text-red-700"
                        >
                            Xóa tất cả
                        </button>
                    </div>
                    <div className="space-y-2">
                        {selectedFiles.map((fileItem, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-gray-300">
                                <div className="flex items-center gap-2">
                                    {fileItem.dataURL ? (
                                        <img src={fileItem.dataURL} alt={fileItem.file.name} className="w-8 h-8 rounded object-cover" />
                                    ) : (
                                        <FaFile className="w-4 h-4 text-gray-500" />
                                    )}
                                    <span className="text-sm text-gray-700 truncate">{fileItem.file.name}</span>
                                    <span className="text-xs text-gray-500">({formatFileSize(fileItem.file.size)})</span>
                                </div>
                                <button
                                    onClick={() => onRemoveFile(index)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <FaTimes className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};

export default FilePreview;

// File type detection and utility functions

export type FileType = 'image' | 'video' | 'audio' | 'document' | 'text' | 'archive' | 'other';

export interface FileTypeInfo {
  type: FileType;
  mimeType: string;
  extension: string;
  icon: string;
  supportsPreview: boolean;
  compressionMethod: 'client' | 'server';
}

const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'svg', 'ico', 'heic', 'avif'];
const videoExtensions = ['mp4', 'webm', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'm4v', '3gp'];
const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma'];
const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp'];
const textExtensions = ['txt', 'md', 'json', 'xml', 'csv', 'html', 'css', 'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'hpp', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'log'];
const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'];

export const getFileExtension = (fileName: string): string => {
  const parts = fileName.toLowerCase().split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
};

export const getFileType = (file: File): FileTypeInfo => {
  const extension = getFileExtension(file.name);
  const mimeType = file.type;

  if (imageExtensions.includes(extension) || mimeType.startsWith('image/')) {
    return {
      type: 'image',
      mimeType,
      extension,
      icon: 'Image',
      supportsPreview: true,
      compressionMethod: 'server'
    };
  }

  if (videoExtensions.includes(extension) || mimeType.startsWith('video/')) {
    return {
      type: 'video',
      mimeType,
      extension,
      icon: 'Video',
      supportsPreview: true,
      compressionMethod: 'server'
    };
  }

  if (audioExtensions.includes(extension) || mimeType.startsWith('audio/')) {
    return {
      type: 'audio',
      mimeType,
      extension,
      icon: 'Music',
      supportsPreview: false,
      compressionMethod: 'server'
    };
  }

  if (documentExtensions.includes(extension)) {
    return {
      type: 'document',
      mimeType,
      extension,
      icon: 'FileText',
      supportsPreview: false,
      compressionMethod: 'server'
    };
  }

  if (textExtensions.includes(extension) || mimeType.startsWith('text/')) {
    return {
      type: 'text',
      mimeType,
      extension,
      icon: 'FileCode',
      supportsPreview: false,
      compressionMethod: 'client'
    };
  }

  if (archiveExtensions.includes(extension)) {
    return {
      type: 'archive',
      mimeType,
      extension,
      icon: 'Archive',
      supportsPreview: false,
      compressionMethod: 'server'
    };
  }

  return {
    type: 'other',
    mimeType,
    extension,
    icon: 'File',
    supportsPreview: false,
    compressionMethod: 'client'
  };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFilePreviewUrl = (file: File): string | null => {
  const fileType = getFileType(file);
  if (fileType.supportsPreview) {
    return URL.createObjectURL(file);
  }
  return null;
};

export const createFilePreview = async (file: File): Promise<string | null> => {
  const fileType = getFileType(file);
  
  if (fileType.type === 'image') {
    return URL.createObjectURL(file);
  }
  
  if (fileType.type === 'video') {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        video.currentTime = 1; // Seek to 1 second for thumbnail
      };
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } else {
          resolve(null);
        }
        URL.revokeObjectURL(video.src);
      };
      video.onerror = () => resolve(null);
      video.src = URL.createObjectURL(file);
    });
  }
  
  return null;
};

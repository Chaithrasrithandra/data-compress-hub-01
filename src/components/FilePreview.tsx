import { useState, useEffect } from 'react';
import { Image, Video, Music, FileText, FileCode, Archive, File, X } from 'lucide-react';
import { getFileType, formatFileSize, createFilePreview, type FileTypeInfo } from '@/lib/fileUtils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface FilePreviewProps {
  file: File;
  onRemove?: () => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Image,
  Video,
  Music,
  FileText,
  FileCode,
  Archive,
  File,
};

const typeColorMap: Record<string, string> = {
  image: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  video: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  audio: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  document: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  text: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  archive: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  other: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

export const FilePreview = ({ file, onRemove }: FilePreviewProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<FileTypeInfo | null>(null);

  useEffect(() => {
    const info = getFileType(file);
    setFileInfo(info);

    const loadPreview = async () => {
      const previewUrl = await createFilePreview(file);
      setPreview(previewUrl);
    };

    loadPreview();

    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [file]);

  if (!fileInfo) return null;

  const IconComponent = iconMap[fileInfo.icon] || File;

  return (
    <div className="relative bg-card border border-border rounded-xl p-4 transition-all hover:shadow-md">
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      )}

      <div className="flex items-start gap-4">
        {/* Preview or Icon */}
        <div className="flex-shrink-0">
          {preview ? (
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
              {fileInfo.type === 'image' ? (
                <img
                  src={preview}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              ) : fileInfo.type === 'video' ? (
                <img
                  src={preview}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
          ) : (
            <div className={`w-20 h-20 rounded-lg flex items-center justify-center ${typeColorMap[fileInfo.type]}`}>
              <IconComponent className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate" title={file.name}>
            {file.name}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {formatFileSize(file.size)}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className={`text-xs ${typeColorMap[fileInfo.type]}`}>
              {fileInfo.type.charAt(0).toUpperCase() + fileInfo.type.slice(1)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              .{fileInfo.extension}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

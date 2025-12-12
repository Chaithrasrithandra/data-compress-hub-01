import { Download, CheckCircle2, Image, Video, Music, FileText, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CompressionData } from "@/pages/Index";
import { formatFileSize } from "@/lib/fileUtils";

interface CompressionResultsProps {
  data: CompressionData;
}

const getFileIcon = (fileType?: string) => {
  switch (fileType) {
    case 'image':
      return Image;
    case 'video':
      return Video;
    case 'audio':
      return Music;
    case 'document':
    case 'text':
      return FileText;
    default:
      return File;
  }
};

export const CompressionResults = ({ data }: CompressionResultsProps) => {
  const handleDownload = () => {
    // Determine the file type and create appropriate blob
    let blob: Blob;
    let fileName: string;

    if (data.fileType === 'image' && data.mimeType) {
      // Decode base64 image data
      const binaryString = atob(data.compressedContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      blob = new Blob([bytes], { type: data.mimeType });
      
      // Get extension from mime type
      const extension = data.mimeType.split('/')[1] || 'bin';
      const fileNameWithoutExt = data.fileName.replace(/\.[^/.]+$/, "");
      fileName = `${fileNameWithoutExt}_compressed.${extension}`;
    } else if (data.fileType === 'video' || data.fileType === 'audio') {
      // Decode base64 media data
      const binaryString = atob(data.compressedContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      blob = new Blob([bytes], { type: data.mimeType || 'application/octet-stream' });
      
      const fileNameWithoutExt = data.fileName.replace(/\.[^/.]+$/, "");
      const extension = data.fileName.split('.').pop() || 'bin';
      fileName = `${fileNameWithoutExt}_compressed.${extension}`;
    } else {
      // Text/other files - download as JSON
      blob = new Blob([data.compressedContent], { type: "application/json" });
      const fileNameWithoutExt = data.fileName.replace(/\.[^/.]+$/, "");
      fileName = `${fileNameWithoutExt}.compressed.json`;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const IconComponent = getFileIcon(data.fileType);

  return (
    <Card className="p-6 shadow-card border-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Compression Complete</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <IconComponent className="w-4 h-4" />
              {data.fileName}
              {data.fileType && (
                <span className="text-xs bg-secondary px-2 py-0.5 rounded-full capitalize">
                  {data.fileType}
                </span>
              )}
            </p>
          </div>
        </div>
        <Button onClick={handleDownload} className="gap-2">
          <Download className="w-4 h-4" />
          Download
        </Button>
      </div>

      {/* Preview for images */}
      {data.fileType === 'image' && data.mimeType && (
        <div className="mb-6 grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Original</p>
            <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src={`data:${data.mimeType};base64,${data.originalContent}`}
                alt="Original"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Compressed</p>
            <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
              <img
                src={`data:${data.mimeType};base64,${data.compressedContent}`}
                alt="Compressed"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-secondary/50 rounded-lg p-4 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Original Size</p>
          <p className="text-2xl font-bold">{formatFileSize(data.originalSize)}</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Compressed Size</p>
          <p className="text-2xl font-bold text-primary">
            {formatFileSize(data.compressedSize)}
          </p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-4 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Space Saved</p>
          <p className="text-2xl font-bold text-accent">
            {data.compressionRatio}%
          </p>
        </div>
      </div>
    </Card>
  );
};

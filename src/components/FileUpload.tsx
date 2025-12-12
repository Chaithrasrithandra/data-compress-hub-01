import { useCallback, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { compressData } from "@/lib/compression";
import { compressImage } from "@/lib/imageCompression";
import { getFileType, type FileTypeInfo } from "@/lib/fileUtils";
import { FilePreview } from "@/components/FilePreview";
import { CompressionOptions, getDefaultSettings, type CompressionSettings } from "@/components/CompressionOptions";
import { supabase } from "@/integrations/supabase/client";
import type { CompressionData } from "@/pages/Index";

interface FileUploadProps {
  onCompressionComplete: (data: CompressionData) => void;
  isCompressing: boolean;
  setIsCompressing: (value: boolean) => void;
}

export const FileUpload = ({
  onCompressionComplete,
  isCompressing,
  setIsCompressing,
}: FileUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<FileTypeInfo | null>(null);
  const [settings, setSettings] = useState<CompressionSettings>(getDefaultSettings());
  const { toast } = useToast();

  const handleFileSelect = useCallback((file: File) => {
    const info = getFileType(file);
    setSelectedFile(file);
    setFileInfo(info);
  }, []);

  const handleCompress = useCallback(async () => {
    if (!selectedFile || !fileInfo) return;

    setIsCompressing(true);
    setProgress(0);

    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await selectedFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Convert to base64
      let binary = "";
      const CHUNK_SIZE = 0x8000;
      for (let i = 0; i < uint8Array.length; i += CHUNK_SIZE) {
        binary += String.fromCharCode(...uint8Array.subarray(i, i + CHUNK_SIZE));
      }
      const base64Content = btoa(binary);

      // Start progress simulation
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Calculate target size if specified
      let targetSizeBytes: number | undefined;
      if (settings.mode === 'size' && settings.targetSizeValue) {
        const sizeValue = parseFloat(settings.targetSizeValue);
        if (!isNaN(sizeValue) && sizeValue > 0) {
          targetSizeBytes = settings.targetSizeUnit === 'KB'
            ? sizeValue * 1024
            : sizeValue * 1024 * 1024;
        }
      }

      let result: CompressionData;

      // Choose compression method based on file type
      if (fileInfo.type === 'image' && fileInfo.compressionMethod === 'server') {
        // Use client-side Canvas API for images
        const imageResult = await compressImage(selectedFile, {
          quality: settings.quality,
          format: settings.imageFormat,
          targetSizeBytes,
        });

        // Convert blob to base64
        const reader = new FileReader();
        const compressedBase64 = await new Promise<string>((resolve) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
          };
          reader.readAsDataURL(imageResult.blob);
        });

        result = {
          originalSize: imageResult.originalSize,
          compressedSize: imageResult.compressedSize,
          compressionRatio: Math.round(((imageResult.originalSize - imageResult.compressedSize) / imageResult.originalSize) * 100),
          redundancyDetected: 0,
          compressionTime: 100,
          compressedContent: compressedBase64,
          originalContent: base64Content,
          fileName: selectedFile.name,
          fileType: fileInfo.type,
          mimeType: imageResult.format,
        };
      } else if (fileInfo.type === 'video' || fileInfo.type === 'audio') {
        // Use edge function for video/audio
        const { data, error } = await supabase.functions.invoke('compress-file', {
          body: {
            fileData: base64Content,
            fileName: selectedFile.name,
            fileType: fileInfo.type,
            mimeType: selectedFile.type,
            quality: settings.quality,
            targetSizeBytes,
            videoPreset: settings.videoPreset,
            videoResolution: settings.videoResolution,
          },
        });

        if (error) throw error;

        result = {
          originalSize: data.originalSize,
          compressedSize: data.compressedSize,
          compressionRatio: data.compressionRatio,
          redundancyDetected: 0,
          compressionTime: 100,
          compressedContent: data.compressedData,
          originalContent: base64Content,
          fileName: selectedFile.name,
          fileType: fileInfo.type,
          mimeType: data.mimeType,
        };
      } else {
        // Use client-side compression for text and other files
        const compressionLevel = 100 - settings.quality;
        result = await compressData(
          base64Content,
          selectedFile.name,
          compressionLevel,
          targetSizeBytes
        );
        result.fileType = fileInfo.type;
        result.mimeType = selectedFile.type;
      }

      clearInterval(progressInterval);
      setProgress(100);

      setTimeout(() => {
        onCompressionComplete(result);
        setSelectedFile(null);
        setFileInfo(null);
        toast({
          title: "Compression complete!",
          description: `Achieved ${result.compressionRatio}% compression ratio`,
        });
      }, 500);
    } catch (error) {
      console.error("Compression error:", error);
      toast({
        title: "Compression failed",
        description: error instanceof Error ? error.message : "An error occurred during compression",
        variant: "destructive",
      });
      setIsCompressing(false);
    }
  }, [selectedFile, fileInfo, settings, onCompressionComplete, setIsCompressing, toast]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files && e.target.files[0]) {
        handleFileSelect(e.target.files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setFileInfo(null);
  }, []);

  return (
    <div className="bg-card border-2 border-dashed border-primary/40 rounded-2xl p-8 md:p-16 transition-all hover:border-primary/60">
      <div
        className={`flex flex-col items-center justify-center ${dragActive ? "scale-105" : ""} transition-all`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleChange}
          disabled={isCompressing}
          accept="*/*"
        />

        {!selectedFile ? (
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center cursor-pointer w-full"
          >
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Upload className="w-10 h-10 text-primary" />
            </div>
            <p className="text-xl font-medium text-foreground mb-2">
              Drop your file here or click to upload
            </p>
            <p className="text-sm text-muted-foreground mb-2">
              Images, Videos, Audio, Documents, and more
            </p>
            <p className="text-xs text-muted-foreground">
              Max file size: 50MB for images, 100MB for videos
            </p>
          </label>
        ) : (
          <div className="w-full space-y-6">
            {/* File Preview */}
            <FilePreview file={selectedFile} onRemove={!isCompressing ? handleRemoveFile : undefined} />

            {/* Compression Options */}
            {!isCompressing && fileInfo && (
              <div className="flex justify-center">
                <CompressionOptions
                  fileType={fileInfo.type}
                  settings={settings}
                  onSettingsChange={setSettings}
                />
              </div>
            )}

            {/* Progress */}
            {isCompressing && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <span className="text-lg font-medium">Compressing...</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-center text-muted-foreground">
                  {progress}% complete
                </p>
              </div>
            )}

            {/* Compress Button */}
            {!isCompressing && (
              <div className="flex justify-center">
                <Button
                  size="lg"
                  className="px-12 py-6 text-base font-medium"
                  onClick={handleCompress}
                >
                  Start Compression
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

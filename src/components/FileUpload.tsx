import { useCallback, useState } from "react";
import { Upload, Loader2, X, Files } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { compressData } from "@/lib/compression";
import { compressImage } from "@/lib/imageCompression";
import { getFileType, formatFileSize, type FileTypeInfo } from "@/lib/fileUtils";
import { FilePreview } from "@/components/FilePreview";
import { CompressionOptions, getDefaultSettings, type CompressionSettings } from "@/components/CompressionOptions";
import { supabase } from "@/integrations/supabase/client";
import type { CompressionData } from "@/pages/Index";

interface FileUploadProps {
  onCompressionComplete: (data: CompressionData[]) => void;
  isCompressing: boolean;
  setIsCompressing: (value: boolean) => void;
}

interface SelectedFile {
  file: File;
  info: FileTypeInfo;
  id: string;
}

export const FileUpload = ({
  onCompressionComplete,
  isCompressing,
  setIsCompressing,
}: FileUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [settings, setSettings] = useState<CompressionSettings>(getDefaultSettings());
  const { toast } = useToast();

  const addFiles = useCallback((files: FileList | File[]) => {
    const newFiles: SelectedFile[] = Array.from(files).map((file) => ({
      file,
      info: getFileType(file),
      id: crypto.randomUUID(),
    }));
    setSelectedFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const compressSingleFile = async (
    selectedFile: File,
    fileInfo: FileTypeInfo
  ): Promise<CompressionData> => {
    const arrayBuffer = await selectedFile.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    let binary = "";
    const CHUNK_SIZE = 0x8000;
    for (let i = 0; i < uint8Array.length; i += CHUNK_SIZE) {
      binary += String.fromCharCode(...uint8Array.subarray(i, i + CHUNK_SIZE));
    }
    const base64Content = btoa(binary);

    let targetSizeBytes: number | undefined;
    if (settings.mode === "size" && settings.targetSizeValue) {
      const sizeValue = parseFloat(settings.targetSizeValue);
      if (!isNaN(sizeValue) && sizeValue > 0) {
        targetSizeBytes =
          settings.targetSizeUnit === "KB"
            ? sizeValue * 1024
            : sizeValue * 1024 * 1024;
      }
    }

    if (fileInfo.type === "image" && fileInfo.compressionMethod === "server") {
      const imageResult = await compressImage(selectedFile, {
        quality: settings.quality,
        format: settings.imageFormat,
        targetSizeBytes,
      });

      const reader = new FileReader();
      const compressedBase64 = await new Promise<string>((resolve) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.readAsDataURL(imageResult.blob);
      });

      return {
        originalSize: imageResult.originalSize,
        compressedSize: imageResult.compressedSize,
        compressionRatio: Math.round(
          ((imageResult.originalSize - imageResult.compressedSize) /
            imageResult.originalSize) *
            100
        ),
        redundancyDetected: 0,
        compressionTime: 100,
        compressedContent: compressedBase64,
        originalContent: base64Content,
        fileName: selectedFile.name,
        fileType: fileInfo.type,
        mimeType: imageResult.format,
      };
    } else if (fileInfo.type === "video" || fileInfo.type === "audio") {
      const { data, error } = await supabase.functions.invoke("compress-file", {
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

      return {
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
      const compressionLevel = 100 - settings.quality;
      const result = await compressData(
        base64Content,
        selectedFile.name,
        compressionLevel,
        targetSizeBytes
      );
      result.fileType = fileInfo.type;
      result.mimeType = selectedFile.type;
      return result;
    }
  };

  const handleCompress = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    setIsCompressing(true);
    setProgress(0);
    setCurrentFileIndex(0);

    const results: CompressionData[] = [];

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        setCurrentFileIndex(i);
        setProgress(Math.round((i / selectedFiles.length) * 100));

        const { file, info } = selectedFiles[i];
        const result = await compressSingleFile(file, info);
        results.push(result);
      }

      setProgress(100);

      setTimeout(() => {
        onCompressionComplete(results);
        setSelectedFiles([]);
        toast({
          title: "Batch compression complete!",
          description: `Compressed ${results.length} file${results.length > 1 ? "s" : ""} successfully`,
        });
      }, 500);
    } catch (error) {
      console.error("Compression error:", error);
      toast({
        title: "Compression failed",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred during compression",
        variant: "destructive",
      });
      // Still return partial results if any
      if (results.length > 0) {
        onCompressionComplete(results);
        setSelectedFiles([]);
      }
      setIsCompressing(false);
    }
  }, [selectedFiles, settings, onCompressionComplete, setIsCompressing, toast]);

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
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
      }
      // Reset input so the same files can be re-selected
      e.target.value = "";
    },
    [addFiles]
  );

  const handleClearAll = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  // Determine primary file type for compression options
  const primaryFileType = selectedFiles.length > 0 ? selectedFiles[0].info.type : undefined;

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
          multiple
        />

        {selectedFiles.length === 0 ? (
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center cursor-pointer w-full"
          >
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Upload className="w-10 h-10 text-primary" />
            </div>
            <p className="text-xl font-medium text-foreground mb-2">
              Drop your files here or click to upload
            </p>
            <p className="text-sm text-muted-foreground mb-2">
              Images, Videos, Audio, Documents, and more
            </p>
            <p className="text-xs text-muted-foreground">
              Select multiple files for batch compression
            </p>
          </label>
        ) : (
          <div className="w-full space-y-6">
            {/* File List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Files className="w-5 h-5 text-primary" />
                  <span className="font-medium">
                    {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""} selected
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({formatFileSize(selectedFiles.reduce((sum, f) => sum + f.file.size, 0))} total)
                  </span>
                </div>
                {!isCompressing && (
                  <div className="flex gap-2">
                    <label
                      htmlFor="file-upload"
                      className="text-sm text-primary hover:underline cursor-pointer"
                    >
                      + Add more
                    </label>
                    <button
                      onClick={handleClearAll}
                      className="text-sm text-destructive hover:underline"
                    >
                      Clear all
                    </button>
                  </div>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {selectedFiles.map((sf) => (
                  <FilePreview
                    key={sf.id}
                    file={sf.file}
                    onRemove={!isCompressing ? () => removeFile(sf.id) : undefined}
                  />
                ))}
              </div>
            </div>

            {/* Compression Options */}
            {!isCompressing && primaryFileType && (
              <div className="flex justify-center">
                <CompressionOptions
                  fileType={primaryFileType}
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
                  <span className="text-lg font-medium">
                    Compressing file {currentFileIndex + 1} of {selectedFiles.length}...
                  </span>
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
                  {selectedFiles.length > 1
                    ? `Compress ${selectedFiles.length} Files`
                    : "Start Compression"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

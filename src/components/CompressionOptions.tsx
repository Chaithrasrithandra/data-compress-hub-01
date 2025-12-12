import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type FileType } from '@/lib/fileUtils';

export interface CompressionSettings {
  mode: 'quality' | 'size';
  quality: number;
  targetSizeValue: string;
  targetSizeUnit: 'KB' | 'MB';
  imageFormat: 'original' | 'webp' | 'jpeg' | 'png';
  videoPreset: 'low' | 'medium' | 'high' | 'ultra';
  videoResolution: 'original' | '1080p' | '720p' | '480p' | '360p';
}

interface CompressionOptionsProps {
  fileType: FileType;
  settings: CompressionSettings;
  onSettingsChange: (settings: CompressionSettings) => void;
}

export const CompressionOptions = ({
  fileType,
  settings,
  onSettingsChange,
}: CompressionOptionsProps) => {
  const updateSettings = (partial: Partial<CompressionSettings>) => {
    onSettingsChange({ ...settings, ...partial });
  };

  const getQualityLabel = (quality: number) => {
    if (quality >= 80) return 'High Quality';
    if (quality >= 60) return 'Good Quality';
    if (quality >= 40) return 'Medium Quality';
    if (quality >= 20) return 'Low Quality';
    return 'Minimum Quality';
  };

  return (
    <div className="space-y-6 w-full max-w-md">
      {/* Mode Selection */}
      <RadioGroup
        value={settings.mode}
        onValueChange={(value) => updateSettings({ mode: value as 'quality' | 'size' })}
        className="flex gap-4 justify-center"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="quality" id="quality" />
          <Label htmlFor="quality" className="cursor-pointer">
            Quality Level
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="size" id="size" />
          <Label htmlFor="size" className="cursor-pointer">
            Target Size
          </Label>
        </div>
      </RadioGroup>

      {/* Quality/Size Settings */}
      {settings.mode === 'quality' ? (
        <div className="space-y-3">
          <Label className="text-sm font-medium block">
            {getQualityLabel(settings.quality)}
            <span className="text-muted-foreground ml-2">({settings.quality}%)</span>
          </Label>
          <Slider
            value={[settings.quality]}
            onValueChange={(value) => updateSettings({ quality: value[0] })}
            min={10}
            max={100}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Smallest</span>
            <span>Balanced</span>
            <span>Best Quality</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Label className="text-sm font-medium block">Target Size</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Enter size"
              value={settings.targetSizeValue}
              onChange={(e) => updateSettings({ targetSizeValue: e.target.value })}
              min="0.1"
              step="0.1"
              className="flex-1"
            />
            <Select
              value={settings.targetSizeUnit}
              onValueChange={(value) => updateSettings({ targetSizeUnit: value as 'KB' | 'MB' })}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KB">KB</SelectItem>
                <SelectItem value="MB">MB</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Image-specific options */}
      {fileType === 'image' && (
        <div className="space-y-3 pt-4 border-t border-border">
          <Label className="text-sm font-medium block">Output Format</Label>
          <Select
            value={settings.imageFormat}
            onValueChange={(value) => updateSettings({ imageFormat: value as CompressionSettings['imageFormat'] })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="original">Keep Original</SelectItem>
              <SelectItem value="webp">WebP (Best Compression)</SelectItem>
              <SelectItem value="jpeg">JPEG</SelectItem>
              <SelectItem value="png">PNG (Lossless)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            WebP offers the best file size reduction while maintaining quality
          </p>
        </div>
      )}

      {/* Video-specific options */}
      {fileType === 'video' && (
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="space-y-3">
            <Label className="text-sm font-medium block">Quality Preset</Label>
            <Select
              value={settings.videoPreset}
              onValueChange={(value) => updateSettings({ videoPreset: value as CompressionSettings['videoPreset'] })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select preset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low (Fast, Smaller)</SelectItem>
                <SelectItem value="medium">Medium (Balanced)</SelectItem>
                <SelectItem value="high">High (Slower, Better)</SelectItem>
                <SelectItem value="ultra">Ultra (Slowest, Best)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium block">Resolution</Label>
            <Select
              value={settings.videoResolution}
              onValueChange={(value) => updateSettings({ videoResolution: value as CompressionSettings['videoResolution'] })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select resolution" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="original">Keep Original</SelectItem>
                <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                <SelectItem value="720p">720p (HD)</SelectItem>
                <SelectItem value="480p">480p (SD)</SelectItem>
                <SelectItem value="360p">360p (Low)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
};

export const getDefaultSettings = (): CompressionSettings => ({
  mode: 'quality',
  quality: 70,
  targetSizeValue: '',
  targetSizeUnit: 'KB',
  imageFormat: 'webp',
  videoPreset: 'medium',
  videoResolution: 'original',
});

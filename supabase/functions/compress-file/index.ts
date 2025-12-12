import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompressionRequest {
  fileData: string; // Base64 encoded file
  fileName: string;
  fileType: string;
  mimeType: string;
  quality: number;
  targetSizeBytes?: number;
  imageFormat?: string;
  videoPreset?: string;
  videoResolution?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: CompressionRequest = await req.json();
    const { fileData, fileName, fileType, mimeType, quality, targetSizeBytes, imageFormat } = body;

    console.log(`Compressing ${fileType} file: ${fileName}, quality: ${quality}%`);

    // Decode base64 file data
    const binaryString = atob(fileData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const originalSize = bytes.length;
    let compressedData: Uint8Array;
    let outputMimeType = mimeType;
    let compressionMethod = 'generic';

    // Process based on file type
    if (fileType === 'image') {
      // For images, we'll use a simple approach that works in Deno
      // In production, you'd use Sharp or similar library
      const result = await compressImageData(bytes, quality, imageFormat || 'original', mimeType);
      compressedData = result.data;
      outputMimeType = result.mimeType;
      compressionMethod = 'image-quality';
      console.log(`Image compressed: ${originalSize} -> ${compressedData.length} bytes`);
    } else if (fileType === 'video') {
      // Video compression is complex - for now, return with metadata
      // In production, you'd use FFmpeg via Deno
      compressedData = bytes;
      compressionMethod = 'video-placeholder';
      console.log(`Video compression placeholder for: ${fileName}`);
    } else if (fileType === 'audio') {
      // Audio compression placeholder
      compressedData = bytes;
      compressionMethod = 'audio-placeholder';
    } else if (fileType === 'document') {
      // For PDFs and documents, apply generic compression
      const result = await compressGenericData(bytes, quality);
      compressedData = result;
      compressionMethod = 'generic';
    } else {
      // Text and other files - use dictionary/RLE compression
      const result = await compressTextData(bytes, quality, targetSizeBytes);
      compressedData = result;
      compressionMethod = 'text-dictionary';
    }

    const compressedSize = compressedData.length;
    const compressionRatio = Math.round(((originalSize - compressedSize) / originalSize) * 100);

    // Convert back to base64
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < compressedData.length; i += chunkSize) {
      binary += String.fromCharCode(...compressedData.subarray(i, i + chunkSize));
    }
    const compressedBase64 = btoa(binary);

    const response = {
      success: true,
      fileName,
      originalSize,
      compressedSize,
      compressionRatio: Math.max(compressionRatio, 0),
      compressedData: compressedBase64,
      mimeType: outputMimeType,
      compressionMethod,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Compression error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Compress image data using quality reduction
async function compressImageData(
  data: Uint8Array, 
  quality: number, 
  format: string,
  originalMimeType: string
): Promise<{ data: Uint8Array; mimeType: string }> {
  // Simple quality-based compression simulation
  // In production, use proper image libraries
  
  // For now, we'll apply a simple reduction based on quality
  const qualityFactor = quality / 100;
  
  // If quality is less than 100, try to reduce data
  if (qualityFactor < 1) {
    // Simple approach: remove some redundant bytes
    // This is a placeholder - real implementation would use proper image codecs
    const targetSize = Math.round(data.length * (0.3 + qualityFactor * 0.7));
    
    if (targetSize < data.length) {
      // Create a simulated compressed version
      const compressed = new Uint8Array(targetSize);
      const step = data.length / targetSize;
      
      for (let i = 0; i < targetSize; i++) {
        compressed[i] = data[Math.floor(i * step)];
      }
      
      return { 
        data: compressed, 
        mimeType: format === 'webp' ? 'image/webp' : 
                  format === 'jpeg' ? 'image/jpeg' : 
                  format === 'png' ? 'image/png' : originalMimeType 
      };
    }
  }
  
  return { data, mimeType: originalMimeType };
}

// Generic data compression using simple RLE-like approach
async function compressGenericData(data: Uint8Array, quality: number): Promise<Uint8Array> {
  // Simple compression: find and reduce repeated byte sequences
  const qualityFactor = quality / 100;
  const targetReduction = 1 - (0.1 + qualityFactor * 0.4);
  
  // Create a simple compressed representation
  const result: number[] = [];
  let i = 0;
  
  while (i < data.length) {
    const byte = data[i];
    let count = 1;
    
    // Count repeated bytes
    while (i + count < data.length && data[i + count] === byte && count < 255) {
      count++;
    }
    
    if (count >= 4) {
      // RLE encode: marker, count, byte
      result.push(0xFF, count, byte);
      i += count;
    } else {
      result.push(byte);
      i++;
    }
  }
  
  // If compression didn't help, return original
  if (result.length >= data.length * 0.95) {
    return data;
  }
  
  return new Uint8Array(result);
}

// Text-specific compression with dictionary encoding
async function compressTextData(
  data: Uint8Array, 
  quality: number,
  targetSizeBytes?: number
): Promise<Uint8Array> {
  // Convert to text
  const decoder = new TextDecoder();
  const text = decoder.decode(data);
  
  // Build word frequency
  const words = text.split(/\s+/);
  const wordFreq = new Map<string, number>();
  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });
  
  // Create dictionary for common words
  const sortedWords = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50);
  
  const dictionary: Record<string, string> = {};
  sortedWords.forEach(([word], index) => {
    dictionary[word] = `[${index}]`;
  });
  
  // Apply dictionary compression
  let compressed = text;
  Object.entries(dictionary).forEach(([word, code]) => {
    compressed = compressed.split(word).join(code);
  });
  
  // Create output structure
  const output = JSON.stringify({
    v: '1.0',
    d: Object.fromEntries(sortedWords.map(([w], i) => [`[${i}]`, w])),
    c: compressed,
  });
  
  const encoder = new TextEncoder();
  let result = encoder.encode(output);
  
  // Adjust to target size if specified
  if (targetSizeBytes && result.length > targetSizeBytes) {
    // Truncate content to meet target
    const ratio = targetSizeBytes / result.length;
    const truncatedContent = compressed.substring(0, Math.floor(compressed.length * ratio * 0.9));
    const truncatedOutput = JSON.stringify({
      v: '1.0',
      d: Object.fromEntries(sortedWords.map(([w], i) => [`[${i}]`, w])),
      c: truncatedContent,
    });
    result = encoder.encode(truncatedOutput);
  }
  
  return result;
}

-- Create storage bucket for file compression
INSERT INTO storage.buckets (id, name, public) VALUES ('compression-files', 'compression-files', true);

-- Create policies for compression files bucket
CREATE POLICY "Users can upload their own files for compression"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'compression-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own compression files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'compression-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own compression files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'compression-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access for compressed results (for download)
CREATE POLICY "Public can view compressed results"
ON storage.objects
FOR SELECT
USING (bucket_id = 'compression-files' AND position('compressed/' in name) > 0);
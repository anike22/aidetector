-- Storage bucket for private authorship creation evidence
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'authorship_evidence',
    'authorship_evidence',
    false,
    15728640, -- 15MB limit
    ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown', 'text/html', 'application/rtf', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for authorship_evidence
DROP POLICY IF EXISTS "Authenticated users can upload authorship evidence" ON storage.objects;
CREATE POLICY "Authenticated users can upload authorship evidence"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'authorship_evidence');

DROP POLICY IF EXISTS "Owners and admins can read authorship evidence" ON storage.objects;
CREATE POLICY "Owners and admins can read authorship evidence"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'authorship_evidence');

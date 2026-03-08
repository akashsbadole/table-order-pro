
-- Storage bucket for org logos
INSERT INTO storage.buckets (id, name, public) VALUES ('org-logos', 'org-logos', true);

-- Storage RLS for org-logos
CREATE POLICY "Authenticated users can upload logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'org-logos');
CREATE POLICY "Anyone can view logos" ON storage.objects FOR SELECT USING (bucket_id = 'org-logos');
CREATE POLICY "Authenticated users can update logos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'org-logos');

-- Synthetic development users only; Auth identities are seeded by scripts/seed-local.mjs.
INSERT INTO christmas_planner.users (email, name) VALUES
  ('alice@example.test', 'Alicia'), ('bruno@example.test', 'Bruno'), ('clara@example.test', 'Clara')
ON CONFLICT (email) DO NOTHING;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('christmas-avatars', 'christmas-avatars', true, 2097152, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO NOTHING;

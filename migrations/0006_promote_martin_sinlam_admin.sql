-- One-time: make the Inner Soul staff accounts Desk admins.
-- Matches username, display name, artist id, or the old seed ids.

UPDATE cue_studio
SET
  accounts = COALESCE(
    (
      SELECT jsonb_agg(next.elem ORDER BY next.ord)
      FROM (
        SELECT
          CASE
            WHEN lower(coalesce(elem->>'username', '')) IN ('martin', 'sinlam', 'sin-lam')
              OR lower(coalesce(elem->>'name', '')) IN ('martin sham', 'sin lam')
              OR lower(coalesce(elem->>'artistId', '')) IN ('martin', 'sinlam')
              OR lower(coalesce(elem->>'id', '')) IN ('acc-martin', 'acc-sinlam')
            THEN jsonb_set(elem, '{kind}', '"admin"')
            ELSE elem
          END AS elem,
          ord
        FROM jsonb_array_elements(COALESCE(accounts, '[]'::jsonb))
          WITH ORDINALITY AS t(elem, ord)
      ) next
    ),
    '[]'::jsonb
  ),
  updated_at = now()
WHERE id = 'indie-dream';

UPDATE cue_accounts
SET kind = 'admin', updated_at = now()
WHERE lower(username) IN ('martin', 'sinlam', 'sin-lam')
   OR lower(name) IN ('martin sham', 'sin lam')
   OR coalesce(artist_id, '') IN ('martin', 'sinlam')
   OR id IN ('acc-martin', 'acc-sinlam');

-- ===========================================================
-- Schema Turso / libSQL – release-onlymatt
-- ===========================================================

-- Table des shoots (séances photo/vidéo)
CREATE TABLE IF NOT EXISTS shoots (
  id          TEXT    PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title       TEXT    NOT NULL,
  shoot_date  TEXT    NOT NULL,          -- ISO-8601 : YYYY-MM-DD
  photographer TEXT   NOT NULL,
  location    TEXT,
  notes       TEXT,
  created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Table des contrats de consentement (un par co-performeur par shoot)
CREATE TABLE IF NOT EXISTS contracts (
  id               TEXT    PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  shoot_id         TEXT    NOT NULL REFERENCES shoots(id) ON DELETE CASCADE,

  -- Identité du modèle
  full_name        TEXT    NOT NULL,
  date_of_birth    TEXT    NOT NULL,     -- ISO-8601 : YYYY-MM-DD
  email            TEXT    NOT NULL,
  phone            TEXT,

  -- Tracé de la signature (data-URL base64 PNG stocké en texte)
  signature_data   TEXT    NOT NULL,

  -- Clés uniques des fichiers dans le bucket R2 (jamais les URLs complètes)
  r2_key_id_front  TEXT    NOT NULL,     -- ex: contracts/{id}/id_front.jpg
  r2_key_id_back   TEXT    NOT NULL,     -- ex: contracts/{id}/id_back.jpg
  r2_key_selfie    TEXT    NOT NULL,     -- ex: contracts/{id}/selfie.jpg

  -- Consentements cochés
  consent_recording   INTEGER NOT NULL DEFAULT 0 CHECK (consent_recording IN (0,1)),
  consent_publication INTEGER NOT NULL DEFAULT 0 CHECK (consent_publication IN (0,1)),
  consent_adult       INTEGER NOT NULL DEFAULT 0 CHECK (consent_adult IN (0,1)),

  -- Métadonnées d'audit
  ip_address       TEXT,
  user_agent       TEXT,
  submitted_at     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_contracts_shoot_id ON contracts(shoot_id);
CREATE INDEX IF NOT EXISTS idx_contracts_email     ON contracts(email);

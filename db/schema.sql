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
  legal_name       TEXT    NOT NULL,     -- Nom officiel (pièce d'identité)
  stage_name       TEXT,                 -- Nom d'artiste / Pseudo
  birth_date       TEXT    NOT NULL,     -- ISO-8601 : YYYY-MM-DD
  email            TEXT    NOT NULL,
  phone            TEXT,
  address          TEXT    NOT NULL,

  -- Tracé de la signature (data-URL base64 PNG stocké en texte)
  signature_data   TEXT    NOT NULL,

  -- Réseaux sociaux
  main_url         TEXT,                 -- URL profil principal (X/Twitter)

  -- Clés uniques des fichiers dans le bucket R2 (jamais les URLs complètes)
  recto_id_key     TEXT    NOT NULL,     -- ex: contracts/{id}/recto.jpg
  verso_id_key     TEXT    NOT NULL,     -- ex: contracts/{id}/verso.jpg
  selfie_key       TEXT    NOT NULL,     -- ex: contracts/{id}/selfie.jpg

  -- Consentements cochés
  consent_recording   INTEGER NOT NULL DEFAULT 0 CHECK (consent_recording IN (0,1)),
  consent_publication INTEGER NOT NULL DEFAULT 0 CHECK (consent_publication IN (0,1)),
  consent_adult       INTEGER NOT NULL DEFAULT 0 CHECK (consent_adult IN (0,1)),

  -- Métadonnées d'audit
  ip_address       TEXT,
  user_agent       TEXT,
  signed_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_contracts_shoot_id ON contracts(shoot_id);
CREATE INDEX IF NOT EXISTS idx_contracts_email     ON contracts(email);

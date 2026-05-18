-- Auth tables for NextAuth / Auth.js v5
-- Run this in Neon SQL Editor

CREATE TABLE IF NOT EXISTS "User" (
  "id"            TEXT NOT NULL PRIMARY KEY,
  "name"          TEXT,
  "email"         TEXT NOT NULL,
  "emailVerified" TIMESTAMP(3),
  "image"         TEXT,
  "passwordHash"  TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

CREATE TABLE IF NOT EXISTS "Account" (
  "id"                TEXT NOT NULL PRIMARY KEY,
  "userId"            TEXT NOT NULL,
  "type"              TEXT NOT NULL,
  "provider"          TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token"     TEXT,
  "access_token"      TEXT,
  "expires_at"        INTEGER,
  "token_type"        TEXT,
  "scope"             TEXT,
  "id_token"          TEXT,
  "session_state"     TEXT,
  CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key"
  ON "Account"("provider", "providerAccountId");

CREATE TABLE IF NOT EXISTS "Session" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "sessionToken" TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "expires"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" ON "Session"("sessionToken");

CREATE TABLE IF NOT EXISTS "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token"      TEXT NOT NULL,
  "expires"    TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key"
  ON "VerificationToken"("identifier", "token");

-- Auto-update updatedAt en User
CREATE OR REPLACE FUNCTION update_user_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_updated_at ON "User";
CREATE TRIGGER user_updated_at
BEFORE UPDATE ON "User"
FOR EACH ROW EXECUTE FUNCTION update_user_updated_at();

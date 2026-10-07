CREATE TABLE "OAuthExchangeCode" (
  "id" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OAuthExchangeCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OAuthExchangeCode_codeHash_key" ON "OAuthExchangeCode"("codeHash");
CREATE INDEX "OAuthExchangeCode_expiresAt_idx" ON "OAuthExchangeCode"("expiresAt");
ALTER TABLE "OAuthExchangeCode" ADD CONSTRAINT "OAuthExchangeCode_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

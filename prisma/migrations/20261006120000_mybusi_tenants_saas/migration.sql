CREATE TYPE "StoreMemberRole" AS ENUM ('ADMINISTRATEUR', 'GERANT', 'CAISSIER', 'VENDEUR', 'MAGASINIER');
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'GRACE_PERIOD', 'EXPIRED', 'SUSPENDED', 'CANCELLED');
CREATE TYPE "SaaSPaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED');

ALTER TABLE "User" ADD COLUMN "emailOtpHash" TEXT,
  ADD COLUMN "emailOtpExpiry" TIMESTAMP(3),
  ADD COLUMN "emailOtpAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "passwordResetOtpHash" TEXT,
  ADD COLUMN "passwordResetOtpExpiry" TIMESTAMP(3),
  ADD COLUMN "passwordResetOtpAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "otpAttempts" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "FinancialTransaction" ADD COLUMN "depotId" TEXT;
CREATE INDEX "FinancialTransaction_depotId_idx" ON "FinancialTransaction"("depotId");
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Client" ADD COLUMN "depotId" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "depotId" TEXT;
CREATE INDEX "Client_depotId_idx" ON "Client"("depotId");
CREATE INDEX "Supplier_depotId_idx" ON "Supplier"("depotId");
ALTER TABLE "Client" ADD CONSTRAINT "Client_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SalaryPayment" ADD COLUMN "depotId" TEXT;
CREATE INDEX "SalaryPayment_depotId_idx" ON "SalaryPayment"("depotId");
ALTER TABLE "SalaryPayment" ADD CONSTRAINT "SalaryPayment_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
UPDATE "Client" c SET "depotId" = link."depotId"
FROM (SELECT DISTINCT ON (s."clientId") s."clientId", s."depotId" FROM "Sale" s WHERE s."clientId" IS NOT NULL ORDER BY s."clientId", s."createdAt") link
WHERE c."id" = link."clientId";
UPDATE "Supplier" s SET "depotId" = link."depotId"
FROM (SELECT DISTINCT ON (p."supplierId") p."supplierId", p."depotId" FROM "Purchase" p ORDER BY p."supplierId", p."createdAt") link
WHERE s."id" = link."supplierId";
UPDATE "SalaryPayment" sp SET "depotId" = link."depotId"
FROM (SELECT DISTINCT ON (ud."userId") ud."userId", ud."depotId" FROM "UserDepot" ud ORDER BY ud."userId", ud."assignedAt") link
WHERE sp."userId" = link."userId";

ALTER TABLE "Depot" ADD COLUMN "description" TEXT,
  ADD COLUMN "logoUrl" TEXT,
  ADD COLUMN "ownerId" TEXT;
CREATE INDEX "Depot_ownerId_idx" ON "Depot"("ownerId");
ALTER TABLE "Depot" ADD CONSTRAINT "Depot_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "UserDepot" ADD COLUMN "role" "StoreMemberRole" NOT NULL DEFAULT 'VENDEUR',
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "customRoleId" TEXT;
UPDATE "UserDepot" ud SET "role" = 'ADMINISTRATEUR'
FROM "User" u WHERE u."id" = ud."userId" AND u."role" = 'ADMIN';
UPDATE "Depot" d SET "ownerId" = owners."userId"
FROM (SELECT DISTINCT ON (ud."depotId") ud."depotId", ud."userId"
      FROM "UserDepot" ud ORDER BY ud."depotId", ud."assignedAt") owners
WHERE d."id" = owners."depotId";
UPDATE "UserDepot" ud SET "role" = 'ADMINISTRATEUR'
FROM "Depot" d WHERE d."id" = ud."depotId" AND d."ownerId" = ud."userId";

CREATE TABLE "StoreRole" (
  "id" TEXT NOT NULL, "depotId" TEXT NOT NULL, "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StoreRole_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StoreRole_depotId_name_key" ON "StoreRole"("depotId", "name");
CREATE INDEX "StoreRole_depotId_idx" ON "StoreRole"("depotId");
ALTER TABLE "StoreRole" ADD CONSTRAINT "StoreRole_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserDepot" ADD CONSTRAINT "UserDepot_customRoleId_fkey" FOREIGN KEY ("customRoleId") REFERENCES "StoreRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "Permission" (
  "id" TEXT NOT NULL, "key" TEXT NOT NULL, "label" TEXT NOT NULL,
  CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");
CREATE TABLE "StoreRolePermission" (
  "roleId" TEXT NOT NULL, "permissionId" TEXT NOT NULL,
  CONSTRAINT "StoreRolePermission_pkey" PRIMARY KEY ("roleId", "permissionId")
);
ALTER TABLE "StoreRolePermission" ADD CONSTRAINT "StoreRolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "StoreRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StoreRolePermission" ADD CONSTRAINT "StoreRolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "Subscription" (
  "id" TEXT NOT NULL, "depotId" TEXT NOT NULL, "planCode" TEXT NOT NULL DEFAULT 'TRIAL',
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
  "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "currentPeriodEnd" TIMESTAMP(3) NOT NULL, "gracePeriodEnd" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Subscription_depotId_key" ON "Subscription"("depotId");
CREATE INDEX "Subscription_status_currentPeriodEnd_idx" ON "Subscription"("status", "currentPeriodEnd");
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SaaSPayment" (
  "id" TEXT NOT NULL, "depotId" TEXT NOT NULL, "subscriptionId" TEXT,
  "amount" INTEGER NOT NULL, "currency" TEXT NOT NULL DEFAULT 'XAF',
  "provider" TEXT NOT NULL DEFAULT 'K-PAY', "transactionId" TEXT,
  "status" "SaaSPaymentStatus" NOT NULL DEFAULT 'PENDING', "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SaaSPayment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SaaSPayment_depotId_createdAt_idx" ON "SaaSPayment"("depotId", "createdAt");
CREATE INDEX "SaaSPayment_transactionId_idx" ON "SaaSPayment"("transactionId");
ALTER TABLE "SaaSPayment" ADD CONSTRAINT "SaaSPayment_depotId_fkey" FOREIGN KEY ("depotId") REFERENCES "Depot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaaSPayment" ADD CONSTRAINT "SaaSPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Existing depots retain access for 90 days after this migration while owners configure billing.
INSERT INTO "Subscription" ("id", "depotId", "planCode", "status", "currentPeriodStart", "currentPeriodEnd", "updatedAt")
SELECT md5(random()::text || clock_timestamp()::text), d."id", 'LEGACY', 'ACTIVE', CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP + INTERVAL '90 days', CURRENT_TIMESTAMP
FROM "Depot" d;

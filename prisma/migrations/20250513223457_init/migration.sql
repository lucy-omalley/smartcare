-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "hourlyRate" DOUBLE PRECISION NOT NULL,
    "availability" JSONB NOT NULL,
    "crecheCapacity" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Provider_email_key" ON "Provider"("email");

-- CreateIndex
CREATE INDEX "Provider_email_idx" ON "Provider"("email");

-- CreateIndex
CREATE INDEX "Provider_status_idx" ON "Provider"("status");

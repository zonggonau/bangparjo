-- CreateTable
CREATE TABLE "VisitorLog" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Unknown',
    "countryCode" TEXT NOT NULL DEFAULT 'XX',
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitorLog_pkey" PRIMARY KEY ("id")
);

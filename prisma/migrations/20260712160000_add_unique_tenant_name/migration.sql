-- AlterEnum
-- CreateIndex
CREATE UNIQUE INDEX "Role_tenantId_name_key" ON "Role"("tenantId", "name");
CREATE UNIQUE INDEX "Recipe_tenantId_name_key" ON "Recipe"("tenantId", "name");

-- Fix duplicate order values before adding unique constraint
-- Reassign orders sequentially based on createdAt so no duplicates remain
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "order" ASC, "createdAt" ASC) AS new_order
  FROM "CourseModule"
)
UPDATE "CourseModule"
SET "order" = numbered.new_order
FROM numbered
WHERE "CourseModule".id = numbered.id;

-- CreateIndex
CREATE UNIQUE INDEX "CourseModule_order_key" ON "CourseModule"("order");

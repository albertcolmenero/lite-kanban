-- AlterTable
ALTER TABLE "ProjectStatus" ADD COLUMN     "isFinal" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "dueDate" TIMESTAMP(3);

/*
  Warnings:

  - You are about to drop the `Conversation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Event` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Interaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `InteractionIssue` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `InteractionTopic` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `InteractionUseCase` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Issue` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Project` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Topic` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UseCase` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[apiKey]` on the table `Organization` will be added. If there are existing duplicate values, this will fail.
  - The required column `apiKey` was added to the `Organization` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Interaction" DROP CONSTRAINT "Interaction_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "Interaction" DROP CONSTRAINT "Interaction_eventId_fkey";

-- DropForeignKey
ALTER TABLE "Interaction" DROP CONSTRAINT "Interaction_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Interaction" DROP CONSTRAINT "Interaction_projectId_fkey";

-- DropForeignKey
ALTER TABLE "InteractionIssue" DROP CONSTRAINT "InteractionIssue_interactionId_fkey";

-- DropForeignKey
ALTER TABLE "InteractionIssue" DROP CONSTRAINT "InteractionIssue_issueId_fkey";

-- DropForeignKey
ALTER TABLE "InteractionTopic" DROP CONSTRAINT "InteractionTopic_interactionId_fkey";

-- DropForeignKey
ALTER TABLE "InteractionTopic" DROP CONSTRAINT "InteractionTopic_topicId_fkey";

-- DropForeignKey
ALTER TABLE "InteractionUseCase" DROP CONSTRAINT "InteractionUseCase_interactionId_fkey";

-- DropForeignKey
ALTER TABLE "InteractionUseCase" DROP CONSTRAINT "InteractionUseCase_useCaseId_fkey";

-- DropForeignKey
ALTER TABLE "Issue" DROP CONSTRAINT "Issue_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Issue" DROP CONSTRAINT "Issue_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Topic" DROP CONSTRAINT "Topic_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Topic" DROP CONSTRAINT "Topic_projectId_fkey";

-- DropForeignKey
ALTER TABLE "UseCase" DROP CONSTRAINT "UseCase_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "UseCase" DROP CONSTRAINT "UseCase_projectId_fkey";

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "apiKey" TEXT NOT NULL;

-- DropTable
DROP TABLE "Conversation";

-- DropTable
DROP TABLE "Event";

-- DropTable
DROP TABLE "Interaction";

-- DropTable
DROP TABLE "InteractionIssue";

-- DropTable
DROP TABLE "InteractionTopic";

-- DropTable
DROP TABLE "InteractionUseCase";

-- DropTable
DROP TABLE "Issue";

-- DropTable
DROP TABLE "Project";

-- DropTable
DROP TABLE "Topic";

-- DropTable
DROP TABLE "UseCase";

-- CreateTable
CREATE TABLE "Sheet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sheet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_apiKey_key" ON "Organization"("apiKey");

-- AddForeignKey
ALTER TABLE "Sheet" ADD CONSTRAINT "Sheet_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sheet" ADD CONSTRAINT "Sheet_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

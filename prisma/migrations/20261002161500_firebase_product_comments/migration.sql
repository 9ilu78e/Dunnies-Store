ALTER TABLE "ProductComment"
ADD COLUMN "firebaseUserUid" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "CommentReply"
ADD COLUMN "firebaseUserUid" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE "CommentLike"
ADD COLUMN "firebaseUserUid" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

CREATE INDEX "ProductComment_firebaseUserUid_idx"
ON "ProductComment"("firebaseUserUid");

CREATE INDEX "CommentReply_firebaseUserUid_idx"
ON "CommentReply"("firebaseUserUid");

CREATE INDEX "CommentLike_firebaseUserUid_idx"
ON "CommentLike"("firebaseUserUid");

CREATE UNIQUE INDEX "CommentLike_firebaseUserUid_commentId_key"
ON "CommentLike"("firebaseUserUid", "commentId");

CREATE UNIQUE INDEX "CommentLike_firebaseUserUid_replyId_key"
ON "CommentLike"("firebaseUserUid", "replyId");

ALTER TABLE "ProductComment"
ADD CONSTRAINT "ProductComment_firebaseUserUid_fkey"
FOREIGN KEY ("firebaseUserUid") REFERENCES "FirebaseUser"("uid")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommentReply"
ADD CONSTRAINT "CommentReply_firebaseUserUid_fkey"
FOREIGN KEY ("firebaseUserUid") REFERENCES "FirebaseUser"("uid")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommentLike"
ADD CONSTRAINT "CommentLike_firebaseUserUid_fkey"
FOREIGN KEY ("firebaseUserUid") REFERENCES "FirebaseUser"("uid")
ON DELETE CASCADE ON UPDATE CASCADE;

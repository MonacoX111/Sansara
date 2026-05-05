import {onCall} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();

export const claimPlayerProfile = onCall(async (request) => {
  // 🔐 перевірка логіну
  if (!request.auth) {
    throw new Error("User must be logged in");
  }

  const uid = request.auth.uid;
  const code = (request.data.code || "").trim();

  if (!code) {
    throw new Error("Code is required");
  }

  const db = admin.firestore();

  // 🔍 шукаємо claim
  const claimRef = db.collection("playerClaims").doc(code);
  const claimSnap = await claimRef.get();

  if (!claimSnap.exists) {
    throw new Error("Invalid code");
  }

  const claim = claimSnap.data();

  if (claim?.used) {
    throw new Error("Code already used");
  }

  const playerId = claim?.playerId;

  if (!playerId) {
    throw new Error("Invalid claim data");
  }

  const playerRef = db.collection("players").doc(String(playerId));
  const playerSnap = await playerRef.get();

  if (!playerSnap.exists) {
    throw new Error("Player not found");
  }

  const player = playerSnap.data();

  if (player?.authUid) {
    throw new Error("Player already linked");
  }

  // 🔥 транзакція
  await db.runTransaction(async (tx) => {
    tx.update(playerRef, {
      authUid: uid,
      claimCodeUsed: true,
    });

    tx.update(claimRef, {
      used: true,
      usedByUid: uid,
      usedAt: new Date().toISOString(),
    });
  });

  return {success: true};
});

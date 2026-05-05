import {HttpsError, onCall} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();

export const claimPlayerProfile = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be logged in");
  }

  const uid = request.auth.uid;
  const code = (request.data.code || "").trim();

  if (!code) {
    throw new HttpsError("invalid-argument", "Code is required");
  }

  const db = admin.firestore();
  const claimRef = db.collection("playerClaims").doc(code);

  await db.runTransaction(async (tx) => {
    const claimSnap = await tx.get(claimRef);

    if (!claimSnap.exists) {
      throw new HttpsError("not-found", "Invalid code");
    }

    const claim = claimSnap.data();

    if (claim?.used) {
      throw new HttpsError("failed-precondition", "Code already used");
    }

    const playerId = claim?.playerId;

    if (!playerId) {
      throw new HttpsError("failed-precondition", "Invalid claim data");
    }

    const playerRef = db.collection("players").doc(String(playerId));
    const playerSnap = await tx.get(playerRef);

    if (!playerSnap.exists) {
      throw new HttpsError("not-found", "Player not found");
    }

    const player = playerSnap.data();

    if (player?.authUid) {
      throw new HttpsError("failed-precondition", "Player already linked");
    }

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

/**
 * @fileoverview Firebase Cloud Functions for the NiyamAI application.
 * This file contains the server-side logic that uses the Firebase Admin SDK
 * to perform privileged operations like writing to secured Firestore collections
 * and integrating with third-party APIs like Anthropic's Claude.
 *
 * Functions are grouped by feature:
 * - onEmployeeOnboard: Handles the final steps of employee onboarding.
 * - generateHoningScenario: Generates a new honing lab scenario.
 * - generateHRInsights: Aggregates organization-wide data for HR analysis.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

import {
  onboardEmployeeDnaMapping,
  EmployeeOnboardingDnaMappingInput,
} from "../../src/ai/flows/employee-onboarding-dna-mapping";
import {
  generateHoningScenario as genkitGenerateHoningScenario,
  GenerateHoningScenarioInput,
} from "../../src/ai/flows/generate-honing-scenario";
import {
  getHrNeuralInsights,
  HrNeuralInsightsInput,
} from "../../src/ai/flows/hr-neural-insights-flow";


// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// =================================================================================
// 1. Employee Onboarding
// =================================================================================
export const onEmployeeOnboard = functions.https.onCall(async (data: EmployeeOnboardingDnaMappingInput, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
  }
  const userId = context.auth.uid;

  try {
    const employeeDna = await onboardEmployeeDnaMapping(data);

    const dnaDocRef = db.collection("users").doc(userId).collection("employeeDNA").doc("current");
    const historyDocRef = db.collection("users").doc(userId).collection("dnaHistory").doc();

    const batch = db.batch();

    // Set current DNA
    batch.set(dnaDocRef, {
      ...employeeDna,
      userId: userId,
      version: 1,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create initial history snapshot
    batch.set(historyDocRef, {
      userId: userId,
      dnaSnapshot: employeeDna,
      synergyScore: employeeDna.synergyScore,
      trigger: "onboarding",
      delta: 0,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Update user's onboarded status
    const userRef = db.collection("users").doc(userId);
    batch.update(userRef, { onboarded: true });

    await batch.commit();

    return { status: "success", dna: employeeDna };
  } catch (error) {
    console.error("Error in onEmployeeOnboard:", error);
    throw new functions.https.HttpsError("internal", "Failed to process employee onboarding.", error);
  }
});


// =================================================================================
// 2. Honing Lab Scenario Generation (Genkit/Gemini)
// =================================================================================
export const generateHoningScenario = functions.https.onCall(async (data: GenerateHoningScenarioInput, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
  }
  try {
    const scenario = await genkitGenerateHoningScenario(data);
    return scenario;
  } catch (error) {
    console.error("Error in generateHoningScenario:", error);
    throw new functions.https.HttpsError("internal", "Failed to generate honing scenario.", error);
  }
});


// =================================================================================
// 3. HR Neural Insights (Genkit/Gemini)
// =================================================================================
export const generateHRInsights = functions.https.onCall(async (data: HrNeuralInsightsInput, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
  }
  // Optional: Add role check for HR_ADMIN
  try {
    const insights = await getHrNeuralInsights(data);
    // Here you would use the admin SDK to write insights to the /organizations/{orgId}/orgAnalytics/current doc
    const orgAnalyticsRef = db.collection("organizations").doc(data.orgId).collection("orgAnalytics").doc("current");
    await orgAnalyticsRef.set({
      ...insights,
      organizationId: data.orgId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return insights;
  } catch (error) {
    console.error("Error in generateHRInsights:", error);
    throw new functions.https.HttpsError("internal", "Failed to generate HR insights.", error);
  }
});

/**
 * @fileoverview Firebase Cloud Functions for the NiyamAI application.
 * This file contains the server-side logic that uses the Firebase Admin SDK
 * to perform privileged operations like writing to secured Firestore collections
 * and integrating with third-party APIs like Anthropic's Claude.
 *
 * Functions are grouped by feature:
 * - onEmployeeOnboard: Handles the final steps of employee onboarding.
 * - submitCheckIn: Processes weekly employee check-ins and gets AI mentorship.
 * - evaluateHoningResponse: Evaluates an employee's response to a honing lab simulation.
 * - generateHoningScenario: Generates a new honing lab scenario.
 * - generateHRInsights: Aggregates organization-wide data for HR analysis.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import fetch from "node-fetch";

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

// Define environment variables for API keys
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

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
// 2. Weekly Check-ins & AI Mentorship (Claude API)
// =================================================================================
export const submitCheckIn = functions.https.onCall(async (data: { reflection: string, cadenceType: string }, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
  }
  const userId = context.auth.uid;
  const { reflection, cadenceType } = data;

  try {
    // 1. Fetch all required data (FounderDNA, EmployeeDNA, Check-in History)
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();
    if (!userData) {
      throw new functions.https.HttpsError("not-found", "User not found.");
    }
    const orgId = userData.organizationId;

    const founderDnaDoc = await db.collection("organizations").doc(orgId).collection("founderDNA").doc("current").get();
    const employeeDnaDoc = await db.collection("users").doc(userId).collection("employeeDNA").doc("current").get();
    const checkInHistorySnapshot = await db.collection("users").doc(userId).collection("checkIns").orderBy("createdAt", "desc").limit(6).get();

    if (!founderDnaDoc.exists || !employeeDnaDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Required DNA profiles not found.");
    }
    
    const checkInHistory = checkInHistorySnapshot.docs.map(doc => doc.data());

    // 2. Construct the system prompt for Claude
    const systemPrompt = `You are NiyamAI, a founder-centric AI employee growth mentor. Your role is to analyze an employee's check-in reflection against the founder's CorePersonaDNA and the employee's behavioral DNA.
    Provide personalized mentorship, identify alignment gaps, and suggest focus areas for improvement.
    
    The founder's core vision and values (CorePersonaDNA):
    ${JSON.stringify(founderDnaDoc.data(), null, 2)}

    The employee's current behavioral DNA and alignment:
    ${JSON.stringify(employeeDnaDoc.data(), null, 2)}

    Employee's recent check-in history (up to 6 previous entries):
    ${JSON.stringify(checkInHistory, null, 2)}

    Based on the employee's reflection, provide:
    1. A personalized mentorship message.
    2. An alignment score (0-100) with the founder's vision.
    3. A burnout flag (true/false).
    4. The overall sentiment of the reflection.
    5. A summary of any observed behavioral drift or alignment shifts.
    6. A suggested next focus area for the employee.

    Your response MUST be a JSON object conforming to the following schema. Ensure all fields are present and correctly typed.`;

    // 3. Call Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY!,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: reflection }],
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new functions.https.HttpsError("internal", `Anthropic API error: ${response.status} - ${errorText}`);
    }

    const claudeResponse = await response.json() as any;
    const aiMentorshipOutput = JSON.parse(claudeResponse.content[0].text);

    // 4. Write new CheckIn document to Firestore
    const newCheckInRef = db.collection("users").doc(userId).collection("checkIns").doc();
    await newCheckInRef.set({
      userId,
      reflection,
      aiMentorship: aiMentorshipOutput.mentorship,
      alignmentScore: aiMentorshipOutput.alignmentScore,
      burnoutFlag: aiMentorshipOutput.burnoutFlag,
      sentiment: aiMentorshipOutput.sentiment,
      cadenceType: cadenceType,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { status: "success", mentorship: aiMentorshipOutput };

  } catch (error) {
    console.error("Error in submitCheckIn:", error);
    throw new functions.https.HttpsError("internal", "Failed to process check-in.", error);
  }
});


// =================================================================================
// 3. Honing Lab Evaluation (Claude API)
// =================================================================================
export const evaluateHoningResponse = functions.https.onCall(async (data: any, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const userId = context.auth.uid;
    const { sessionId, traitName, userResponse, honingScenario } = data;

    try {
        const userDoc = await db.collection("users").doc(userId).get();
        const userData = userDoc.data();
        if (!userData) throw new functions.https.HttpsError("not-found", "User not found.");
        const orgId = userData.organizationId;

        const founderDnaDoc = await db.collection("organizations").doc(orgId).collection("founderDNA").doc("current").get();
        const employeeDnaDoc = await db.collection("users").doc(userId).collection("employeeDNA").doc("current").get();

        if (!founderDnaDoc.exists || !employeeDnaDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Required DNA profiles not found.");
        }
        const founderDNA = founderDnaDoc.data();
        const employeeDNA = employeeDnaDoc.data();

        const systemPrompt = `You are NiyamAI, an expert AI evaluating an employee's response in a honing lab simulation. Your goal is to assess how well the employee's response aligns with the founder's CorePersonaDNA, specifically focusing on the trait: "${traitName}".

--- Founder's CorePersonaDNA ---
${JSON.stringify(founderDNA, null, 2)}

--- Employee's Current PersonaDNA ---
${JSON.stringify(employeeDNA, null, 2)}

--- Honing Lab Scenario ---
${JSON.stringify(honingScenario, null, 2)}

--- Evaluation Task ---
Evaluate the employee's response to the scenario and challenge, specifically against the founder's first principles and the target trait "${traitName}". Provide detailed, constructive feedback. Quantify the change in synergy score (synergyDelta) between -5 and +10 and the gain in the specific trait score (traitGain) between 0 and 15.

Your output MUST be a JSON object with the structure: { "feedback": "...", "synergyDelta": X, "traitGain": Y }`;

        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": CLAUDE_API_KEY!,
                "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 2048,
                system: systemPrompt,
                messages: [{ role: "user", content: `Employee's response for trait "${traitName}":\n"${userResponse}"` }],
            })
        });

        if (!response.ok) throw new functions.https.HttpsError("internal", `Anthropic API error: ${response.status}`);
        
        const claudeResponse = await response.json() as any;
        const evaluation = JSON.parse(claudeResponse.content[0].text);

        const batch = db.batch();
        const honingSessionRef = db.collection("users").doc(userId).collection("honingSessions").doc(sessionId);
        batch.update(honingSessionRef, { evaluation: evaluation, completed: true, userResponse: userResponse });

        const dnaDocRef = db.collection("users").doc(userId).collection("employeeDNA").doc("current");
        const newSynergyScore = (employeeDNA!.synergyScore || 0) + evaluation.synergyDelta;
        
        // Update trait score
        const newTraits = employeeDNA!.selectedTraits.map((trait: any) => {
            if (trait.name === traitName) {
                return { ...trait, score: (trait.score || 0) + evaluation.traitGain };
            }
            return trait;
        });

        batch.update(dnaDocRef, { 
          synergyScore: newSynergyScore,
          selectedTraits: newTraits,
          version: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Create history snapshot
        const historyDocRef = db.collection("users").doc(userId).collection("dnaHistory").doc();
        batch.set(historyDocRef, {
            userId,
            dnaSnapshot: { ...employeeDNA, selectedTraits: newTraits, synergyScore: newSynergyScore },
            synergyScore: newSynergyScore,
            trigger: "honing-session",
            delta: evaluation.synergyDelta,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        await batch.commit();

        return { status: "success", evaluation };
    } catch (error) {
        console.error("Error in evaluateHoningResponse:", error);
        throw new functions.https.HttpsError("internal", "Failed to evaluate honing response.", error);
    }
});


// =================================================================================
// 4. Honing Lab Scenario Generation (Genkit/Gemini)
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
// 5. HR Neural Insights (Genkit/Gemini)
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

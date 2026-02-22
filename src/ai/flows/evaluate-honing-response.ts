'use server';
/**
 * @fileOverview This Genkit flow has been migrated to a Firebase Cloud Function.
 * The logic for evaluating a honing response now resides in 'functions/src/index.ts'
 * within the 'evaluateHoningResponse' callable function. This change was made to
 * use the Firebase Admin SDK for secure, server-side writes to Firestore, bypassing
 * client-side security rules, and to directly integrate with the Claude API via `fetch`.
 */

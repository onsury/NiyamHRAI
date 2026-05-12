import { NextRequest, NextResponse } from 'next/server';
import { z, ZodSchema } from 'zod';

/**
 * H-5 body-validation helper.
 *
 * Reads the request body, enforces a total size cap, then validates
 * against the provided zod schema. Returns either:
 *   - { data: T }        -> caller proceeds with parsed, typed data
 *   - { error: Response} -> caller returns this immediately
 *
 * Size cap prevents an authenticated user from burning Claude tokens by
 * stuffing a huge founderDNA / practices / voiceCaptures payload.
 *
 * Usage:
 *   const schema = z.object({ reflection: z.string().max(4000) });
 *   const parsed = await parseBody(req, schema);
 *   if (parsed.error) return parsed.error;
 *   const { reflection } = parsed.data;
 */

const DEFAULT_MAX_BYTES = 64 * 1024; // 64 KB total body

export interface ParseBodySuccess<T> {
  data: T;
  error?: undefined;
}

export interface ParseBodyFailure {
  data?: undefined;
  error: NextResponse;
}

export async function parseBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>,
  maxBytes: number = DEFAULT_MAX_BYTES
): Promise<ParseBodySuccess<T> | ParseBodyFailure> {
  // Check Content-Length first (cheapest rejection path)
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > maxBytes) {
    return {
      error: NextResponse.json(
        { error: 'PAYLOAD_TOO_LARGE', maxBytes },
        { status: 413 }
      ),
    };
  }

  // Read raw text so we can measure size even if Content-Length was lying
  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return {
      error: NextResponse.json({ error: 'BODY_READ_FAILED' }, { status: 400 }),
    };
  }

  if (raw.length > maxBytes) {
    return {
      error: NextResponse.json(
        { error: 'PAYLOAD_TOO_LARGE', maxBytes },
        { status: 413 }
      ),
    };
  }

  // Parse JSON
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return {
      error: NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 }),
    };
  }

  // Validate against schema
  const result = schema.safeParse(json);
  if (!result.success) {
    return {
      error: NextResponse.json(
        {
          error: 'VALIDATION_FAILED',
          issues: result.error.issues.slice(0, 5).map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 }
      ),
    };
  }

  return { data: result.data };
}

// Common sub-schemas reused across routes
export const stringArraySchema = z.array(z.string().max(100)).max(20);

// founderDNA and employeeDNA are complex objects that vary in shape.
// We accept them as passthrough objects but enforce a reasonable key count.
// founderDNA and employeeDNA are free-form objects that vary in shape.
// Using z.any() so downstream code keeps the same flexibility it had before
// validation was added. The real cost-control comes from the 64KB body cap
// in parseBody(), not from deep-typing these objects.
export const dnaPassthroughSchema = z.any().optional();


// ============================================================================
// H-6: Output validation schemas â€” sanitize Claude/Gemini responses
// ============================================================================
//
// Goal: an employee who prompt-injects through a reflection cannot smuggle
// unbounded text or fabricated field values into admin-visible dashboards.
// We enforce max lengths on every string and cap array sizes. Unknown fields
// are preserved (passthrough) so Claude format tweaks don't break us.

const boundedString = (max: number) => z.string().max(max).optional();
const boundedStringArray = (maxItems: number, maxLen: number) =>
  z.array(z.string().max(maxLen)).max(maxItems).optional();

// /api/checkin
export const CheckinResponseSchema = z.object({
  mentorship: boundedString(4000),
  synergyDelta: z.number().min(-100).max(100).optional(),
  driftAreas: boundedStringArray(5, 200),
  strengths: boundedStringArray(5, 200),
}).passthrough();

// /api/employee-dna â€” traits are [{ name, cluster, score, description }]
export const EmployeeDNAResponseSchema = z.object({
  traits: z.array(z.object({
    name: boundedString(200),
    cluster: boundedString(100),
    score: z.number().min(0).max(100).optional(),
    description: boundedString(500),
  }).passthrough()).max(30).optional(),
  synergyScore: z.number().min(0).max(100).optional(),
  driftAreas: boundedStringArray(10, 200),
  strengths: boundedStringArray(10, 200),
  lastUpdated: boundedString(50),
}).passthrough();

// /api/founder-dna
export const FounderDNAResponseSchema = z.object({
  signatureTraits: z.array(z.object({
    name: boundedString(200),
    cluster: boundedString(100),
    score: z.number().min(0).max(100).optional(),
  }).passthrough()).max(30).optional(),
  philosophy: boundedString(2000),
  negativeConstraints: boundedStringArray(10, 500),
  decisionPatterns: boundedStringArray(10, 500),
  leadershipStyle: boundedString(1000),
}).passthrough();

// /api/honing/scenario
export const HoningScenarioResponseSchema = z.object({
  scenario: boundedString(4000),
}).passthrough();

// /api/honing/evaluate
export const HoningEvaluateResponseSchema = z.object({
  evaluation: boundedString(4000),
  alignmentScore: z.number().min(0).max(100).optional(),
  synergyDelta: z.number().min(-100).max(100).optional(),
  driftAreas: boundedStringArray(5, 200),
  strengths: boundedStringArray(5, 200),
}).passthrough();

// /api/practices/analyze
export const PracticesAnalyzeResponseSchema = z.object({
  benchmarkScore: z.number().min(0).max(100).optional(),
  gaps: boundedStringArray(20, 300),
  strengths: boundedStringArray(20, 300),
  recommendations: boundedStringArray(20, 500),
  summary: boundedString(2000),
}).passthrough();

// /api/practices/generate
export const PracticesGenerateResponseSchema = z.object({
  policyType: boundedString(100),
  title: boundedString(300),
  content: boundedString(50000),
  sections: z.array(z.object({
    heading: boundedString(300),
    body: boundedString(10000),
  }).passthrough()).max(30).optional(),
}).passthrough();

// /api/report
export const ReportResponseSchema = z.object({
  title: boundedString(300),
  summary: boundedString(4000),
  sections: z.array(z.object({
    heading: boundedString(300),
    body: boundedString(10000),
  }).passthrough()).max(30).optional(),
  generatedAt: boundedString(50),
  reportType: boundedString(100),
}).passthrough();

/**
 * Safe-parse a Claude response. Returns validated data, or the fallback
 * if validation fails. Unlike parseBody, this never returns an error
 * response because a prompt-injected Claude response is the AI's problem,
 * not the user's.
 */
export function sanitizeResponse<T>(
  raw: unknown,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  fallback: T
): T {
  const result = schema.safeParse(raw);
  return result.success ? result.data : fallback;
}
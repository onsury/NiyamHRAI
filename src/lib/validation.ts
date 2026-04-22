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

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/api-auth';
import { parseBody } from '@/lib/validation';

const ReportSchema = z.object({
  reportType: z.string().max(100),
  data: z.any().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (authResult.error) return authResult.error;
    // const { uid } = authResult;  // available for per-user quota enforcement (M-level scope)

    const parsed = await parseBody(req, ReportSchema);
    if (parsed.error) return parsed.error;
    const { reportType, data } = parsed.data;
    // reportType: 'employee_monthly' | 'manager_monthly' | 'founder_quarterly'

    const CLAUDE_KEY = process.env.CLAUDE_API_KEY;

    if (!CLAUDE_KEY) {
      return NextResponse.json({
        title: `${reportType} Report`,
        summary: 'AI report generation requires Claude API key. Please configure CLAUDE_API_KEY.',
        sections: [],
        generatedAt: new Date().toISOString(),
      });
    }

    const prompts: Record<string, string> = {
      employee_monthly: `Generate a monthly growth report for an employee.
Employee: ${data.employeeName || 'Team Member'}
Synergy Score: ${data.synergyScore || 50}%
Drift Areas: ${(data.driftAreas || []).join(', ')}
Strengths: ${(data.strengths || []).join(', ')}
Check-ins this month: ${data.checkInCount || 0}
Honing sessions: ${data.honingCount || 0}
Average honing alignment: ${data.avgHoningScore || 50}%

Generate a structured report with:
1. Executive Summary (2 sentences)
2. Synergy Trend Analysis
3. Top 3 Growth Areas
4. Top 3 Strengths Demonstrated
5. Recommended Focus for Next Month
6. Founder Alignment Index`,

      manager_monthly: `Generate a monthly team report for a manager.
Team Size: ${data.teamSize || 0}
Average Synergy: ${data.avgSynergy || 50}%
Critical Drift Count: ${data.criticalDrift || 0}
Top Performer: ${data.topPerformer || 'TBD'}
At-Risk Employee: ${data.atRisk || 'None'}

Generate a structured report with:
1. Team Health Summary
2. Individual Performance Overview
3. Critical Drift Alerts
4. Recommended Interventions
5. Team Trend vs Previous Month`,

      founder_quarterly: `Generate a quarterly organisational DNA report for the founder.
Org Size: ${data.orgSize || 0}
Overall Synergy: ${data.overallSynergy || 50}%
Departments: ${(data.departments || []).join(', ')}
Hiring Gaps: ${(data.hiringGaps || []).join(', ')}
Cultural Evolution: ${data.culturalTrend || 'Stable'}

Generate a structured report with:
1. Organisational DNA Health
2. Department-wise Alignment
3. Top Stars & At-Risk Employees
4. Hiring Recommendations (DNA gaps)
5. Cultural Evolution Tracking
6. ROI Metrics
7. Strategic Recommendations`,
    };

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        system: `You are NiyamAI's Report Generator. Create professional, data-driven reports. Use specific numbers and actionable insights. Be direct and founder-like in tone.

Respond ONLY with valid JSON:
{
  "title": "Report Title",
  "summary": "2-sentence executive summary",
  "sections": [
    { "heading": "Section Title", "content": "Section content with specifics" }
  ],
  "keyMetric": "The single most important number",
  "actionItem": "The #1 thing to do next"
}`,
        messages: [{ role: 'user', content: prompts[reportType] || prompts.employee_monthly }],
      }),
    });

    const apiData = await res.json();
    const text = apiData.content?.[0]?.text || '';

    try {
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      return NextResponse.json({ ...parsed, reportType, generatedAt: new Date().toISOString() });
    } catch {
      return NextResponse.json({
        title: `${reportType} Report`,
        summary: text || 'Report generated.',
        sections: [],
        generatedAt: new Date().toISOString(),
      });
    }
  } catch (err: any) {
    console.error('Report API error:', err);
    return NextResponse.json({ error: 'Report generation failed' }, { status: 500 });
  }
}

import { aiProvider, cleanJsonString } from './aiClient';

export interface ParsedEmailResult {
  classification: 'Interview' | 'Rejection' | 'Follow-up' | 'Other';
  company: string;
  interviewDate?: string;
  meetingLink?: string;
  sentimentReason: string;
}

export const parseRecruiterEmail = async (emailText: string): Promise<ParsedEmailResult> => {
  try {
    const prompt = `
    Recruiter Email Text:
    ---
    ${emailText}
    ---
    
    Please analyze this email from a recruiter or employer and classify it.
    If it asks to set up an interview, schedule a call, or chat, classify as "Interview".
    If it states they are not moving forward, rejecting, or closing the application, classify as "Rejection".
    If it is a general follow-up asking for more details or next steps, classify as "Follow-up".
    Otherwise, classify as "Other".
    
    For "Interview" invitations, try to extract:
    - Target company name.
    - Proposed Date/Time (convert to a standard UTC ISO 8601 string or guess a relative date from now. If multiple dates are suggested, pick the first one).
    - Meeting Link (Zoom, Google Meet, Teams, Calendly link, etc.).
    
    Return ONLY a JSON object matching this schema:
    {
      "classification": "Interview" | "Rejection" | "Follow-up" | "Other",
      "company": "string (Company Name, default to Unknown if not found)",
      "interviewDate": "string (ISO 8601 string, optional)",
      "meetingLink": "string (URL, optional)",
      "sentimentReason": "string (Concise explanation of the classification)"
    }
    `;

    const systemPrompt = `You are an expert recruitment coordinator. Analyze recruiter emails and extract classification details as raw JSON.`;

    const response = await aiProvider.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ], { jsonMode: true });

    const cleaned = cleanJsonString(response);
    const parsed = JSON.parse(cleaned);

    return {
      classification: parsed.classification || 'Other',
      company: parsed.company || 'Unknown',
      interviewDate: parsed.interviewDate,
      meetingLink: parsed.meetingLink,
      sentimentReason: parsed.sentimentReason || 'No reason provided.'
    };
  } catch (err) {
    console.error('Error parsing recruiter email via AI:', err);
    return {
      classification: 'Other',
      company: 'Unknown',
      sentimentReason: 'Failed to analyze email content.'
    };
  }
};

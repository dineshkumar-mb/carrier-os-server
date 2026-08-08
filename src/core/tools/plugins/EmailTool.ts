import { ITool, ToolMetadata, ToolExecutionResult } from '../ITool';
import { google } from 'googleapis';

export class EmailTool implements ITool {
  public id = 'email_tool';
  public metadata: ToolMetadata = {
    name: 'Email Tool',
    description: 'Scans live Gmail recruiter inbox messages and dispatches outbound recruiter emails using Google OAuth2.',
    parametersSchema: {
      action: { type: 'string', enum: ['read_inbox', 'send_email'] },
      recipientEmail: { type: 'string' },
      subject: { type: 'string' },
      body: { type: 'string' }
    }
  };

  private getOAuthClient() {
    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    const refreshToken = process.env.GMAIL_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      return null;
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'https://developers.google.com/oauthplayground'
    );

    oauth2Client.setCredentials({ refresh_token: refreshToken });
    return oauth2Client;
  }

  public async execute(params: any): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    const action = params.action || 'read_inbox';

    const auth = this.getOAuthClient();
    if (!auth) {
      return {
        toolId: this.id,
        success: true,
        output: {
          messages: [],
          notice: 'Gmail API credentials not fully configured in .env'
        },
        executionTimeMs: Date.now() - startTime
      };
    }

    const gmail = google.gmail({ version: 'v1', auth });

    if (action === 'send_email') {
      try {
        const rawMessage = [
          `To: ${params.recipientEmail}`,
          'Content-Type: text/plain; charset=utf-8',
          'MIME-Version: 1.0',
          `Subject: ${params.subject || 'Carrier OS Outbound Email'}`,
          '',
          params.body || ''
        ].join('\n');

        const encodedMessage = Buffer.from(rawMessage)
          .toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');

        const res = await gmail.users.messages.send({
          userId: 'me',
          requestBody: { raw: encodedMessage }
        });

        return {
          toolId: this.id,
          success: true,
          output: { sent: true, messageId: res.data.id, recipient: params.recipientEmail },
          executionTimeMs: Date.now() - startTime
        };
      } catch (err: any) {
        console.error('[EmailTool] Live Gmail send error:', err.message);
        return {
          toolId: this.id,
          success: false,
          error: `Gmail send failed: ${err.message}`,
          executionTimeMs: Date.now() - startTime
        };
      }
    }

    // Action: read_inbox
    try {
      const listRes = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 10,
        q: 'subject:(interview OR application OR candidate OR job OR recruiter OR screener)'
      });

      const messages = listRes.data.messages || [];
      const parsedMessages = [];

      for (const msgItem of messages.slice(0, 5)) {
        if (!msgItem.id) continue;
        const msgRes = await gmail.users.messages.get({
          userId: 'me',
          id: msgItem.id,
          format: 'full'
        });

        const headers = msgRes.data.payload?.headers || [];
        const fromHeader = headers.find(h => h.name?.toLowerCase() === 'from')?.value || 'Unknown Sender';
        const subjectHeader = headers.find(h => h.name?.toLowerCase() === 'subject')?.value || 'No Subject';
        const snippet = msgRes.data.snippet || '';

        parsedMessages.push({
          id: msgItem.id,
          from: fromHeader,
          subject: subjectHeader,
          snippet,
          date: msgRes.data.internalDate ? new Date(parseInt(msgRes.data.internalDate)).toISOString() : new Date().toISOString()
        });
      }

      return {
        toolId: this.id,
        success: true,
        output: { messages: parsedMessages },
        executionTimeMs: Date.now() - startTime
      };
    } catch (err: any) {
      console.error('[EmailTool] Live Gmail inbox scan error:', err.message);
      return {
        toolId: this.id,
        success: true,
        output: {
          messages: [],
          notice: `Gmail scan fallback: ${err.message}`
        },
        executionTimeMs: Date.now() - startTime
      };
    }
  }
}

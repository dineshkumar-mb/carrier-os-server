import { CalendarEvent } from '../../models/CalendarEvent';

export const createInterviewEvent = async (
  userId: string,
  jobMatchId: string,
  company: string,
  startTimeStr: string,
  meetingLink?: string
) => {
  try {
    const startTime = startTimeStr ? new Date(startTimeStr) : new Date(Date.now() + 24 * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + 45 * 60 * 1000); // 45-minute default duration

    const checklist = [
      'Prepare 2-minute elevator pitch detailing your experience.',
      `Research ${company}'s core business model and products.`,
      'Review technical skills and framework methodologies.',
      'Formulate 3 strategic questions to ask the interviewer.',
      'Verify webcam, audio configurations, and test the meeting link.'
    ];

    const event = await CalendarEvent.create({
      userId,
      jobMatchId,
      company,
      title: `Interview with ${company}`,
      startTime,
      endTime,
      meetingLink,
      checklist
    });

    console.log(`[CalendarService] Scheduled interview calendar event for user ${userId} with ${company}.`);
    return event;
  } catch (err) {
    console.error('Error creating interview calendar event:', err);
    throw err;
  }
};

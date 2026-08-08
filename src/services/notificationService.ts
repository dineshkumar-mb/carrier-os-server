import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Notification } from '../models/Notification';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
let bot: TelegramBot | null = null;

if (token) {
  bot = new TelegramBot(token, { polling: false });
  console.log('[NotificationService] Telegram bot initialized.');
} else {
  console.log('[NotificationService] TELEGRAM_BOT_TOKEN not found. Running with mock notifications.');
}

export const sendNotification = async (userId: any, message: string) => {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      console.warn(`[NotificationService] User ${userId} not found.`);
      return;
    }

    // Save to Notification model (In-App)
    await Notification.create({
      userId,
      message,
      type: 'Job Alert',
      read: false,
      channel: 'In-App'
    });

    if (user.preferences?.notifyTelegram) {
      if (bot && user.telegramChatId) {
        await bot.sendMessage(user.telegramChatId, message);
        console.log(`[NotificationService] Sent Telegram message to ${user.telegramChatId}`);
      } else {
        // Fallback or mock
        console.log(`[NotificationService] MOCK TELEGRAM to User ${userId}: ${message}`);
      }
    }
  } catch (error) {
    console.error('[NotificationService] Error sending notification:', error);
  }
};

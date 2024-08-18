import TelegramBot from "node-telegram-bot-api";
import { NextResponse } from "next/server";

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN!);

export async function POST(request: any) {
    try {
         const body = await request.json();
         if (body.message && body.message.text === '/start') {
            const chatId = body.message.chat.id;
            const url = 'https://hamster-key-generator-c5ujg1dl0-fardins-projects-caa8af9b.vercel.app';
      
            await bot.sendMessage(chatId, 'Click the button below to start:', {
              reply_markup: {
                inline_keyboard: [
                  [{ text: 'Start', url: url }],
                ],
              },
            });
          }


      return NextResponse.json({message: 'success'},{status: 201})
    } catch (error) {
       return NextResponse.json({message: error} ,{status: 400})
    }
}
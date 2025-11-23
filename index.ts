import { Bot } from 'grammy'; // легкий современный выбор для Node/Bun телеграм ботов
import { ConvexHttpClient } from "convex/browser";
import { api } from './convex/_generated/api';
import dotenv from 'dotenv';
dotenv.config();

// Инициализация Convex клиента
const convexUrl = process.env.CONVEX_URL;
const convex = new ConvexHttpClient(convexUrl);

// Токен бота
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

const participants = [
  "1 - Аяз Оруджов",
  "2 - Булохова Екатерина",
  "3 - Никитенко Екатерина",
  "6- Нигметзянова Галия",
  "7- Коротченко Екатерина",
  "8- Слесарева Елена",
  "9- Андреева Екатерина",
  "10- Бородавкин Дмитрий",
];

// Функция создания кнопок
function getKeyboard(variants?:string[]) {
  return {
    inline_keyboard: participants.map((participant, index) => {
      return [{
        text: variants?.find(v => v === participant) ? `✅ ${participant}` : participant,
        callback_data: `vote_${index}`
      }] 
    })
  };
}

// Стартовое сообщение с вопросом
bot.command('start', async (ctx) => {
  await ctx.reply('Проголосуйте за своего любимого участника', {
    reply_markup: getKeyboard()
  });
});

// Обработка нажатия на кнопки
bot.on('callback_query:data', async (ctx) => {
  const userId = ctx.from.id;
  const choiceIndex = parseInt(ctx.callbackQuery.data.replace('vote_', ''), 10);
  const choice = participants[choiceIndex];
  // Проверяем, голосовал ли уже пользователь (запрос в Convex)
  const existingVote = await convex.query(api.votes.get, { userId: userId.toString(), choice: choice });

  if (existingVote) {
    await ctx.answerCallbackQuery({
      text: `Вы уже голосовали за: ${existingVote.choice}`,
      show_alert: true
    });
    return;
  }

  // Сохраняем голос пользователя (мутация в Convex)
  await convex.mutation(api.votes.pushVote, { userId: userId.toString(), choice: choice });
  const votes = await convex.query(api.votes.getVotesByUserId, { userId: userId.toString() });
  
  const variants=votes.map(v => v.choice);
  

  await ctx.answerCallbackQuery({ text: `Ваш голос записан! Вы проголосовали за: ${choice}` });
  await ctx.editMessageText(`Ваш голос записан! Вы проголосовали за: ${choice}`,{
    reply_markup: getKeyboard(variants)
  });
});

// Запуск бота
bot.start({
  onStart: info => console.log(`Bot started as @${info.username}`)
});

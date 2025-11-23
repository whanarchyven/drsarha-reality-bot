import { Bot } from 'grammy'; // легкий современный выбор для Node/Bun телеграм ботов
import { ConvexHttpClient } from "convex/browser";
import { api } from './convex/_generated/api';

// Инициализация Convex клиента
const convexUrl = process.env.CONVEX_URL;
const convex = new ConvexHttpClient(convexUrl);

// Токен бота
const bot = new Bot(process.env.BOT_TOKEN);

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
function getKeyboard() {
  return {
    inline_keyboard: participants.map((participant, index) => [
      { text: participant, callback_data: `vote_${index}` }
    ])
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
  const existingVote = await convex.query(api.votes.get, { userId: userId.toString() });

  if (existingVote) {
    await ctx.answerCallbackQuery({
      text: `Вы уже выбрали: ${existingVote.choice}`,
      show_alert: true
    });
    return;
  }

  // Сохраняем голос пользователя (мутация в Convex)
  await convex.mutation(api.votes.set, { userId: userId.toString(), choice: choice });

  await ctx.answerCallbackQuery({ text: `Спасибо за ваш выбор: ${choice}` });
  await ctx.editMessageText(`Спасибо за ваш выбор: ${choice}`);
});

// Запуск бота
bot.start({
  onStart: info => console.log(`Bot started as @${info.username}`)
});

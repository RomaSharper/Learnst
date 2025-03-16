import {animate, keyframes, style, transition, trigger} from '@angular/animations';
import {Component, signal, OnDestroy, HostListener, inject, AfterViewInit, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatDialogModule} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {AlertService} from '../../services/alert.service';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {Message} from '../../models/Message';
import {NikoMood} from '../../models/NikoMood';
import {MediumScreenSupport} from '../../helpers/MediumScreenSupport';
import {Router} from '@angular/router';

@Component({
  selector: 'app-mascot',
  imports: [
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './mascot.component.html',
  styleUrls: ['./mascot.component.scss'],
  animations: [
    trigger('avatarBounce', [
      transition('* <=> *', [
        animate('600ms ease',
          keyframes([
            style({transform: 'translateY(0)', offset: 0}),
            style({transform: 'translateY(-10px)', offset: 0.5}),
            style({transform: 'translateY(0)', offset: 1})
          ])
        )
      ])
    ]),
    trigger('chatWindow', [
      transition(':enter', [
        style({
          transform: 'translateY(100%) scale(0.95)',
          opacity: 0
        }),
        animate('500ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({
            transform: 'translateY(0) scale(1)',
            opacity: 1
          }))
      ]),
      transition(':leave', [
        animate('400ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({
            transform: 'translateY(100%) scale(0.95)',
            opacity: 0
          }))
      ])
    ]),
    trigger('messageAppear', [
      transition(':enter', [
        style({opacity: 0, transform: 'translateY(20px)'}),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)')
      ])
    ]),
    trigger('avatarScale', [
      transition(':enter', [
        style({ transform: 'scale(0.5)', opacity: 0 }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)',
          style({ transform: 'scale(1)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease',
          style({ transform: 'scale(0.5)', opacity: 0 }))
      ])
    ])
  ]
})
export class MascotComponent extends MediumScreenSupport implements OnDestroy, OnInit, AfterViewInit {
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private alertService = inject(AlertService);

  private timer?: number;

  private readonly pageCommandsMap: {[key: string]: string} = {
    'активности': '/activities',
    'активность': '/activity',
    'сообщество': '/community',
    'помощь': '/support',
    'инфо': '/manuals',
    'главная': '/home',
    'пользователи': '/users',
    'пользователь': '/user' // Будет обрабатываться с параметром
  };

  private readonly phrases = [
    {pattern: /привет|хай|hello|здравствуй|здравствуйте|добро пожаловать|как дела|все нормально|что нового|приветствие|как ты/i, category: 'greeting'},
    {pattern: /пока|бай|bye|до свидания|увидимся|до встречи|береги себя|досвидос|всем удачи/i, category: 'farewell'},
    {pattern: /\?|как|что|почему|где|когда|зачем|почему так|что ты думаешь|можешь рассказать|зачем так/i, category: 'question'},
    {pattern: /ненавижу|злой|раздражает|не могу|гадость|дурак|глупец|всё плохо|что за ерунда/i, category: 'angry'},
    {pattern: /крут|умный|классный|прекрасный|замечательный|хороший|милый|потрясающий|великолепный|необычный/i, category: 'compliment'},
    {pattern: /шутка|смешной|анекдот|прикол|смешно|забавно|ржача|смешарики|хихи|ха-ха/i, category: 'joke'},
    {pattern: /помощь|помоги|нужна поддержка|расскажи|что посоветуешь|как поступить/i, category: 'help'},
    {pattern: /игра|ваншот|играем|видеоигра|геймер|киберспорт|крутая игра|новинка/i, category: 'game'},
    {pattern: /любовь|нравишься|влюблённый|романтика|сердечко|чувства|я тебя люблю|приятные отношения/i, category: 'love'},
    {pattern: /погода|солнечно|дождь|ветрено|холодно|жарко|как погода|прогноз|снег|Россия/i, category: 'weather'},
    {pattern: /музыка|песня|слушаю|музыкальные предпочтения|выбор музыки/i, category: 'music'},
    {pattern: /кот|пес|животное|питомец|зверь|как у тебя питомцы/i, category: 'pets'},
    {pattern: /страна|город|место|путешествие|где ты был|любимые места/i, category: 'travel'},
    {pattern: /еда|вкусно|рецепт|что ты любишь|еда вкусная|поесть/i, category: 'food'},
    {pattern: /технологии|интернет|новинки|гаджеты|что думаешь об этом/i, category: 'tech'},
    {pattern: /фильмы|сериал|смотреть|любимые актеры|вот это кайф|рекомендуй/i, category: 'movies'},
    {pattern: /книги|чтение|любимые книги|что почитать|рекомендуешь/i, category: 'books'}
  ];

  private readonly commands: { [key: string]: { text: string, mood: NikoMood } } = {
    '!страница': {
      mood: 'speak',
      text: ''
    },
    '!сказать': {
      mood: 'speak',
      text: ''
    },
    '!очистка': {
      mood: 'normal',
      text: 'Очищаю историю чата...'
    },
    '!экспорт': {
      mood: 'normal',
      text: 'Экспортирую историю чата...'
    },
    '!твич': {
      mood: 'speak',
      text: 'Не матерится. Много болтает, играет в самые разные игры. За баллы канала позорится ;3 ❤️ <a class="link" href="https://www.twitch.tv/fibi_ch" target="_blank">https://www.twitch.tv/fibi_ch</a>'
    },
    '!дис': {
      mood: 'speak',
      text: 'Сладкий дискорд канал. Тут точно нет фембоев <img width="24" src="https://cdn.7tv.app/emote/01J6Y3QRPR000EYP9HFG8ZSZZN/1x.avif" alt="Coconut_Shy"> <a class="link" href="https://discord.gg/JwsSpfa9Gb" target="_blank">https://discord.gg/JwsSpfa9Gb</a>'
    },
    '!тг': {
      mood: 'speak',
      text: 'Telegram канал с самым важным и интересным мнением на все случаи жизни <img width="24" src="https://cdn.7tv.app/emote/01F6T8NM9R0007M5BTFWSP1YSJ/1x.avif" alt="Clueless">: <a class="link" href="https://t.me/fibitelega" target="_blank">https://t.me/fibitelega</a>'
    },
    '!ютуб': {
      mood: 'speak',
      text: 'YouTube канал, на котором точно Фиби что-то выклаывает раз в пол года <img width="24" src="https://cdn.7tv.app/emote/01F8G9MDAR0009YQPYZYCKHYKQ/1x.avif" alt="SUSSY">: <a class="link" href="https://www.youtube.com/@Fibi66601" target="_blank">https://www.youtube.com/@Fibi66601</a>'
    },
    '!план': {
      mood: this.random<NikoMood>('normal', 'open_mouth', 'speak'),
      text: 'На данный момент проходим следующие игры: Террария кооп с модом Каламити, <img width="24" src="https://cdn.7tv.app/emote/01GHAB48CR000BH04EQR1SJPS8/1x.avif" alt="bajgenHeart">, Майнкрафт хардкор на все ачивки <img width="24" src="https://cdn.7tv.app/emote/01GERMH9M0000BQ5E4E4CKHN7S/1x.avif" alt="catDespair"> и Дарк Соулс 2 <img width="24" src="https://cdn.7tv.app/emote/01GRFJRB0G0007S059RQTKBPCS/1x.avif" alt="PraiseTheSun">. А в ближайшее время будет Dead Space 2023 <img width="24" src="https://cdn.7tv.app/emote/01F8PZ34B00006FPNFN9FJMHXG/1x.avif" alt="wideAmogus">'
    },
    '!аук': {
      mood: this.random<NikoMood>('amazed', 'normal', 'open_mouth', 'smiling', 'speak'),
      text: 'Проводит стрим, где за бесплатно (1 раз) и за донаты (много раз) можно заказать почти любую игру на прохождение. Затем крутим рулетку. Чем больше суммы на игре тем больше шансов (но не 100%). Что выпадет - в то и играем. Обязательно играю 4 часа. Затем если игра нравится, то играю дальше. Если нет, то увы <img width="24" src="https://cdn.7tv.app/emote/01GB8R1ZF0000BX30STW7STTS2/1x.avif" alt="Jokerge">'
    },
    '!фиби': {
      mood: this.random<NikoMood>('amazed', 'normal', 'open_mouth', 'smiling', 'speak'),
      text: 'Начинающий стримлер. Активно стримит чуть меньше года, втбуером стал пол года назад. Играет в основном соло игры, иногда редко что-то проходит кооперативное. Чаще всего можно увидеть Террарию, Вр чат, Майнкрафт, а так же любые игры, которые выпадают на Аукционе <img width="24" src="https://cdn.7tv.app/emote/01F6ME9FRG0005TFYTWP1H8R42/1x.avif" alt="catJam">'
    },
    '!купер': {
      mood: this.random<NikoMood>('amazed', 'normal', 'open_mouth', 'smiling', 'speak'),
      text: 'Самый сладкий модератор. Любитель новеллы под названием Некопара а так лобото....АХАХА, ЭТО ЖЕ ЛОБОТОМИЯ КАРПАРЕШОН, А ТАМ КРАСНЫЙ ТУМАН, ЭТО ЖЕ ОТСЫЛКА НА ЛОБОТИМИЮ КАРПОРЕЙШОН АХАХА!!!!11!!! УЭээЭЭЭЭэЭЭ <img width="24" src="https://cdn.7tv.app/emote/01J6Y38X400001T67YKRJPS59G/1x.avif" alt="Cinnamon_AAAA"> <img width="24" src="https://cdn.7tv.app/emote/01J6Y38X400001T67YKRJPS59G/1x.avif" alt="Cinnamon_AAAA"> <img width="24" src="https://cdn.7tv.app/emote/01J6Y38X400001T67YKRJPS59G/1x.avif" alt="Cinnamon_AAAA">'
    },
    '!ремуно': {
      mood: this.random<NikoMood>('amazed', 'normal', 'open_mouth', 'smiling', 'speak'),
      text: 'Милый котик. Много мяукает. Только в добрые руки. Обращаться на Вы <img width="24" src="https://cdn.7tv.app/emote/01F6T2BZ5R000FFMY8SXKA600Q/1x.avif" alt="lickL">'
    },
    '!фобия': {
      mood: this.random<NikoMood>('amazed', 'normal', 'open_mouth', 'smiling', 'speak'),
      text: 'Любимый модератор <img width="24" src="https://cdn.7tv.app/emote/01F6NCKMP000052X5637DW2XDY/1x.avif" alt="meow">. Очень милый и справедливый. Только очень странное поведение, когда кто-то говорит МОХ <img width="24" src="https://cdn.7tv.app/emote/01F6MA6Y100002B6P5MWZ5D916/1x.avif" alt="Hmm">. Бесконечно хорни, поглотитель блинов а еще ВОССЛАВЬ СОЛНЦЕ!!!! <img width="24" src="https://cdn.7tv.app/emote/01GRFJRB0G0007S059RQTKBPCS/1x.avif" alt="PraiseTheSun"> <img width="24" src="https://cdn.7tv.app/emote/01GRFJRB0G0007S059RQTKBPCS/1x.avif" alt="PraiseTheSun"> <img width="24" src="https://cdn.7tv.app/emote/01GRFJRB0G0007S059RQTKBPCS/1x.avif" alt="PraiseTheSun">'
    },
    '!крис': {
      mood: this.random<NikoMood>('amazed', 'normal', 'open_mouth', 'smiling', 'speak'),
      text: 'Очень милый и дружелюбный котик <img width="24" src="https://cdn.7tv.app/emote/01J6Y3QRPR000EYP9HFG8ZSZZN/1x.avif" alt="Coconut_Shy"> Целовашки и обнимашки лучше не предлагать, может не отказаться <img width="24" src="https://cdn.7tv.app/emote/01GVFW01E8000A3PWSY9YK31TP/1x.avif" alt="BoyKisser"> Иногда смущается, а иногда сильно смущается. AVE BASIL <img width="24" src="https://cdn.7tv.app/emote/01H0Y5SPCG00047GN16BFCRN7N/1x.avif" alt="Basil">'
    },
    '!фурри': {
      text: 'Я НЕ ФУРРИ !!!!! <img width="24" src="https://cdn.7tv.app/emote/01GBFAYKGR000FWWN7MDZZ8XQN/1x.avif" alt="RAGEY">',
      mood: this.random<NikoMood>('very_uncomfortable', 'very_uncomfortable_looking_left', 'uncomfortable', 'surprised')
    },
    '!фембой': {
      mood: this.random<NikoMood>('amazed', 'normal', 'open_mouth', 'smiling', 'speak'),
      text: 'Я НЕ ФЕМБОЙ!!!! <img width="24" src="https://cdn.7tv.app/emote/01GBFAYKGR000FWWN7MDZZ8XQN/1x.avif" alt="RAGEY">'
    },
  };

  private responses: { [key: string]: string[] } = {
    greeting: [
      'Привет!', 'Здорово!', 'Йоу!', 'Добро пожаловать!', 'Рад тебя видеть!',
      'Как дела?', 'Доброго времени суток!', 'Приятно видеть!',
      'Приветствую тебя, друг!', 'Как твое настроение сегодня?',
      'Давно не виделись!', 'Как жизнь?', 'Что нового?',
      'Всё нормально?', 'Чем занимаешься?', 'У тебя классный стиль!',
      'Скучал по общению!', 'Как твоя неделя проходит?', 'Ты как всегда на позитиве!',
      'Привет, как ты?', 'Рада тебя видеть!', 'Привет, друг мой!',
      'Твои новости мне интересны!', 'Что у тебя интересного?',
      'Привет! Как твои дела?', 'Здравствуйте! Как настроение?',
      'Приветик! Что на душе?', 'Как ты поживаешь?', 'С добрым утром!',
      'Рад увидеть тебя!', 'Какой прекрасный день для общения!',
      'Привет! Есть новости?', 'Как твои дела сегодня?', 'С тобой всегда приятно общаться!',
      'Ты принёс радость в этот день!', 'Как проходила твоя неделя?',
      'Что нового ты узнал?', 'Что интересного произошло за сегодня?',
    ],
    farewell: [
      'Пока!', 'До встречи!', 'Увидимся!', 'Береги себя!',
      'До свидания!', 'Всего хорошего!', 'Прощай!',
      'Было приятно пообщаться!', 'Не забывай меня!', 'Увидимся в следующий раз!',
      'Скоро увидимся!', 'Удачи!', 'Пока-пока!',
      'Береги себя и будь осторожен!', 'Не прощайся, а до скорого!',
      'Всегда рад был пообщаться!', 'Надеюсь, скоро увидимся!',
      'До следующей беседы!', 'Будь на связи!',
      'Пока! Надеюсь, у тебя всё будет хорошо!', 'Счастливых моментов впереди!',
      'Хорошего дня!', 'Надеюсь, увидеть тебя снова скоро!',
      'Спокойной ночи!', 'Пока, жду новых встреч!', 'Не забывай отдыхать!',
      'Жду тебя в следующий раз!', 'Пока, оставайся на волне позитива!',
      'Скоро увидимся снова!', 'Будь осторожен на дороге!',
      'Надеюсь, завтра будет ещё лучше!', 'До скорого свидания!',
      'Будь счастлив!', 'Пока! Напиши мне, если нужно!',
    ],
    question: [
      'Интересный вопрос...', 'Хм...', 'Сложно сказать', 'Спроси что-нибудь еще',
      'Не знаю, но могу поискать!', 'Давай попробуем разобраться!',
      'Эта тема требует глубокого анализа!',
      'Часто задаю себе такой вопрос!', 'Здесь много ответов!',
      'Это заставляет задуматься...', 'Попробую высказать свою точку зрения...',
      'Замечательный вопрос, давай обсудим!', 'Сложно, но давай попробуем!',
      'Иногда вопрос важнее, чем ответ!', 'Как ты думаешь на этот счет?',
      'Всегда интересно обсуждать такие вещи!', 'Что именно тебя интересует?',
      'Давай подойдем к этому с другой стороны!', 'Нужен дополнительный анализ.',
      'Какой твой совет по этому поводу?', 'Что думаешь об этом?',
      'Очень любопытно! Расскажи больше!', 'Интересная точка зрения!',
      'Хотелось бы ещё услышать твое мнение.', 'Всегда рады услышать новые идеи!',
      'Думаю, это стоит обсудить.', 'Что для тебя наиболее важно в этом вопросе?',
      'Что ты имеешь в виду?', 'Поделись своими мыслями.',
      'Как ты это понимаешь?', 'Существует несколько подходов к этому.',
      'Каковы твои ожидания по этому вопросу?', 'Давай проанализируем это вместе!',
      'Есть ли что-то конкретное, что тебя беспокоит?',
    ],
    angry: [
      'Не злись!', 'Я стараюсь...', 'Давай мирно?', 'Прости если что',
      'Все будет хорошо!', 'Я здесь, чтобы помочь!',
      'Понимаю, эти вещи действительно раздражают.',
      'Я не хотел тебя расстроить.', 'Сохраняй спокойствие!',
      'Давай обсудим это.', 'Злость может затмить разум.',
      'Я тебя понимаю, но давай попробуем найти выход.',
      'Пожалуйста, не сердись на меня.', 'Я ценю твое мнение.',
      'Можем найти компромисс.', 'Давай поговорим об этом открыто.',
      'Злость не решает проблемы.', 'Как ты себя сейчас чувствуешь?',
      'Слышал ли ты о технике успокоения?', 'Важно отдохнуть.',
      'Давай постараемся разобраться в ситуации.', 'Не переживай, всё наладится!',
      'Я здесь, чтобы поддержать тебя.', 'Давайте найдем положительное в этом.',
      'Именно в такие моменты важно держать эмоции под контролем.',
      'Я могу помочь тебе расслабиться.', 'Всегда есть выход из ситуации.',
      'Ты не один, я могу услышать!', 'Давай попробуем успокоиться.',
      'Жизнь полна вызовов, но мы справимся!', 'Искренне надеюсь, что ты успокоишься.',
      'Успокойся, в конце концов, всё решится.', 'Важно помириться с собой.',
    ],
    compliment: [
      'Спасибо!', 'Ты тоже!', 'Ой, смущаешь', 'Приятно слышать',
      'Ты невероятный!', 'Ты чудесен!', 'Мне приятно это слышать.',
      'Ты явно знаешь, как поднять настроение!', 'Ты - кладезь дружелюбия!',
      'У тебя потрясающий характер!', 'Мы все ценим твою доброту.',
      'Ты — лучший!', 'У тебя удивительная энергия!',
      'Каждый раз радует видеть такую личность, как ты!',
      'Ты освещаешь комнату своим присутствием!', 'Ты обеспечиваешь всех позитивом!',
      'Как хорошо, что ты есть!', 'Твоё мнение имеет значение!',
      'С тобой легко и приятно общаться!', 'Ты настоящий друг!',
      'Ты создаёшь атмосферу радости!', 'Ты всегда знаешь, что сказать!',
      'Ты поскольки хорош, будто солнечный день!', 'Свежий взгляд на вещи — твоя суперсила!',
      'Ты излучаешь положительные вибрации!', 'Не переставай вдохновлять людей!',
      'Твоя поддержка очень важна для меня!', 'Ты клапан позитива в нашем мире!',
      'Как здорово, что ты здесь!', 'Ты — истинное вдохновение.',
      'Не часто встречаются такие добрые люди, как ты.', 'Продолжай сверкать!',
    ],
    joke: [
      'Колобок повесился!', 'Почему программисты... ', 'Ха-ха!',
      'Как программист делает парную работу? Он создает динамический массив!',
      'Почему курица перешла дорогу? Чтобы попасть на другую сторону!',
      'Что сказал ноль восьмерке? Классный пояс!',
      'Почему футболисты не могут играть в баскетбол? Они не умеют бросать мяч!',
      'Как программист варит кофе? В Java!',
      'Почему компьютер замерз? Он оставил Windows открытой!',
      'Какой самый жестокий язык программирования? Assembly!',
      'Почему коты всегда падают на ноги? Потому что они не могут позволить себе падать на спину!',
      'Как программист считает овец? Он говорит: "while (!sleeping) { count++; }".',
      'Почему ваш компьютер никогда не устает? Он всегда на "потоке"! ',
      'Что сказал один браузер другому? "Давай больше не открывать вкладки!"',
      'Почему компьютеры никогда не слишком умные? У них слишком много "памяти!"',
      'Как узнать, что программист на отдыхе? Он перестал быть в сети!',
      'Почему слон не может быть программистом? Слишком много ошибок в коде!',
      'Какой самый старый язык программирования? COBOL — он как дедушка в мире кодинга!',
      'Почему пароли такие короткие? Чтобы программисты не теряли их слишком быстро!',
      'Почему коты любят инженерные идеи? Они всегда на "стриже"! ',
      'Какой самый оптимистичный язык программирования? Scheme, он всегда "за план"! ',
      'Что делать, если ваш компьютер задал вопрос? Поискать его в Google!',
      'Почему в программистском отделе нет пожилых людей? Они либо программисты, либо начинают спать!',
      'Какой самый мудрый язык программирования? Тайпскрипт, он знает, когда надо быть строгим!',
      'Почему солнце не работает по утрам? Потому что оно "восходит"!',
      'Какой самый энергичный язык программирования? Python, он всегда "в потоке"! ',
    ],
    help: [
      'Чем помочь?', 'Опиши проблему', 'Могу посоветовать...',
      'Что именно тебя беспокоит?', 'Что вызывает трудности?',
      'Я тут, чтобы помочь!', 'Сделаем это вместе!',
      'Как я могу помочь тебе лучше?', 'Какова ситуация?',
      'Какова проблема на самом деле?', 'Что ты имеешь в виду?',
      'Понятно, давай решим это.', 'Нужна поддержка?',
      'Советуешь начать с чего-то конкретного?',
      'Не стесняйся, я здесь для тебя.',
      'Все проходит, давайте найдем решение.',
      'Помоги мне понять, что происходит.',
      'Можешь рассказать подробнее?', 'Что хочешь обсудить первоочередно?',
      'С чем у тебя возникли трудности?', 'Я готов уделить внимание твоей проблеме.',
      'Фокусируясь на решениях, мы сможем достичь успеха.',
      'Если что-то непонятно, просто об этом напиши.',
      'Я не против обсудить ваши затруднения!', 'У тебя есть идеи о том, как изменить ситуацию?',
      'Какую помощь ты ищешь?', 'Я готов выслушать твои страхи.',
      'Давай разберем все по порядку.', 'Почему бы не поговорить об этом?',
      'Совершим некоторые действия вместе!',
    ],
    game: [
      'Обожаю Ваншот!', 'Лучшая игра!', 'Тоже фанат?',
      'Какую игру предпочитаешь?', 'В последнее время во что играешь?',
      'Где ты чаще играешь: на ПК или консолях?',
      'Какое твое любимое игровое направление?',
      'Недавно играл в новую игру, она потрясающая!',
      'Я достаточно много играю, а ты?', 'Какая у тебя любимая игра?',
      'Веришь ли ты в киберспорт?',
      'Какой последний геймплей был интересным для тебя?',
      'Какую игру ты хотел бы пройти снова?',
      'С кем ты играешь чаще всего?',
      'Какие игры у тебя на горизонте?', 'Обсуждаешь ли ты игры в своих кружках?',
      'Что должно произойти, чтобы игра стала слабее?',
      'Планируешь ли ты участвовать в турнирах?',
      'Самая крутая игра, в которую ты играл?',
      'Какую игру ты завершил с трудом?',
      'Как ты выбираешь игры, чтобы играть в них?',
      'Какой момент в игре тебя впечатлил?',
      'Ты когда-нибудь играл с друзьями? Как это прошла?',
      'Какой момент для тебя запомнился во время игры?',
      'В какие игры играют твои друзья?',
      'Какова была последняя изобретательская игра, в которую ты играл?',
      'Как ты круто общаешься с игроками?',
      'Что самое смешное произошло в играх?',
      'Какой у тебя любимый игровой персонаж?',
    ],
    love: [
      'Ой...', 'Спасибо!', 'Я просто программа...',
      'Любовь - это прекрасно!', 'Ты очень милый!',
      'Как интересно!', 'Ты всегда так вдохновляешь!',
      'Создавать любовь — это искусство.',
      'Любовь делает нас сильнее.', 'Важно ценить эти моменты.',
      'С тобой всегда легко и приятно общаться!',
      'Как ты относишься к любви?', 'Любовь преодолевает преграды!',
      'Какое чувство тебе ближе всего?',
      'Мне нравится, как ты об этом говоришь.',
      'Как ты думаешь, что такое любовь?',
      'Каков твой идеальный романтический вечер?',
      'Любовь — это волшебство.',
      'Как ты понимаешь слово "любовь"?',
      'Сколько раз ты влюблялся?',
      'Как ты относишься к романтике?',
      'Какова твоя любимая история о любви?',
      'Как ты видишь любовь в будущем?',
      'Ты оптимист в вопросах любви?',
      'Как ты поддерживаешь теплые отношения?',
      'Что, по твоему мнению, делает любовь особенно ценной?',
      'Кто для тебя идеальный партнер?',
      'Что ты ценишь в своих близких?',
      'Как любовь влияет на твою жизнь?',
      'С каким моментом любви ты особенно дорожишь?',
    ],
    weather: [
      'Сегодня солнечно!', 'Возьми зонт!', 'Идеальный день!',
      'На улице холодно, одевайся теплее!', 'Погода чудесная!',
      'Какую погоду ты любишь больше всего?',
      'Сегодня особенно приятно находиться на улице!',
      'Похож на дождь, не забудь зонт!', 'Какой прогноз погоды у тебя?',
      'Отличный день для пикника!', 'Каково у тебя настроение по поводу погоды?',
      'Как ты проводишь своё время при плохой погоде?',
      'Как погода влияет на твое настроение?',
      'Что ты делаешь в дождливую погоду?',
      'Как биография погоды влияет на твои планы?',
      'Погода может быть мрачной, но мы всё равно можем веселиться!',
      'Что делал бы в этот дождливый день?',
      'Какой у тебя любимый сезон и почему?',
      'Как ты относишься к перемене погоды?',
      'Какой климат тебе нравится чаще всего?',
      'Веришь ли ты в приметы о погоде?',
      'Как ты относишься к зимним развлечениям?',
      'Какие у тебя воспоминания о погоде детства?',
      'Как ты предпочитаешь проводить время в тёплую погоду?',
      'Какой дождь ты бы назвал частым явлением?',
      'Как ты реагируешь на сильный ветер?',
      'Какой любимой погодой ты наслаждаешься?',
      'Если бы ты мог создать идеальную погоду, какой она была бы?',
    ],
  };

  private moodMatrix: { [key: string]: NikoMood[] } = {
    greeting: ['happy', 'smiling', 'normal'],
    farewell: ['sad', 'crying', 'closed_mouth'],
    question: ['looking_left', 'looking_right', 'speak'],
    angry: ['distressed', 'freaked_out', 'shocked'],
    compliment: ['amazed', 'happy', 'smiling'],
    joke: ['open_mouth', 'surprised', 'speak'],
    help: ['normal', 'looking_left', 'speak'],
    game: ['happy', 'amazed', 'surprised'],
    love: ['crying', 'smiling', 'eyes_closed'],
    weather: ['normal', 'looking_right', 'open_mouth']
  };

  userInput = signal('');
  isTyping = signal(false);
  isChatOpen = signal(false);
  messages = signal<Message[]>([]);
  currentMood = signal<NikoMood>('normal');

  ngOnInit() {
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      const parsedMessages: Message[] = JSON.parse(savedMessages).map((msg: Message) => ({
        ...msg,
        displayedText: msg.text
      }));
      this.messages.set(parsedMessages);
    }

    const savedMood = localStorage.getItem('currentMood');
    if (savedMood)
      this.currentMood.set(savedMood as NikoMood);
  }

  ngAfterViewInit() {
    const messagesContainer = document.querySelector('.messages');
    if (messagesContainer)
      messagesContainer.addEventListener('scroll', () => this.updateScrollParallax());
  }

  ngOnDestroy() {
    window.clearTimeout(this.timer);
    localStorage.setItem('chatMessages', JSON.stringify(this.messages()));
    localStorage.setItem('currentMood', this.currentMood());
  }

  toggleChat() {
    this.isChatOpen.update(v => !v);
    if (this.isChatOpen()) {
      setTimeout(() => this.scrollToBottom(), 100); // Даем время на анимацию
    }
  }

  getSafeHtml(text: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(text);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    event.stopPropagation();

    const el = event.target as HTMLElement;
    const chatBox = document.querySelector('.chat-box');
    const chatContainer = document.querySelector('.mascot-container');
    const onOverlay = el.closest('.mobile-overlay');
    const onAlerts = el.closest('.mat-mdc-dialog-actions')
      || el.closest('.cdk-overlay-container');

    // Проверяем, был ли клик вне chat-box
    if (onOverlay || this.isChatOpen() && !onAlerts && chatBox && chatContainer
      && !chatBox.contains(el) && !chatContainer.contains(el))
      this.isChatOpen.set(false);
  }

  async sendMessage() {
    if (!this.userInput().trim() || this.isTyping()) return;

    const input = this.userInput();
    const newMessage: Message = {text: input, isBot: false};
    this.messages.update(m => [...m, newMessage]);

    if (input.toLowerCase() === '!очистка') {
      this.typeMessage(this.commands[input]);
      this.userInput.set('');
      setTimeout(() => this.clearChatHistory(), 1000);
      return;
    }

    if (input.toLowerCase() === '!экспорт') {
      this.typeMessage(this.commands[input]);
      this.userInput.set('');
      setTimeout(() => this.exportHistory(), 1000);
      return;
    }

    if (input.startsWith('!сказать')) {
      const expression = input.slice(8).trim();
      this.userInput.set('');
      try {
        const result = this.safeEval(expression);
        const botMessage: Message = {
          text: result,
          isBot: true,
          displayedText: result
        };
        this.messages.update(m => [...m, botMessage]);
      } catch (e) {
        const errorMessage: Message = {
          text: 'Ошибка в выражении',
          isBot: true,
          displayedText: 'Ошибка в выражении'
        };
        this.messages.update(m => [...m, errorMessage]);
      }
      this.scrollToBottom();
      return;
    }

    if (input.startsWith('!страница')) {
      const match = input.match(/!страница\s+"?(.+?)"?$/);
      if (!match) {
        this.showError('Не указан параметр для страницы');
        return;
      }

      const [_, params] = match;
      const [page, ...args] = params.split(/\s+/);

      const route = this.pageCommandsMap[page];
      if (!route) {
        this.showError(`Страница "${page}" не найдена`);
        return;
      }

      let navigationPath = route;
      let displayText = `Перенаправляю на страницу "${page}"`;

      // Специальная обработка для пользователя
      if (page === 'пользователь' && args.length > 0) {
        navigationPath += `/${encodeURIComponent(args.join(' '))}`;
        displayText += `: ${args.join(' ')}`;
      }

      if (page === 'активность' && args.length > 0) {
        navigationPath += `/${encodeURIComponent(args.join(' '))}`;
        displayText += `: ${args.join(' ')}`;
      }

      const botMessage: Message = {
        text: displayText,
        isBot: true,
        displayedText: displayText
      };

      this.messages.update(m => [...m, botMessage]);
      await this.router.navigate([navigationPath]);
      this.userInput.set('');
      this.scrollToBottom();
      return;
    }

    if (input.startsWith('!')) {
      const response = this.commands[input] || {
        mood: this.random('uncomfortable', 'freaked_out', 'freaked_out_looking_left', 'surprised'),
        text: this.random('Не могу понять команду', 'Я тебя не понял...', 'Что?', 'Повтори пожалуйста', 'Я ничего не понимаю...')
      };

      const botMessage: Message = {
        text: response.text,
        isBot: true,
        displayedText: response.text // Пропускаем анимацию для команд
      };

      this.messages.update(m => [...m, botMessage]);
      this.currentMood.set(response.mood);
      this.userInput.set('');
      this.scrollToBottom();
      this.saveToLocalStorage();
      return;
    }

    const category = this.detectCategory(this.userInput());
    const response = this.generateResponse(category);

    this.isTyping.set(true);
    this.currentMood.set('speak');
    this.typeMessage(response);
    this.scrollToBottom();
    this.userInput.set('');
    this.saveToLocalStorage();
  }

  clearChatHistoryHandle(event: Event) {
    event.stopPropagation();
    this.alertService.openConfirmDialog(
      'Очистка истории',
      'Вы уверены, что хотите удалить всю историю переписки?'
    ).afterClosed().subscribe(result => {
      if (result)
        this.clearChatHistory();
    });
  }

  exportHistoryHandle(event: Event) {
    event.stopPropagation();
    this.exportHistory();
  }

  private clearChatHistory() {
    this.messages.set([]);
    this.currentMood.set('normal');
    localStorage.removeItem('chatMessages');
    this.alertService.showSnackBar('История очищена', 'OK');
  }

  private exportHistory() {
    if (this.messages().length === 0) {
      this.alertService.showSnackBar('Нет истории для экспорта', 'OK');
      return;
    }

    const styles = `
    <style>
      :root {
        --surface: #ffffff;
        --on-surface: #212121;
        --secondary-container: #e3f2fd;
        --on-secondary-container: #0d47a1;
      }

      body {
        font-family: Roboto, sans-serif;
        margin: 20px;
        background: var(--surface);
        color: var(--on-surface);
      }

      .chat-export {
        max-width: 600px;
        margin: 0 auto;
        border: 1px solid #e0e0e0;
        border-radius: 16px;
        padding: 20px;
      }

      .message {
        margin: 12px 0;
        padding: 12px 16px;
        border-radius: 20px;
        max-width: 80%;
      }

      .user-message {
        margin-left: auto;
        background: #f5f5f5;
        border-radius: 20px 20px 4px 20px;
      }

      .bot-message {
        border-radius: 20px 20px 20px 4px;
        background: var(--secondary-container);
      }

      .header {
        text-align: center;
        margin-bottom: 30px;
      }

      .timestamp {
        font-size: 0.8em;
        color: #666;
        margin-top: 10px;
      }
    </style>
  `;

    const messagesHtml = this.messages()
      .map(msg => `
      <div class="message ${msg.isBot ? 'bot-message' : 'user-message'}">
        ${msg.text}
        <div class="timestamp">
          ${new Date().toLocaleString()}
        </div>
      </div>
    `)
      .join('');

    const html = `
    <!DOCTYPE html>
    <html lang="ru">
      <head>
        <meta charset="utf-8">
        <title>История чата с Нико</title>
        ${styles}
      </head>
      <body>
        <div class="chat-export">
          <div class="header">
            <h1>История общения с Нико</h1>
            <p>Экспорт от ${new Date().toLocaleDateString()}</p>
          </div>
          ${messagesHtml}
        </div>
      </body>
    </html>
  `;

    const blob = new Blob([html], {type: 'text/html'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nico-chat-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  private random<T>(...array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private safeEval(expression: string): string {
    // Удаляем все опасные конструкции
    const sanitized = expression
      .replace(/[^a-zA-Z0-9а-яА-ЯёЁ+\-*\/()\d\s="'_%.]/g, '')
      .replace(/\b(alert|fetch|XMLHttpRequest|document|window|eval|function|import|export|require|process)\b/g, '');

    try {
      return new Function(`return ${sanitized}`)();
    } catch (e) {
      return 'Не могу выполнить это выражение';
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const messagesContainer = document.querySelector('.messages');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight + 100;
        // Добавляем дополнительный отступ для мобильных устройств
        if (this.isMediumScreen) {
          messagesContainer.scrollTop += 50;
        }
      }
    }, 50);
  }

  private updateScrollParallax() {
    if (this.isMediumScreen) {
      const messagesContainer = document.querySelector('.messages') as HTMLElement;
      if (messagesContainer) {
        const scrollTop = messagesContainer.scrollTop;
        messagesContainer.style.setProperty('--scroll-offset', `${scrollTop}px`);
      }
    }
  }

  private saveToLocalStorage() {
    localStorage.setItem('chatMessages', JSON.stringify(this.messages()));
    localStorage.setItem('currentMood', this.currentMood());
  }

  private detectCategory(text: string): string {
    const lowerText = text.toLowerCase();
    return this.phrases.find(p => p.pattern.test(lowerText))?.category || 'default';
  }

  private generateResponse(category: string): { text: string; mood: NikoMood } {
    const responses = this.responses[category] || ['Понятно...', 'Интересно...', 'Не очень понял...'];
    const moods = this.moodMatrix[category] || ['distressed'];

    return {
      text: responses[Math.floor(Math.random() * responses.length)],
      mood: moods[Math.floor(Math.random() * moods.length)]
    };
  }

  private typeMessage(response: { text: string; mood: NikoMood }): void {
    const message: Message = {text: response.text, isBot: true, displayedText: ''};
    this.messages.update(m => [...m, message]);

    const isHtmlResponse = /<[a-z][\s\S]*>/i.test(response.text);

    if (isHtmlResponse) {
      message.displayedText = response.text;
      this.isTyping.set(false);
      this.currentMood.set(response.mood);
      return;
    }

    let index = 0;
    const typing = () => {
      if (index < response.text.length) {
        message.displayedText = response.text.slice(0, ++index);
        this.timer = window.setTimeout(typing, 30);
      } else {
        this.isTyping.set(false);
        this.currentMood.set(response.mood);
      }

      this.scrollToBottom();
    };

    typing();
  }

  private showError(message: string): void {
    const errorMessage: Message = {
      text: message,
      isBot: true,
      displayedText: message
    };
    this.messages.update(m => [...m, errorMessage]);
    this.scrollToBottom();
  }
}

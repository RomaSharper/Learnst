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
import {ChatContext} from '../../models/ChatContext';
import {CryptoService} from '../../services/crypto.service';
import {environment} from '../../environments/environment';
import {NoDownloadingDirective} from '../../directives/no-downloading.directive';

@Component({
  selector: 'app-mascot',
  imports: [
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatTooltipModule,
    MatSnackBarModule,
    NoDownloadingDirective
  ],
  templateUrl: './mascot.component.html',
  styleUrls: ['./mascot.component.scss']
})
export class MascotComponent extends MediumScreenSupport implements OnDestroy, OnInit, AfterViewInit {
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private alertService = inject(AlertService);
  private readonly STORAGE_KEY = 'chat_data';

  private timer?: number;
  private moodIntensity: number = 0;
  private currentTopic: string = '';
  private context: ChatContext = {
    messages: [],
    currentMood: 'normal',
    moodIntensity: 0,
    currentTopic: '',
    complimentCounter: 0,
    nextComplimentAt: this.generateRandomComplimentThreshold(),
    lastTopics: [],
    mentionedEntities: [],
    userPreferences: {}
  };

  get messages() {
    return this.context.messages;
  }

  get currentMood() {
    return this.context.currentMood;
  }

  set currentMood(value: NikoMood) {
    this.context.currentMood = value;
  }

  private readonly pageCommandsMap: { [key: string]: string } = {
    'главная': '/home',
    'активности': '/activities',
    'активность': '/activity',
    'сообщество': '/community',
    'поддержка': '/support',
    'информация': '/manuals',
    'пользователи': '/users',
    'пользователь': '/user',
    'настройки': '/settings'
  };

  private readonly commands: { [key: string]: { text: string, mood: NikoMood } } = {
    '!страница': {mood: 'speak', text: ''},
    '!сказать': {mood: 'speak', text: ''},
    '!очистка': {mood: 'normal', text: 'Очищаю историю чата...'},
    '!экспорт': {mood: 'normal', text: 'Экспортирую историю чата...'},
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

  private readonly phrases = [
    {
      pattern: /(привет|ха[йя]|hello|hi|здрав?ств?уй(те)?|доброе?\sутро|добрый\s(день|вечер)|рад\sвидеть|давно\sне\sвиделись|как\sты\sтам|приветик|салют|здоров[оа]|добро\sпожаловать|как\sдела\?*|хей|хеллоу|здаров?а?|доброго\sвремени\sсуток)/i,
      category: 'greeting'
    },
    {
      pattern: /(пока|бай|bye|goodbye|до\s(свидания|встречи)|увидимся|чао|всего\s(хорошего|доброго)|бывай|береги\sсебя|досвидос|всем\sудачи|гудбай|спокойной\sночи|покеда|ариведерчи|прощай|до\sзавтра|бай-бай|покедова|покасики)/i,
      category: 'farewell'
    },
    {
      pattern: /(\?|как|что|почему|где|когда|зачем|откуда|куда|сколько|чей|какой|какая|какое|какие|расскажи|объясни|знаешь\sли|можешь\sли|подскажи|в\sчем\sпричина|в\sчем\sдело|как\sсдел|как\sработает|что\sесли|почему\sтак|что\sпосоветуешь)/i,
      category: 'question'
    },
    {
      pattern: /(ненавижу|злюсь|бесит|раздражает|надоело|устал|грустно|печаль|тоска|депресс|кошмар|ужас|отвратительно|мерзко|фигня|хреново|отстой|противно|гадость|тупость|дурак|идиот|достало|заколебало|надоед|разочарован|отврат|фу|тьфу)/i,
      category: 'angry'
    },
    {
      pattern: /(крут|умничк[аи]|молодец|талант|гениальн|шикарн|восхитительн|прелестн|обожаю|лучший|супер|потряс|восхищ|очаровательн|класс|великолепн|невероятн|божественн|чудо|красив[аоы]|мил|восхит|брав|умнище|красавч|огонь|шик|превосход)/i,
      category: 'compliment'
    },
    {
      pattern: /(шутк|прикол|смех|анекдот|юмор|прикольно|забавно|угар|ржу|ха-ха|хи-хи|рофл|lol|кек|сарказм|ирония|пародия|мем|мемчик|смехуечки|ржака|умора|приколь|смешнявк|ржач|угарн|весель)/i,
      category: 'joke'
    },
    {
      pattern: /(помоги|помощь|спас[иы]|выручи|подмог|поддержк|не\sработает|сломал[ао]сь|поломк|глюк|баг|ошибк|не\sпонимаю|запутал|застрял|тупик|как\s(сдел|использ|настро)|хелп|срочно\sнужно|выручай|не\sполучается|не\sработай)/i,
      category: 'help'
    },
    {
      pattern: /((video)?game|игр[ауы]|ваншот|гейм|steam|стим|кс?го|танки|майнкрафт|рпг|квест|стратеги|шутер|синглплеер|мультиплеер|прокачк|ачивк|достижени|левел|уровень|прокачаться|геймплей|сюжет|персонаж|босс|лут|крафт|ресурсы|инвентар)/i,
      category: 'game'
    },
    {
      pattern: /(любов|роман|сердц|чувств|влюб|свидан|отношен|романтик|обнимашк|целовашк|симпати|встречаться|пара|чувствую\sсебя|одинок|мечтаю|хочу\sвстреч|флирт|знакомств|романс|сердечко|валентинк)/i,
      category: 'love'
    },
    {
      pattern: /(погод|дожд|снег|град|ветер|солнц|жара|холод|мороз|туман|облач|ясн|температур|прогноз\sпогод|климат|заморозк|слякоть|гроза|молния|радуга|ураган|шторм|метель|ливень|снегопад|погодка)/i,
      category: 'weather'
    },
    {
      pattern: /(напомни|помнишь|мы\sговорили|ранее\sобсуждали|в\sпрошлый\sраз|как\sмы\sрешили|как\sдоговаривались|вспомни|предыдущ|прежде|уже\sбыло|напоминание|ранее\sупоминали|прошлый\sразговор)/i,
      category: 'memory'
    },
    {
      pattern: /(как\s(зовут|звать)|тво[её]\sимя|представься|имя\sкота|кличк|никак\sне\sзапомню|забыл\sимя|называй\sменя|зовут\sменя|твоя\sкличк|имя\sпитомц)/i,
      category: 'name_request'
    },
    {
      pattern: /(спасибо|благодар|ты\s(помог|выручил)|признателен|очень\sвыручил|ты\sмолодец|респект|уважуха|ты\sлучший|я\sоцен|ты\sкрут|мерси|пасиб|благодарючко|ты\sсупер)/i,
      category: 'thanks'
    },
    {
      pattern: /(врем[яи]|который\sчас|сколько\sвремени|часики|тайминг|опозда|успева|тороп|поздн|рано|таймер|будильник|расписан|хронометр|секундомер|время\sсейчас)/i,
      category: 'time'
    },
    {
      pattern: /(совет|посоветуй|как\sлучше|что\sвыбрать|рекомендац|помоги\sрешить|иде[яи]|подход|вариант|альтернатив|опыт\sв|мнение\sо|какой\sлучше|что\sпосовету|дай\sсовет)/i,
      category: 'advice'
    },
    {
      pattern: /(фильм|кино|сериал|нетфликс|смотрю|трейлер|режиссёр|акт[ёе]р|сюжет|кинопоиск|оскар|премия|блокбастер|драм|комеди|ужас|фантастик|мелодрам|биографи|мультфильм|аним[еэ])/i,
      category: 'movies'
    },
    {
      pattern: /(музык|песн|трек|плейлист|альбом|исполнитель|групп|рок|поп|джаз|классик|хит|ритм|мелоди|бит|бас|вокал|концерт|фестивал|диджей|ремикс|кавер|текст\sпесн)/i,
      category: 'music'
    },
    {
      pattern: /(еда|рецепт|готовить|вкусн|кулинар|блюд|завтрак|обед|ужин|десерт|перекус|продукт|ингредиент|специ|соус|приправ|кафе|ресторан|рецептик|вкусняш|деликатес|гастроном)/i,
      category: 'food'
    },
    {
      pattern: /(спорт|тренировк|зал|бег|йог|фитнес|качалк|бодибилдинг|кроссфит|марафон|чемпион|соревнован|олимпиад|разминк|мышц|пресс|подтягивани|отжимани|гантел|тренажер)/i,
      category: 'sport'
    },
    {
      pattern: /(книг|читать|литератур|автор|роман|фантастик|детектив|поэз|стих|библиотек|глава|сюжет|персонаж|издатель|бестселлер|буккроссинг|сага|новелл|антиутопи|фэнтези)/i,
      category: 'books'
    },
    {
      pattern: /(работ|карьер|проект|коллег|начальник|зарплат|офис|увольнен|совещани|дедлайн|стресс|переработк|фриланс|ваканс|должност|труд|задач|клиент|отчет)/i,
      category: 'work'
    },
    {
      pattern: /(уч[ёе]б|экзамен|сессия|преподаватель|универ|колледж|школ|лекци|семинар|зачёт|диплом|курсов|студен|академ|реферат|контрольн|задани|шпаргалк)/i,
      category: 'study'
    },
    {
      pattern: /(путешеств|отпуск|отдых|отель|билет|авиа|поездк|тур|виз|паспорт|чемодан|экскурс|достопримечательн|курорт|пляж|горы|багаж|роуминг|гид|туристическ)/i,
      category: 'travel'
    },
    {
      pattern: /(технолог|гаджет|смартфон|ноутбук|компьютер|видеокарт|процессор|софт|железо|айти|программир|код|алгоритм|шифрован|видюха|материнк|оперативк|девайс)/i,
      category: 'tech'
    },
    {
      pattern: /(мечт|цел|план|будущ|амбиц|хочу\sдобиться|планирую|намерен|стратеги|перспектив|исполнени|желани|хобби|увлечен|целеустремлени|мечтани|грандиозн)/i,
      category: 'dreams'
    },
    {
      pattern: /(кот|кошк|кот[ёе]нок|мурлык|хвост|усы|лапк|мяу|мур-мур|пушист|четвероног|питомец|хозяин|корм|лежанк|когтеточк|мурчани|кошачий|котэ|котейк)/i,
      category: 'pets'
    },
    {
      pattern: /(здоровь|болит|врач|больничн|лекарств|аптек|симптом|диагноз|лечен|процедур|терапи|самочувств|диет|витамин|анализ|давление|температур|аллерг)/i,
      category: 'health'
    },
    {
      pattern: /(деньг|финанс|бюджет|экономи|трат|зарплат|накоплен|кредит|долг|инвестиц|копилк|состояни|бедн|богат|валюта|крипт|биткоин|акци|ипотек|налог)/i,
      category: 'finance'
    },
    {
      pattern: /(?:меня зовут|мо[ёе] имя|обращайся ко мне|меня звать|я -|я —)\s+([А-Яа-яЁёA-Za-z-]+)/i,
      category: 'name_mention'
    },
  ];

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
    memory: [
      'Конечно помню! Мы говорили о $topic...',
      'Как забыть про $topic?',
      'Это было интересное обсуждение $topic!'
    ],
    name_request: [
      'Меня зовут Нико! А тебя?',
      'Я кот Нико, а ты?',
      'Нико. А как зовут тебя?'
    ],
    thanks: [
      'Всегда пожалуйста!', 'Рад был помочь!', 'Обращайся ещё!',
      'Для тебя всегда есть время!', 'Это моя работа!'
    ],
    time: [
      'Время для котика всегда одинаково - пора играть!',
      'Сейчас самое подходящее время для чая с печеньками',
      'Мои часы показывают время веселья!',
      'Точное время можно узнать в телефоне, я же кот!'
    ],
    advice: [
      'Мой совет - больше спать и есть вкусняшки!',
      'Попробуй спросить у Фиби, она умная!',
      'Лучший совет - доверься интуиции',
      'Сначала хорошо подумай, потом действуй'
    ],
    movies: [
      'Советую посмотреть "Котики на поводке"!',
      'Лучший фильм всех времён - "Ваншот: Последний клик"',
      'Как насчёт старого доброго аниме?',
      'Фиби недавно смотрела новый хоррор, спроси у неё'
    ],
    music: [
      'Сейчас в тренде мяуканье под джаз!',
      'Включи lo-fi и расслабься',
      'Рекомендую группу "Мурчальные ритмы"',
      'Лучшая музыка - звуки природы'
    ],
    food: [
      'Попробуй тунца под соусом из сметаны!',
      'Идеальный ужин - рыба с картошкой',
      'Главное - не пережарь печеньки!',
      'Спроси у Фиби её фирменный рецепт'
    ],
    sport: [
      'Мой любимый спорт - бег за лазерной точкой!',
      'Йога для котиков: 18 часов сна в день',
      'Главное - регулярность!',
      'Не забывай разминаться!'
    ],
    books: [
      'Обязательно прочти "Мур-мур-терапия"!',
      'Лучшая книга - поваренная книга для котиков',
      'Как насчёт классики? "Война и мир" с котом Бегемотом',
      'Фиби любит детективы, спроси у неё'
    ],
    work: [
      'Не работай слишком много!',
      'Помни про перерывы на кофе',
      'Лучшая работа - лежать на солнышке',
      'Главное - хороший коллектив!'
    ],
    study: [
      'Учись как кот - с любопытством!',
      'Не зубри, а понимай!',
      'Делай перерывы на игры',
      'Помни: практика важнее теории'
    ],
    travel: [
      'Хочу в Японию! Там лучшая рыба!',
      'Идеальное путешествие - диван и телевизор',
      'Не забудь взять меня с собой!',
      'Спроси у Фиби про её поездки'
    ],
    tech: [
      'Новый айфон? Лучше купи вкусняшек!',
      'Главное в технике - чтобы мышка бегала',
      'Не забывай иногда отключаться от гаджетов',
      'Лучшее изобретение - автоматическая кормушка'
    ],
    dreams: [
      'Мечтай как кот - масштабно!',
      'Главная цель - мировая власть... мур-мур',
      'Не останавливайся на достигнутом!',
      'Разбивай большие цели на маленькие шаги'
    ],
    health: [
      'Не забывай высыпаться!',
      'Здоровье важнее всего!',
      'Может сделать перерыв?',
      'Советую кошачью мяту!'
    ],
    finance: [
      'Инвестируй в корм!',
      'Экономить - это по-кошачьи!',
      'Лучший бюджет - когда есть запасы',
      'Не забудь про сбережения'
    ],
    pets: [
      'Коты - лучшие существа!',
      'У тебя есть питомец?',
      'Все котики заслуживают любви',
      'Мур-мур-терапия лучшая!'
    ],
    name_mention: [
      'Приятно познакомиться, $name! Меня зовут Нико!',
      'Запомнил, $name! А меня кстати Нико зовут!',
      'Буду звать тебя $name! А ты называй меня Нико!',
      'Хорошее имя, $name! А меня Нико зовут!'
    ]
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
    weather: ['normal', 'looking_right', 'open_mouth'],
    memory: ['normal', 'looking_left', 'looking_right'],
    name_request: ['open_mouth', 'speak', 'happy'],
    thanks: ['happy', 'smiling', 'eyes_closed'],
    time: ['looking_left', 'looking_right', 'normal'],
    advice: ['looking_left', 'looking_right', 'speak', 'normal'],
    movies: ['amazed', 'surprised', 'happy'],
    music: ['happy', 'smiling'],
    food: ['open_mouth', 'eating_a_pancake', 'happy'],
    sport: ['speak', 'smiling', 'normal'],
    books: ['normal', 'looking_left', 'looking_right'],
    work: ['distressed', 'uncomfortable', 'normal'],
    study: ['normal', 'speak'],
    travel: ['amazed', 'happy', 'surprised'],
    tech: ['looking_right', 'normal', 'speak'],
    dreams: ['eyes_closed', 'happy', 'smiling']
  };

  userInput = signal('');
  isTyping = signal(false);
  isChatOpen = signal(false);
  scaleTrigger = signal(false);
  bounceTrigger = signal(false);

  ngOnInit() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const encryptedData = localStorage.getItem(this.STORAGE_KEY);
    if (encryptedData) {
      const data = CryptoService.decryptData<ChatContext>(encryptedData, environment.encryptionKey);
      if (data) {
        this.context = {
          ...this.context,
          ...data,
          messages: data.messages.map(msg => ({
            ...msg,
            displayedText: msg.text // Восстанавливаем отображение
          }))
        };
      }
    }
  }

  private saveToLocalStorage() {
    const dataToSave = {
      ...this.context,
      messages: this.context.messages.map(({text, isBot}) => ({text, isBot}))
    };

    const encryptedData = CryptoService.encryptData(dataToSave, environment.encryptionKey);
    localStorage.setItem(this.STORAGE_KEY, encryptedData);
  }

  private clearChatHistory() {
    this.context = {
      messages: [],
      currentMood: 'normal',
      moodIntensity: 0,
      currentTopic: '',
      complimentCounter: 0,
      nextComplimentAt: this.generateRandomComplimentThreshold(),
      lastTopics: [],
      mentionedEntities: [],
      userPreferences: {}
    };
    localStorage.removeItem(this.STORAGE_KEY);
  }

  ngAfterViewInit() {
    const messagesContainer = document.querySelector('.messages');
    if (messagesContainer)
      messagesContainer.addEventListener('scroll', () => this.updateScrollParallax());
  }

  ngOnDestroy() {
    window.clearTimeout(this.timer);
    this.saveToLocalStorage();
  }

  toggleChat() {
    this.bounceTrigger.set(true);
    const wasOpen = this.isChatOpen();
    this.isChatOpen.update(v => !v);

    if (!wasOpen) {
      setTimeout(() => {
        this.scrollToBottom();
      }, 100);
    }

    setTimeout(() => {
      this.bounceTrigger.set(false);
    }, 600);
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

    if (onOverlay || this.isChatOpen() && !onAlerts && chatBox && chatContainer
      && !chatBox.contains(el) && !chatContainer.contains(el))
      this.isChatOpen.set(false);
  }

  async sendMessage() {
    if (!this.userInput().trim() || this.isTyping()) return;

    const input = this.userInput().trim();
    const newMessage: Message = {text: input, isBot: false};
    this.context.messages.push(newMessage);

    if (input === 'ь.') {
      this.typeMessage({text: 'ь.', mood: 'april_fools'});
      this.userInput.set('');
      return;
    }

    if (input.toLowerCase().includes('гойда')) {
      this.typeMessage({text: 'ГОЙДА!', mood: 'amazed'});
      this.userInput.set('');
      return;
    }

    if (input === '!очистка') {
      this.typeMessage(this.commands[input]);
      this.userInput.set('');
      setTimeout(() => this.clearChatHistory(), 1000);
      return;
    }

    if (input === '!экспорт') {
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
        this.context.messages.push(botMessage);
      } catch (e) {
        const errorMessage: Message = {
          text: 'Ошибка в выражении',
          isBot: true,
          displayedText: 'Ошибка в выражении'
        };
        this.context.messages.push(errorMessage);
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

      this.context.messages.push(botMessage);
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
        displayedText: response.text
      };

      this.context.messages.push(botMessage);
      this.context.currentMood = response.mood;
      this.userInput.set('');
      this.scrollToBottom();
      this.saveToLocalStorage();
      return;
    }

    const category = this.detectCategory(input);
    const response = this.generateResponse(category);

    this.isTyping.set(true);
    this.context.currentMood = 'speak';
    this.typeMessage(response);
    this.scrollToBottom();
    this.userInput.set('');

    this.updateContext(input, category);
    this.updateMood(category);
    this.saveToLocalStorage();
  }

  clearChatHistoryHandle(event: Event) {
    event.stopPropagation();
    this.alertService.openConfirmDialog(
      'Очистка истории',
      'Вы уверены, что хотите удалить всю историю переписки?'
    ).afterClosed().subscribe(result => {
      if (result) this.clearChatHistory();
    });
  }

  exportHistoryHandle(event: Event) {
    event.stopPropagation();
    this.exportHistory();
  }

  private exportHistory() {
    if (this.messages.length === 0) {
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

    const messagesHtml = this.messages
      .map(msg => `
      <div class="message ${msg.isBot ? 'bot-message' : 'user-message'}">
        ${msg.text}
        <div class="timestamp">
          ${new Date().toLocaleString()}
        </div>
      </div>
    `).join('');

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
    const sanitized = expression.replace(/[^a-zA-Z0-9а-яА-ЯёЁ+\-*\/()\d\s="'_%.]/g, '')
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
      if (!messagesContainer) return;
      messagesContainer.scrollTop = messagesContainer.scrollHeight + 100;
      if (this.isMediumScreen)
        messagesContainer.scrollTop += 50;
    }, 50);
  }

  private updateScrollParallax() {
    if (!this.isMediumScreen) return;
    const messagesContainer = document.querySelector('.messages') as HTMLElement;
    if (!messagesContainer) return;
    const scrollTop = messagesContainer.scrollTop;
    messagesContainer.style.setProperty('--scroll-offset', `${scrollTop}px`);
  }

  private detectCategory(text: string): string {
    const lowerText = text.toLowerCase();
    const foundPhrase = this.phrases.find(p => {
      const match = p.pattern.exec(lowerText);
      if (match && p.category === 'name_mention' && match[1])
        this.context.userPreferences.name = match[1];
      return p.pattern.test(lowerText);
    });

    return foundPhrase?.category || 'default';
  }

  private generateResponse(category: string): { text: string; mood: NikoMood } {
    let baseResponse = this.getBaseResponse(category);
    baseResponse = this.applyContextModifications(baseResponse);
    baseResponse = this.applyMoodModifications(baseResponse);
    console.log(`Niko's mood (-5:5): ${this.moodIntensity}`);

    return {
      text: baseResponse,
      mood: this.calculateCurrentMood()
    };
  }

  private getBaseResponse(category: string): string {
    const responses = this.responses[category] || ['Мяу...'];
    const response = this.random(...responses);

    // Замена специальных тегов
    return response.replace(/\$topic/g, this.currentTopic)
      .replace(/\$entity/g, this.context.mentionedEntities[0] || 'что-то')
      .replace(/\$name/g, this.context.userPreferences.name || 'друг')
      .replace(/\$game/g, this.random('Oneshot', 'Omori', 'Terraria', 'Minecraft'))
      .replace(/\$food/g, this.random('тунец', 'молоко', 'печеньки'));
  }

  private generateRandomComplimentThreshold(): number {
    return Math.floor(Math.random() * (15 - 5 + 1)) + 5; // Случайное число от 5 до 15
  }

  private applyContextModifications(response: string): string {
    // Увеличиваем счетчик сообщений
    this.context.complimentCounter++;

    // Проверяем достижение порога для комплимента
    if (this.context.complimentCounter >= this.context.nextComplimentAt) {
      response = this.addCompliment(response);
      this.context.complimentCounter = 0;
      this.context.nextComplimentAt = this.generateRandomComplimentThreshold();
    }

    return response;
  }

  private applyMoodModifications(response: string): string {
    let modifiedResponse = response;

    switch (true) {
      case (this.moodIntensity <= -5):
        this.context.currentMood = this.random<NikoMood>('very_uncomfortable', 'crying');
        modifiedResponse += ' 😥 М-мяу...';
        break;

      case (this.moodIntensity >= -4 && this.moodIntensity <= -3):
        this.context.currentMood = this.random<NikoMood>('sad', 'distressed');
        modifiedResponse += ' 😞 Мя-яу...';
        break;

      case (this.moodIntensity >= -2 && this.moodIntensity <= -1):
        this.context.currentMood = this.random<NikoMood>('uncomfortable', 'looking_left');
        modifiedResponse += ' 😨';
        break;

      case (this.moodIntensity >= 1 && this.moodIntensity <= 2):
        this.context.currentMood = this.random<NikoMood>('normal', 'smiling');
        modifiedResponse += ' 🙂';
        break;

      case (this.moodIntensity >= 3 && this.moodIntensity <= 4):
        this.context.currentMood = this.random<NikoMood>('happy', 'amazed');
        modifiedResponse += ' 😊';
        break;

      case (this.moodIntensity >= 5):
        this.context.currentMood = this.random<NikoMood>('surprised', 'eyes_closed');
        modifiedResponse += ' 🥰 УРРРР!';
        break;

      default: // 0
        this.context.currentMood = this.random<NikoMood>('normal', 'speak');
        modifiedResponse += '~';
    }

    return modifiedResponse;
  }

  private updateContext(text: string, category: string): void {
    this.currentTopic = category !== 'default' ? category : this.currentTopic;

    if (category !== 'default')
      this.context.lastTopics = [category, ...this.context.lastTopics].slice(0, 3);

    const entities = this.extractEntities(text);
    this.context.mentionedEntities = [...entities, ...this.context.mentionedEntities].slice(0, 5);

    if (category === 'compliment')
      this.context.userPreferences.likesCompliments = true;
  }

  private updateMood(category: string): void {
    const moodMap: { [key: string]: number } = {
      compliment: 2,
      angry: -3,
      joke: 1,
      farewell: -1,
      love: 2
    };

    this.moodIntensity = Math.min(Math.max(
      this.moodIntensity + (moodMap[category] || 0),
      -5
    ), 5);
  }

  private calculateCurrentMood(): NikoMood {
    if (this.moodIntensity > 3) return 'happy';
    if (this.moodIntensity < -3) return 'distressed';
    return this.random(...this.moodMatrix[this.currentTopic] || ['normal']);
  }

  private extractEntities(text: string): string[] {
    return text.match(/[А-ЯЁA-Z][а-яёa-z-]+/g) || [];
  }

  private addCompliment(response: string): string {
    const compliments = ['Кстати, ты сегодня прекрасно выглядишь!', 'Ты молодец!', 'Как всегда, умничка!'];
    return response + ' ' + this.random(...compliments);
  }

  private typeMessage(response: { text: string; mood: NikoMood }): void {
    this.context.currentMood = response.mood;

    const message: Message = {
      text: response.text,
      isBot: true,
      displayedText: ''
    };

    this.context.messages.push(message);

    // Запуск анимации печати
    if (!response.text.match(/<[^>]*>/))
      this.animateTextTyping(message, response.text);
  }

  private animateTextTyping(message: Message, fullText: string): void {
    let currentChar = 0;
    const typingSpeed = this.calculateTypingSpeed(fullText);

    const typeNextChar = () => {
      if (currentChar < fullText.length) {
        message.displayedText = fullText.slice(0, currentChar + 1);
        currentChar++;
        this.timer = window.setTimeout(typeNextChar, typingSpeed);
      } else {
        this.isTyping.set(false);
        this.scrollToBottom();
      }
    };

    this.isTyping.set(true);
    typeNextChar();
  }

  private calculateTypingSpeed(text: string): number {
    const baseSpeed = 30; // Минимальная скорость печати
    const speedVariation = 20; // Вариация для естественности
    const punctuationDelay = 50; // Задержка для пунктуации

    // Увеличиваем задержку для знаков препинания
    if (/[.!?,;:]$/.test(text))
      return baseSpeed + speedVariation + punctuationDelay;

    return baseSpeed + Math.random() * speedVariation;
  }

  private showError(message: string): void {
    this.context.messages.push({
      text: message,
      isBot: true,
      displayedText: message
    });
    this.scrollToBottom();
  }
}

import { AbstractControl, FormControl, ValidationErrors } from "@angular/forms";
import { SocialMediaPlatform } from "../enums/SocialMediaPlatform";
import { SocialMediaPlatformHelper } from "../helpers/SocialMediaPlatformHelper";
import { TransliterationMap } from "../models/TransliterationMap";

export class ValidationService {
  static fullNamePattern = /^[A-Za-zА-Яа-яЁё\s]+$/;
  static emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  static passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  static usernamePattern = /^(?!_)[a-zA-Z0-9]+(_[a-zA-Z0-9]+)*(?<!_)$/;
  static urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-@]*)*\/?$/;

  static emptyGuid = '00000000-0000-0000-0000-000000000000';
  static emailDomains = ['mail.ru', 'xmail.ru', 'gmail.com', 'vk.com', 'yandex.ru', 'icloud.com'];

  static forbiddenWords = [
    // Основные оскорбления (английские)
    'bitch', 'asshole', 'nigger', 'nigga', 'fuck', 'fucker', 'motherfucker',
    'shit', 'cunt', 'whore', 'slut', 'dick', 'pussy', 'bastard', 'retard',
    'douche', 'wanker', 'twat', 'pedo', 'rapist', 'scum', 'jizz', 'cum',

    // Русские оскорбления
    'сука', 'сучка', 'блядь', 'блять', 'хуй', 'хуё', 'пидор', 'пидарас',
    'мудак', 'говно', 'долбоёб', 'шлюха', 'дебил', 'кретин', 'еблан', 'жопа',
    'залупа', 'мразь', 'падла', 'сволочь', 'урод', 'чмо', 'гандон', 'козёл',
    'лох', 'пердун', 'пизда', 'ебучка', 'выёбок', 'манда', 'ссанина',

    // Украинские оскорбления
    'бля', 'хуйло', 'курва', 'гівно', 'пізда', 'мусор', 'хамло', 'тупий',
    'виродок', 'срака', 'падлюка', 'свиня', 'чорт', 'дідько', 'перець',
    'халява', 'шльондра', 'москаль', 'кацап', 'свидомый',

    // Расистские термины
    'чурка', 'хач', 'жид', 'нигер', 'расист', 'фашист', 'нацист',
    'белый мусор', 'чёрный', 'yellowface', 'spic', 'wetback', 'kike', 'gook',
    'chink', 'raghead', 'coon', 'porchmonkey', 'beaner', 'towelhead',

    // Сексуальные термины
    'секс', 'порно', 'голый', 'нагота', 'мастурбация', 'проститутка',
    'изнасилование', 'педофил', 'вуайерист', 'инцест', 'зоофил', 'садо',
    'мазо', 'оргия', 'эрекция', 'сперма', 'вагина', 'член', 'соси', 'трахни',
    'ебать', 'кончил', 'оргазм',

    // Термины насилия
    'убийца', 'убивать', 'резать', 'стрелять', 'террорист', 'бомба',
    'самоубийство', 'пытка', 'избиение', 'кровь', 'расчленить', 'захват',
    'заложник', 'маньяк', 'покушение',

    // Современный сленг и интернет-термины
    'simp', 'incel', 'thot', 'karen', 'neckbeard', 'cuck', 'soyboy', 'cuntface',
    'dickhead', 'asshat', 'buttface', 'cocknose', 'douchecanoe', 'fuckwit',
    'shitbag', 'twatwaffle',

    // Альтернативные написания и символы
    'f4ck', 'b1tch', 'n1gg3r', '5uk4', 'bl9d', 'xyй', 'h\\/\\i', 'p!zda',
    'bl**t', 'mud@k', 'd0lbaeb', 'pi3or', 'govn0', '3жopa', 'cyka', 'blyat',
    '6лядь', 'xуесос', 'ъуъ', 'и$пать', 'ёб@ный', 'п@дон', 'чм0', 'г0вно',

    // Запрещенные исторические термины
    'фашист', 'наци', 'свастика', '1488', '88', '14words', 'aryan', 'supremacy',
    'white-power', 'kkk', 'nsdap', 'reich', 'holocaust', 'nazi', 'gas-chamber',

    // Гендерные оскорбления
    'трансгендер', 'гомик', 'лесбиянка', 'педик', 'гей', 'феменистка', 'содомит',
    'гермафродит', 'андрогин', 'квир', 'nonbinary', 'tranny', 'shemale', 'faggot',
    'dyke', 'homo',

    // Религиозные оскорбления
    'еретик', 'сатана', 'дьявол', 'ислам', 'жид', 'мусульманин', 'иудей',
    'язычник', 'безбожник', 'коран', 'библия', 'аллах', 'богомол', 'секта',

    // Дискриминация по возрасту
    'старый', 'дряхлый', 'старуха', 'младенец', 'подросток', 'пенсионер',
    'динозавр', 'малолетка', 'недоросль',

    // Дискриминация по здоровью
    'инвалид', 'даун', 'аутист', 'дебил', 'калека', 'псих', 'шизофреник',
    'олигофрен', 'эпилептик', 'алкаш', 'наркоман', 'идиот',

    // Дополнительные фильтры
    'scat', 'coprophilia', 'necrophilia', 'zoophilia', 'pedo', 'lolita',
    'underage', 'childporn', 'cp', 'loli', 'shota', 'drugs', 'meth', 'heroin',
    'cocaine', 'weed', 'lsd', 'overdose', 'suicide', 'kill'
  ];

  static loginValidator(control: FormControl): ValidationErrors | null {
    return ValidationService.emailPattern.test(control.value) || ValidationService.usernamePattern.test(control.value)
      ? null : { invalidLogin: true };
  }

  static domainValidator(control: FormControl): ValidationErrors | null {
    const email = control.value;
    if (!email) return null;
    const emailParts = email.split('@');
    if (emailParts.length !== 2) return { invalidEmailFormat: true }; // Пустое или некорректное
    const domain = emailParts[1];
    return ValidationService.emailDomains.includes(domain) ? null : { invalidDomain: true };
  }

  static usernameValidator(control: FormControl): { [s: string]: any } | null {
    const value = control.value;
    const errors: { [key: string]: boolean } = {};

    // Проверка на длину
    if (value.length < 3 || value.length > 20)
      errors['invalidLength'] = true;

    // Проверка на запрет подчёркивания в начале или конце
    if (/^_/.test(value) || /_$/.test(value))
      errors['invalidStartOrEnd'] = true;

    // Проверка на использование только латиницы, цифр и подчёркивания
    if (!/^[a-zA-Z0-9]+([_a-zA-Z0-9]+)*$/.test(value))
      errors['invalidCharacters'] = true;

    if ((value.match(/_/g) || []).length > 1)
      errors['tooMuchUnderscores'] = true;

    // Проверка на запрещённые слова
    const hasForbiddenWord = ValidationService.containsForbiddenWords(value);
    if (hasForbiddenWord)
      errors['forbiddenWord'] = true;

    // Если есть ошибки, возвращаем их
    return Object.keys(errors).length > 0 ? errors : null;
  }

  static passwordValidator(control: FormControl): ValidationErrors | null {
    return ValidationService.passwordPattern.test(control.value) ? null : { invalidPassword: true };
  }

  static urlValidator(control: AbstractControl): ValidationErrors | null {
    return ValidationService.urlPattern.test(control.value) ? null : { invalidUrl: true };
  }

  // Валидатор для проверки, что ссылка соответствует поддерживаемым социальным сетям
  static supportedPlatformValidator(control: AbstractControl): ValidationErrors | null {
    return SocialMediaPlatformHelper.getSocialMediaPlatform(control.value) !== SocialMediaPlatform.Unknown ? null : {
      unsupportedPlatform: true
    };
  }

  // Проверка на запрещенные слова
  static containsForbiddenWords(input: string): boolean {
    const normalizedInput = input.toLowerCase();

    // Проверка на наличие слова в списке запрещённых слов на латинице
    if (ValidationService.forbiddenWords.some(word => word.toLowerCase() === normalizedInput)) {
      return true;
    }

    // Транслитерация введённого слова с латиницы в кириллицу
    const transliteratedInput = ValidationService.transliterateToCyrillic(normalizedInput);

    // Проверка на наличие транслитерированного слова в списке запрещённых слов на кириллице
    return ValidationService.forbiddenWords.some(word => {
      return word.toLowerCase() === transliteratedInput;
    });
  }

  // Функция транслитерации латиницы в кириллицу
  // Функция транслитерации латиницы в кириллицу
  static transliterateToCyrillic(input: string): string {
    const translitMap: { [key: string]: string } = {
      'ch': 'ч',
      'sh': 'ш',
      'zh': 'ж',
      'yu': 'ю',
      'ya': 'я',
      'ts': 'ц',
      'a': 'а', 'b': 'б', 'c': 'ц', 'd': 'д', 'e': 'е', 'f': 'ф',
      'g': 'г', 'h': 'х', 'i': 'и', 'j': 'й', 'k': 'к', 'l': 'л',
      'm': 'м', 'n': 'н', 'o': 'о', 'p': 'п', 'q': 'к', 'r': 'р',
      's': 'с', 't': 'т', 'u': 'у', 'v': 'в', 'w': 'в', 'x': 'кс',
      'y': 'и', 'z': 'з'
    };

    // Преобразуем вход в стрим, чтобы первым делом заменить пары символов, потом одинарные
    let result = input;

    // Проходим по каждой паре символов
    for (const [key, value] of Object.entries(translitMap)) {
      result = result.replace(new RegExp(key, 'gi'), value); // 'gi' - для нечувствительного к регистру
    }

    return result;
  }
}

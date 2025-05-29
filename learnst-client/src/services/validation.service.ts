import {AbstractControl, AsyncValidatorFn, FormControl, ValidationErrors} from "@angular/forms";
import {SocialMediaPlatform} from "../enums/SocialMediaPlatform";
import {SocialMediaPlatformHelper} from "../helpers/SocialMediaPlatformHelper";
import {debounceTime} from 'rxjs/operators';
import {catchError, map, Observable, of} from "rxjs";
import {UsersService} from "./users.service";

export class ValidationService {
  static emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  static passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  static usernamePattern = /^(?!_)[a-zA-Z0-9]+(_[a-zA-Z0-9]+)*(?<!_)$/;
  static urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-@]*)*\/?$/;

  static emptyGuid = '00000000-0000-0000-0000-000000000000';
  static emailDomains = ['mail.ru', 'xmail.ru', 'gmail.com', 'vk.com', 'yandex.ru', 'icloud.com', 'proton.me', 'protonmail.com'];

  static forbiddenWords = [
    // Основные оскорбления (английские)
    'bitch', 'asshole', 'nigger', 'niger', 'nigga', 'fuck', 'fucker', 'motherfucker',
    'shit', 'cunt', 'whore', 'slut', 'dick', 'pussy', 'bastard', 'retard',
    'douche', 'wanker', 'twat', 'pedo', 'rapist', 'scum', 'jizz', 'cum',

    // Русские оскорбления
    'suka', 'suchka', 'blyad', 'blyat', 'hui', 'huy', 'pidor', 'pidoras',
    'mudak', 'govno', 'shit', 'dolboeb', 'shluha', 'zalupa', 'pizda', 'cunt',

    // Украинские оскорбления
    'moscal', 'kacap', 'ork',

    // Расистские термины
    'black', 'yellowface', 'spic', 'wetback', 'kike', 'gook',
    'chink', 'raghead', 'coon', 'porchmonkey', 'beaner', 'towelhead',

    // Термины насилия
    'killer', 'kill', 'slash', 'slasher', 'shoot', 'shooter', 'terrorist', 'bomb',
    'kys', 'kicker', 'blood', 'capture', 'assassin', 'suicide',

    // Современный сленг и интернет-термины
    'simp', 'incel', 'thot', 'karen', 'neckbeard', 'cuck', 'soyboy', 'cuntface',
    'dickhead', 'asshat', 'buttface', 'cocknose', 'douchecanoe', 'fuckwit',
    'shitbag', 'twatwaffle',

    // Альтернативные написания и символы
    'f4ck', 'b1tch', 'n1gg3r', '5uk4', 'bl9d', 'xyй', 'h\\/\\i', 'p!zda',
    'bl**t', 'mud@k', 'd0lbaeb', 'pi3or', 'govn0', 'cyka', 'blyat',

    // Гендерные оскорбления
    'tranny', 'shemale', 'faggot', 'dyke',

    // Дополнительные фильтры
    'scat', 'coprophilia', 'necrophilia', 'zoophilia', 'pedo', 'lolita',
    'underage', 'childporn', 'cp', 'loli', 'shota', 'drugs', 'meth', 'heroin',
    'cocaine', 'weed', 'lsd', 'overdose'
  ];

  static loginValidator(control: FormControl): ValidationErrors | null {
    return ValidationService.emailPattern.test(control.value) || ValidationService.usernamePattern.test(control.value)
      ? null : {invalidLogin: true};
  }

  static domainValidator(control: FormControl): ValidationErrors | null {
    const email = control.value;
    if (!email) return null;
    const emailParts = email.split('@');
    if (emailParts.length !== 2) return {invalidEmailFormat: true}; // Пустое или некорректное
    const domain = emailParts[1];
    return ValidationService.emailDomains.includes(domain) ? null : {invalidDomain: true};
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
    return ValidationService.passwordPattern.test(control.value) ? null : {invalidPassword: true};
  }

  static urlValidator(control: AbstractControl): ValidationErrors | null {
    return ValidationService.urlPattern.test(control.value) ? null : {invalidUrl: true};
  }

  // Валидатор для проверки, что ссылка соответствует поддерживаемым социальным сетям
  static supportedPlatformValidator(control: AbstractControl): ValidationErrors | null {
    return SocialMediaPlatformHelper.getSocialMediaPlatform(control.value) !== SocialMediaPlatform.Unknown ? null : {
      unsupportedPlatform: true
    };
  }

  // Проверка на запрещенные слова
  static containsForbiddenWords(input: string): boolean {
    return ValidationService.forbiddenWords.some(word => input.toLowerCase().includes(word.toLowerCase()));
  }

  static uniqueEmailValidator(userService: UsersService): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.invalid) return of(null);

      return userService.checkEmailExists(control.value).pipe(
        debounceTime(500),
        map(exists => {
          if (exists) return {duplicateEmail: true};
          return null;
        }),
        catchError(() => of(null))
      );
    };
  }

  static uniqueUsernameValidator(userService: UsersService): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.invalid) return of(null);

      return userService.checkUsernameExists(control.value).pipe(
        debounceTime(500),
        map(exists => {
          if (exists) return {duplicateUsername: true};
          return null;
        }),
        catchError(() => of(null))
      );
    };
  }

  static existingEmailValidator(usersService: UsersService): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || control.invalid) return of(null);

      return usersService.checkEmailExists(control.value).pipe(
        map(exists => (exists ? null : {emailNotFound: true})),
        catchError(() => of(null))
      );
    };
  }
}

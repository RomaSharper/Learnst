import { AbstractControl, FormControl } from "@angular/forms";
import { SocialMediaPlatform } from "../enums/SocialMediaPlatform";
import { SocialMediaPlatformHelper } from "../helpers/SocialMediaPlatformHelper";

export class ValidationService {
  static phoneRegex = /^\+?[0-9]{11}$/;
  static fullNameRegex = /^[A-Za-zА-Яа-яЁё\s]+$/;
  static emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  static passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  static usernameRegex = /^(?!_)(?!\d)[a-z0-9]+(_[a-z0-9]+)*(?<!_)(?<!\d)$/;
  static urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-@]*)*\/?$/;

  static emptyGuid = '00000000-0000-0000-0000-000000000000';
  static emailDomains = ['mail.ru', 'xmail.ru', 'gmail.com', 'vk.com', 'yandex.ru', 'icloud.com'];
  static forbiddenWords = [
    'bitch', 'ass', 'nigger', 'nigga', 'fuck', 'fucker', 'motherfucker', 'mfer', 'killyourself', 'kys', 'gay'
  ];

  static loginValidator(control: FormControl): { [s: string]: boolean } | null {
    return ValidationService.emailRegex.test(control.value) || ValidationService.usernameRegex.test(control.value)
      ? null : { invalidLogin: true };
  }

  static domainValidator(control: FormControl): { [s: string]: boolean } | null {
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

    // Проверка на запрет подчёркивания или цифр в начале или конце
    if (/^[_0-9]/.test(value) || /[_0-9]$/.test(value))
      errors['invalidStartOrEnd'] = true;

    // Проверка на использование только латиницы, цифр и подчёркивания
    if (!/^[a-z0-9]+([_a-z0-9]+)*$/.test(value))
      errors['invalidCharacters'] = true;

    if ((value.match(/_/g) || []).length > 1)
      errors['tooMuchUnderscores'] = true;

    // Проверка на запрещённые слова
    const hasForbiddenWord = ValidationService.forbiddenWords.some(word => value.toLowerCase().includes(word));
    if (hasForbiddenWord)
      errors['forbiddenWord'] = true;

    // Если есть ошибки, возвращаем их
    return Object.keys(errors).length > 0 ? errors : null;
  }

  static passwordValidator(control: FormControl): { [s: string]: boolean } | null {
    return ValidationService.passwordRegex.test(control.value) ? null : { invalidPassword: true };
  }

  // Валидатор для проверки, что значение является корректной ссылкой
  static urlValidator(control: AbstractControl): { [s: string]: boolean } | null {
    return ValidationService.urlPattern.test(control.value) ? null : {
      invalidUrl: true
    };
  }

  // Валидатор для проверки, что ссылка соответствует поддерживаемым социальным сетям
  static supportedPlatformValidator(control: AbstractControl): { [s: string]: boolean } | null {
    return SocialMediaPlatformHelper.getSocialMediaPlatform(control.value) !== SocialMediaPlatform.Unknown ? null : {
      unsupportedPlatform: true
    };
  }
}

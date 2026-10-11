import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Decorator to validate password strength.
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function ValidatePasswordStrength(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'validatePasswordStrength',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(args: ValidationArguments) {
          const password: string = args.value as string;
          if (!password || typeof password !== 'string') {
            return false;
          }
          const minLength = 8;
          const hasUpperCase = /[A-Z]/.test(password);
          const hasLowerCase = /[a-z]/.test(password);
          const hasNumber = /[0-9]/.test(password);
          const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
          return (
            password.length >= minLength &&
            hasUpperCase &&
            hasLowerCase &&
            hasNumber &&
            hasSpecialChar
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `Password must be at least ${8} characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.`;
        },
      },
    });
  };
}

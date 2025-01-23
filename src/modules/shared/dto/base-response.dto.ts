export class BaseResponseDto<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;

  constructor(data?: T, message?: string) {
    this.success = !message;
    this.data = data;
    this.message = message;
  }
}

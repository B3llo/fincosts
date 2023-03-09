export class KnownError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = "KnownError";
  }
}

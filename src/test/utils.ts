export const wait = (ms: number) =>
  new Promise<void>(resolve => setTimeout(() => resolve(), ms));

export const readEnv = (name: string): string => {
  if (!process.env[name]) {
    throw new Error(`${name} not set`);
  }
  return process.env[name] || '';
};

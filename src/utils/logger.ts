const prefix = "[compliance-bot]";

export const logger = {
  info: (msg: string, ...args: unknown[]) =>
    console.log(`${prefix} INFO  ${new Date().toISOString()}  ${msg}`, ...args),
  warn: (msg: string, ...args: unknown[]) =>
    console.warn(`${prefix} WARN  ${new Date().toISOString()}  ${msg}`, ...args),
  error: (msg: string, ...args: unknown[]) =>
    console.error(`${prefix} ERROR ${new Date().toISOString()}  ${msg}`, ...args),
};

let verboseEnabled = false;

export function setVerbose(enabled: boolean): void {
  verboseEnabled = enabled;
}

export function isVerbose(): boolean {
  return verboseEnabled;
}

export function info(message: string): void {
  console.log(message);
}

export function verbose(message: string): void {
  if (verboseEnabled) {
    console.log(message);
  }
}

export function warn(message: string): void {
  console.warn(`Warning: ${message}`);
}

export function error(message: string): void {
  console.error(`Error: ${message}`);
}

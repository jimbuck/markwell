import { ConverterRegistry } from "../core/registry.js";

let registry: ConverterRegistry | null = null;

export function getRegistry(): ConverterRegistry {
  if (!registry) {
    registry = new ConverterRegistry();
    // Converters will be registered here in tasks 0400-0600 (ingest)
    // and 0700-1000 (export). Registration order matters:
    // specific converters before generic ones.
  }
  return registry;
}

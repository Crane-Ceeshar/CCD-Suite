import { error } from './responses';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate that a string is a valid UUID format.
 * Returns null if valid, or an error response (400) if invalid.
 */
export function validateUuid(id: string, entity = 'Resource') {
  if (!UUID_REGEX.test(id)) {
    return error(`Invalid ${entity} ID format`, 400);
  }
  return null;
}

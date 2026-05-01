import { ApiError } from '#/lib/api/errors';

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function assertUuidParam(name: string, value: string) {
  if (!uuidPattern.test(value)) {
    throw new ApiError({
      status: 404,
      code: 'INVALID_ROUTE_PARAM',
      message: `${name} was not found.`,
    });
  }
}

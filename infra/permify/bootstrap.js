import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const DEFAULT_SCHEMA_PATH = resolve(scriptDir, 'schema.syncpad.perm');

const getEnv = (name, fallback) => {
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const permifyUrl = getEnv('PERMIFY_URL');
const tenantId = getEnv('PERMIFY_TENANT_ID', 'syncpad');
const schemaPath = process.env.PERMIFY_SCHEMA_PATH
  ? resolve(process.cwd(), process.env.PERMIFY_SCHEMA_PATH)
  : DEFAULT_SCHEMA_PATH;

const buildUrl = (path) => new URL(path, permifyUrl).toString();

const request = async (path, body) => {
  const response = await fetch(buildUrl(path), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const responseBody = await response.text().catch(() => '');
    throw new Error(
      `Permify returned ${response.status} for ${path}${
        responseBody ? `: ${responseBody}` : ''
      }`,
    );
  }

  return response.json().catch(() => ({}));
};

const ensureTenant = async () => {
  try {
    await request('/v1/tenants/create', {
      id: tenantId,
      name: tenantId,
    });
    console.log(`created Permify tenant ${tenantId}`);
  } catch (error) {
    if (
      error instanceof Error &&
      /already exists|conflict|409/i.test(error.message)
    ) {
      console.log(`Permify tenant ${tenantId} already exists`);
      return;
    }

    throw error;
  }
};

const writeSchema = async () => {
  const schema = await readFile(schemaPath, 'utf8');
  const result = await request(`/v1/tenants/${tenantId}/schemas/write`, {
    tenantId,
    schema,
  });

  const schemaVersion =
    result.schemaVersion ?? result.schema_version ?? result.version;

  console.log(`wrote Permify schema for tenant ${tenantId}`);

  if (schemaVersion) {
    console.log(`PERMIFY_SCHEMA_VERSION=${schemaVersion}`);
  } else {
    console.log('Permify did not return a schema version');
  }
};

await ensureTenant();
await writeSchema();

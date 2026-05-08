import type {
  onAuthenticatePayload,
  onAwarenessUpdatePayload,
  onChangePayload,
  onConfigurePayload,
  onConnectPayload,
  onCreateDocumentPayload,
  onDestroyPayload,
  onDisconnectPayload,
  onListenPayload,
  onLoadDocumentPayload,
  onRequestPayload,
  onStatelessPayload,
  onStoreDocumentPayload,
  onTokenSyncPayload,
  onUpgradePayload,
  ServerConfiguration,
} from '@hocuspocus/server';
import type { DocumentService } from '@syncpad/core';
import { type PermissionChecker, resources, subjects } from '@syncpad/permify';
import { encodeStateAsUpdate } from 'yjs';
import type { Auth } from '../lib/auth.js';

export type ServerHandlersConfig = {
  auth: Auth;
  permissionChecker: PermissionChecker;
  documentService: DocumentService;
};

type AuthSession = NonNullable<Awaited<ReturnType<Auth['api']['getSession']>>>;

type WebsocketContext = {
  session: AuthSession['session'];
  user: AuthSession['user'];
  actorUserId: string;
};

type HandlerConfiguration = Omit<
  ServerConfiguration<WebsocketContext>,
  | 'name'
  | 'extensions'
  | 'timeout'
  | 'debounce'
  | 'maxDebounce'
  | 'quiet'
  | 'unloadImmediately'
  | 'yDocOptions'
>;

const createAuthenticationError = (reason: string, message: string) =>
  Object.assign(new Error(message), { reason });

const getDocumentId = (documentName: string) => {
  // Current clients do not define a separate websocket room naming scheme, so
  // treat Hocuspocus documentName as the SyncPad document.id until that changes.
  return documentName;
};

export function createServerHandlers({
  auth,
  permissionChecker,
  documentService,
}: ServerHandlersConfig) {
  const handlers: HandlerConfiguration = {
    onAuthenticate: async ({
      documentName,
      requestHeaders,
    }: onAuthenticatePayload<WebsocketContext>) => {
      const authSession = await auth.api.getSession({
        headers: requestHeaders,
      });

      if (!authSession) {
        throw createAuthenticationError(
          'unauthorized',
          'No valid session for websocket connection',
        );
      }

      const documentId = getDocumentId(documentName);
      const document = await documentService.findById(documentId);

      if (!document) {
        throw createAuthenticationError(
          'document-not-found',
          `Document ${documentId} was not found`,
        );
      }

      // Keep the hot websocket auth path narrow: load metadata through
      // documentService, then use permissionChecker directly for the read gate.
      const canRead = await permissionChecker.checkPermission(
        subjects.user(authSession.user.id),
        resources.document(documentId),
        'read',
      );

      if (!canRead) {
        throw createAuthenticationError(
          'forbidden',
          `Read permission denied for document ${documentId}`,
        );
      }

      return {
        actorUserId: authSession.user.id,
        session: authSession.session,
        user: authSession.user,
      };
    },
    onAwarenessUpdate: async (
      _payload: onAwarenessUpdatePayload<WebsocketContext>,
    ) => {
      // Presence is currently Hocuspocus-owned runtime state. There is no repo
      // service for storing cursor/user awareness yet, so leave this as a hook
      // point for future analytics or presence fan-out.
    },
    onChange: async (_payload: onChangePayload<WebsocketContext>) => {
      // Hocuspocus already schedules debounced onStoreDocument calls after Yjs
      // updates. Avoid per-change DB writes here until we have an append-only
      // update log or another realtime persistence model.
    },
    onConfigure: async (_payload: onConfigurePayload) => {
      // Configuration is fully assembled in app.ts/bootstrap deps today. Keep
      // lifecycle logging/instrumentation here if the websocket service needs it.
    },
    onConnect: async (_payload: onConnectPayload<WebsocketContext>) => {
      // Authentication runs in onAuthenticate, where Hocuspocus provides the
      // auth token flow and lets us enrich context for later document hooks.
    },
    onCreateDocument: async (
      _payload: onCreateDocumentPayload<WebsocketContext>,
    ) => {
      // Document metadata is created through HTTP/core documentService CRUD.
      // This hook should not create DB rows until websocket-only document
      // creation becomes an explicit product flow.
    },
    onDestroy: async (_payload: onDestroyPayload) => {
      // Server shutdown cleanup is handled by startServer/deps pool cleanup.
      // Add websocket-specific teardown here only if new resources are added.
    },
    onDisconnect: async (_payload: onDisconnectPayload<WebsocketContext>) => {
      // Hocuspocus manages connection counts and document unloading. There is
      // no durable collaboration session model in core/db yet.
    },
    onListen: async (_payload: onListenPayload) => {
      // Startup logging is currently centralized in Hocuspocus/startServer.
    },
    onLoadDocument: async ({
      context,
      documentName,
    }: onLoadDocumentPayload<WebsocketContext>) => {
      const state = await documentService.getDocumentState({
        actorUserId: context.actorUserId,
        documentId: getDocumentId(documentName),
      });

      return new Uint8Array(state.yjsState);
    },
    onRequest: async (_payload: onRequestPayload) => {
      // This only handles plain HTTP requests to the websocket server. API
      // routes and auth endpoints live in the api package.
    },
    onStateless: async (_payload: onStatelessPayload) => {
      // Stateless messages are not modeled by core services yet. Keep this
      // reserved for explicit non-Yjs websocket commands.
    },
    onStoreDocument: async ({
      document,
      documentName,
      lastContext,
    }: onStoreDocumentPayload<WebsocketContext>) => {
      await documentService.saveDocumentState({
        actorUserId: lastContext.actorUserId,
        documentId: getDocumentId(documentName),
        yjsState: Buffer.from(encodeStateAsUpdate(document)),
      });
    },
    onTokenSync: async (_payload: onTokenSyncPayload<WebsocketContext>) => {
      // Token sync carries Hocuspocus provider auth metadata after connection
      // setup. Better Auth session validation is already done in onAuthenticate.
    },
    onUpgrade: async (_payload: onUpgradePayload) => {
      // The underlying server/crossws adapter handles protocol upgrade. Header
      // auth is checked later in onAuthenticate where a Request is available.
    },
  };

  return handlers;
}

export type ServerHandlers = ReturnType<typeof createServerHandlers>;

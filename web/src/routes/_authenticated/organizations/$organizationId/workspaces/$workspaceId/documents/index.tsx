import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/_authenticated/organizations/$organizationId/workspaces/$workspaceId/documents/',
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      Hello
      "/_authenticated/organizations/$organizationId/workspaces/$workspaceId/documents/"!
    </div>
  );
}

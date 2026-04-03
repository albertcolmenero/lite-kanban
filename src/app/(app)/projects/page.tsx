import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { listProjectsWithStatusBreakdown } from "@/lib/projects/list-projects-with-status-breakdown";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateProjectDialog } from "@/app/(app)/projects/create-project-dialog";
import { DeleteProjectButton } from "@/app/(app)/projects/delete-project-button";

export default async function ProjectsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const projects = await listProjectsWithStatusBreakdown(userId);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Task counts by status for each board.
          </p>
        </div>
        <CreateProjectDialog />
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No projects yet. Create one with{" "}
            <span className="font-medium text-foreground">New project</span>.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <li key={p.id} className="min-w-0">
              <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 border-b border-border/60 pb-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <CardTitle className="text-base leading-snug">
                      <Link
                        href={`/projects/${p.id}`}
                        className="hover:underline"
                      >
                        {p.name}
                      </Link>
                    </CardTitle>
                    {p.description ? (
                      <CardDescription className="line-clamp-2">
                        {p.description}
                      </CardDescription>
                    ) : null}
                  </div>
                  <DeleteProjectButton projectId={p.id} projectName={p.name} />
                </CardHeader>
                <CardContent className="flex flex-1 flex-col pt-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Tasks by status
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {p.statuses.map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs"
                      >
                        <span className="font-medium">{s.name}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {s.taskCount}
                        </span>
                      </span>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="mt-auto border-t border-border/60 pt-4">
                  <Link
                    href={`/projects/${p.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Open project
                  </Link>
                </CardFooter>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import { RegisterProjectHeader } from "@/app/(app)/projects/[id]/register-project-header";
import { getCachedProjectBoardShell } from "@/lib/projects/get-cached-project-shell";

export default async function ProjectBoardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const shell = await getCachedProjectBoardShell(id);

  const payload = shell
    ? {
        projectId: shell.project.id,
        projectName: shell.project.name,
        projectDescription: shell.project.description,
        allTasks: JSON.parse(JSON.stringify(shell.allTasks)),
      }
    : null;

  return (
    <>
      <RegisterProjectHeader payload={payload} />
      {children}
    </>
  );
}

import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ExtensionTokenPanel } from "@/app/(app)/extension-setup/extension-token-panel";

export default async function ExtensionSetupPage() {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <main className="mx-auto flex max-w-lg flex-1 flex-col gap-4 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Chrome extension</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Load the unpacked extension from the{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">extension/</code>{" "}
          folder. Set your app base URL and paste the token below into the
          extension popup. Add your{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            chrome-extension://…
          </code>{" "}
          origin to{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            EXTENSION_ALLOWED_ORIGINS
          </code>{" "}
          in{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">.env</code> so
          CORS allows the extension.
        </p>
      </div>
      <ExtensionTokenPanel />
      <p className="text-sm">
        <Link href="/projects" className="text-primary hover:underline">
          Back to projects
        </Link>
      </p>
    </main>
  );
}

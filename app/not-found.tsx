import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-dvh w-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
      <h1 className="font-bold text-6xl">404</h1>
      <p className="text-lg text-muted-foreground">
        The page you're looking for doesn't exist.
      </p>
      <Link
        href="/"
        className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm transition-colors hover:bg-primary/90"
      >
        Back to chat
      </Link>
    </div>
  );
}

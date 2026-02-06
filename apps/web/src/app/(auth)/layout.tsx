export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ccd-cream p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold font-heading text-ccd-blue">
            CCD Suite
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Crane & Ceeshar Digital
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

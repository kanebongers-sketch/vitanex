/** Rustig laadscherm in de webshopstijl (anders toont de gedeelde app zijn eigen laadscherm). */
export default function ReleaseVLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Laden">
      <span className="size-2 animate-pulse rounded-full bg-accent" />
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export default function CalendarioLoading() {
  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>
      <Skeleton className="h-[600px] w-full rounded-2xl" />
    </div>
  );
}

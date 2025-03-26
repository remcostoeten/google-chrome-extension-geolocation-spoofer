import { Skeleton } from "@/components/ui/skeleton"

const MapSkeleton = () => {
  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden">
      <Skeleton className="absolute inset-0" />
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex gap-4">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export default MapSkeleton

import * as React from "react"
import { cn } from "@/lib/utils"

interface AvatarProps extends React.ComponentProps<"div"> {
  photoURL?: string | null
  displayName?: string | null
  size?: "sm" | "md" | "lg" | "xl"
}

const sizeClasses = {
  sm: "size-8 text-sm",
  md: "size-10 text-base", 
  lg: "size-12 text-lg",
  xl: "size-16 text-xl"
}

function Avatar({ 
  photoURL, 
  displayName, 
  size = "md", 
  className, 
  ...props 
}: AvatarProps) {
  const initials = React.useMemo(() => {
    if (!displayName) return "?"
    return displayName
      .split(" ")
      .map(name => name.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }, [displayName])

  return (
    <div
      data-slot="avatar"
      className={cn(
        "relative flex shrink-0 overflow-hidden rounded-full",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {photoURL ? (
        <img
          className="aspect-square h-full w-full object-cover"
          src={photoURL}
          alt={displayName || "Avatar"}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-muted font-medium text-muted-foreground">
          {initials}
        </div>
      )}
    </div>
  )
}

export { Avatar }
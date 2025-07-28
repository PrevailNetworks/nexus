import * as React from "react"
import { 
  Clock, 
  Users, 
  MapPin, 
  Image, 
  FileText, 
  Settings, 
  Search, 
  Bell, 
  LogOut,
  User,
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  Edit,
  Trash2,
  Camera,
  MessageCircle,
  Heart,
  Share,
  ThumbsUp,
  Send,
  Plus,
  X,
  Check,
  AlertCircle,
  Info,
  Play,
  Pause,
  Home,
  Building,
  UserPlus,
  FileImage,
  Smile,
  Bold,
  Italic,
  Gift,
  MapPinIcon,
  Clock3,
  type LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

interface IconProps extends React.ComponentProps<"svg"> {
  name: keyof typeof iconMap
  size?: number
}

const iconMap = {
  // Time & Clock
  punch_clock: Clock,
  clock: Clock,
  schedule_post: Clock3,
  timer: Clock,
  
  // Users & People
  person: User,
  people: Users,
  user: User,
  users: Users,
  user_plus: UserPlus,
  
  // Location
  location_on: MapPin,
  map_pin: MapPinIcon,
  
  // Media
  image: Image,
  camera: Camera,
  file_image: FileImage,
  gif: Gift,
  
  // Communication
  chat_bubble: MessageCircle,
  message: MessageCircle,
  send: Send,
  
  // Actions
  thumb_up: ThumbsUp,
  thumbs_up: ThumbsUp,
  favorite: Heart,
  share: Share,
  
  // Navigation
  more_horiz: MoreHorizontal,
  more_horizontal: MoreHorizontal,
  chevron_down: ChevronDown,
  chevron_right: ChevronRight,
  chevron_left: ChevronLeft,
  
  // CRUD
  edit: Edit,
  delete: Trash2,
  add: Plus,
  plus: Plus,
  
  // UI States
  close: X,
  x: X,
  check: Check,
  
  // Content
  format_bold: Bold,
  format_italic: Italic,
  
  // Emotions
  emoji_emotions: Smile,
  
  // General
  search: Search,
  notifications: Bell,
  settings: Settings,
  logout: LogOut,
  calendar: Calendar,
  document: FileText,
  home: Home,
  building: Building,
  alert: AlertCircle,
  info: Info,
  play: Play,
  pause: Pause,
} as const

function Icon({ name, size = 20, className, ...props }: IconProps) {
  const IconComponent = iconMap[name] as LucideIcon

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`)
    return <div className={cn("inline-block", className)} style={{ width: size, height: size }} />
  }

  return (
    <IconComponent
      {...props}
      size={size}
      className={cn("shrink-0", className)}
    />
  )
}

export { Icon }
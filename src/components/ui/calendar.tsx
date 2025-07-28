import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface CalendarProps {
  mode?: "single"
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  initialFocus?: boolean
  className?: string
}

const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  ({ className, mode = "single", selected, onSelect, initialFocus, ...props }, ref) => {
    const [currentDate, setCurrentDate] = React.useState(selected || new Date())
    
    const today = new Date()
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const firstDayWeekday = firstDayOfMonth.getDay()
    const daysInMonth = lastDayOfMonth.getDate()
    
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ]
    
    const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
    
    const navigateMonth = (direction: number) => {
      setCurrentDate(new Date(year, month + direction, 1))
    }
    
    const handleDateClick = (day: number) => {
      const selectedDate = new Date(year, month, day)
      onSelect?.(selectedDate)
    }
    
    const isSelected = (day: number) => {
      if (!selected) return false
      const dayDate = new Date(year, month, day)
      return dayDate.toDateString() === selected.toDateString()
    }
    
    const isToday = (day: number) => {
      const dayDate = new Date(year, month, day)
      return dayDate.toDateString() === today.toDateString()
    }
    
    // Generate calendar days
    const calendarDays = []
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDayWeekday; i++) {
      calendarDays.push(
        <div key={`empty-${i}`} className="p-2"></div>
      )
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(day)}
          className={cn(
            "p-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md",
            isSelected(day) && "bg-primary text-primary-foreground",
            isToday(day) && !isSelected(day) && "bg-accent text-accent-foreground",
          )}
        >
          {day}
        </button>
      )
    }
    
    return (
      <div
        ref={ref}
        className={cn("p-3", className)}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth(-1)}
            className="p-1 h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="font-semibold">
            {monthNames[month]} {year}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth(1)}
            className="p-1 h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekdays.map((weekday) => (
            <div key={weekday} className="p-2 text-sm font-medium text-muted-foreground text-center">
              {weekday}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays}
        </div>
      </div>
    )
  }
)

Calendar.displayName = "Calendar"

export { Calendar }
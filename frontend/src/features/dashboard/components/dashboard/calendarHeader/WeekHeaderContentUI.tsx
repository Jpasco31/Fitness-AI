// components/WeekHeaderContent.tsx
import { Button } from "@/shared/components/ui/button";

interface WeekHeaderContentUIProps {
  weekDates: Date[];
  onSelectDate: (date: Date) => void;
  isToday: (date: Date) => boolean;
  isCurrentDate: (date: Date) => boolean;
  isAnimating: boolean;
  DaysOfWeekCompletedList: number[];
}

// Helper function to map ratio to Tailwind CSS classes
const getGreenClass = (ratio: number): string => {
  if (ratio === 0) return "bg-transparent";
  if (ratio > 0 && ratio <= 0.2) return "bg-green-100";
  if (ratio > 0.2 && ratio <= 0.4) return "bg-green-300";
  if (ratio > 0.4 && ratio <= 0.6) return "bg-green-400";
  if (ratio > 0.6 && ratio <= 0.8) return "bg-green-600";
  if (ratio > 0.8) return "bg-green-800";
  return "bg-transparent"; // Fallback
};

const WeekHeaderContentUI = ({
  weekDates,
  onSelectDate,
  isToday,
  isCurrentDate,
  isAnimating,
  DaysOfWeekCompletedList,
}: WeekHeaderContentUIProps) => {
  return (
    <div
      className={`my-2 flex flex-1 justify-between px-2 ${isAnimating ? "pointer-events-none" : ""}`}
    >
      {weekDates.map((date, index) => (
        <div key={index} className="flex flex-1 justify-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <Button
              variant={isCurrentDate(date) ? "default" : "ghost"}
              className={`my-0 flex h-10 w-10 flex-col items-center justify-center gap-0 rounded-full p-0 sm:h-14 sm:w-14 ${isToday(date) && !isCurrentDate(date) ? "text-primary" : ""
                }`}
              onClick={() => onSelectDate(date)}
              disabled={isAnimating}
            >
              <span className="text-xs uppercase leading-tight sm:text-lg">
                {date
                  .toLocaleDateString("en-US", { weekday: "short" })
                  .charAt(0)}
              </span>
              <span
                className={`text-xs font-semibold leading-tight sm:text-xl ${isToday(date)
                    ? "flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                    : ""
                  }`}
              >
                {date.getDate()}
              </span>
            </Button>
            <div
              className={`h-1 w-3 rounded sm:w-6 ${getGreenClass(
                DaysOfWeekCompletedList[index],
              )}`}
              title={`Completed: ${Math.round(
                DaysOfWeekCompletedList[index] * 100,
              )}%`}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WeekHeaderContentUI;

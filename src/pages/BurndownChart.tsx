import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useProjects } from "@/context/ProjectContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO, startOfDay, addDays, isBefore, isAfter, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { BurndownData, Task } from "@/types";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface BurndownDataPoint {
  date: string;
  ideal: number;
  actual: number;
  formattedDate: string;
}

const BurndownChart: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { getProject, getTasksBySprint, getSprintsByProject, tasks, sprints } = useProjects();
  const { user } = useAuth();
  const [chartData, setChartData] = useState<BurndownDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const project = getProject(projectId || "");
  
  useEffect(() => {
    const fetchBurndownData = async () => {
      if (!projectId || !user) return;
      
      setIsLoading(true);
      setError(null);
      try {
        // Always generate burndown data to keep it current with task status
        const burndownData = await generateBurndownData();
        setChartData(burndownData);
        
        // Save data in background, but don't block UI
        saveBurndownDataSafely(burndownData);
      } catch (error) {
        console.error("Error generating burndown data:", error);
        setError("Failed to load burndown chart data");
        toast.error("Failed to load burndown chart data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBurndownData();
  }, [projectId, user, tasks, sprints]);
  
  // New function for safer data saving with debounce
  const saveBurndownDataSafely = async (data: BurndownDataPoint[]) => {
    if (isSaving || !projectId || !user) return;
    
    try {
      setIsSaving(true);
      
      // First clear existing data
      const { error: deleteError } = await supabase
        .from('burndown_data')
        .delete()
        .eq('project_id', projectId);
        
      if (deleteError) {
        console.log("Non-blocking delete error:", deleteError);
        // Continue anyway
      }
      
      // Wait a moment before inserting
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Insert data one by one with small delays to avoid overwhelming the DB
      for (const item of data) {
        const { error: insertError } = await supabase
          .from('burndown_data')
          .insert({
            project_id: projectId,
            user_id: user.id,
            date: item.date,
            ideal_points: item.ideal,
            actual_points: item.actual
          });
          
        if (insertError) {
          console.log("Non-blocking insert error:", insertError);
          // Don't break the loop, continue with other items
        }
        
        // Small delay between inserts
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (error) {
      console.log("Background save error (non-blocking):", error);
      // Don't show errors to user for background operations
    } finally {
      setIsSaving(false);
    }
  };
  
  const generateBurndownData = async (): Promise<BurndownDataPoint[]> => {
    const data: BurndownDataPoint[] = [];
    const today = startOfDay(new Date());
    
    // Get all sprints for the project
    const projectSprints = getSprintsByProject(projectId || "");
    
    if (projectSprints.length === 0) {
      // If no sprints exist, use default 21-day range
      return generateDefaultTimeframe(today, 21);
    }
    
    // Find earliest sprint start date and latest sprint end date
    let earliestStartDate: Date | null = null;
    let latestEndDate: Date | null = null;
    
    for (const sprint of projectSprints) {
      const startDate = parseISO(sprint.startDate);
      const endDate = parseISO(sprint.endDate);
      
      if (!earliestStartDate || isBefore(startDate, earliestStartDate)) {
        earliestStartDate = startDate;
      }
      
      if (!latestEndDate || isAfter(endDate, latestEndDate)) {
        latestEndDate = endDate;
      }
    }
    
    // Ensure we have valid dates
    if (!earliestStartDate || !latestEndDate) {
      return generateDefaultTimeframe(today, 21);
    }
    
    // Calculate days between earliest and latest dates
    const daysInProject = differenceInDays(latestEndDate, earliestStartDate) + 1;
    
    // Ensure we have at least 7 days for visibility
    const timeframeDays = Math.max(daysInProject, 7);
    
    // Get all tasks across all sprints
    const allTasks: Task[] = [];
    for (const sprint of projectSprints) {
      const sprintTasks = getTasksBySprint(sprint.id);
      allTasks.push(...sprintTasks);
    }
    
    // Calculate total story points across all tasks
    const totalStoryPoints = allTasks.reduce((sum, task) => {
      return sum + (task.storyPoints || 0);
    }, 0);
    
    // If no story points, set a default value
    if (totalStoryPoints === 0) {
      return generateDefaultTimeframe(today, timeframeDays);
    }
    
    // Create a map to track completed tasks by date
    const completedTasksByDate = new Map<string, number>();
    
    // Populate the map with completed tasks
    allTasks.forEach(task => {
      if (task.status === "done" && task.updatedAt && task.storyPoints) {
        const completionDate = task.updatedAt.split('T')[0];
        const currentPoints = completedTasksByDate.get(completionDate) || 0;
        completedTasksByDate.set(completionDate, currentPoints + task.storyPoints);
      }
    });
    
    // Generate data points for each day in the project timeframe
    let remainingPoints = totalStoryPoints;
    let actualRemainingPoints = totalStoryPoints;
    const pointsPerDay = totalStoryPoints / timeframeDays;
    
    for (let i = 0; i < timeframeDays; i++) {
      const date = addDays(earliestStartDate, i);
      const dateStr = date.toISOString().split('T')[0];
      const formattedDate = format(date, "MMM dd");
      
      // Calculate ideal burndown - linear decrease over the project timeframe
      const idealRemaining = Math.max(0, totalStoryPoints - (i * pointsPerDay));
      
      // For past dates, reduce actual points based on completed tasks
      if (isBefore(date, today) || date.getTime() === today.getTime()) {
        const completedPoints = completedTasksByDate.get(dateStr) || 0;
        actualRemainingPoints = Math.max(0, actualRemainingPoints - completedPoints);
      }
      
      data.push({
        date: dateStr,
        ideal: Math.round(idealRemaining),
        actual: Math.round(actualRemainingPoints),
        formattedDate
      });
    }
    
    return data;
  };
  
  const generateDefaultTimeframe = (startDate: Date, days: number): BurndownDataPoint[] => {
    const data: BurndownDataPoint[] = [];
    const totalPoints = 100;
    const pointsPerDay = totalPoints / days;
    
    for (let i = 0; i < days; i++) {
      const date = addDays(startDate, i);
      const dateStr = date.toISOString().split('T')[0];
      const idealRemaining = Math.max(0, totalPoints - (i * pointsPerDay));
      
      data.push({
        date: dateStr,
        ideal: Math.round(idealRemaining),
        actual: Math.round(idealRemaining), // Start with ideal for default
        formattedDate: format(date, "MMM dd"),
      });
    }
    
    return data;
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-scrum-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-scrum-text-secondary">Loading burndown chart data...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="scrum-card p-6 text-center">
        <p className="text-red-500 mb-2">Error loading burndown data</p>
        <p className="text-scrum-text-secondary">Please try refreshing the page</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="scrum-card mb-6">
        <h2 className="text-xl font-bold mb-2">Project Burndown Chart</h2>
        <p className="text-scrum-text-secondary">
          Tracking progress across all sprints in {project?.title || "this project"}
        </p>
      </div>
      
      <div className="scrum-card h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 10,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis
              dataKey="formattedDate"
              stroke="#777"
              tick={{ fill: "#777" }}
              axisLine={{ stroke: "#444" }}
            />
            <YAxis
              label={{ value: "Story Points Remaining", angle: -90, position: "insideLeft", fill: "#777" }}
              stroke="#777"
              tick={{ fill: "#777" }}
              axisLine={{ stroke: "#444" }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-scrum-card border border-scrum-border p-3 rounded">
                      <p className="font-medium">{payload[0].payload.formattedDate}</p>
                      <div className="mt-2 space-y-1">
                        <p className="flex items-center text-sm">
                          <span className="h-2 w-2 rounded-full bg-[#8884d8] mr-2"></span>
                          <span>Ideal: {payload[0].value} points</span>
                        </p>
                        <p className="flex items-center text-sm">
                          <span className="h-2 w-2 rounded-full bg-[#82ca9d] mr-2"></span>
                          <span>Actual: {payload[1].value} points</span>
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              wrapperStyle={{ color: "#fff" }}
            />
            <Line
              type="monotone"
              dataKey="ideal"
              stroke="#8884d8"
              name="Ideal Burndown"
              dot={false}
              activeDot={{ r: 8 }}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#82ca9d"
              name="Actual Burndown"
              dot={false}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="scrum-card mt-6 p-4">
        <h3 className="text-lg font-medium mb-3">How to Read the Burndown Chart</h3>
        <ul className="list-disc pl-5 space-y-2 text-sm text-scrum-text-secondary">
          <li>
            <strong>Ideal Burndown</strong>: Shows the theoretical perfect progress where work is completed at a constant rate.
          </li>
          <li>
            <strong>Actual Burndown</strong>: Shows the actual remaining work based on completed tasks.
          </li>
          <li>
            When the Actual line is <strong>above</strong> the Ideal line, the project is <strong>behind schedule</strong>.
          </li>
          <li>
            When the Actual line is <strong>below</strong> the Ideal line, the project is <strong>ahead of schedule</strong>.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default BurndownChart;

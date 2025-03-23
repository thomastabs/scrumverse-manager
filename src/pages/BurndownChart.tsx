import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useProjects } from "@/context/ProjectContext";
import { useAuth } from "@/context/AuthContext";
import { supabase, fetchBurndownData, upsertBurndownData } from "@/lib/supabase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { format, parseISO, startOfDay, addDays, isBefore, isAfter, isToday, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { Task } from "@/types";

interface BurndownDataPoint {
  date: string;
  ideal: number;
  actual: number | null;
  formattedDate: string;
}

const BurndownChart: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { getProject, getTasksBySprint, getSprintsByProject, tasks, sprints } = useProjects();
  const { user } = useAuth();
  const [chartData, setChartData] = useState<BurndownDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastTasksLength, setLastTasksLength] = useState(0);
  const [lastSprintsLength, setLastSprintsLength] = useState(0);
  const dataFetchedRef = useRef(false);
  const loadingTimeoutRef = useRef<number | null>(null);
  
  const project = getProject(projectId || "");
  
  useEffect(() => {
    if (!projectId || !user || dataFetchedRef.current) return;
    
    const loadBurndownData = async () => {
      setIsLoading(true);
      try {
        const existingData = await fetchBurndownData(projectId, user.id);
        
        if (existingData && existingData.length > 0) {
          const formattedData = existingData.map(item => ({
            ...item,
            formattedDate: format(parseISO(item.date), "MMM dd")
          }));
          setChartData(formattedData);
        } else {
          await generateAndSaveBurndownData();
        }
      } catch (error) {
        console.error("Error loading burndown data:", error);
        await generateAndSaveBurndownData();
      } finally {
        // Use a timeout to prevent the loading indicator from flickering
        if (loadingTimeoutRef.current) window.clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = window.setTimeout(() => {
          setIsLoading(false);
          dataFetchedRef.current = true;
        }, 500);
      }
    };
    
    loadBurndownData();
    
    return () => {
      if (loadingTimeoutRef.current) {
        window.clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [projectId, user]);
  
  useEffect(() => {
    if (!projectId || !user || isLoading || !dataFetchedRef.current) return;
    
    const projectSprints = getSprintsByProject(projectId);
    const currentTasksCount = tasks.filter(t => t.projectId === projectId).length;
    const currentSprintsCount = projectSprints.length;
    
    const shouldUpdate = 
      currentTasksCount !== lastTasksLength || 
      currentSprintsCount !== lastSprintsLength;
    
    if (shouldUpdate && !isUpdating) {
      const updateBurndownData = async () => {
        try {
          setIsUpdating(true);
          await generateAndSaveBurndownData();
          
          setLastTasksLength(currentTasksCount);
          setLastSprintsLength(currentSprintsCount);
        } catch (error) {
          console.error("Error updating burndown data:", error);
        } finally {
          setIsUpdating(false);
        }
      };
      
      updateBurndownData();
    }
  }, [tasks, sprints, projectId, user, isLoading, lastTasksLength, lastSprintsLength, isUpdating]);
  
  const generateAndSaveBurndownData = async () => {
    try {
      if (!projectId || !user) return [];
      
      const burndownData = await generateBurndownData();
      setChartData(burndownData);
      
      const saved = await upsertBurndownData(projectId, user.id, burndownData);
      if (!saved) {
        console.warn("Failed to save burndown data to database");
      }
      
      return burndownData;
    } catch (error) {
      console.error("Error generating burndown data:", error);
      toast.error("Failed to generate burndown chart data");
      return [];
    }
  };
  
  const generateBurndownData = async (): Promise<BurndownDataPoint[]> => {
    const data: BurndownDataPoint[] = [];
    const today = startOfDay(new Date());
    
    const projectSprints = getSprintsByProject(projectId || "");
    
    if (projectSprints.length === 0) {
      return generateDefaultTimeframe(today, 21);
    }
    
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
    
    if (!earliestStartDate || !latestEndDate) {
      return generateDefaultTimeframe(today, 21);
    }
    
    const daysInProject = differenceInDays(latestEndDate, earliestStartDate) + 1;
    const timeframeDays = Math.max(daysInProject, 7);
    
    const allTasks: Task[] = [];
    for (const sprint of projectSprints) {
      const sprintTasks = getTasksBySprint(sprint.id);
      allTasks.push(...sprintTasks);
    }
    
    const totalStoryPoints = allTasks.reduce((sum, task) => {
      return sum + (task.storyPoints || task.story_points || 0);
    }, 0);
    
    if (totalStoryPoints === 0) {
      return generateDefaultTimeframe(today, timeframeDays);
    }
    
    const completedTasksByDate = new Map<string, number>();
    
    allTasks.forEach(task => {
      if (task.status === "done" && task.storyPoints) {
        // Use completion_date if available, otherwise use updatedAt
        const completionDateStr = task.completionDate || task.completion_date || task.updatedAt;
        if (completionDateStr) {
          // Extract just the date part (YYYY-MM-DD)
          const completionDate = completionDateStr.split('T')[0];
          const currentPoints = completedTasksByDate.get(completionDate) || 0;
          const points = task.storyPoints || task.story_points || 0;
          completedTasksByDate.set(completionDate, currentPoints + points);
        }
      }
    });
    
    let remainingPoints = totalStoryPoints;
    let actualRemainingPoints = totalStoryPoints;
    const pointsPerDay = totalStoryPoints / timeframeDays;
    
    for (let i = 0; i < timeframeDays; i++) {
      const date = addDays(earliestStartDate, i);
      const dateStr = date.toISOString().split('T')[0];
      const formattedDate = format(date, "MMM dd");
      
      const idealRemaining = Math.max(0, totalStoryPoints - (i * pointsPerDay));
      
      let actualPoints: number | null = null;
      
      if (isBefore(date, today) || isToday(date)) {
        const completedPoints = completedTasksByDate.get(dateStr) || 0;
        actualRemainingPoints = Math.max(0, actualRemainingPoints - completedPoints);
        actualPoints = actualRemainingPoints;
      }
      
      data.push({
        date: dateStr,
        ideal: Math.round(idealRemaining),
        actual: actualPoints,
        formattedDate
      });
    }
    
    return data;
  };
  
  const generateDefaultTimeframe = (startDate: Date, days: number): BurndownDataPoint[] => {
    const data: BurndownDataPoint[] = [];
    const totalPoints = 100;
    const pointsPerDay = totalPoints / days;
    const today = startOfDay(new Date());
    
    for (let i = 0; i < days; i++) {
      const date = addDays(startDate, i - Math.floor(days / 3));
      const dateStr = date.toISOString().split('T')[0];
      const idealRemaining = Math.max(0, totalPoints - (i * pointsPerDay));
      
      const actual = isBefore(date, today) || isToday(date) 
        ? Math.round(idealRemaining * (0.8 + Math.random() * 0.4))
        : null;
      
      data.push({
        date: dateStr,
        ideal: Math.round(idealRemaining),
        actual: actual,
        formattedDate: format(date, "MMM dd"),
      });
    }
    
    return data;
  };
  
  if (isLoading) {
    return (
      <div className="text-center py-12 opacity-100 transition-opacity duration-300">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-scrum-accent border-t-transparent animate-spin"></div>
          <p className="text-scrum-text-secondary">Loading burndown chart data...</p>
        </div>
      </div>
    );
  }
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayIndex = chartData.findIndex(d => d.date === todayStr);
  const todayLabel = todayIndex >= 0 ? chartData[todayIndex]?.formattedDate : format(new Date(), "MMM dd");
  
  const lastActualIndex = chartData.reduce((lastIdx, point, idx) => {
    return point.actual !== null ? idx : lastIdx;
  }, -1);
  
  return (
    <div>
      <div className="scrum-card mb-6">
        <h2 className="text-xl font-bold mb-2">Project Burndown Chart</h2>
        <p className="text-scrum-text-secondary">
          Tracking progress across all sprints in {project?.title || "this project"}
        </p>
      </div>
      
      <div className="scrum-card h-[500px] opacity-100 transition-opacity duration-500">
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
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--scrum-chart-grid))" />
            <XAxis
              dataKey="formattedDate"
              stroke="hsl(var(--scrum-chart-axis))"
              tick={{ fill: "hsl(var(--scrum-chart-axis))" }}
              axisLine={{ stroke: "hsl(var(--scrum-chart-grid))" }}
            />
            <YAxis
              label={{ 
                value: "Story Points Remaining", 
                angle: -90, 
                position: "insideLeft", 
                fill: "hsl(var(--scrum-chart-axis))" 
              }}
              stroke="hsl(var(--scrum-chart-axis))"
              tick={{ fill: "hsl(var(--scrum-chart-axis))" }}
              axisLine={{ stroke: "hsl(var(--scrum-chart-grid))" }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const idealValue = payload[0]?.value !== undefined ? payload[0].value : null;
                  const actualValue = payload.length > 1 && payload[1]?.value !== undefined ? payload[1].value : null;
                  
                  return (
                    <div className="bg-scrum-card border border-scrum-border p-3 rounded">
                      <p className="font-medium">{payload[0]?.payload?.formattedDate || ""}</p>
                      <div className="mt-2 space-y-1">
                        {idealValue !== null && (
                          <p className="flex items-center text-sm">
                            <span className="h-2 w-2 rounded-full bg-[hsl(var(--scrum-chart-line-1))] mr-2"></span>
                            <span>Ideal: {idealValue} points</span>
                          </p>
                        )}
                        {actualValue !== null && (
                          <p className="flex items-center text-sm">
                            <span className="h-2 w-2 rounded-full bg-[hsl(var(--scrum-chart-line-2))] mr-2"></span>
                            <span>Actual: {actualValue} points</span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              wrapperStyle={{ color: "inherit" }}
            />
            <ReferenceLine 
              x={todayLabel} 
              stroke="hsl(var(--scrum-chart-reference))" 
              strokeWidth={2}
              strokeDasharray="5 3" 
              label={{ 
                value: "TODAY", 
                position: "top", 
                fill: "hsl(var(--scrum-chart-reference))",
                fontSize: 12,
                fontWeight: "bold"
              }} 
            />
            <Line
              type="monotone"
              dataKey="ideal"
              stroke="hsl(var(--scrum-chart-line-1))"
              strokeWidth={2}
              name="Ideal Burndown"
              dot={false}
              activeDot={{ r: 8 }}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="hsl(var(--scrum-chart-line-2))"
              strokeWidth={2}
              name="Actual Burndown"
              dot={(props) => {
                const { cx, cy, payload, index } = props;
                if (!payload || payload.actual === null || payload.actual === undefined) return null;
                
                if (index === lastActualIndex) {
                  return (
                    <svg x={cx - 5} y={cy - 5} width={10} height={10}>
                      <circle cx={5} cy={5} r={5} fill="hsl(var(--scrum-chart-line-2))" />
                    </svg>
                  );
                }
                
                return null;
              }}
              activeDot={{ r: 8 }}
              connectNulls={false}
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
          <li>
            The <strong style={{ color: "hsl(var(--scrum-chart-reference))" }}>TODAY</strong> line marks the current date on the timeline.
          </li>
          <li>
            Task completion is calculated based on the <strong>completion date</strong> of each task.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default BurndownChart;

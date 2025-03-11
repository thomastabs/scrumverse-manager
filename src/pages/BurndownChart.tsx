
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
import { format, parseISO, startOfDay, addDays, min, max, differenceInDays, isBefore, isAfter } from "date-fns";
import { toast } from "sonner";

interface BurndownDataPoint {
  date: string;
  ideal: number;
  actual: number;
  formattedDate: string;
}

const BurndownChart: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { getProject, getTasksBySprint, getSprintsByProject } = useProjects();
  const { user } = useAuth();
  const [chartData, setChartData] = useState<BurndownDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const project = getProject(projectId || "");
  
  useEffect(() => {
    const fetchBurndownData = async () => {
      if (!projectId || !user) return;
      
      setIsLoading(true);
      try {
        // Fetch burndown data from Supabase
        const { data, error } = await supabase
          .from('burndown_data')
          .select('*')
          .eq('project_id', projectId)
          .eq('user_id', user.id)
          .order('date', { ascending: true });
          
        if (error) throw error;
        
        let burndownData: BurndownDataPoint[] = [];
        
        if (!data || data.length === 0) {
          // If no data exists, generate default data based on tasks
          burndownData = await generateDefaultBurndownData();
          
          // Save default data to database
          await Promise.all(
            burndownData.map(async (point) => {
              await supabase.from('burndown_data').insert({
                project_id: projectId,
                user_id: user.id,
                date: point.date,
                ideal_points: point.ideal,
                actual_points: point.actual
              });
            })
          );
        } else {
          // Format the existing data for the chart
          burndownData = data.map((item) => ({
            date: item.date,
            ideal: item.ideal_points,
            actual: item.actual_points,
            formattedDate: format(parseISO(item.date), "MMM dd"),
          }));
        }
        
        setChartData(burndownData);
      } catch (error) {
        console.error("Error fetching burndown data:", error);
        toast.error("Failed to load burndown chart data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBurndownData();
  }, [projectId, user]);
  
  const generateDefaultBurndownData = async (): Promise<BurndownDataPoint[]> => {
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
    
    // Calculate total and completed story points
    let totalStoryPoints = 0;
    let completedPoints = 0;
    
    for (const sprint of projectSprints) {
      const tasks = getTasksBySprint(sprint.id);
      
      for (const task of tasks) {
        if (task.storyPoints) {
          totalStoryPoints += task.storyPoints;
          
          // Count completed tasks for actual burndown
          if (task.status === "done") {
            completedPoints += task.storyPoints;
          }
        }
      }
    }
    
    // If no story points, set a default value
    if (totalStoryPoints === 0) {
      totalStoryPoints = 100;
    }
    
    // Generate data points for each day in the project timeframe
    for (let i = 0; i < timeframeDays; i++) {
      const date = addDays(earliestStartDate, i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Calculate ideal burndown - linear decrease over the project timeframe
      const idealRemaining = Math.max(0, totalStoryPoints - (i * (totalStoryPoints / (timeframeDays - 1))));
      
      // For actual burndown, start with total points and then reduce based on completed tasks
      // Only reduce for past dates
      let actualRemaining = totalStoryPoints;
      const isPastDate = date <= today;
      
      if (isPastDate) {
        actualRemaining = Math.max(0, totalStoryPoints - completedPoints);
      }
      
      data.push({
        date: dateStr,
        ideal: Math.round(idealRemaining),
        actual: Math.round(actualRemaining),
        formattedDate: format(date, "MMM dd"),
      });
    }
    
    return data;
  };
  
  const generateDefaultTimeframe = (startDate: Date, days: number): BurndownDataPoint[] => {
    const data: BurndownDataPoint[] = [];
    const totalPoints = 100;
    
    for (let i = 0; i < days; i++) {
      const date = addDays(startDate, i);
      const dateStr = date.toISOString().split('T')[0];
      const idealRemaining = Math.max(0, totalPoints - (i * (totalPoints / (days - 1))));
      
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
      <div className="text-center py-12">
        <p>Loading burndown chart data...</p>
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
              label={{ value: "Story Points", angle: -90, position: "insideLeft", fill: "#777" }}
              stroke="#777"
              tick={{ fill: "#777" }}
              axisLine={{ stroke: "#444" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#222",
                border: "1px solid #444",
                borderRadius: "4px",
                color: "#fff",
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
    </div>
  );
};

export default BurndownChart;
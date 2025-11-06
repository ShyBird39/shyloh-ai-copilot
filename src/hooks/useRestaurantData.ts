import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface KPIData {
  avg_weekly_sales: number | null;
  food_cost_goal: number | null;
  labor_cost_goal: number | null;
  sales_mix_food: number | null;
  sales_mix_liquor: number | null;
  sales_mix_wine: number | null;
  sales_mix_beer: number | null;
  sales_mix_na_bev: number | null;
}

interface ToolsData {
  pos_system: string | null;
  reservation_system: string | null;
  payroll_system: string | null;
  accounting_system: string | null;
  inventory_system: string | null;
  scheduling_system: string | null;
  marketing_tools: string | null;
}

interface ToastData {
  dailySales: number;
  guestCount: number;
  avgCheck: number;
  orderCount: number;
  hourlyData: any[];
}

export const useRestaurantData = (restaurantId: string | undefined) => {
  // Restaurant profile state
  const [restaurantData, setRestaurantData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // KPI state
  const [kpiData, setKPIData] = useState<KPIData>({
    avg_weekly_sales: null,
    food_cost_goal: null,
    labor_cost_goal: null,
    sales_mix_food: null,
    sales_mix_liquor: null,
    sales_mix_wine: null,
    sales_mix_beer: null,
    sales_mix_na_bev: null,
  });
  const [hasCompletedKPIs, setHasCompletedKPIs] = useState<boolean | null>(null);

  // Tools state
  const [toolsData, setToolsData] = useState<ToolsData>({
    pos_system: null,
    reservation_system: null,
    payroll_system: null,
    accounting_system: null,
    inventory_system: null,
    scheduling_system: null,
    marketing_tools: null,
  });

  // Custom knowledge state
  const [customKnowledge, setCustomKnowledge] = useState<any[]>([]);

  // Toast POS state
  const [toastData, setToastData] = useState<ToastData | null>(null);
  const [loadingToastData, setLoadingToastData] = useState(false);

  // Load custom knowledge
  const loadCustomKnowledge = async () => {
    if (!restaurantId) return;
    
    try {
      const { data, error } = await supabase
        .from("restaurant_custom_knowledge")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCustomKnowledge(data || []);
    } catch (error) {
      console.error("Error loading custom knowledge:", error);
    }
  };

  // Fetch Toast POS data
  const fetchToastData = async () => {
    if (!restaurantData?.restaurant_guid || toolsData?.pos_system !== 'Toast') {
      return;
    }

    setLoadingToastData(true);
    try {
      const { data: toastResponse, error } = await supabase.functions.invoke('toast-reporting', {
        body: {
          action: 'request-and-poll',
          reportType: 'metrics',
          timeRange: 'day',
          startDate: parseInt(format(new Date(), 'yyyyMMdd')),
          endDate: parseInt(format(new Date(), 'yyyyMMdd')),
          restaurantIds: [restaurantData.restaurant_guid],
          aggregateBy: 'HOUR'
        }
      });

      if (error) throw error;

      if (toastResponse?.success && toastResponse?.data) {
        const hourlyData = toastResponse.data;
        
        // Aggregate daily totals
        const totals = hourlyData.reduce((acc: any, hour: any) => ({
          netSales: (acc.netSales || 0) + (hour.netSales || 0),
          guestCount: (acc.guestCount || 0) + (hour.guestCount || 0),
          ordersCount: (acc.ordersCount || 0) + (hour.ordersCount || 0),
        }), {});

        setToastData({
          dailySales: totals.netSales || 0,
          guestCount: totals.guestCount || 0,
          avgCheck: totals.guestCount > 0 ? totals.netSales / totals.guestCount : 0,
          orderCount: totals.ordersCount || 0,
          hourlyData: hourlyData
        });
      }
    } catch (error) {
      console.error('Error fetching Toast data:', error);
    } finally {
      setLoadingToastData(false);
    }
  };

  // Refresh restaurant data
  const refreshRestaurantData = async () => {
    if (!restaurantId) return;
    
    try {
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single();

      if (restaurantError) throw restaurantError;
      setRestaurantData(restaurant);
      console.log('Restaurant data refreshed:', restaurant);
    } catch (error) {
      console.error('Error refreshing restaurant data:', error);
    }
  };

  // Load all restaurant data on mount
  useEffect(() => {
    const loadRestaurantData = async () => {
      if (!restaurantId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch restaurant data
        const { data: restaurant, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('id', restaurantId)
          .single();

        if (restaurantError) throw restaurantError;
        setRestaurantData(restaurant);

        // Fetch tools data
        const { data: tools, error: toolsError } = await supabase
          .from('restaurant_tools')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .maybeSingle();

        if (toolsError && toolsError.code !== 'PGRST116') {
          throw toolsError;
        }
        
        if (tools) {
          setToolsData(tools);
        }

        // Fetch KPIs
        const { data: kpis, error: kpisError } = await supabase
          .from('restaurant_kpis')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .maybeSingle();

        if (kpisError && kpisError.code !== 'PGRST116') {
          throw kpisError;
        }

        if (kpis) {
          setKPIData({
            avg_weekly_sales: kpis.avg_weekly_sales,
            food_cost_goal: kpis.food_cost_goal,
            labor_cost_goal: kpis.labor_cost_goal,
            sales_mix_food: kpis.sales_mix_food,
            sales_mix_liquor: kpis.sales_mix_liquor,
            sales_mix_wine: kpis.sales_mix_wine,
            sales_mix_beer: kpis.sales_mix_beer,
            sales_mix_na_bev: kpis.sales_mix_na_bev,
          });

          const allKPIsCompleted = Boolean(
            kpis.avg_weekly_sales &&
            kpis.food_cost_goal &&
            kpis.labor_cost_goal &&
            kpis.sales_mix_food !== null &&
            kpis.sales_mix_liquor !== null &&
            kpis.sales_mix_wine !== null &&
            kpis.sales_mix_beer !== null &&
            kpis.sales_mix_na_bev !== null
          );
          setHasCompletedKPIs(allKPIsCompleted);
        } else {
          setHasCompletedKPIs(false);
        }
      } catch (error) {
        console.error('Error fetching restaurant:', error);
        toast.error('Failed to load restaurant data');
      } finally {
        setLoading(false);
      }
    };

    loadRestaurantData();
  }, [restaurantId]);

  // Load custom knowledge on mount
  useEffect(() => {
    loadCustomKnowledge();
  }, [restaurantId]);

  // Fetch Toast data when tools are loaded
  useEffect(() => {
    if (restaurantData && toolsData?.pos_system === 'Toast' && restaurantData.restaurant_guid) {
      fetchToastData();
    }
  }, [restaurantData, toolsData]);

  return {
    // State
    restaurantData,
    setRestaurantData,
    kpiData,
    setKPIData,
    hasCompletedKPIs,
    setHasCompletedKPIs,
    toolsData,
    setToolsData,
    customKnowledge,
    setCustomKnowledge,
    toastData,
    loadingToastData,
    loading,

    // Operations
    loadCustomKnowledge,
    fetchToastData,
    refreshRestaurantData,
  };
};

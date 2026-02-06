export type WidgetType = 'line_chart' | 'bar_chart' | 'pie_chart' | 'area_chart' | 'stat_card' | 'table' | 'metric';

export interface Dashboard {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  layout: WidgetPosition[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
  widgets?: Widget[];
}

export interface Widget {
  id: string;
  dashboard_id: string;
  title: string;
  widget_type: WidgetType;
  data_source: string;
  config: Record<string, unknown>;
  position: WidgetPosition;
  created_at: string;
}

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Metric {
  id: string;
  tenant_id: string;
  module: string;
  metric_name: string;
  metric_value: number;
  dimensions: Record<string, unknown>;
  recorded_at: string;
}

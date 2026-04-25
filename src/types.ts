/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ProductionStatus = 'QUEUED' | 'IN_PROGRESS' | 'QUALITY_CHECK' | 'COMPLETED' | 'DELAYED';

export interface ProductionRecord {
  id: string;
  date: string;
  shift: 'DAY' | 'NIGHT';
  machineId: string;
  operatorName: string;
  designName: string;
  designStitch: number;
  frame: number;
  totalMeters: number;
  totalStitches: number;
}

export interface ProductionItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  status: ProductionStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  startDate: string;
  dueDate: string;
  progress: number; // 0 to 100
  assignedTo: string;
  machineHead?: string;
  machineArea?: string;
  frameMeters?: number;
  productionLogs?: ProductionRecord[];
}

export interface ProductionMetric {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

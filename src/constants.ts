import { ProductionItem } from "./types";

export const INITIAL_DATA: ProductionItem[] = [
  {
    id: 'PRD-001',
    name: 'Precision Gear Assembly',
    category: 'Mechanical',
    quantity: 500,
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    startDate: '2026-04-20',
    dueDate: '2026-05-01',
    progress: 65,
    assignedTo: 'Alex Rivera'
  },
  {
    id: 'PRD-002',
    name: 'Optical Sensor Unit',
    category: 'Electronics',
    quantity: 1200,
    status: 'QUALITY_CHECK',
    priority: 'MEDIUM',
    startDate: '2026-04-18',
    dueDate: '2026-04-28',
    progress: 90,
    assignedTo: 'Sarah Chen'
  },
  {
    id: 'PRD-003',
    name: 'Reinforced Chassis Frame',
    category: 'Structural',
    quantity: 200,
    status: 'QUEUED',
    priority: 'LOW',
    startDate: '2026-04-25',
    dueDate: '2026-05-15',
    progress: 0,
    assignedTo: 'Marcus Thorne'
  },
  {
    id: 'PRD-004',
    name: 'Control Circuit Board',
    category: 'Electronics',
    quantity: 850,
    status: 'DELAYED',
    priority: 'HIGH',
    startDate: '2026-04-15',
    dueDate: '2026-04-22',
    progress: 45,
    assignedTo: 'Elena Petrova'
  },
  {
    id: 'PRD-005',
    name: 'Thermal Heat Sink',
    category: 'Thermal',
    quantity: 3000,
    status: 'COMPLETED',
    priority: 'LOW',
    startDate: '2026-04-10',
    dueDate: '2026-04-20',
    progress: 100,
    assignedTo: 'David Kim'
  },
  {
    id: 'PRD-006',
    name: 'Hydraulic Valve System',
    category: 'Mechanical',
    quantity: 150,
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    startDate: '2026-04-22',
    dueDate: '2026-05-05',
    progress: 20,
    assignedTo: 'Jordan Smith'
  }
];

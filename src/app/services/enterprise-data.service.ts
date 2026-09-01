import { Injectable, signal, computed } from '@angular/core';
import {
  EnterpriseMetric,
  TransactionRecord,
  BiAggregationResult,
  ExportAuditReport,
  BiFilterState,
  MetricCategory,
  BiTimeRange,
  ExportFormat,
  BusinessDomain,
  InventoryStockStatus,
  EnterpriseBiTab,
  ReorderPriority,
  InventorySupplier,
  InventoryItem,
  InventoryFilterState,
  DomainSummaryResult,
  ReorderReceipt,
} from '../models/enterprise-bi.types';

@Injectable({
  providedIn: 'root',
})
export class EnterpriseDataService {
  // --- Raw State Signals ---
  readonly metrics = signal<EnterpriseMetric[]>([
    {
      id: 'revenue_ytd',
      name: 'Total Revenue YTD',
      category: 'financial',
      value: 14820000,
      unit: 'USD',
      deltaPercent: 18.4,
      trend: 'up',
      history: [
        { timestamp: '00:00', value: 12100000 },
        { timestamp: '04:00', value: 12400000 },
        { timestamp: '08:00', value: 13200000 },
        { timestamp: '12:00', value: 13900000 },
        { timestamp: '16:00', value: 14350000 },
        { timestamp: '20:00', value: 14820000 },
      ],
      targetThreshold: 15000000,
      status: 'healthy',
    },
    {
      id: 'system_latency',
      name: 'Global Edge Latency',
      category: 'performance',
      value: 42.6,
      unit: 'ms',
      deltaPercent: -8.2,
      trend: 'down',
      history: [
        { timestamp: '00:00', value: 58.2 },
        { timestamp: '04:00', value: 51.4 },
        { timestamp: '08:00', value: 47.9 },
        { timestamp: '12:00', value: 44.1 },
        { timestamp: '16:00', value: 43.0 },
        { timestamp: '20:00', value: 42.6 },
      ],
      targetThreshold: 50.0,
      status: 'healthy',
    },
    {
      id: 'active_nodes',
      name: 'Active Mesh Nodes',
      category: 'infrastructure',
      value: 1284,
      unit: 'nodes',
      deltaPercent: 4.5,
      trend: 'up',
      history: [
        { timestamp: '00:00', value: 1150 },
        { timestamp: '04:00', value: 1180 },
        { timestamp: '08:00', value: 1220 },
        { timestamp: '12:00', value: 1260 },
        { timestamp: '16:00', value: 1275 },
        { timestamp: '20:00', value: 1284 },
      ],
      targetThreshold: 1000,
      status: 'healthy',
    },
    {
      id: 'anomaly_score',
      name: 'AI Threat Anomaly Index',
      category: 'security',
      value: 0.014,
      unit: 'idx',
      deltaPercent: -32.1,
      trend: 'down',
      history: [
        { timestamp: '00:00', value: 0.045 },
        { timestamp: '04:00', value: 0.038 },
        { timestamp: '08:00', value: 0.024 },
        { timestamp: '12:00', value: 0.019 },
        { timestamp: '16:00', value: 0.016 },
        { timestamp: '20:00', value: 0.014 },
      ],
      targetThreshold: 0.05,
      status: 'healthy',
    },
  ]);

  readonly transactions = signal<TransactionRecord[]>([
    {
      id: 'TXN-9021-AF',
      timestamp: '2026-08-26T17:15:00Z',
      department: 'Autonomous Fleet',
      service: 'LiDAR Mesh Ingestion',
      amount: 14250.0,
      currency: 'USD',
      latencyMs: 38.4,
      status: 'completed',
      anomalyScore: 0.02,
      region: 'us-east-1',
    },
    {
      id: 'TXN-9022-FC',
      timestamp: '2026-08-26T17:18:22Z',
      department: 'Fintech Cloud',
      service: 'High-Freq Settlement',
      amount: 98400.0,
      currency: 'USD',
      latencyMs: 14.2,
      status: 'completed',
      anomalyScore: 0.01,
      region: 'eu-west-1',
    },
    {
      id: 'TXN-9023-EN',
      timestamp: '2026-08-26T17:21:40Z',
      department: 'Engineering',
      service: 'Neural Model Fine-Tuning',
      amount: 5600.0,
      currency: 'USD',
      latencyMs: 145.0,
      status: 'pending',
      anomalyScore: 0.08,
      region: 'us-west-2',
    },
    {
      id: 'TXN-9024-AS',
      timestamp: '2026-08-26T17:24:10Z',
      department: 'AI Security',
      service: 'Zero-Trust Auth Token Verification',
      amount: 1200.0,
      currency: 'USD',
      latencyMs: 8.7,
      status: 'completed',
      anomalyScore: 0.005,
      region: 'ap-northeast-1',
    },
    {
      id: 'TXN-9025-GS',
      timestamp: '2026-08-26T17:28:55Z',
      department: 'Global Sales',
      service: 'B2B Enterprise License Renewal',
      amount: 250000.0,
      currency: 'USD',
      latencyMs: 62.1,
      status: 'completed',
      anomalyScore: 0.04,
      region: 'us-east-1',
    },
    {
      id: 'TXN-9026-FC',
      timestamp: '2026-08-26T17:30:12Z',
      department: 'Fintech Cloud',
      service: 'Cross-Border FX Liquidity Pool',
      amount: 175000.0,
      currency: 'USD',
      latencyMs: 22.5,
      status: 'completed',
      anomalyScore: 0.015,
      region: 'eu-central-1',
    },
    {
      id: 'TXN-9027-AS',
      timestamp: '2026-08-26T17:32:05Z',
      department: 'AI Security',
      service: 'DDoS Mitigation Ingress Filter',
      amount: 450.0,
      currency: 'USD',
      latencyMs: 310.4,
      status: 'flagged',
      anomalyScore: 0.89,
      region: 'sa-east-1',
    },
    {
      id: 'TXN-9028-AF',
      timestamp: '2026-08-26T17:34:40Z',
      department: 'Autonomous Fleet',
      service: 'Telemetry Vector Stream',
      amount: 8750.0,
      currency: 'USD',
      latencyMs: 41.2,
      status: 'completed',
      anomalyScore: 0.03,
      region: 'us-west-1',
    },
    {
      id: 'TXN-9029-EN',
      timestamp: '2026-08-26T17:36:19Z',
      department: 'Engineering',
      service: 'CI/CD Distributed Test Matrix',
      amount: 3200.0,
      currency: 'USD',
      latencyMs: 89.0,
      status: 'completed',
      anomalyScore: 0.02,
      region: 'us-east-2',
    },
    {
      id: 'TXN-9030-FC',
      timestamp: '2026-08-26T17:38:00Z',
      department: 'Fintech Cloud',
      service: 'Automated Margin Clearing',
      amount: 64200.0,
      currency: 'USD',
      latencyMs: 18.9,
      status: 'completed',
      anomalyScore: 0.01,
      region: 'ap-southeast-1',
    },
    {
      id: 'TXN-9031-AS',
      timestamp: '2026-08-26T17:40:11Z',
      department: 'AI Security',
      service: 'Outlier Payload Quarantine',
      amount: 890.0,
      currency: 'USD',
      latencyMs: 450.0,
      status: 'flagged',
      anomalyScore: 0.94,
      region: 'eu-west-2',
    },
    {
      id: 'TXN-9032-GS',
      timestamp: '2026-08-26T17:42:33Z',
      department: 'Global Sales',
      service: 'OEM Partner Onboarding Tier 1',
      amount: 120000.0,
      currency: 'USD',
      latencyMs: 54.0,
      status: 'pending',
      anomalyScore: 0.03,
      region: 'us-east-1',
    },
    {
      id: 'TXN-9033-AF',
      timestamp: '2026-08-26T17:44:02Z',
      department: 'Autonomous Fleet',
      service: 'Over-The-Air Firmware Manifest',
      amount: 22400.0,
      currency: 'USD',
      latencyMs: 49.3,
      status: 'completed',
      anomalyScore: 0.025,
      region: 'eu-north-1',
    },
    {
      id: 'TXN-9034-EN',
      timestamp: '2026-08-26T17:45:15Z',
      department: 'Engineering',
      service: 'Vector Embeddings Cache Warmup',
      amount: 7800.0,
      currency: 'USD',
      latencyMs: 72.8,
      status: 'completed',
      anomalyScore: 0.01,
      region: 'us-west-2',
    },
    {
      id: 'TXN-9035-FC',
      timestamp: '2026-08-26T17:46:50Z',
      department: 'Fintech Cloud',
      service: 'Real-Time Compliance Audit Sweep',
      amount: 31000.0,
      currency: 'USD',
      latencyMs: 29.5,
      status: 'completed',
      anomalyScore: 0.015,
      region: 'ap-east-1',
    },
    {
      id: 'TXN-9036-AS',
      timestamp: '2026-08-26T17:48:10Z',
      department: 'AI Security',
      service: 'Credential Stuffing Defense',
      amount: 1500.0,
      currency: 'USD',
      latencyMs: 198.2,
      status: 'flagged',
      anomalyScore: 0.78,
      region: 'us-east-1',
    },
    {
      id: 'TXN-9037-GS',
      timestamp: '2026-08-26T17:49:25Z',
      department: 'Global Sales',
      service: 'Cloud Storage Tier Upgrade',
      amount: 18500.0,
      currency: 'USD',
      latencyMs: 34.1,
      status: 'completed',
      anomalyScore: 0.01,
      region: 'eu-central-1',
    },
    {
      id: 'TXN-9038-AF',
      timestamp: '2026-08-26T17:50:45Z',
      department: 'Autonomous Fleet',
      service: '3D Point Cloud Ground Truth Sync',
      amount: 45000.0,
      currency: 'USD',
      latencyMs: 88.6,
      status: 'pending',
      anomalyScore: 0.05,
      region: 'us-west-1',
    },
    {
      id: 'TXN-9039-EN',
      timestamp: '2026-08-26T17:51:30Z',
      department: 'Engineering',
      service: 'GraphQL Gateway Query Compilation',
      amount: 2900.0,
      currency: 'USD',
      latencyMs: 16.4,
      status: 'completed',
      anomalyScore: 0.005,
      region: 'us-east-1',
    },
    {
      id: 'TXN-9040-FC',
      timestamp: '2026-08-26T17:52:10Z',
      department: 'Fintech Cloud',
      service: 'Synthetic Derivatives Rebalancing',
      amount: 320000.0,
      currency: 'USD',
      latencyMs: 25.1,
      status: 'completed',
      anomalyScore: 0.02,
      region: 'eu-west-1',
    },
  ]);

  readonly filterState = signal<BiFilterState>({
    status: 'all',
    department: 'all',
    searchTerm: '',
    minAmount: 0,
    timeRange: '24h',
  });

  readonly exportAuditLog = signal<ExportAuditReport[]>([]);

  // --- Multi-Domain Inventory State Signals ---
  readonly inventory = signal<InventoryItem[]>([
    // Retail Domain (4 SKUs)
    {
      id: 'INV-RET-101',
      sku: 'RET-101',
      name: 'Quantum Wireless POS Terminal',
      domain: 'retail',
      stockLevel: 85,
      minThreshold: 20,
      maxCapacity: 200,
      unitPrice: 299.99,
      currency: 'USD',
      status: 'in_stock',
      supplier: {
        id: 'SUP-RET-01',
        name: 'OmniRetail Systems',
        leadTimeDays: 3,
        rating: 4.8,
        contactEmail: 'supply@omniretail.io',
      },
      lastRestocked: '2026-08-20T10:00:00Z',
      location: 'Warehouse North - Section A1',
    },
    {
      id: 'INV-RET-102',
      sku: 'RET-102',
      name: 'Smart Shelf RFID Beacon',
      domain: 'retail',
      stockLevel: 14,
      minThreshold: 25,
      maxCapacity: 150,
      unitPrice: 45.5,
      currency: 'USD',
      status: 'low_stock',
      supplier: {
        id: 'SUP-RET-02',
        name: 'IoT Retail Solutions',
        leadTimeDays: 5,
        rating: 4.6,
        contactEmail: 'orders@iotretailsol.com',
      },
      lastRestocked: '2026-08-15T08:30:00Z',
      location: 'Warehouse North - Section A3',
    },
    {
      id: 'INV-RET-103',
      sku: 'RET-103',
      name: 'UltraHD Electronic Shelf Label',
      domain: 'retail',
      stockLevel: 0,
      minThreshold: 50,
      maxCapacity: 500,
      unitPrice: 18.0,
      currency: 'USD',
      status: 'out_of_stock',
      supplier: {
        id: 'SUP-RET-01',
        name: 'OmniRetail Systems',
        leadTimeDays: 3,
        rating: 4.8,
        contactEmail: 'supply@omniretail.io',
      },
      lastRestocked: '2026-08-01T14:00:00Z',
      location: 'Warehouse North - Section A5',
    },
    {
      id: 'INV-RET-104',
      sku: 'RET-104',
      name: 'Self-Checkout Optical Scanner',
      domain: 'retail',
      stockLevel: 42,
      minThreshold: 15,
      maxCapacity: 80,
      unitPrice: 850.0,
      currency: 'USD',
      status: 'in_stock',
      supplier: {
        id: 'SUP-RET-03',
        name: 'AcuScan Robotics',
        leadTimeDays: 7,
        rating: 4.9,
        contactEmail: 'enterprise@acuscan.tech',
      },
      lastRestocked: '2026-08-22T11:15:00Z',
      location: 'Warehouse North - Section B2',
    },

    // Hardware Domain (4 SKUs)
    {
      id: 'INV-HDW-201',
      sku: 'HDW-201',
      name: 'Edge AI Accelerators (PCIe)',
      domain: 'hardware',
      stockLevel: 60,
      minThreshold: 15,
      maxCapacity: 120,
      unitPrice: 1250.0,
      currency: 'USD',
      status: 'in_stock',
      supplier: {
        id: 'SUP-HDW-01',
        name: 'NeuralSilicon Labs',
        leadTimeDays: 10,
        rating: 4.9,
        contactEmail: 'chips@neuralsilicon.ai',
      },
      lastRestocked: '2026-08-18T09:00:00Z',
      location: 'Facility Tech-Bay 4',
    },
    {
      id: 'INV-HDW-202',
      sku: 'HDW-202',
      name: 'Industrial LiDAR Sensor Array',
      domain: 'hardware',
      stockLevel: 8,
      minThreshold: 12,
      maxCapacity: 50,
      unitPrice: 2400.0,
      currency: 'USD',
      status: 'low_stock',
      supplier: {
        id: 'SUP-HDW-02',
        name: 'PrecisionPhotonics Inc',
        leadTimeDays: 14,
        rating: 4.7,
        contactEmail: 'sales@pphotonics.com',
      },
      lastRestocked: '2026-08-10T16:45:00Z',
      location: 'Facility Tech-Bay 2',
    },
    {
      id: 'INV-HDW-203',
      sku: 'HDW-203',
      name: 'ARM64 Server Blade Unit',
      domain: 'hardware',
      stockLevel: 25,
      minThreshold: 10,
      maxCapacity: 60,
      unitPrice: 3800.0,
      currency: 'USD',
      status: 'in_stock',
      supplier: {
        id: 'SUP-HDW-03',
        name: 'MegaCompute Hardware',
        leadTimeDays: 8,
        rating: 4.8,
        contactEmail: 'enterprise@megacompute.com',
      },
      lastRestocked: '2026-08-24T12:00:00Z',
      location: 'Facility Server-Row C',
    },
    {
      id: 'INV-HDW-204',
      sku: 'HDW-204',
      name: 'Redundant 2000W Platinum PSU',
      domain: 'hardware',
      stockLevel: 0,
      minThreshold: 10,
      maxCapacity: 80,
      unitPrice: 420.0,
      currency: 'USD',
      status: 'out_of_stock',
      supplier: {
        id: 'SUP-HDW-03',
        name: 'MegaCompute Hardware',
        leadTimeDays: 4,
        rating: 4.8,
        contactEmail: 'enterprise@megacompute.com',
      },
      lastRestocked: '2026-07-28T14:30:00Z',
      location: 'Facility Power-Rack 1',
    },

    // Logistics Domain (4 SKUs)
    {
      id: 'INV-LOG-301',
      sku: 'LOG-301',
      name: 'Autonomous Pallet AGV Rover',
      domain: 'logistics',
      stockLevel: 12,
      minThreshold: 5,
      maxCapacity: 25,
      unitPrice: 15500.0,
      currency: 'USD',
      status: 'in_stock',
      supplier: {
        id: 'SUP-LOG-01',
        name: 'RoboFleet Global',
        leadTimeDays: 21,
        rating: 4.9,
        contactEmail: 'dispatch@robofleet.io',
      },
      lastRestocked: '2026-08-05T09:20:00Z',
      location: 'Logistics Hub Central',
    },
    {
      id: 'INV-LOG-302',
      sku: 'LOG-302',
      name: 'Rugged GPS Telematics Gateway',
      domain: 'logistics',
      stockLevel: 110,
      minThreshold: 30,
      maxCapacity: 300,
      unitPrice: 185.0,
      currency: 'USD',
      status: 'in_stock',
      supplier: {
        id: 'SUP-LOG-02',
        name: 'TrackGlobal Tech',
        leadTimeDays: 6,
        rating: 4.7,
        contactEmail: 'support@trackglobal.com',
      },
      lastRestocked: '2026-08-21T13:40:00Z',
      location: 'Logistics Depot 3',
    },
    {
      id: 'INV-LOG-303',
      sku: 'LOG-303',
      name: 'Thermal Cargo Temperature Logger',
      domain: 'logistics',
      stockLevel: 15,
      minThreshold: 40,
      maxCapacity: 200,
      unitPrice: 95.0,
      currency: 'USD',
      status: 'low_stock',
      supplier: {
        id: 'SUP-LOG-02',
        name: 'TrackGlobal Tech',
        leadTimeDays: 5,
        rating: 4.7,
        contactEmail: 'support@trackglobal.com',
      },
      lastRestocked: '2026-08-12T10:10:00Z',
      location: 'Logistics Cold-Chain B',
    },
    {
      id: 'INV-LOG-304',
      sku: 'LOG-304',
      name: 'High-Speed Barcode Sorter Arm',
      domain: 'logistics',
      stockLevel: 6,
      minThreshold: 4,
      maxCapacity: 15,
      unitPrice: 8900.0,
      currency: 'USD',
      status: 'in_stock',
      supplier: {
        id: 'SUP-LOG-01',
        name: 'RoboFleet Global',
        leadTimeDays: 18,
        rating: 4.9,
        contactEmail: 'dispatch@robofleet.io',
      },
      lastRestocked: '2026-08-16T15:00:00Z',
      location: 'Logistics Sorting Wing',
    },

    // Pharma Domain (4 SKUs)
    {
      id: 'INV-PHA-401',
      sku: 'PHA-401',
      name: 'Cryogenic Specimen Vial (100pk)',
      domain: 'pharma',
      stockLevel: 240,
      minThreshold: 80,
      maxCapacity: 600,
      unitPrice: 120.0,
      currency: 'USD',
      status: 'in_stock',
      supplier: {
        id: 'SUP-PHA-01',
        name: 'BioCare Instruments',
        leadTimeDays: 4,
        rating: 4.95,
        contactEmail: 'orders@biocare-pharma.com',
      },
      lastRestocked: '2026-08-25T08:00:00Z',
      location: 'Pharma Lab Vault 1',
    },
    {
      id: 'INV-PHA-402',
      sku: 'PHA-402',
      name: 'Digital Precision Micro-Pipette',
      domain: 'pharma',
      stockLevel: 18,
      minThreshold: 20,
      maxCapacity: 80,
      unitPrice: 450.0,
      currency: 'USD',
      status: 'low_stock',
      supplier: {
        id: 'SUP-PHA-01',
        name: 'BioCare Instruments',
        leadTimeDays: 6,
        rating: 4.95,
        contactEmail: 'orders@biocare-pharma.com',
      },
      lastRestocked: '2026-08-11T14:15:00Z',
      location: 'Pharma Cleanroom A',
    },
    {
      id: 'INV-PHA-403',
      sku: 'PHA-403',
      name: 'Smart Cold-Chain Vaccine Safe',
      domain: 'pharma',
      stockLevel: 5,
      minThreshold: 3,
      maxCapacity: 12,
      unitPrice: 14200.0,
      currency: 'USD',
      status: 'in_stock',
      supplier: {
        id: 'SUP-PHA-02',
        name: 'MedTemp Vaults',
        leadTimeDays: 12,
        rating: 4.85,
        contactEmail: 'sales@medtemp.eu',
      },
      lastRestocked: '2026-08-08T11:30:00Z',
      location: 'Pharma Lab Vault 2',
    },
    {
      id: 'INV-PHA-404',
      sku: 'PHA-404',
      name: 'Centrifuge Rotors Titanium T8',
      domain: 'pharma',
      stockLevel: 0,
      minThreshold: 5,
      maxCapacity: 20,
      unitPrice: 3100.0,
      currency: 'USD',
      status: 'out_of_stock',
      supplier: {
        id: 'SUP-PHA-02',
        name: 'MedTemp Vaults',
        leadTimeDays: 9,
        rating: 4.85,
        contactEmail: 'sales@medtemp.eu',
      },
      lastRestocked: '2026-07-20T09:45:00Z',
      location: 'Pharma Prep Room C',
    },
  ]);

  readonly inventoryFilter = signal<InventoryFilterState>({
    domain: 'all',
    status: 'all',
    searchTerm: '',
    lowStockOnly: false,
  });

  readonly reorderLog = signal<ReorderReceipt[]>([]);

  // --- Computed Reactive Signals ---
  readonly filteredTransactions = computed(() => {
    const list = this.transactions();
    const filter = this.filterState();
    const search = filter.searchTerm.trim().toLowerCase();

    return list.filter((tx) => {
      // Status filter
      if (filter.status !== 'all' && tx.status !== filter.status) {
        return false;
      }
      // Department filter
      if (filter.department !== 'all' && tx.department.toLowerCase() !== filter.department.toLowerCase()) {
        return false;
      }
      // Min amount filter
      if (filter.minAmount > 0 && tx.amount < filter.minAmount) {
        return false;
      }
      // Search term
      if (search) {
        const matchesId = tx.id.toLowerCase().includes(search);
        const matchesService = tx.service.toLowerCase().includes(search);
        const matchesDept = tx.department.toLowerCase().includes(search);
        const matchesRegion = tx.region.toLowerCase().includes(search);
        if (!matchesId && !matchesService && !matchesDept && !matchesRegion) {
          return false;
        }
      }
      return true;
    });
  });

  readonly aggregation = computed<BiAggregationResult>(() => {
    const list = this.filteredTransactions();
    const totalTransactions = list.length;

    if (totalTransactions === 0) {
      return {
        totalTransactions: 0,
        totalVolume: 0,
        averageLatencyMs: 0,
        anomalyRatePercent: 0,
        departmentBreakdown: {},
        statusCounts: { completed: 0, pending: 0, flagged: 0 },
      };
    }

    let totalVolume = 0;
    let totalLatency = 0;
    let anomalyCount = 0;
    const statusCounts = { completed: 0, pending: 0, flagged: 0 };
    const departmentBreakdown: Record<string, { count: number; volume: number }> = {};

    for (const tx of list) {
      totalVolume += tx.amount;
      totalLatency += tx.latencyMs;
      if (tx.anomalyScore > 0.5 || tx.status === 'flagged') {
        anomalyCount++;
      }
      statusCounts[tx.status] = (statusCounts[tx.status] || 0) + 1;

      if (!departmentBreakdown[tx.department]) {
        departmentBreakdown[tx.department] = { count: 0, volume: 0 };
      }
      departmentBreakdown[tx.department].count++;
      departmentBreakdown[tx.department].volume += tx.amount;
    }

    const averageLatencyMs = Math.round((totalLatency / totalTransactions) * 10) / 10;
    const anomalyRatePercent = Math.round((anomalyCount / totalTransactions) * 1000) / 10;

    return {
      totalTransactions,
      totalVolume: Math.round(totalVolume * 100) / 100,
      averageLatencyMs,
      anomalyRatePercent,
      departmentBreakdown,
      statusCounts,
    };
  });

  readonly departments = computed(() => {
    const set = new Set<string>();
    this.transactions().forEach((tx) => set.add(tx.department));
    return Array.from(set).sort();
  });

  readonly filteredInventory = computed(() => {
    const list = this.inventory();
    const filter = this.inventoryFilter();
    const search = filter.searchTerm.trim().toLowerCase();

    return list.filter((item) => {
      // Domain filter
      if (filter.domain !== 'all' && item.domain !== filter.domain) {
        return false;
      }
      // Status filter
      if (filter.status !== 'all' && item.status !== filter.status) {
        return false;
      }
      // Low stock only filter
      if (
        filter.lowStockOnly &&
        item.stockLevel > item.minThreshold &&
        item.status !== 'low_stock' &&
        item.status !== 'out_of_stock'
      ) {
        return false;
      }
      // Search term filter
      if (search) {
        const matchesSku = item.sku.toLowerCase().includes(search);
        const matchesName = item.name.toLowerCase().includes(search);
        const matchesLoc = item.location.toLowerCase().includes(search);
        const matchesSup = item.supplier.name.toLowerCase().includes(search);
        if (!matchesSku && !matchesName && !matchesLoc && !matchesSup) {
          return false;
        }
      }
      return true;
    });
  });

  readonly domainSummaries = computed<DomainSummaryResult[]>(() => {
    const domains: Exclude<BusinessDomain, 'all'>[] = ['retail', 'hardware', 'logistics', 'pharma'];
    const items = this.inventory();

    return domains.map((domain) => {
      const domainItems = items.filter((item) => item.domain === domain);
      const totalSkus = domainItems.length;
      const totalValuation =
        Math.round(
          domainItems.reduce((acc, item) => acc + item.stockLevel * item.unitPrice, 0) * 100
        ) / 100;
      const lowStockCount = domainItems.filter(
        (item) => item.status === 'low_stock' || (item.stockLevel <= item.minThreshold && item.stockLevel > 0)
      ).length;
      const outOfStockCount = domainItems.filter(
        (item) => item.status === 'out_of_stock' || item.stockLevel === 0
      ).length;
      const healthyCount = domainItems.filter(
        (item) => item.status === 'in_stock' && item.stockLevel > item.minThreshold
      ).length;
      const healthScore =
        totalSkus === 0
          ? 100
          : Math.max(0, Math.min(100, Math.round((healthyCount / totalSkus) * 100)));

      return {
        domain,
        totalSkus,
        totalValuation,
        lowStockCount,
        outOfStockCount,
        healthScore,
      };
    });
  });

  readonly totalInventoryValuation = computed(() => {
    const items = this.inventory();
    return (
      Math.round(
        items.reduce((acc, item) => acc + item.stockLevel * item.unitPrice, 0) * 100
      ) / 100
    );
  });

  readonly lowStockAlerts = computed(() => {
    return this.inventory().filter(
      (item) =>
        item.stockLevel <= item.minThreshold ||
        item.status === 'low_stock' ||
        item.status === 'out_of_stock'
    );
  });

  readonly allSuppliers = computed<InventorySupplier[]>(() => {
    const map = new Map<string, InventorySupplier>();
    for (const item of this.inventory()) {
      if (item.supplier && !map.has(item.supplier.id)) {
        map.set(item.supplier.id, item.supplier);
      }
    }
    return Array.from(map.values());
  });

  // --- Actions & Methods ---
  updateFilter(partial: Partial<BiFilterState>): void {
    this.filterState.update((current) => ({
      ...current,
      ...partial,
    }));
  }

  resetFilter(): void {
    this.filterState.set({
      status: 'all',
      department: 'all',
      searchTerm: '',
      minAmount: 0,
      timeRange: '24h',
    });
  }

  queryMetrics(params: { category?: MetricCategory; department?: string; timeRange?: BiTimeRange }): EnterpriseMetric[] {
    const all = this.metrics();
    if (!params.category) {
      return all;
    }
    return all.filter((m) => m.category === params.category);
  }

  calculateKpiSummary(metricIds?: string[]): {
    metricId: string;
    name: string;
    currentValue: number;
    unit: string;
    deltaPercent: number;
    status: string;
  }[] {
    const all = this.metrics();
    const targets = metricIds && metricIds.length > 0
      ? all.filter((m) => metricIds.includes(m.id))
      : all;

    return targets.map((m) => ({
      metricId: m.id,
      name: m.name,
      currentValue: m.value,
      unit: m.unit,
      deltaPercent: m.deltaPercent,
      status: m.status,
    }));
  }

  filterTransactions(filters: Partial<BiFilterState>): TransactionRecord[] {
    this.updateFilter(filters);
    return this.filteredTransactions();
  }

  triggerExport(format: ExportFormat = 'json', filterSummary?: string): ExportAuditReport {
    const data = this.filteredTransactions();
    const exportId = `EXP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const generatedAt = new Date().toISOString();
    const recordCount = data.length;
    const checksum = `sha256-${Math.random().toString(16).substring(2, 10)}`;

    const summary = filterSummary || `Filter status=${this.filterState().status}, dept=${this.filterState().department}, minAmount=${this.filterState().minAmount}`;

    const report: ExportAuditReport = {
      exportId,
      format,
      generatedAt,
      recordCount,
      checksum,
      downloadUrl: `blob:https://webmcp-bi.local/reports/${exportId}.${format}`,
      filterSummary: summary,
    };

    this.exportAuditLog.update((logs) => [report, ...logs.slice(0, 19)]);
    return report;
  }

  // --- Multi-Domain Inventory Operations ---
  updateInventoryFilter(partial: Partial<InventoryFilterState>): void {
    this.inventoryFilter.update((current) => ({
      ...current,
      ...partial,
    }));
  }

  resetInventoryFilter(): void {
    this.inventoryFilter.set({
      domain: 'all',
      status: 'all',
      searchTerm: '',
      lowStockOnly: false,
    });
  }

  queryInventory(params?: {
    domain?: BusinessDomain;
    status?: InventoryStockStatus | 'all';
    searchTerm?: string;
    lowStockOnly?: boolean;
  }): InventoryItem[] {
    if (!params) {
      return this.filteredInventory();
    }

    const domain = params.domain ?? 'all';
    const status = params.status ?? 'all';
    const searchTerm = (params.searchTerm ?? '').trim().toLowerCase();
    const lowStockOnly = params.lowStockOnly ?? false;

    return this.inventory().filter((item) => {
      if (domain !== 'all' && item.domain !== domain) {
        return false;
      }
      if (status !== 'all' && item.status !== status) {
        return false;
      }
      if (
        lowStockOnly &&
        item.stockLevel > item.minThreshold &&
        item.status !== 'low_stock' &&
        item.status !== 'out_of_stock'
      ) {
        return false;
      }
      if (searchTerm) {
        const matchesSku = item.sku.toLowerCase().includes(searchTerm);
        const matchesName = item.name.toLowerCase().includes(searchTerm);
        const matchesLoc = item.location.toLowerCase().includes(searchTerm);
        const matchesSup = item.supplier.name.toLowerCase().includes(searchTerm);
        if (!matchesSku && !matchesName && !matchesLoc && !matchesSup) {
          return false;
        }
      }
      return true;
    });
  }

  updateStockLevel(
    sku: string,
    delta: number,
    reason?: string
  ): {
    success: boolean;
    item?: InventoryItem;
    previousStock?: number;
    newStock?: number;
    error?: string;
  } {
    const item = this.inventory().find(
      (i) => i.sku.toLowerCase() === sku.trim().toLowerCase()
    );
    if (!item) {
      return { success: false, error: `SKU '${sku}' not found in inventory catalog.` };
    }

    const previousStock = item.stockLevel;
    const newStock = Math.max(0, item.stockLevel + delta);

    let newStatus: InventoryStockStatus;
    if (newStock === 0) {
      newStatus = 'out_of_stock';
    } else if (newStock <= item.minThreshold) {
      newStatus = 'low_stock';
    } else {
      newStatus = 'in_stock';
    }

    const updatedItem: InventoryItem = {
      ...item,
      stockLevel: newStock,
      status: newStatus,
      lastRestocked: delta > 0 ? new Date().toISOString() : item.lastRestocked,
    };

    this.inventory.update((items) =>
      items.map((i) => (i.id === item.id ? updatedItem : i))
    );

    return {
      success: true,
      item: updatedItem,
      previousStock,
      newStock,
    };
  }

  reorderItem(
    sku: string,
    quantity: number,
    priority: ReorderPriority = 'standard',
    supplierId?: string,
    notes?: string
  ): {
    success: boolean;
    receipt?: ReorderReceipt;
    error?: string;
  } {
    const item = this.inventory().find(
      (i) => i.sku.toLowerCase() === sku.trim().toLowerCase()
    );
    if (!item) {
      return { success: false, error: `SKU '${sku}' not found in inventory catalog.` };
    }

    if (quantity <= 0) {
      return { success: false, error: 'Reorder quantity must be greater than 0.' };
    }

    const supplier = (supplierId && this.allSuppliers().find((s) => s.id === supplierId)) || item.supplier;
    const leadFactor = priority === 'critical' ? 0.33 : priority === 'expedited' ? 0.5 : 1.0;
    const leadDays = Math.max(1, Math.ceil(supplier.leadTimeDays * leadFactor));
    const arrivalDate = new Date(Date.now() + leadDays * 86400000).toISOString();
    const costMultiplier = priority === 'critical' ? 1.25 : priority === 'expedited' ? 1.1 : 1.0;
    const totalCost = Math.round(quantity * item.unitPrice * costMultiplier * 100) / 100;
    const reorderId = `RO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const receipt: ReorderReceipt = {
      reorderId,
      sku: item.sku,
      quantity,
      priority,
      supplier,
      estimatedArrival: arrivalDate,
      totalCost,
      orderedAt: new Date().toISOString(),
      notes,
    };

    this.reorderLog.update((logs) => [receipt, ...logs]);

    if (item.status === 'out_of_stock' || item.status === 'low_stock') {
      this.inventory.update((items) =>
        items.map((i) => (i.id === item.id ? { ...i, status: 'reordered' as const } : i))
      );
    }

    return {
      success: true,
      receipt,
    };
  }

  getDomainSummary(domain?: BusinessDomain): DomainSummaryResult | DomainSummaryResult[] {
    const summaries = this.domainSummaries();
    if (domain && domain !== 'all') {
      const match = summaries.find((s) => s.domain === domain);
      return (
        match || {
          domain,
          totalSkus: 0,
          totalValuation: 0,
          lowStockCount: 0,
          outOfStockCount: 0,
          healthScore: 100,
        }
      );
    }
    return summaries;
  }
}

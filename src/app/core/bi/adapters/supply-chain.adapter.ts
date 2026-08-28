import { Injectable } from '@angular/core';
import type {
  BiDomainAdapter,
  BiFilterCriteria,
  BiKpiSummary,
  BiQueryParams,
  BiExportResult,
  BiExportFormat,
} from '../bi.types';

export type SupplyChainStatus = 'delivered' | 'delayed' | 'in_transit' | 'stockout';

export interface SupplyChainRecord {
  id: string;
  sku: string;
  name: string;
  department: string;
  status: SupplyChainStatus;
  orderVolume: number;
  cost: number;
  onTimeInFull: boolean;
  stockLevel: number;
  safetyStock: number;
  leadTimeDays: number;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class SupplyChainAdapter implements BiDomainAdapter<SupplyChainRecord> {
  readonly domainId = 'supply_chain';
  readonly displayName = 'Supply Chain & Logistics';
  readonly description = 'Supply Chain operations telemetry covering OTIF delivery, warehouse turnover, and stockout risk.';

  private readonly mockDataset: SupplyChainRecord[] = [
    {
      id: 'sc-101',
      sku: 'SKU-LOG-01',
      name: 'High-Density LiDAR Sensor',
      department: 'Logistics',
      status: 'delivered',
      orderVolume: 1200,
      cost: 48000,
      onTimeInFull: true,
      stockLevel: 140,
      safetyStock: 50,
      leadTimeDays: 4,
      timestamp: '2026-08-27T08:30:00.000Z',
    },
    {
      id: 'sc-102',
      sku: 'SKU-LOG-02',
      name: 'Industrial Microcontroller Hub',
      department: 'Warehouse',
      status: 'delayed',
      orderVolume: 850,
      cost: 34000,
      onTimeInFull: false,
      stockLevel: 25,
      safetyStock: 60,
      leadTimeDays: 14,
      timestamp: '2026-08-27T09:15:00.000Z',
    },
    {
      id: 'sc-103',
      sku: 'SKU-LOG-03',
      name: 'Pneumatic Actuator Assembly',
      department: 'Procurement',
      status: 'in_transit',
      orderVolume: 400,
      cost: 18500,
      onTimeInFull: true,
      stockLevel: 80,
      safetyStock: 40,
      leadTimeDays: 6,
      timestamp: '2026-08-27T11:00:00.000Z',
    },
    {
      id: 'sc-104',
      sku: 'SKU-LOG-04',
      name: 'Fiber Optic Transceiver Kit',
      department: 'Logistics',
      status: 'stockout',
      orderVolume: 600,
      cost: 29000,
      onTimeInFull: false,
      stockLevel: 0,
      safetyStock: 30,
      leadTimeDays: 21,
      timestamp: '2026-08-27T13:45:00.000Z',
    },
    {
      id: 'sc-105',
      sku: 'SKU-LOG-05',
      name: 'Lithium Battery Pack 48V',
      department: 'Warehouse',
      status: 'delivered',
      orderVolume: 1500,
      cost: 75000,
      onTimeInFull: true,
      stockLevel: 320,
      safetyStock: 100,
      leadTimeDays: 3,
      timestamp: '2026-08-27T14:20:00.000Z',
    },
  ];

  queryRecords(params?: BiQueryParams): SupplyChainRecord[] {
    let results = [...this.mockDataset];

    if (params?.department) {
      results = results.filter(
        (r) => r.department.toLowerCase() === params.department!.toLowerCase()
      );
    }
    if (params?.status) {
      results = results.filter((r) => r.status === params.status);
    }
    if (params?.startDate) {
      results = results.filter((r) => r.timestamp >= params.startDate!);
    }
    if (params?.endDate) {
      results = results.filter((r) => r.timestamp <= params.endDate!);
    }
    if (typeof params?.limit === 'number' && params.limit > 0) {
      results = results.slice(0, params.limit);
    }

    return results;
  }

  filterRecords(records: SupplyChainRecord[], criteria: BiFilterCriteria): SupplyChainRecord[] {
    return records.filter((r) => {
      if (criteria.department && criteria.department !== 'all') {
        if (r.department.toLowerCase() !== criteria.department.toLowerCase()) return false;
      }
      if (criteria.status && criteria.status !== 'all') {
        if (r.status !== criteria.status) return false;
      }
      if (criteria.searchTerm) {
        const term = criteria.searchTerm.toLowerCase();
        const matchName = r.name.toLowerCase().includes(term);
        const matchSku = r.sku.toLowerCase().includes(term);
        const matchDept = r.department.toLowerCase().includes(term);
        if (!matchName && !matchSku && !matchDept) return false;
      }
      if (typeof criteria.minAmount === 'number' && r.cost < criteria.minAmount) return false;
      if (typeof criteria.maxAmount === 'number' && r.cost > criteria.maxAmount) return false;
      if (criteria.startDate && r.timestamp < criteria.startDate) return false;
      if (criteria.endDate && r.timestamp > criteria.endDate) return false;
      return true;
    });
  }

  calculateKpiSummary(records: SupplyChainRecord[]): BiKpiSummary {
    const total = records.length;
    if (total === 0) {
      return {
        domain: this.domainId,
        totalRecords: 0,
        totalVolume: 0,
        healthScore: 100,
        keyMetrics: {
          otifRatePercent: 100,
          stockoutRiskIndex: 0,
          inventoryTurnoverRatio: 0,
          averageLeadTimeDays: 0,
        },
        breakdown: { statusCounts: {} },
        timestamp: new Date().toISOString(),
      };
    }

    const totalVolume = records.reduce((sum, r) => sum + r.cost, 0);
    const otifCount = records.filter((r) => r.onTimeInFull).length;
    const otifRatePercent = Number(((otifCount / total) * 100).toFixed(1));

    const atRiskCount = records.filter((r) => r.stockLevel <= r.safetyStock).length;
    const stockoutRiskIndex = Number((atRiskCount / total).toFixed(2));

    const totalLeadTime = records.reduce((sum, r) => sum + r.leadTimeDays, 0);
    const averageLeadTimeDays = Number((totalLeadTime / total).toFixed(1));

    const totalStock = records.reduce((sum, r) => sum + r.stockLevel, 0);
    const deliveredVolume = records
      .filter((r) => r.status === 'delivered')
      .reduce((sum, r) => sum + r.orderVolume, 0);
    const inventoryTurnoverRatio = totalStock > 0 ? Number((deliveredVolume / totalStock).toFixed(2)) : 0;

    // Health score computation (0-100)
    let healthScore = Math.round(otifRatePercent * 0.7 + (1 - stockoutRiskIndex) * 30);
    healthScore = Math.max(0, Math.min(100, healthScore));

    const statusCounts: Record<string, number> = {};
    for (const r of records) {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    }

    return {
      domain: this.domainId,
      totalRecords: total,
      totalVolume,
      healthScore,
      keyMetrics: {
        otifRatePercent,
        stockoutRiskIndex,
        inventoryTurnoverRatio,
        averageLeadTimeDays,
      },
      breakdown: { statusCounts },
      timestamp: new Date().toISOString(),
    };
  }

  formatExportData(records: SupplyChainRecord[], format: BiExportFormat): BiExportResult {
    const exportId = `exp-sc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const generatedAt = new Date().toISOString();

    let data = '';
    if (format === 'csv') {
      const headers = ['id', 'sku', 'name', 'department', 'status', 'orderVolume', 'cost', 'onTimeInFull', 'stockLevel', 'safetyStock', 'leadTimeDays', 'timestamp'];
      const rows = records.map((r) =>
        [
          r.id,
          r.sku,
          `"${r.name.replace(/"/g, '""')}"`,
          r.department,
          r.status,
          r.orderVolume,
          r.cost,
          r.onTimeInFull,
          r.stockLevel,
          r.safetyStock,
          r.leadTimeDays,
          r.timestamp,
        ].join(',')
      );
      data = [headers.join(','), ...rows].join('\n');
    } else {
      data = JSON.stringify(records, null, 2);
    }

    // Simple pseudo hash for checksum
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = (hash << 5) - hash + data.charCodeAt(i);
      hash |= 0;
    }
    const checksum = `sha256-${Math.abs(hash).toString(16).padStart(8, '0')}`;

    return {
      success: true,
      exportId,
      domain: this.domainId,
      format,
      recordCount: records.length,
      data,
      checksum,
      generatedAt,
    };
  }
}

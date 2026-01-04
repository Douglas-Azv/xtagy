
import { AnalyticsEvent, EventType, CompanyRole, Order, Piece, OrderStatus } from '../types';
import { db, getEnvCollection } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

class AnalyticsService {
  private events: AnalyticsEvent[] = [];

  /**
   * Logs an operational event both to console and to environment-specific Firestore logs.
   */
  async logEvent(
    type: EventType, 
    companyId: string, 
    companyRole: CompanyRole, 
    relatedEntityId: string, 
    metadata: Record<string, any> = {}
  ) {
    const event: Omit<AnalyticsEvent, 'id'> = {
      type,
      timestamp: new Date().toISOString(),
      companyId,
      companyRole,
      relatedEntityId,
      metadata
    };
    
    console.log(`[XTAGY Analytics] [${type}]`, event);

    try {
      // Persist log to environment-specific collection: sandbox/logs or production/logs
      await addDoc(collection(db, getEnvCollection('logs')), event);
    } catch (error) {
      console.warn('Analytics persistence failed (expected if DB not ready):', error);
    }
  }

  getEvents() {
    return this.events;
  }

  /**
   * Calculates real-time statistics based on actual orders and pieces data.
   */
  calculateStats(orders: Order[], pieces: Piece[]) {
    const activeOrders = orders.filter(o => o.status !== OrderStatus.FINISHED && o.status !== OrderStatus.DELIVERED).length;
    const totalPieces = pieces.length;
    const totalWeight = pieces.reduce((sum, p) => sum + (p.peso_peca || 0), 0);
    const avgWeight = totalPieces > 0 ? totalWeight / totalPieces : 0;
    const waitingCollection = orders.filter(o => o.status === OrderStatus.FINISHED).length;
    
    // Simple revenue estimation (Sum of piece costs)
    const totalRevenue = pieces.reduce((sum, p) => sum + (p.custo_final_cliente || 0), 0);
    const avgTicket = orders.length > 0 ? totalRevenue / orders.length : 0;

    return {
      totalOrders: activeOrders,
      totalPieces,
      avgTicket,
      avgWeight,
      waitingCollection,
      monthlyGrowth: 0 // Will be implemented with historical data later
    };
  }
}

export const analyticsService = new AnalyticsService();

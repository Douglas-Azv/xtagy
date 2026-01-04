
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import { db, getEnvCollection, auth } from './firebase';
import { Order, Piece, OrderStatus, Company, EventType, CompanyRole, User, UserRole, SubscriptionStatus, SubscriptionInfo, BillingStatus, StripeTestPayment } from '../types';
import { analyticsService } from './analyticsService';

class ApiService {
  private COLLECTIONS = {
    COMPANIES: 'empresas',
    USERS: 'usuarios',
    ORDERS: 'lotes',
    PIECES: 'pecas'
  };

  /**
   * Remove campos undefined de um objeto para evitar erros no Firestore
   */
  private cleanData(data: any) {
    const clean: any = {};
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        clean[key] = data[key];
      }
    });
    return clean;
  }

  private handleFirestoreError(error: any): never {
    console.error('[XTAGY API Error]', error);
    if (error.code === 'permission-denied') {
      console.error(`[PERMISSÃO] Acesso negado ao Firestore.`);
    }
    throw error;
  }

  private generateAccessCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  async registerCompany(userId: string, data: Partial<Company>): Promise<User> {
    try {
      const companyRef = doc(collection(db, getEnvCollection(this.COLLECTIONS.COMPANIES)));
      const companyId = companyRef.id;
      
      const subscription = data.role === CompanyRole.BANHO ? {
        status: SubscriptionStatus.PAYMENT_PENDING,
        plan: 'banho_mensal',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        trialStartedAt: new Date().toISOString(),
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      } : null;

      const newCompany = this.cleanData({
        id: companyId,
        name: data.name || '',
        tradingName: data.tradingName || '',
        role: data.role || CompanyRole.CLIENTE,
        email: data.email || '',
        taxId: data.taxId || '',
        phone: data.phone || '',
        address: data.address || '',
        subscription: subscription || undefined // cleanData removerá se for undefined
      });

      const newUser: User = {
        id: userId,
        email: data.email || '',
        name: data.tradingName || data.name || 'Usuário',
        companyId: companyId,
        role: UserRole.ADMIN,
        companyRole: data.role || CompanyRole.CLIENTE
      };

      await setDoc(doc(db, 'users', userId), {
        uid: userId,
        email: newUser.email,
        companyId: companyId,
        updatedAt: new Date().toISOString()
      });

      await setDoc(companyRef, newCompany);
      await setDoc(doc(db, getEnvCollection(this.COLLECTIONS.USERS), userId), newUser);

      analyticsService.logEvent(EventType.COMPANY_CREATED, companyId, newUser.companyRole, companyId, { name: newCompany.name });
      return newUser;
    } catch (e) { return this.handleFirestoreError(e); }
  }

  subscribeToCompany(companyId: string, callback: (company: Company) => void) {
    if (!auth.currentUser) return () => {};
    const docRef = doc(db, getEnvCollection(this.COLLECTIONS.COMPANIES), companyId);
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as Company);
      }
    }, (error) => this.handleFirestoreError(error));
  }

  async updateBillingStatus(companyId: string, billingStatus: BillingStatus): Promise<void> {
    try {
      const companyRef = doc(db, getEnvCollection(this.COLLECTIONS.COMPANIES), companyId);
      await updateDoc(companyRef, { billingStatus });
    } catch (e) { this.handleFirestoreError(e); }
  }

  async updateStripeTestPayment(companyId: string, testPayment: StripeTestPayment): Promise<void> {
    try {
      const companyRef = doc(db, getEnvCollection(this.COLLECTIONS.COMPANIES), companyId);
      await updateDoc(companyRef, { stripeTestPayment: testPayment });
    } catch (e) { this.handleFirestoreError(e); }
  }

  async updateSubscriptionStatus(companyId: string, status: SubscriptionStatus): Promise<void> {
    try {
      const companyRef = doc(db, getEnvCollection(this.COLLECTIONS.COMPANIES), companyId);
      await updateDoc(companyRef, { "subscription.status": status });
    } catch (e) { this.handleFirestoreError(e); }
  }

  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, getEnvCollection(this.COLLECTIONS.USERS), userId));
      if (userDoc.exists()) return userDoc.data() as User;
      return null;
    } catch (e) { return this.handleFirestoreError(e); }
  }

  async getOrdersByCompany(companyId: string, role: CompanyRole): Promise<Order[]> {
    try {
      const field = role === CompanyRole.BANHO ? 'banhoCompanyId' : 'clienteCompanyId';
      const q = query(
        collection(db, getEnvCollection(this.COLLECTIONS.ORDERS)), 
        where(field, '==', companyId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
    } catch (e) { return this.handleFirestoreError(e); }
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    try {
      const orderDoc = await getDoc(doc(db, getEnvCollection(this.COLLECTIONS.ORDERS), id));
      return orderDoc.exists() ? ({ id: orderDoc.id, ...orderDoc.data() } as Order) : undefined;
    } catch (e) { return this.handleFirestoreError(e); }
  }

  async createOrder(orderData: Partial<Order>): Promise<Order> {
    try {
      const orderDataFinal = this.cleanData({
        ...orderData,
        status: OrderStatus.PENDING,
        accessCode: this.generateAccessCode(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      const docRef = await addDoc(collection(db, getEnvCollection(this.COLLECTIONS.ORDERS)), orderDataFinal);
      return { id: docRef.id, ...orderDataFinal } as Order;
    } catch (e) { return this.handleFirestoreError(e); }
  }

  async linkOrderToClient(accessCode: string, clientCompanyId: string): Promise<Order | null> {
    try {
      const q = query(collection(db, getEnvCollection(this.COLLECTIONS.ORDERS)), where('accessCode', '==', accessCode.toUpperCase()));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      const orderDoc = snapshot.docs[0];
      await updateDoc(doc(db, getEnvCollection(this.COLLECTIONS.ORDERS), orderDoc.id), {
        clienteCompanyId: clientCompanyId,
        updatedAt: new Date().toISOString()
      });
      return { id: orderDoc.id, ...orderDoc.data(), clienteCompanyId: clientCompanyId } as Order;
    } catch (e) { return this.handleFirestoreError(e); }
  }

  async getPiecesByOrder(orderId: string): Promise<Piece[]> {
    try {
      const q = query(collection(db, getEnvCollection(this.COLLECTIONS.PIECES)), where('orderId', '==', orderId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Piece));
    } catch (e) { return this.handleFirestoreError(e); }
  }

  async getPieceById(id: string): Promise<Piece | undefined> {
    try {
      const pieceDoc = await getDoc(doc(db, getEnvCollection(this.COLLECTIONS.PIECES), id));
      return pieceDoc.exists() ? ({ id: pieceDoc.id, ...pieceDoc.data() } as Piece) : undefined;
    } catch (e) { return this.handleFirestoreError(e); }
  }

  async createPiece(pieceData: Partial<Piece>, order: Order): Promise<Piece> {
    try {
      const finalPieceData = this.cleanData({
        orderId: order.id,
        photo: pieceData.photo || 'https://picsum.photos/200/200',
        internalCode: pieceData.internalCode || 'N/A',
        type: pieceData.type || 'Generic',
        peso_peca: pieceData.peso_peca || 0,
        valor_peca_bruta: pieceData.valor_peca_bruta || 0,
        camadas: order.camadas,
        mao_de_obra: order.mao_de_obra,
        cotacao_ouro_dia: order.goldPrice,
        calculo_metal: ((order.camadas + order.mao_de_obra) * order.goldPrice) / 1000,
        custo_final_cliente: (pieceData.peso_peca || 0) * (((order.camadas + order.mao_de_obra) * order.goldPrice) / 1000) + (pieceData.valor_peca_bruta || 0),
        suggestedPrice: ((pieceData.peso_peca || 0) * (((order.camadas + order.mao_de_obra) * order.goldPrice) / 1000) + (pieceData.valor_peca_bruta || 0)) * order.defaultMargin
      });
      const docRef = await addDoc(collection(db, getEnvCollection(this.COLLECTIONS.PIECES)), finalPieceData);
      return { id: docRef.id, ...finalPieceData } as Piece;
    } catch (e) { return this.handleFirestoreError(e); }
  }

  async updatePiece(pieceId: string, updates: Partial<Piece>): Promise<void> {
    try {
      const pieceRef = doc(db, getEnvCollection(this.COLLECTIONS.PIECES), pieceId);
      await updateDoc(pieceRef, this.cleanData(updates));
    } catch (e) { this.handleFirestoreError(e); }
  }

  async getCompanies(): Promise<Company[]> {
    try {
      const snapshot = await getDocs(collection(db, getEnvCollection(this.COLLECTIONS.COMPANIES)));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
    } catch (e) { return this.handleFirestoreError(e); }
  }

  async getCompanyById(id: string): Promise<Company | undefined> {
    try {
      const companyDoc = await getDoc(doc(db, getEnvCollection(this.COLLECTIONS.COMPANIES), id));
      return companyDoc.exists() ? ({ id: companyDoc.id, ...companyDoc.data() } as Company) : undefined;
    } catch (e) { return this.handleFirestoreError(e); }
  }
}

export const apiService = new ApiService();


export enum UserRole {
  ADMIN = 'admin',
  OPERATIONAL = 'operational',
  VIEWER = 'viewer'
}

export enum CompanyRole {
  BANHO = 'banho',
  CLIENTE = 'cliente'
}

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  FINISHED = 'finished',
  DELIVERED = 'delivered'
}

export enum LabelLayout {
  A4 = 'A4',
  COMPACT = 'COMPACT',
  THERMAL = 'THERMAL'
}

export enum SubscriptionStatus {
  TRIAL = 'trial',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  PAYMENT_PENDING = 'payment_pending'
}

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  plan: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  trialStartedAt: string;
  trialEndsAt: string;
}

export interface StripeTestPayment {
  status: 'paid' | 'canceled' | 'failed' | 'skipped';
  paymentIntentId?: string;
  paidAt?: string;
  skippedAt?: string;
  mode: 'test';
  amount?: number;
}

export interface BillingStatus {
  status: 'paid' | 'skipped' | 'pending_test';
  mode: 'test';
  paymentProvider?: 'stripe';
  paymentIntentId?: string;
  paidAt?: string;
  skippedAt?: string;
}

export enum EventType {
  COMPANY_CREATED = 'COMPANY_CREATED',
  CLIENT_LINKED = 'CLIENT_LINKED',
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_FINALIZED = 'ORDER_FINALIZED',
  PIECE_CREATED = 'PIECE_CREATED',
  QR_CODE_GENERATED = 'QR_CODE_GENERATED',
  QR_CODE_SCANNED = 'QR_CODE_SCANNED',
  GOLD_PRICE_UPDATED = 'GOLD_PRICE_UPDATED',
  PRINT_JOB_CREATED = 'PRINT_JOB_CREATED',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  PIECE_CAPTURED = 'PIECE_CAPTURED',
  OCR_PROCESSED = 'OCR_PROCESSED',
  PIECE_CONFIRMED = 'PIECE_CONFIRMED',
  LABEL_PRINTED = 'LABEL_PRINTED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_SKIPPED = 'PAYMENT_SKIPPED'
}

export interface Company {
  id: string;
  name: string;
  tradingName: string;
  role: CompanyRole;
  email: string;
  taxId: string;
  phone: string;
  address: string;
  logo?: string;
  subscription?: SubscriptionInfo;
  stripeTestPayment?: StripeTestPayment;
  billingStatus?: BillingStatus;
}

export interface User {
  id: string;
  email: string;
  name: string;
  companyId: string;
  role: UserRole;
  companyRole: CompanyRole;
}

export interface Order {
  id: string;
  banhoCompanyId: string;
  clienteCompanyId: string | null;
  status: OrderStatus;
  goldPrice: number;
  defaultMargin: number;
  camadas: number;
  mao_de_obra: number;
  accessCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface LabelSnapshot {
  layout: LabelLayout;
  generatedAt: string;
  internalCode: string;
  peso: number;
  valorBruto: number;
  camadas: number;
  maoDeObra: number;
  cotacaoOuro: number;
  custoFinal: number;
}

export interface Piece {
  id: string;
  orderId: string;
  photo: string;
  internalCode: string;
  type: string;
  peso_peca: number;
  valor_peca_bruta: number;
  camadas: number;
  mao_de_obra: number;
  cotacao_ouro_dia: number;
  calculo_metal: number;
  custo_final_cliente: number;
  suggestedPrice: number;
  label?: LabelSnapshot;
}

export interface AnalyticsEvent {
  id: string;
  type: EventType;
  timestamp: string;
  companyId: string;
  companyRole: CompanyRole;
  relatedEntityId: string;
  metadata: Record<string, any>;
}

export interface DashboardStats {
  totalOrders: number;
  totalPieces: number;
  avgTicket: number;
  avgWeight: number;
  monthlyGrowth: number;
}

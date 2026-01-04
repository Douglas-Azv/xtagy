
import { Company, CompanyRole, User, UserRole, Order, OrderStatus, Piece } from '../types';

// Fix: Added missing properties (tradingName, taxId, phone, address) to comply with Company interface
export const mockCompanies: Company[] = [
  { 
    id: 'c1', 
    name: 'Golden Plating Inc.', 
    tradingName: 'Golden Plating',
    role: CompanyRole.BANHO, 
    email: 'contact@goldenplating.com',
    taxId: '12.345.678/0001-00',
    phone: '(11) 9999-9999',
    address: 'Rua das Industrias, 123'
  },
  { 
    id: 'c2', 
    name: 'Bella Joias', 
    tradingName: 'Bella Joias',
    role: CompanyRole.CLIENTE, 
    email: 'sales@bellajoias.com',
    taxId: '23.456.789/0001-00',
    phone: '(11) 8888-8888',
    address: 'Av. Shopping, 500'
  },
  { 
    id: 'c3', 
    name: 'Luxury Accessories', 
    tradingName: 'Luxury Access',
    role: CompanyRole.CLIENTE, 
    email: 'admin@luxaccessories.com',
    taxId: '34.567.890/0001-00',
    phone: '(11) 7777-7777',
    address: 'Rua do Luxo, 10'
  },
];

export const mockUsers: User[] = [
  { 
    id: 'u1', 
    email: 'banho@xtagy.com', 
    name: 'Admin Banho', 
    companyId: 'c1', 
    role: UserRole.ADMIN, 
    companyRole: CompanyRole.BANHO 
  },
  { 
    id: 'u2', 
    email: 'cliente@xtagy.com', 
    name: 'John Client', 
    companyId: 'c2', 
    role: UserRole.ADMIN, 
    companyRole: CompanyRole.CLIENTE 
  },
];

// Fix: Added missing accessCode, camadas, and mao_de_obra properties to comply with Order interface
export const mockOrders: Order[] = [
  {
    id: 'o1',
    banhoCompanyId: 'c1',
    clienteCompanyId: 'c2',
    status: OrderStatus.FINISHED,
    goldPrice: 350.50,
    defaultMargin: 2.5,
    camadas: 5,
    mao_de_obra: 2,
    accessCode: 'ABC123',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'o2',
    banhoCompanyId: 'c1',
    clienteCompanyId: 'c2',
    status: OrderStatus.PROCESSING,
    goldPrice: 355.20,
    defaultMargin: 2.5,
    camadas: 5,
    mao_de_obra: 2,
    accessCode: 'XYZ789',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// Fix: Corrected property names (weight -> peso_peca, baseValue -> valor_peca_bruta, etc.) and added missing required fields for Piece interface
export const mockPieces: Piece[] = [
  {
    id: 'p1',
    orderId: 'o1',
    photo: 'https://picsum.photos/seed/ring1/200/200',
    internalCode: 'AN-001',
    type: 'Anel',
    peso_peca: 2.5,
    valor_peca_bruta: 45.0,
    camadas: 5,
    mao_de_obra: 2,
    cotacao_ouro_dia: 350.50,
    calculo_metal: 2.4535,
    custo_final_cliente: 921.25,
    suggestedPrice: 2303.13
  },
  {
    id: 'p2',
    orderId: 'o1',
    photo: 'https://picsum.photos/seed/earring1/200/200',
    internalCode: 'BR-042',
    type: 'Brinco',
    peso_peca: 1.2,
    valor_peca_bruta: 25.0,
    camadas: 5,
    mao_de_obra: 2,
    cotacao_ouro_dia: 350.50,
    calculo_metal: 2.4535,
    custo_final_cliente: 445.60,
    suggestedPrice: 1114.00
  }
];
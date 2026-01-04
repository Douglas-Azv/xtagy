
/**
 * SERVIÇO DE PREPARAÇÃO STRIPE (SHADOW MODE)
 * Este arquivo define a lógica de backend que será futuramente implementada via Cloud Functions.
 * Atualmente não é chamado pelo frontend para garantir zero impacto na UI.
 */

import { doc, updateDoc } from 'firebase/firestore';
import { db, getEnvCollection } from './firebase';
import { SubscriptionStatus } from '../types';

// Mock/Placeholder para Stripe Secret Key (Nunca usar no frontend em produção)
const STRIPE_TEST_SECRET = "sk_test_placeholder_xtagy"; 

export const stripeIntegration = {
  /**
   * Mock para criação de cliente no Stripe.
   * Em produção, isso seria uma chamada via Cloud Function.
   */
  async createStripeCustomerPlaceholder(companyId: string, email: string) {
    console.log(`[Stripe Shadow] Preparando criação de cliente para ${email}...`);
    // Placeholder para chamada futura:
    // const customer = await stripe.customers.create({ email, metadata: { companyId } });
    return "cus_placeholder_" + Math.random().toString(36).substr(2, 9);
  },

  /**
   * Mock para início de assinatura.
   */
  async startSubscriptionPlaceholder(companyId: string) {
    console.log(`[Stripe Shadow] Preparando assinatura para empresa ${companyId}...`);
    // Em produção, isso retornaria o clientSecret para o checkout.
    return { status: "pending_activation" };
  },

  /**
   * Simulador de Webhook (Apenas referência lógica)
   * Responsável por processar eventos do Stripe e atualizar o Firestore.
   */
  async handleStripeWebhook(event: { type: string, data: any }) {
    const { type, data } = event;
    const stripeCustomerId = data.object.customer;
    
    // Lógica de mapeamento de eventos
    let newStatus: SubscriptionStatus | null = null;

    switch (type) {
      case 'checkout.session.completed':
      case 'invoice.paid':
        newStatus = SubscriptionStatus.ACTIVE;
        break;
      case 'invoice.payment_failed':
        newStatus = SubscriptionStatus.PAST_DUE;
        break;
      case 'customer.subscription.deleted':
        newStatus = SubscriptionStatus.CANCELED;
        break;
    }

    if (newStatus && stripeCustomerId) {
       console.log(`[Stripe Webhook Shadow] Atualizando status para ${newStatus} para cliente ${stripeCustomerId}`);
       // Em produção, buscaríamos a companyId via metadata do customer no Stripe
       // E atualizaríamos o Firestore:
       // await updateDoc(doc(db, getEnvCollection('empresas'), companyId), { "subscription.status": newStatus });
    }
  }
};

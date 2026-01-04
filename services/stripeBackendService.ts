
/**
 * SERVIÇO DE BACKEND STRIPE (MODO DE PREPARAÇÃO / SHADOW MODE)
 * 
 * Este serviço gerencia a infraestrutura básica do Stripe para o XTAGY.
 * Ele permanece inativo e isolado enquanto a flag STRIPE_ENABLED for 'false'.
 */

const getStripeConfig = () => ({
  secretKey: process.env.STRIPE_SECRET_KEY,
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  enabled: process.env.STRIPE_ENABLED === 'true'
});

/**
 * Inicializa o SDK do Stripe de forma segura e assíncrona.
 * A importação do módulo só ocorre se o Stripe estiver habilitado,
 * economizando recursos e garantindo isolamento total dos fluxos atuais.
 */
const getStripeInstance = async () => {
  const config = getStripeConfig();
  
  if (!config.enabled || !config.secretKey) {
    return null;
  }

  try {
    // Importação dinâmica via ESM para o SDK do Stripe para ambiente web/cloud
    const { default: Stripe } = await import('https://esm.sh/stripe@14.14.0');
    return new Stripe(config.secretKey, {
      apiVersion: '2023-10-16' as any,
      appInfo: {
        name: 'XTAGY-SaaS',
        version: '1.0.0'
      }
    });
  } catch (error) {
    console.error('[Stripe Backend] Erro crítico na inicialização do SDK:', error);
    return null;
  }
};

export const stripeBackendService = {
  /**
   * Healthcheck interno (/internal/stripe/healthcheck).
   * Pode ser invocado para validar a configuração sem realizar operações de cobrança.
   * Não está vinculado a nenhum botão ou tela da interface do usuário.
   */
  async healthCheck() {
    const config = getStripeConfig();
    
    if (!config.enabled) {
      return { 
        stripe: "disabled",
        reason: "STRIPE_ENABLED is false"
      };
    }

    const stripe = await getStripeInstance();
    
    if (!stripe) {
      return { 
        stripe: "error", 
        message: "Stripe SDK initialization failed. Check Secret Key." 
      };
    }

    return { 
      stripe: "ok",
      mode: "test", // Baseado nas chaves sk_test fornecidas
      readyForShadowMode: true
    };
  }
};

// Monitoramento passivo: não interfere em nenhum fluxo se desabilitado.
if (process.env.STRIPE_ENABLED === 'true') {
  console.info('[XTAGY] Stripe Backend Infrastructure detected and active.');
}

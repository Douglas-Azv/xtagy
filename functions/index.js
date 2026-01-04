
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'PLACEHOLDER_API_KEY');
admin.initializeApp();

/**
 * Cloud Function: createPaymentIntent
 * Robusta contra variações de payload e erros de rede.
 */
exports.createPaymentIntent = functions.region("us-central1").https.onCall(async (data, context) => {
  // Em v1.https.onCall, os dados vêm diretamente no primeiro argumento 'data'.
  // Algumas versões do SDK podem envolver em um objeto 'data'.
  const payload = (data && data.data) ? data.data : data;

  const amount = payload?.amount;
  const companyId = payload?.companyId;

  console.log(`[XTAGY] Iniciando createPaymentIntent para Empresa: ${companyId}, Valor: ${amount}`);

  // 1. Verificação de Autenticação
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Você precisa estar logado para processar pagamentos."
    );
  }

  // 2. Validação de Argumentos
  if (!amount || !companyId) {
    console.error("[XTAGY] Erro: Argumentos ausentes", { amount, companyId });
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Parâmetros 'amount' e 'companyId' são obrigatórios."
    );
  }

  try {
    // 3. Criação do Intent no Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(amount) * 100), // Converte para centavos
      currency: "brl",
      metadata: {
        companyId: companyId,
        userId: context.auth.uid,
        environment: "sandbox"
      },
      automatic_payment_methods: { enabled: true },
    });

    console.log(`[Stripe Success] Intent ${paymentIntent.id} gerado.`);

    return {
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id
    };

  } catch (error) {
    console.error("[Stripe Error] Falha crítica:", error.message);

    // Erros 'internal' no Firebase geralmente mascaram a causa real (como falta de plano Blaze)
    // Se o projeto não estiver no plano pago, requisições externas para a Stripe falharão.
    throw new functions.https.HttpsError(
      "internal",
      `Erro no processador de pagamento: ${error.message}`
    );
  }
});

/**
 * Cloud Function: stripeWebhook
 * Recebe notificações de eventos da Stripe.
 */
exports.stripeWebhook = functions.region("us-central1").https.onRequest(async (req, res) => {
  const event = req.body;

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const companyId = paymentIntent.metadata.companyId;

    if (companyId) {
      const db = admin.firestore();
      try {
        const companyRef = db.doc(`environments/sandbox/empresas/${companyId}`);
        await companyRef.update({
          "subscription.status": "active",
          "billingStatus": {
            status: "paid",
            mode: "test",
            paidAt: new Date().toISOString(),
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            provider: "stripe"
          }
        });
        console.log(`[Webhook] Empresa ${companyId} ativada.`);
      } catch (err) {
        console.error(`[Webhook Error] Update failed:`, err.message);
      }
    }
  }

  res.status(200).send({ received: true });
});

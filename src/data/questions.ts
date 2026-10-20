import type { Locale } from './sources';

const CRM = ['HubSpot', 'Pipedrive', 'Salesforce', 'Dynamics 365'];
const ERP = ['Holded', 'Sage', 'NetSuite', 'Odoo', 'Dynamics 365'];
const DB = ['PostgreSQL', 'SQL Server', 'MongoDB', 'Cloud Storage'];
const SHOP = ['Shopify', 'Stripe'];
const SHEET = ['Excel', 'Google Sheets'];
const MAIL = ['Mailchimp', 'Brevo'];

/** Requisito: basta con una de las herramientas de `any`. */
export interface Requirement {
  label: Record<Locale, string>;
  any: string[];
}

const R = {
  crm: { label: { es: 'un CRM', en: 'a CRM' }, any: CRM },
  erp: { label: { es: 'un ERP', en: 'an ERP' }, any: ERP },
  sheet: { label: { es: 'Excel o Sheets', en: 'Excel or Sheets' }, any: SHEET },
  shop: { label: { es: 'Shopify o Stripe', en: 'Shopify or Stripe' }, any: SHOP },
  sales: { label: { es: 'ventas registradas', en: 'recorded sales' }, any: [...SHOP, ...ERP] },
  ads: { label: { es: 'Meta Ads', en: 'Meta Ads' }, any: ['Meta Ads'] },
  web: { label: { es: 'Google Analytics 4', en: 'Google Analytics 4' }, any: ['Google Analytics 4'] },
  mail: { label: { es: 'Mailchimp o Brevo', en: 'Mailchimp or Brevo' }, any: MAIL },
  db: { label: { es: 'tu base de datos', en: 'your database' }, any: DB },
  stripe: { label: { es: 'Stripe', en: 'Stripe' }, any: ['Stripe'] },
  shopify: { label: { es: 'Shopify', en: 'Shopify' }, any: ['Shopify'] },
  crmdb: { label: { es: 'un CRM o tu base de datos', en: 'a CRM or your database' }, any: [...CRM, ...DB] },
  erpcrm: { label: { es: 'un ERP o un CRM', en: 'an ERP or a CRM' }, any: [...ERP, ...CRM] },
  promo: { label: { es: 'Meta Ads o email', en: 'Meta Ads or email' }, any: ['Meta Ads', ...MAIL] },
  paid: { label: { es: 'Stripe o un ERP', en: 'Stripe or an ERP' }, any: ['Stripe', ...ERP] },
  mailcrm: { label: { es: 'un CRM o Shopify', en: 'a CRM or Shopify' }, any: [...CRM, 'Shopify'] },
  shoperp: { label: { es: 'Shopify o un ERP', en: 'Shopify or an ERP' }, any: ['Shopify', ...ERP] },
} satisfies Record<string, Requirement>;

export interface Question {
  id: string;
  /** Pregunta tal y como la ve el visitante. */
  q: Record<Locale, string>;
  /** Fragmento para el mensaje prerrellenado: "Nos gustaría saber …". */
  want: Record<Locale, string>;
  need: Requirement[];
}

/**
 * Banco de preguntas de negocio. Sin cifras: solo preguntas que se pueden responder
 * con el stack marcado. Añade o edita aquí; la interfaz se adapta sola.
 */
export const QUESTIONS: Question[] = [
  { id: 'cac', need: [R.ads, R.crm, R.shop],
    q: { es: '¿Cuánto te cuesta conseguir un cliente en cada canal?', en: 'What does each new customer cost you, per channel?' },
    want: { es: 'cuánto nos cuesta cada cliente según el canal', en: 'what each customer costs us per channel' } },
  { id: 'product-margin', need: [R.shop, R.erp],
    q: { es: '¿Qué margen real te deja cada producto?', en: 'What real margin does each product leave you?' },
    want: { es: 'qué margen real deja cada producto', en: 'the real margin of each product' } },
  { id: 'customer-margin', need: [R.erp, R.sheet],
    q: { es: '¿Qué margen te deja cada cliente, contando los costes que hoy están en Excel?', en: 'What margin does each customer leave, including the costs that live in Excel today?' },
    want: { es: 'qué margen nos deja cada cliente', en: 'the margin of each customer' } },
  { id: 'forecast', need: [R.sheet, R.erp],
    q: { es: '¿Vas por encima o por debajo de lo previsto?', en: 'Are you ahead of or behind your forecast?' },
    want: { es: 'cómo vamos frente a la previsión', en: 'how we are doing against forecast' } },
  { id: 'funnel', need: [R.web, R.crm],
    q: { es: '¿Cuántas visitas acaban en venta y dónde se pierden?', en: 'How many visits end in a sale, and where do they drop off?' },
    want: { es: 'dónde se pierden las ventas por el camino', en: 'where we lose sales along the way' } },
  { id: 'pages-sales', need: [R.web, R.shop],
    q: { es: '¿Qué páginas de tu web traen ventas de verdad?', en: 'Which pages on your site actually bring in sales?' },
    want: { es: 'qué páginas de la web traen ventas', en: 'which pages bring in sales' } },
  { id: 'email-sales', need: [R.mail, R.shop],
    q: { es: '¿Cuánto vendes gracias al email?', en: 'How much do you sell thanks to email?' },
    want: { es: 'cuánto vendemos gracias al email', en: 'how much email sells for us' } },
  { id: 'email-segments', need: [R.mail, R.mailcrm],
    q: { es: '¿Qué segmentos de tu lista de email compran más?', en: 'Which segments of your email list buy the most?' },
    want: { es: 'qué segmentos de la lista de email compran más', en: 'which email segments buy the most' } },
  { id: 'repeat-campaigns', need: [R.ads, R.shop],
    q: { es: '¿Qué campañas atraen clientes que luego repiten?', en: 'Which campaigns bring customers who come back?' },
    want: { es: 'qué campañas traen clientes que repiten', en: 'which campaigns bring repeat customers' } },
  { id: 'won-invoiced', need: [R.crm, R.erp],
    q: { es: '¿Las oportunidades ganadas se acaban facturando a tiempo?', en: 'Do won deals get invoiced on time?' },
    want: { es: 'si lo que ganamos en el CRM se factura a tiempo', en: 'whether deals won in the CRM get invoiced on time' } },
  { id: 'churn-risk', need: [R.crmdb, R.paid],
    q: { es: '¿Qué clientes están a punto de irse?', en: 'Which customers are about to leave?' },
    want: { es: 'qué clientes están a punto de irse', en: 'which customers are about to leave' } },
  { id: 'customer-360', need: [R.db, R.crm],
    q: { es: '¿Qué hace cada cliente, qué paga y qué te pide?', en: 'What does each customer do, pay and ask you for?' },
    want: { es: 'una ficha completa de cada cliente', en: 'a full view of each customer' } },
  { id: 'erp-vs-shop', need: [R.erp, R.shopify],
    q: { es: '¿Coinciden los números de tu ERP con los de tu tienda online?', en: 'Do your ERP numbers match your online store?' },
    want: { es: 'por qué no cuadran el ERP y la tienda', en: "why the ERP and the store don't match" } },
  { id: 'stock-campaigns', need: [R.erp, R.promo],
    q: { es: '¿Tu stock aguanta las campañas que tienes previstas?', en: 'Will your stock hold up for the campaigns you have planned?' },
    want: { es: 'si el stock aguanta las campañas previstas', en: 'whether stock will hold up for planned campaigns' } },
  { id: 'manual-time', need: [R.sheet, R.erpcrm],
    q: { es: '¿Cuánto tiempo pierde tu equipo consolidando datos a mano?', en: 'How much time does your team lose consolidating data by hand?' },
    want: { es: 'cuánto tiempo perdemos consolidando datos a mano', en: 'how much time we lose consolidating data by hand' } },
  { id: 'receivables', need: [R.erp],
    q: { es: '¿Qué clientes te deben dinero y desde cuándo?', en: 'Which customers owe you money, and since when?' },
    want: { es: 'qué clientes nos deben dinero y desde cuándo', en: 'which customers owe us money and since when' } },
  { id: 'dead-stock', need: [R.erp],
    q: { es: '¿Qué productos se quedan parados en el almacén?', en: 'Which products sit idle in the warehouse?' },
    want: { es: 'qué productos se quedan parados en el almacén', en: 'which products sit idle in stock' } },
  { id: 'cash', need: [R.erp],
    q: { es: '¿Cómo evoluciona tu tesorería mes a mes?', en: 'How does your cash position change month to month?' },
    want: { es: 'cómo evoluciona la tesorería', en: 'how our cash position evolves' } },
  { id: 'buying-less', need: [R.sales],
    q: { es: '¿Qué clientes compran menos que el año pasado?', en: 'Which customers are buying less than last year?' },
    want: { es: 'qué clientes compran menos que el año pasado', en: 'which customers buy less than last year' } },
  { id: 'basket', need: [R.shoperp],
    q: { es: '¿Qué productos se compran juntos?', en: 'Which products are bought together?' },
    want: { es: 'qué productos se compran juntos', en: 'which products are bought together' } },
  { id: 'mrr', need: [R.stripe],
    q: { es: '¿Cuánto ingresas cada mes de forma recurrente y cuánto pierdes?', en: 'How much recurring revenue do you make each month, and how much do you lose?' },
    want: { es: 'nuestros ingresos recurrentes y las bajas', en: 'our recurring revenue and churn' } },
  { id: 'sales-reps', need: [R.crm],
    q: { es: '¿Qué comercial cierra más y en cuánto tiempo?', en: 'Which salesperson closes the most, and how fast?' },
    want: { es: 'qué comercial cierra más y en cuánto tiempo', en: 'which salesperson closes the most and how fast' } },
  { id: 'stale-deals', need: [R.crm],
    q: { es: '¿Cuántas oportunidades se enfrían por falta de seguimiento?', en: 'How many deals go cold for lack of follow-up?' },
    want: { es: 'cuántas oportunidades se enfrían sin seguimiento', en: 'how many deals go cold without follow-up' } },
  { id: 'excel-reports', need: [R.sheet],
    q: { es: '¿Qué informes de Excel podrías dejar de hacer a mano?', en: 'Which Excel reports could you stop building by hand?' },
    want: { es: 'qué informes de Excel podemos automatizar', en: 'which Excel reports we can automate' } },
  { id: 'db-dashboard', need: [R.db],
    q: { es: '¿Qué datos de tu base de datos podrías ver en un cuadro de mando?', en: 'Which data in your database could you see on a dashboard?' },
    want: { es: 'qué datos de nuestra base de datos podemos ver en un cuadro de mando', en: 'which database data we can put on a dashboard' } },
];

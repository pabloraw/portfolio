export type Locale = 'es' | 'en';

export type Category =
  | 'crm' | 'erp-crm' | 'erp' | 'accounting' | 'email' | 'web' | 'ads'
  | 'payments' | 'ecommerce' | 'database' | 'files' | 'spreadsheet';

export interface Source {
  name: string;
  category: Category;
}

/** Fuentes que caen en el juego y se pueden marcar en el selector de stack. */
export const SOURCES: Source[] = [
  { name: 'Pipedrive', category: 'crm' },
  { name: 'Dynamics 365', category: 'erp-crm' },
  { name: 'HubSpot', category: 'crm' },
  { name: 'Salesforce', category: 'crm' },
  { name: 'NetSuite', category: 'erp' },
  { name: 'Odoo', category: 'erp' },
  { name: 'Holded', category: 'erp' },
  { name: 'Sage', category: 'accounting' },
  { name: 'Mailchimp', category: 'email' },
  { name: 'Brevo', category: 'email' },
  { name: 'Google Analytics 4', category: 'web' },
  { name: 'Meta Ads', category: 'ads' },
  { name: 'Stripe', category: 'payments' },
  { name: 'Shopify', category: 'ecommerce' },
  { name: 'PostgreSQL', category: 'database' },
  { name: 'SQL Server', category: 'database' },
  { name: 'MongoDB', category: 'database' },
  { name: 'Cloud Storage', category: 'files' },
  { name: 'Excel', category: 'spreadsheet' },
  { name: 'Google Sheets', category: 'spreadsheet' },
];

export const CATEGORY_LABEL: Record<Locale, Record<Category, string>> = {
  es: {
    crm: 'CRM', 'erp-crm': 'ERP · CRM', erp: 'ERP', accounting: 'Contabilidad', email: 'Email',
    web: 'Web', ads: 'Publicidad', payments: 'Pagos', ecommerce: 'E-commerce',
    database: 'Base de datos', files: 'Ficheros', spreadsheet: 'Hoja de cálculo',
  },
  en: {
    crm: 'CRM', 'erp-crm': 'ERP · CRM', erp: 'ERP', accounting: 'Accounting', email: 'Email',
    web: 'Web', ads: 'Ads', payments: 'Payments', ecommerce: 'E-commerce',
    database: 'Database', files: 'Files', spreadsheet: 'Spreadsheet',
  },
};

/** Color del icono de cada categoría en el juego (decorativo, no semántico). */
export const CATEGORY_COLOR: Record<Category, string> = {
  crm: '#2B4BFF', 'erp-crm': '#5A3BD6', erp: '#5A3BD6', accounting: '#7B4B2A', email: '#C2410C',
  web: '#B45309', ads: '#BE185D', payments: '#0F766E', ecommerce: '#15803D',
  database: '#334155', files: '#0369A1', spreadsheet: '#166534',
};

/** Fuentes que la demo automática ingesta para enseñar el juego. */
export const DEMO_SOURCES = ['Meta Ads', 'HubSpot', 'Stripe', 'Shopify', 'Holded', 'Google Analytics 4'];

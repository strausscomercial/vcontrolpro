import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Package, ShoppingCart, Truck, Settings, LayoutDashboard, 
  Plus, Save, Trash2, Search, DollarSign, FileText, X, LogOut, 
  Calendar, CheckCircle, AlertCircle, Clock, Edit, Edit2, 
  History as HistoryIcon, Archive, CheckSquare, CalendarClock, 
  Printer, Shield, TrendingUp, BarChart2, Lock, Unlock, Image as ImageIcon, Key, Building, SwitchCamera, AlertTriangle, Wallet, PieChart, FileSearch, ClipboardList, Info, Monitor, Smartphone, TrendingDown, CreditCard, Check, Layers, AlertOctagon, Eye, EyeOff, Database, Server, Globe, Network, HardDrive, Cpu, MemoryStick, ShieldCheck, AlertCircle as AlertCircleIcon, Bell, Filter, Download, Upload, RefreshCw, Activity, Terminal, Code, Bug, ShieldAlert
} from 'lucide-react';

// --- CONSTANTES GLOBAIS ---
const LOCAL_STORAGE_KEY = 'vcontrol_pro_db_v_original_plus_caixa';
const CURRENT_DB_VERSION = 'v2.12.complete_logs';
const DEFAULT_LOGO = "./V.png"; 

const DOC_TYPES = [
  'Nota Fiscal', 'Dacte', 'Aluguel', 'Financiamento', 'Energia', 'Água', 'Pessoal', 'Boleto', 'Recibo', 'Outros'
];

const COMPANIES = [
  { cnpj: '31501279000110', name: 'COMERCIAL STRAUSS (Matriz)', shortName: 'STRAUSS M' },
  { cnpj: '31501279000200', name: 'COMERCIAL STRAUSS (Filial)', shortName: 'STRAUSS F' },
  { cnpj: '55482599000139', name: 'GROUP SUPPLY SP', shortName: 'GROUP SP' },
];

// Tipos de ações para logs - SIMPLIFICADO
const LOG_TYPES = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  CREATE: 'criar',
  UPDATE: 'alterar',
  DELETE: 'excluir',
  VIEW: 'visualizar',
  PRINT: 'imprimir',
  SYSTEM: 'sistema'
};

// --- FUNÇÕES DE FORMATAÇÃO ---
const safeFormatCurrency = (value) => {
  const num = parseFloat(value);
  if (isNaN(num)) return 'R$ 0,00';
  return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const safeString = (str) => {
  if (str === null || str === undefined) return '';
  return String(str);
};

const formatNCM = (ncm) => {
  if (!ncm) return '';
  
  // Remove qualquer caractere não numérico
  const cleaned = ncm.toString().replace(/\D/g, '');
  
  // Garante que tenha 8 dígitos (padrão NCM)
  const padded = cleaned.padStart(8, '0');
  
  // Formata: 0000.00.00
  return `${padded.substring(0, 4)}.${padded.substring(4, 6)}.${padded.substring(6, 8)}`;
};

const formatPhone = (phone) => {
  if (!phone) return '';
  
  // Remove qualquer caractere não numérico
  const cleaned = phone.toString().replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    // Celular com DDD: (11) 98765-4321
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7, 11)}`;
  } else if (cleaned.length === 10) {
    // Telefone fixo com DDD: (11) 3456-7890
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6, 10)}`;
  } else if (cleaned.length === 8 || cleaned.length === 9) {
    // Telefone sem DDD
    if (cleaned.length === 9) {
      return `${cleaned.substring(0, 5)}-${cleaned.substring(5, 9)}`;
    }
    return `${cleaned.substring(0, 4)}-${cleaned.substring(4, 8)}`;
  }
  
  // Retorna o original se não conseguir formatar
  return phone;
};

const formatCNPJCPF = (doc) => {
  if (!doc) return '';
  
  const cleaned = doc.toString().replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    // CPF: 123.456.789-00
    return `${cleaned.substring(0, 3)}.${cleaned.substring(3, 6)}.${cleaned.substring(6, 9)}-${cleaned.substring(9, 11)}`;
  } else if (cleaned.length === 14) {
    // CNPJ: 12.345.678/0001-90
    return `${cleaned.substring(0, 2)}.${cleaned.substring(2, 5)}.${cleaned.substring(5, 8)}/${cleaned.substring(8, 12)}-${cleaned.substring(12, 14)}`;
  }
  
  // Retorna o original se não conseguir formatar
  return doc;
};

const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString + 'T12:00:00');
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('pt-BR');
  } catch (e) {
    return '-';
  }
};

const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleString('pt-BR');
  } catch (e) {
    return '-';
  }
};

const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let browser = "Desconhecido";
    if (ua.indexOf("Chrome") > -1) browser = "Chrome";
    else if (ua.indexOf("Safari") > -1) browser = "Safari";
    else if (ua.indexOf("Firefox") > -1) browser = "Firefox";
    else if (ua.indexOf("Edg") > -1) browser = "Edge";

    let os = "Desconhecido";
    if (ua.indexOf("Win") > -1) os = "Windows";
    else if (ua.indexOf("Mac") > -1) os = "MacOS";
    else if (ua.indexOf("Linux") > -1) os = "Linux";
    else if (ua.indexOf("Android") > -1) os = "Android";
    else if (ua.indexOf("iPhone") > -1) os = "iPhone";

    return `${browser} em ${os}`;
};

const detectChanges = (oldObj, newObj, fieldsToCheck) => {
    let changes = [];
    fieldsToCheck.forEach(field => {
        const oldVal = oldObj[field];
        const newVal = newObj[field];
        if (String(oldVal) !== String(newVal)) {
            const fieldNames = { name: 'Nome', price: 'Preço', cost: 'Custo', stock: 'Estoque', generalStatus: 'Status', ncm: 'NCM', phone: 'Telefone', partnerId: 'Parceiro', value: 'Valor', dueDate: 'Vencimento', description: 'Descrição', docNumber: 'Nº Doc', customerDescription: 'Descrição do Cliente' };
            const label = fieldNames[field] || field;
            changes.push(`${label}: ${oldVal} -> ${newVal}`);
        }
    });
    return changes.length > 0 ? changes.join(' | ') : null;
};

const detectOrderChanges = (oldItems, newItems) => {
    let details = [];
    oldItems.forEach(oldItem => {
        const newItem = newItems.find(ni => ni.id === oldItem.id); 
        if (!newItem) details.push(`🔴 REMOVEU item '${oldItem.name}' (Qtd: ${oldItem.quantity})`);
        else {
            if (oldItem.quantity !== newItem.quantity) details.push(`✏️ ALTEROU Qtd '${oldItem.name}': ${oldItem.quantity} -> ${newItem.quantity}`);
            if (oldItem.unitPrice !== newItem.unitPrice) details.push(`💲 ALTEROU Preço '${oldItem.name}': ${safeFormatCurrency(oldItem.unitPrice)} -> ${safeFormatCurrency(newItem.unitPrice)}`);
        }
    });
    newItems.forEach(newItem => {
        const oldItem = oldItems.find(oi => oi.id === newItem.id);
        if (!oldItem) details.push(`🟢 ADICIONOU item '${newItem.name}' (Qtd: ${newItem.quantity})`);
    });
    return details.length > 0 ? details.join(' | ') : "Nenhuma alteração nos itens.";
};

// DATA UTILS FOR MOCK DATA - MOVED HERE TO BE AVAILABLE FOR INITIAL_DB_SCHEMA
const formatDateIso = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const daysAgo = (n) => { 
    const d = new Date(); 
    d.setDate(d.getDate() - n); 
    return formatDateIso(d); 
};

const daysAhead = (n) => { 
    const d = new Date(); 
    d.setDate(d.getDate() + n); 
    return formatDateIso(d); 
};

// Dados iniciais com formatação aplicada
const INITIAL_DB_SCHEMA = {
  company: { 
    name: 'VControlPro', 
    currency: 'R$', 
    lastUnlockedMonth: '', 
    logoUrl: '' 
  },
  users: [
    { 
      id: 1, 
      name: 'Administrador', 
      user: 'admin', 
      pass: 'admin', 
      role: 'admin',
      modules: []
    },
    { 
      id: 2, 
      name: 'Gerente', 
      user: 'gerente', 
      pass: '123', 
      role: 'gerente',
      modules: []
    },
    { 
      id: 3, 
      name: 'Vendedor', 
      user: 'vendedor', 
      pass: '123', 
      role: 'vendedor',
      modules: []
    },
    { 
      id: 4, 
      name: 'Almoxarife', 
      user: 'almox', 
      pass: '123', 
      role: 'almoxarifado',
      modules: []
    },
    { 
      id: 5, 
      name: 'Analista Financeiro', 
      user: 'finan', 
      pass: '123', 
      role: 'financeiro',
      modules: []
    }
  ],
  // --- CLIENTES MOCK COM FORMATAÇÃO ---
  clients: [
    { id: 1, name: 'Mercado Silva & Filhos', doc: formatCNPJCPF('12345678000190'), phone: formatPhone('11987654321'), address: 'Rua das Flores, 123', city: 'São Paulo' },
    { id: 2, name: 'Padaria Pão Dourado', doc: formatCNPJCPF('98765432000110'), phone: formatPhone('21912345678'), address: 'Av. Principal, 500', city: 'Rio de Janeiro' },
    { id: 3, name: 'Construtora Horizonte', doc: formatCNPJCPF('45678901000123'), phone: formatPhone('31998765432'), address: 'Praça Central, 45', city: 'Belo Horizonte' },
    { id: 4, name: 'João da Silva (PF)', doc: formatCNPJCPF('12345678900'), phone: formatPhone('41999998888'), address: 'Rua A, 10', city: 'Curitiba' }
  ],
  // --- FORNECEDORES MOCK COM FORMATAÇÃO ---
  suppliers: [
    { id: 1, name: 'Distribuidora Nacional', doc: formatCNPJCPF('11222333000144'), phone: formatPhone('4133334444'), contact: 'Roberto' },
    { id: 2, name: 'Tech Soluções Ltda', doc: formatCNPJCPF('55666777000188'), phone: formatPhone('1130302020'), contact: 'Fernanda' },
    { id: 3, name: 'Atacadão de Materiais', doc: formatCNPJCPF('99888777000111'), phone: formatPhone('5132109876'), contact: 'Carlos' },
    { id: 4, name: 'Logística Express', doc: formatCNPJCPF('22333444000155'), phone: formatPhone('4730005000'), contact: 'Mariana' }
  ],
  // --- PRODUTOS MOCK COM NCM FORMATADO ---
  products: [
    { id: 1, name: 'Cimento CP II - 50kg', price: 35.90, cost: 28.50, stock: 150, unit: 'SC', ncm: formatNCM('25232910'), customerDescription: 'Cimento para construção civil' },
    { id: 2, name: 'Tinta Acrílica Branca 18L', price: 289.90, cost: 195.00, stock: 45, unit: 'LT', ncm: formatNCM('32091010'), customerDescription: 'Tinta para pintura de paredes' },
    { id: 3, name: 'Tijolo 8 Furos', price: 1.20, cost: 0.65, stock: 5000, unit: 'UN', ncm: formatNCM('69041000'), customerDescription: 'Tijolo cerâmico para alvenaria' },
    { id: 4, name: 'Areia Média (Metro)', price: 120.00, cost: 80.00, stock: 30, unit: 'M3', ncm: formatNCM('25051000'), customerDescription: 'Areia para construção' },
    { id: 5, name: 'Tubo PVC 100mm - Barra 6m', price: 65.50, cost: 42.00, stock: 80, unit: 'BR', ncm: formatNCM('39172300'), customerDescription: 'Tubo para esgoto e água' },
    { id: 6, name: 'Argamassa AC-III', price: 45.00, cost: 32.00, stock: 200, unit: 'SC', ncm: formatNCM('38245000'), customerDescription: 'Argamassa para assentamento' }
  ],
  // --- ESTOQUE INDEPENDENTE MOCK COM NCM FORMATADO ---
  inventoryItems: [
    { id: 1, name: 'Cimento CP II - Reserva Técnica', ncm: formatNCM('25232910'), lastEntryInvoice: 'NF-1020', stock: 200, unit: 'SC', cost: 28.00 },
    { id: 2, name: 'Tijolo 8 Furos - Lote Antigo', ncm: formatNCM('69041000'), lastEntryInvoice: 'NF-1021', stock: 5000, unit: 'UN', cost: 0.60 },
    { id: 3, name: 'Kit Ferramentas Básicas', ncm: formatNCM('82060000'), lastEntryInvoice: 'NF-9988', stock: 15, unit: 'CX', cost: 150.00 },
    { id: 4, name: 'Capacete de Segurança Azul', ncm: formatNCM('65061000'), lastEntryInvoice: 'NF-3321', stock: 50, unit: 'UN', cost: 12.50 }
  ],
  // --- VENDAS MOCK ---
  sales: [
    {
        id: 101,
        partnerName: 'Mercado Silva & Filhos',
        partnerId: 1,
        customerOrderNumber: 'PO-554',
        issueDate: daysAgo(5), 
        generalStatus: 'Entregue',
        total: 1795.00,
        items: [
            { id: 1, name: 'Cimento CP II - 50kg', quantity: 50, delivered: 50, unitPrice: 35.90, itemStatus: 'Entregue', deliveryDate: daysAgo(4) }
        ]
    },
    {
        id: 102,
        partnerName: 'Construtora Horizonte',
        partnerId: 3,
        customerOrderNumber: 'CONST-2024',
        issueDate: daysAgo(2), 
        generalStatus: 'Parcialmente',
        total: 6000.00,
        items: [
            { id: 3, name: 'Tijolo 8 Furos', quantity: 5000, delivered: 2000, unitPrice: 1.20, itemStatus: 'Parcial', deliveryDate: daysAhead(2) }
        ]
    },
    {
        id: 103,
        partnerName: 'João da Silva (PF)',
        partnerId: 4,
        customerOrderNumber: 'BALCÃO',
        issueDate: daysAgo(10), 
        generalStatus: 'Cancelado',
        total: 589.90,
        items: [
            { id: 2, name: 'Tinta Acrílica Branca 18L', quantity: 2, delivered: 0, unitPrice: 289.90, itemStatus: 'Pendente', deliveryDate: daysAgo(8) }
        ]
    }
  ],
  // --- COMPRAS MOCK ---
  purchases: [
    {
        id: 501,
        partnerName: 'Distribuidora Nacional',
        partnerId: 1,
        customerOrderNumber: 'COMPRA-ABRIL',
        issueDate: daysAgo(15),
        generalStatus: 'Entregue',
        total: 2850.00,
        items: [
            { id: 1, name: 'Cimento CP II - 50kg', quantity: 100, delivered: 100, unitPrice: 28.50, itemStatus: 'Entregue', deliveryDate: daysAgo(12) }
        ]
    },
    {
        id: 502,
        partnerName: 'Logística Express',
        partnerId: 4,
        customerOrderNumber: 'FRETE-URG',
        issueDate: daysAgo(1),
        generalStatus: 'Aberto',
        total: 8400.00,
        items: [
            { id: 5, name: 'Tubo PVC 100mm - Barra 6m', quantity: 200, delivered: 0, unitPrice: 42.00, itemStatus: 'Pendente', deliveryDate: daysAhead(1) }
        ]
    }
  ],
  // --- FINANCEIRO MOCK ---
  financials: [
    // Contas a Pagar
    { id: 1, type: 'payable', description: 'Aluguel Galpão Principal', value: 3500.00, dueDate: daysAhead(5), status: 'Pendente', partnerName: 'Imobiliária Central', docType: 'Aluguel', issueDate: daysAgo(20) },
    { id: 2, type: 'payable', description: 'Conta de Energia (Ref. Mês Anterior)', value: 850.20, dueDate: daysAgo(2), status: 'Pendente', partnerName: 'Enel', docType: 'Energia', issueDate: daysAgo(15) }, // Atrasada
    { id: 3, type: 'payable', description: 'Internet Fibra', value: 150.00, dueDate: daysAgo(5), status: 'Pago', settlementDate: daysAgo(5), partnerName: 'Vivo Empresas', docType: 'Outros', issueDate: daysAgo(20), settledBy: 'financeiro' },
    { id: 4, type: 'payable', description: 'Compra Matéria Prima - Distribuidora Nac.', value: 2850.00, dueDate: daysAhead(10), status: 'Pendente', partnerName: 'Distribuidora Nacional', docType: 'Boleto', issueDate: daysAgo(15) },
    
    // Contas a Receber
    { id: 5, type: 'receivable', description: 'Venda #101 - Mercado Silva', value: 1795.00, dueDate: daysAgo(1), status: 'Recebido', settlementDate: daysAgo(1), partnerName: 'Mercado Silva & Filhos', docType: 'Nota Fiscal', issueDate: daysAgo(5), settledBy: 'admin' },
    { id: 6, type: 'receivable', description: 'Venda #102 - Horizonte (Parc 1/2)', value: 3000.00, dueDate: daysAhead(2), status: 'Pendente', partnerName: 'Construtora Horizonte', docType: 'Boleto', issueDate: daysAgo(2) },
    { id: 7, type: 'receivable', description: 'Venda #102 - Horizonte (Parc 2/2)', value: 3000.00, dueDate: daysAhead(32), status: 'Pendente', partnerName: 'Construtora Horizonte', docType: 'Boleto', issueDate: daysAgo(2) },
    
    // UPDATE: Adicionando item Atrasado e Pendente para teste visual
    { id: 8, type: 'receivable', description: 'Manutenção Equipamento - Em Atraso', value: 450.00, dueDate: daysAgo(3), status: 'Pendente', partnerName: 'Construtora Horizonte', docType: 'Boleto', issueDate: daysAgo(10) }
  ],
  // --- ADIÇÃO: MÓDULO CAIXA ---
  cashier: [
     { id: 1, date: daysAgo(0), type: 'entry', entryInvoice: '', exitInvoice: 'NFCe-1001' },
     { id: 2, date: daysAgo(0), type: 'exit', entryInvoice: 'NF-550', exitInvoice: '' }
  ],
  // --- LOGS MOCK SIMPLIFICADOS ---
  logs: [
      { 
        id: 1, 
        timestamp: new Date().toISOString(), 
        user: 'admin', 
        role: 'admin', 
        action: LOG_TYPES.SYSTEM, 
        details: 'Sistema inicializado', 
        module: 'sistema'
      },
      { 
        id: 2, 
        timestamp: daysAgo(1) + 'T10:30:00', 
        user: 'vendedor', 
        role: 'vendedor', 
        action: LOG_TYPES.CREATE, 
        details: 'Criou Pedido #102', 
        module: 'vendas'
      },
      { 
        id: 3, 
        timestamp: daysAgo(5) + 'T14:45:00', 
        user: 'financeiro', 
        role: 'financeiro', 
        action: LOG_TYPES.UPDATE, 
        details: 'Baixou conta #3 (Pago)', 
        module: 'financeiro'
      },
      { 
        id: 4, 
        timestamp: daysAgo(2) + 'T09:15:00', 
        user: 'admin', 
        role: 'admin', 
        action: LOG_TYPES.SYSTEM, 
        details: 'Tentativa de acesso não autorizado', 
        module: 'segurança'
      }
  ] 
};

// --- DEFINIÇÃO DOS MÓDULOS DISPONÍVEIS ---
const AVAILABLE_MODULES = [
  { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard, category: 'principal' },
  { id: 'clients', label: 'Clientes', icon: Users, category: 'cadastros' },
  { id: 'suppliers', label: 'Fornecedores', icon: Truck, category: 'cadastros' },
  { id: 'products', label: 'Produtos', icon: Package, category: 'cadastros' },
  { id: 'sales', label: 'Vendas', icon: ShoppingCart, category: 'movimentacao' },
  { id: 'purchases', label: 'Compras', icon: FileText, category: 'movimentacao' },
  { id: 'history_items', label: 'Histórico Itens', icon: HistoryIcon, category: 'movimentacao' },
  { id: 'delivery_report', label: 'Relatório Entregas', icon: CalendarClock, category: 'movimentacao' },
  { id: 'financial_payable', label: 'Contas a Pagar', icon: TrendingDown, category: 'financeiro' },
  { id: 'financial_receivable', label: 'Contas a Receber', icon: TrendingUp, category: 'financeiro' },
  { id: 'cashier', label: 'Livro Caixa', icon: Wallet, category: 'controle_interno' },
  { id: 'inventory_report', label: 'Estoque (Independente)', icon: ClipboardList, category: 'relatorios' },
  { id: 'audit_report', label: 'Logs do Sistema', icon: FileSearch, category: 'relatorios' },
  { id: 'sales_history', label: 'Vendas Finalizadas', icon: Archive, category: 'concluidos' },
  { id: 'purchases_history', label: 'Compras Finalizadas', icon: CheckSquare, category: 'concluidos' },
  { id: 'config', label: 'Configurações', icon: Settings, category: 'administracao' }
];

// Grupos de módulos por categoria
const MODULE_CATEGORIES = {
  principal: 'Principal',
  cadastros: 'Cadastros',
  movimentacao: 'Movimentação',
  financeiro: 'Financeiro',
  controle_interno: 'Controle Interno',
  relatorios: 'Relatórios & Auditoria',
  concluidos: 'Pedidos Concluídos',
  administracao: 'Administração'
};

// Função para verificar acesso a módulos
const checkModuleAccess = (user, moduleId) => {
  // Admin sempre tem acesso total
  if (user?.role === 'admin') return true;
  
  // Se o usuário tem módulos customizados definidos
  if (user?.modules && Array.isArray(user.modules)) {
    return user.modules.includes(moduleId);
  }
  
  // Sistema legado baseado em roles (para compatibilidade)
  const roleAccess = {
    'admin': AVAILABLE_MODULES.map(m => m.id),
    'gerente': ['dashboard', 'clients', 'suppliers', 'products', 'sales', 'purchases', 'history_items', 'delivery_report', 'financial_payable', 'financial_receivable', 'cashier', 'inventory_report', 'audit_report', 'sales_history', 'purchases_history'],
    'vendedor': ['dashboard', 'clients', 'products', 'sales', 'history_items', 'delivery_report', 'sales_history'],
    'almoxarifado': ['dashboard', 'suppliers', 'products', 'purchases', 'delivery_report', 'inventory_report', 'purchases_history'],
    'financeiro': ['dashboard', 'clients', 'suppliers', 'financial_payable', 'financial_receivable', 'cashier', 'audit_report'],
    'user': ['dashboard', 'clients', 'products', 'sales', 'history_items', 'sales_history']
  };
  
  return roleAccess[user?.role]?.includes(moduleId) || false;
};

// --- COMPONENTES UI REUTILIZÁVEIS ---
const Button = ({ children, onClick, variant = 'primary', className = '', size = 'md', disabled = false, title = '' }) => {
  const baseStyle = "rounded-md font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = { sm: "px-2 py-1 text-xs", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-base" };
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-700 hover:bg-gray-300",
    danger: "bg-red-100 text-red-600 hover:bg-red-200",
    success: "bg-green-600 text-white hover:bg-green-700",
    ghost: "text-gray-500 hover:bg-gray-100",
    warning: "bg-yellow-500 text-white hover:bg-yellow-600",
    info: "bg-blue-500 text-white hover:bg-blue-600"
  };
  return <button onClick={onClick} disabled={disabled} title={title} className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${className}`}>{children}</button>;
};

const Card = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex items-center space-x-4">
    <div className={`p-3 rounded-full ${color} text-white`}><Icon size={24} /></div>
    <div><p className="text-gray-500 text-sm font-medium">{title}</p><h3 className="text-xl font-bold text-gray-800">{value}</h3></div>
  </div>
);

const Input = ({ label, value, onChange, type = 'text', colSpan = 'col-span-1', placeholder = '', onBlur, ...props }) => {
  const safeVal = value === undefined || value === null ? '' : value;
  return (
    <div className={colSpan}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {type === 'textarea' ? (
        <textarea 
          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none resize-none" 
          rows="3"
          value={safeVal} 
          onChange={e => onChange(e.target.value)} 
          onBlur={onBlur}
          placeholder={placeholder}
          {...props}
        />
      ) : (
        <input 
          type={type} 
          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" 
          value={safeVal} 
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur} 
          placeholder={placeholder}
          step={type === 'number' ? "0.01" : undefined}
          {...props}
        />
      )}
    </div>
  );
};

const NavButton = ({ active, onClick, icon: Icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-colors ${active ? 'bg-blue-600 text-white border-r-4 border-blue-400' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}><Icon size={18} /> {label}</button>
);

const SectionTitle = ({ children }) => <div className="px-6 py-2 text-xs font-bold text-slate-500 uppercase mt-4 tracking-wider">{children}</div>;

const StatusBadge = ({ status, severity }) => {
  // Para logs severity
  if (severity) {
    const severityStyles = {
      info: 'bg-blue-100 text-blue-700',
      warning: 'bg-yellow-100 text-yellow-700',
      error: 'bg-red-100 text-red-700',
      critical: 'bg-red-600 text-white',
      debug: 'bg-gray-100 text-gray-700'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-bold ${severityStyles[severity] || 'bg-gray-100'}`}>{severity.toUpperCase()}</span>;
  }
  
  // Para outros status
  const styles = { 
      'Aberto': 'bg-blue-100 text-blue-700', 
      'Entregue': 'bg-green-100 text-green-700', 
      'Parcialmente': 'bg-orange-100 text-orange-700', 
      'Parcial': 'bg-orange-100 text-orange-700', 
      'Cancelado': 'bg-red-100 text-red-700', 
      'Pendente': 'bg-yellow-100 text-yellow-700', 
      'Pago': 'bg-green-100 text-green-700', 
      'Recebido': 'bg-green-100 text-green-700',
      'entry': 'bg-green-100 text-green-700',
      'exit': 'bg-red-100 text-red-700',
      'login': 'bg-green-100 text-green-700',
      'logout': 'bg-gray-100 text-gray-700',
      'criar': 'bg-blue-100 text-blue-700',
      'alterar': 'bg-yellow-100 text-yellow-700',
      'excluir': 'bg-red-100 text-red-700',
      'visualizar': 'bg-gray-100 text-gray-700',
      'imprimir': 'bg-purple-100 text-purple-700',
      'sistema': 'bg-indigo-100 text-indigo-700'
  };
  const label = status === 'entry' ? 'ENTRADA' : status === 'exit' ? 'SAÍDA' : status;
  return <span className={`px-2 py-1 rounded-full text-xs font-bold ${styles[status] || 'bg-gray-100'}`}>{label || 'N/A'}</span>
};

const AccessDenied = ({ moduleName = "este módulo" }) => (
  <div className="flex flex-col items-center justify-center h-96 animate-fade-in">
    <div className="p-6 bg-red-50 rounded-full mb-6">
      <Lock className="text-red-500" size={64} />
    </div>
    <h2 className="text-2xl font-bold text-gray-800 mb-2">Acesso Restrito</h2>
    <p className="text-gray-600 text-center max-w-md mb-8">
      Você não tem permissão para acessar {moduleName}.<br/>
      Contate o administrador do sistema para solicitar acesso.
    </p>
    <div className="flex gap-4">
      <Button onClick={() => window.history.back()} variant="secondary">
        Voltar
      </Button>
      <Button onClick={() => window.location.reload()} variant="primary">
        Atualizar Página
      </Button>
    </div>
  </div>
);

const GenericList = ({ title, data, columns, onAdd, onEdit, onDelete, currentUser, addLabel = "Novo", onPrint, onPrintList, moduleId }) => {
  // Verifica se o usuário tem acesso ao módulo
  if (!checkModuleAccess(currentUser, moduleId)) {
    return <AccessDenied moduleName={title} />;
  }

  const [searchTerm, setSearchTerm] = useState('');

  if (!currentUser) return null;
  const safeData = Array.isArray(data) ? data : [];
  const filteredData = safeData.filter(item => {
    if (!searchTerm) return true;
    const lowerTerm = searchTerm.toLowerCase();
    return (safeString(item.customerOrderNumber).toLowerCase().includes(lowerTerm) || safeString(item.name).toLowerCase().includes(lowerTerm) || safeString(item.partnerName).toLowerCase().includes(lowerTerm) || safeString(item.description).toLowerCase().includes(lowerTerm) || String(item.id || '').includes(lowerTerm) || String(item.ncm || '').includes(lowerTerm) || String(item.docNumber || '').includes(lowerTerm));
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" placeholder="Pesquisar..." className="w-full pl-10 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
            </div>
            {onPrintList && (<Button onClick={() => onPrintList(filteredData)} variant="secondary" className="whitespace-nowrap"><Printer size={18} /> Imprimir Lista</Button>)}
            {onAdd && <Button onClick={onAdd}><Plus size={18} /> {addLabel}</Button>}
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b"><tr>{columns.map((col, idx) => (<th key={idx} className={`p-4 font-semibold text-gray-600 text-sm uppercase ${col.key === 'id' ? 'w-16 text-center' : ''}`}>{col.head}</th>))}<th className="p-4 text-right">Ações</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {filteredData.length === 0 ? (<tr><td colSpan={columns.length + 1} className="p-8 text-center text-gray-400">{searchTerm ? 'Nenhum registro encontrado.' : 'Nenhum registro.'}</td></tr>) : filteredData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                {columns.map((col, idx) => (<td key={idx} className={`p-4 text-gray-700 text-sm ${col.key === 'id' ? 'text-center font-mono text-gray-500' : ''}`}>{col.render ? col.render(item) : (col.format ? col.format(item[col.key]) : item[col.key])}</td>))}
                <td className="p-4 text-right flex justify-end gap-4 items-center">{onPrint && (<button onClick={() => onPrint(item)} className="text-slate-400 hover:text-slate-600 transition-colors" title="Imprimir Item"><Printer size={18}/></button>)}{onEdit && (<button onClick={() => onEdit(item)} className="text-blue-500 hover:text-blue-700 transition-colors" title="Editar"><Edit size={18} /></button>)}{(onDelete) && (<button onClick={() => onDelete(item.id)} className="text-red-400 hover:text-red-600 transition-colors" title="Excluir"><Trash2 size={18} /></button>)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- COMPONENTE MODAL DE SELEÇÃO DE MÓDULOS ---
const ModuleSelectorModal = ({ 
  isOpen, 
  onClose, 
  user, 
  onSave,
  title = "Selecionar Módulos"
}) => {
  const [selectedModules, setSelectedModules] = useState([]);
  
  useEffect(() => {
    if (user && isOpen) {
      setSelectedModules(user.modules || []);
    }
  }, [user, isOpen]);
  
  const toggleModule = (moduleId) => {
    setSelectedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };
  
  const toggleAllInCategory = (category) => {
    const categoryModules = AVAILABLE_MODULES
      .filter(m => m.category === category)
      .map(m => m.id);
    
    const allSelected = categoryModules.every(id => selectedModules.includes(id));
    
    if (allSelected) {
      // Desmarcar todos da categoria
      setSelectedModules(prev => prev.filter(id => !categoryModules.includes(id)));
    } else {
      // Marcar todos da categoria
      setSelectedModules(prev => [...new Set([...prev, ...categoryModules])]);
    }
  };
  
  const toggleAll = () => {
    if (selectedModules.length === AVAILABLE_MODULES.length) {
      setSelectedModules([]);
    } else {
      setSelectedModules(AVAILABLE_MODULES.map(m => m.id));
    }
  };
  
  const getCategoryModules = (category) => {
    return AVAILABLE_MODULES.filter(m => m.category === category);
  };
  
  const handleSave = () => {
    onSave(selectedModules);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
              <p className="text-gray-600">Configure os módulos que {user?.name || 'este usuário'} pode acessar</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-red-500 p-2 rounded-full hover:bg-gray-100"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              <span className="font-bold text-blue-600">{selectedModules.length}</span> de {AVAILABLE_MODULES.length} módulos selecionados
            </div>
            <div className="flex gap-2">
              <Button onClick={toggleAll} variant="secondary" size="sm">
                {selectedModules.length === AVAILABLE_MODULES.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Body - Categorias */}
        <div className="flex-1 overflow-y-auto p-6">
          {Object.entries(MODULE_CATEGORIES).map(([categoryKey, categoryLabel]) => {
            const categoryModules = getCategoryModules(categoryKey);
            if (categoryModules.length === 0) return null;
            
            const selectedCount = categoryModules.filter(m => selectedModules.includes(m.id)).length;
            const allSelected = categoryModules.length === selectedCount;
            
            return (
              <div key={categoryKey} className="mb-6 last:mb-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                    {categoryLabel}
                    <span className="text-sm font-normal text-gray-500">
                      ({selectedCount}/{categoryModules.length})
                    </span>
                  </h3>
                  <button
                    onClick={() => toggleAllInCategory(categoryKey)}
                    className={`text-xs font-medium px-3 py-1 rounded-full ${allSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {allSelected ? 'Desmarcar Todos' : 'Selecionar Todos'}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categoryModules.map(module => {
                    const Icon = module.icon;
                    const isSelected = selectedModules.includes(module.id);
                    
                    return (
                      <div
                        key={module.id}
                        onClick={() => toggleModule(module.id)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'bg-blue-50 border-blue-300 shadow-sm ring-1 ring-blue-100' 
                            : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                            <Icon size={20} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800">{module.label}</h4>
                            <p className="text-xs text-gray-500 mt-1">ID: {module.id}</p>
                          </div>
                          <div className={`w-5 h-5 rounded border flex items-center justify-center mt-1 ${
                            isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'
                          }`}>
                            {isSelected && <Check size={14} className="text-white" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="flex flex-wrap gap-2">
            {selectedModules.length > 0 && (
              <>
                <span className="text-sm text-gray-600">Selecionados:</span>
                <div className="flex flex-wrap gap-1 max-w-md">
                  {selectedModules.slice(0, 5).map(moduleId => {
                    const module = AVAILABLE_MODULES.find(m => m.id === moduleId);
                    return module ? (
                      <span 
                        key={moduleId} 
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1"
                      >
                        {module.label}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleModule(moduleId);
                          }}
                          className="text-blue-900 hover:text-red-600"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ) : null;
                  })}
                  {selectedModules.length > 5 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      +{selectedModules.length - 5} mais
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button onClick={onClose} variant="secondary">
              Cancelar
            </Button>
            <Button onClick={handleSave} variant="primary">
              <Save size={18} /> Salvar Módulos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL DA APLICAÇÃO ---
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });
  const [currentCompanyCNPJ, setCurrentCompanyCNPJ] = useState(null); 
  const [isCompanySelectionOpen, setIsCompanySelectionOpen] = useState(false); 
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', msg: '', onConfirm: null });
  const [financialViewMode, setFinancialViewMode] = useState('open');
  const [cashierFilters, setCashierFilters] = useState({ start: new Date().toISOString().slice(0, 8) + '01', end: new Date().toISOString().slice(0, 10) });
    
  const [allCompaniesData, setAllCompaniesData] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : {};
      const initialData = {};
      COMPANIES.forEach(comp => {
          const key = comp.cnpj;
          const savedData = parsed[key] || INITIAL_DB_SCHEMA;
          const cleanArray = (arr) => {
            if (!Array.isArray(arr)) return [];
            return arr.filter(item => item !== null && item !== undefined).map(item => {
              // Formatar CNPJ/CPF, telefone e NCM dos dados salvos
              if (item.doc) item.doc = formatCNPJCPF(item.doc);
              if (item.phone) item.phone = formatPhone(item.phone);
              if (item.ncm) item.ncm = formatNCM(item.ncm);
              return item;
            });
          };
          
          initialData[key] = {
            ...INITIAL_DB_SCHEMA, ...savedData, 
            company: { ...INITIAL_DB_SCHEMA.company, ...(savedData.company || {}) },
            clients: cleanArray(savedData.clients).length ? cleanArray(savedData.clients) : INITIAL_DB_SCHEMA.clients,
            suppliers: cleanArray(savedData.suppliers).length ? cleanArray(savedData.suppliers) : INITIAL_DB_SCHEMA.suppliers,
            products: cleanArray(savedData.products).length ? cleanArray(savedData.products) : INITIAL_DB_SCHEMA.products,
            inventoryItems: cleanArray(savedData.inventoryItems || []),
            sales: cleanArray(savedData.sales), purchases: cleanArray(savedData.purchases), 
            financials: cleanArray(savedData.financials || []), 
            cashier: cleanArray(savedData.cashier || INITIAL_DB_SCHEMA.cashier),
            users: cleanArray(savedData.users.length > 0 ? savedData.users : INITIAL_DB_SCHEMA.users),
            logs: cleanArray(savedData.logs || INITIAL_DB_SCHEMA.logs)
          };
      });
      return initialData;
    } catch (e) { console.error(e); return {}; }
  });

  const data = allCompaniesData[currentCompanyCNPJ] || INITIAL_DB_SCHEMA;
    
  useEffect(() => { 
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allCompaniesData)); 
  }, [allCompaniesData]);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeFinancialTab, setActiveFinancialTab] = useState('payable'); 
  const [notification, setNotification] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState(null); 
  const [formData, setFormData] = useState({});
  const [editingOrderId, setEditingOrderId] = useState(null); 
  const [orderItems, setOrderItems] = useState([]);
  const [historySearch, setHistorySearch] = useState(''); 
  const [newUser, setNewUser] = useState({ name: '', user: '', pass: '', role: 'user', modules: [] });
  const [isMonthlyLocked, setIsMonthlyLocked] = useState(false);
  const [passChangeForm, setPassChangeForm] = useState({ current: '', new: '', confirm: '' });
  const [deliverySearch, setDeliverySearch] = useState('');
  const [financialFilters, setFinancialFilters] = useState({ start: '', end: '' });
  const [tempInstallments, setTempInstallments] = useState([]);
  const [isInstallmentEditOpen, setIsInstallmentEditOpen] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  
  // Estados para módulos
  const [moduleSelectorModal, setModuleSelectorModal] = useState({
    open: false,
    user: null,
    title: '',
    onSave: null
  });

  // --- DEFINIÇÃO DOS HANDLERS ---

  const logAction = (action, details, module = 'sistema') => {
    if (!currentUser && action !== LOG_TYPES.SYSTEM) return;
    
    const userName = currentUser ? currentUser.user : 'Sistema';
    const userRole = currentUser ? currentUser.role : 'N/A';
    
    const newLog = { 
      id: Date.now(), 
      timestamp: new Date().toISOString(), 
      user: userName, 
      role: userRole, 
      action, 
      details, 
      module
    };

    setAllCompaniesData(prev => {
        const targetCnpj = currentCompanyCNPJ || COMPANIES[0].cnpj;
        const companyLogs = prev[targetCnpj]?.logs || [];
        // Limitar logs a 1000 registros para não sobrecarregar
        return { ...prev, [targetCnpj]: { ...prev[targetCnpj], logs: [newLog, ...companyLogs].slice(0, 1000) } };
    });
  };

  const updateCompanyData = useCallback((key, newData) => {
      setAllCompaniesData(prev => ({ ...prev, [currentCompanyCNPJ]: { ...prev[currentCompanyCNPJ], [key]: newData } }));
  }, [currentCompanyCNPJ]);

  useEffect(() => {
    const checkLockStatus = () => {
        const today = new Date();
        const currentMonthKey = today.toISOString().slice(0, 7); 
        const lastUnlocked = data.company?.lastUnlockedMonth || '';
        if (today.getDate() >= 5 && lastUnlocked !== currentMonthKey) setIsMonthlyLocked(true);
        else setIsMonthlyLocked(false);
    };
    if (data.company) checkLockStatus();
  }, [data.company]);

  const showNotification = (msg, type = 'success') => { 
    setNotification({ msg, type }); 
    setTimeout(() => setNotification(null), 3000); 
  };

  const handleSaveEntity = async (entity) => {
    const safeFormData = formData || {};
    
    // Aplicar formatação antes de salvar
    if (safeFormData.doc) {
      safeFormData.doc = formatCNPJCPF(safeFormData.doc);
    }
    if (safeFormData.phone) {
      safeFormData.phone = formatPhone(safeFormData.phone);
    }
    if (safeFormData.ncm) {
      safeFormData.ncm = formatNCM(safeFormData.ncm);
    }
    
    const listKey = entity; 
    const currentList = data[listKey] || [];
    let nextId = currentList.length > 0 ? Math.max(...currentList.map(i => i.id || 0)) + 1 : 1;
    const payload = { ...safeFormData, id: safeFormData.id || nextId };
      
    if (entity === 'products' || entity === 'inventoryItems' || entity === 'financials' || entity === 'cashier') {
        payload.value = parseFloat(payload.value || 0);
        if (entity === 'products' || entity === 'inventoryItems') {
            payload.stock = parseFloat(payload.stock || 0);
            payload.price = parseFloat(payload.price || 0);
            payload.cost = parseFloat(payload.cost || 0);
        }
    }
    if (entity === 'financials') {
        if (!payload.status) payload.status = 'Pendente';
        if (payload.partnerId) {
            const partnerList = payload.type === 'payable' ? data.suppliers : data.clients;
            const partner = partnerList?.find(p => p.id === parseInt(payload.partnerId));
            if(partner) payload.partnerName = partner.name;
        }
    }

    let newList = [...currentList];

    if (entity === 'financials') {
        const installments = parseInt(safeFormData.installments) || 1;
        const baseValue = parseFloat(safeFormData.value || 0);
        const baseDate = new Date(safeFormData.dueDate || new Date());
        const partnerList = payload.type === 'payable' ? data.suppliers : data.clients;
        const partner = partnerList?.find(p => p.id === parseInt(payload.partnerId));
        const partnerName = partner ? partner.name : 'Desconhecido';
        
        if (!safeFormData.id && installments > 1) {
            const generated = [];
            for (let i = 0; i < installments; i++) {
                const newDate = new Date(baseDate);
                newDate.setMonth(baseDate.getMonth() + i);
                
                const installmentPayload = {
                    ...payload,
                    id: nextId + i,
                    value: baseValue,
                    dueDate: newDate.toISOString().split('T')[0],
                    description: `${payload.description} (${i+1}/${installments})`,
                    partnerName: partnerName,
                    status: 'Pendente'
                };
                delete installmentPayload.installments;
                generated.push(installmentPayload);
            }
            setTempInstallments(generated);
            setIsInstallmentEditOpen(true);
            return; 
        } else {
            payload.value = baseValue;
            payload.partnerName = partnerName;
            if (!payload.status) payload.status = 'Pendente';

            if (safeFormData.id) {
                const idx = newList.findIndex(i => i.id === safeFormData.id);
                if(idx > -1) {
                    const oldItem = newList[idx];
                    const changes = detectChanges(oldItem, payload, ['description', 'value', 'dueDate', 'status', 'docNumber', 'partnerName']);
                    const logDetail = changes ? `Alterou Fin: ${changes}` : `Salvou sem alterações.`;
                    newList[idx] = payload;
                    logAction(LOG_TYPES.UPDATE, logDetail, 'financeiro');
                }
            } else {
                newList.push(payload);
                logAction(LOG_TYPES.CREATE, `Criou financeiro: ${payload.description} - Valor: ${safeFormatCurrency(payload.value)}`, 'financeiro');
            }
        }
    } else {
        if (safeFormData.id) {
            const idx = newList.findIndex(i => i.id === safeFormData.id);
            if(idx > -1) {
                const oldItem = newList[idx];
                const changes = detectChanges(oldItem, payload, ['name', 'price', 'cost', 'stock', 'phone', 'ncm', 'description', 'entryInvoice', 'exitInvoice', 'customerDescription']);
                const logDetail = changes ? `Alterou ${payload.name || 'Item'}: [ ${changes} ]` : `Salvou sem alterações.`;
                newList[idx] = payload;
                logAction(LOG_TYPES.UPDATE, logDetail, entity === 'clients' ? 'clientes' : 
                  entity === 'suppliers' ? 'fornecedores' : 
                  entity === 'products' ? 'produtos' : 
                  entity === 'inventoryItems' ? 'estoque' : 
                  entity === 'cashier' ? 'caixa' : 'sistema');
            }
        } else {
            newList.push(payload);
            logAction(LOG_TYPES.CREATE, `Criou novo registro: ${payload.name || 'Item'}`, entity === 'clients' ? 'clientes' : 
              entity === 'suppliers' ? 'fornecedores' : 
              entity === 'products' ? 'produtos' : 
              entity === 'inventoryItems' ? 'estoque' : 
              entity === 'cashier' ? 'caixa' : 'sistema');
        }
    }
      
    updateCompanyData(listKey, newList);
    setIsModalOpen(false); 
    setFormData({});
    showNotification('Salvo com sucesso!');
  };

  const handleCancelOrder = (id, type) => {
      const list = data[type];
      const order = list.find(o => o.id === id);
      if (!order) return;
      
      setConfirmModal({
          open: true,
          title: 'Cancelar Pedido',
          msg: `Tem a certeza que deseja CANCELAR o pedido #${id}?\nIsso irá alterar o status e estornar o estoque.`,
          onConfirm: () => {
              const newList = list.map(o => o.id === id ? { ...o, generalStatus: 'Cancelado' } : o);
              updateCompanyData(type, newList);

              let newProducts = [...data.products];
              order.items.forEach(item => {
                  const pIdx = newProducts.findIndex(p => p.id === item.id);
                  if (pIdx > -1) {
                      const quantity = parseFloat(item.quantity) || 0;
                      if (type === 'sales') {
                          newProducts[pIdx].stock = (newProducts[pIdx].stock || 0) + quantity;
                      } else {
                          newProducts[pIdx].stock = (newProducts[pIdx].stock || 0) - quantity;
                      }
                  }
              });
              updateCompanyData('products', newProducts);

              logAction(LOG_TYPES.UPDATE, `Cancelou Pedido #${id} (Estoque estornado)`, type === 'sales' ? 'vendas' : 'compras');
              showNotification('Pedido cancelado e estoque atualizado.', 'success');
          }
      });
  };

  const handleConfirmInstallments = () => {
      const currentList = data.financials || [];
      const newList = [...currentList, ...tempInstallments];
      updateCompanyData('financials', newList);
      logAction(LOG_TYPES.CREATE, `Criou ${tempInstallments.length} parcelas financeiras (em lote)`, 'financeiro');
      
      setIsInstallmentEditOpen(false);
      setTempInstallments([]);
      setIsModalOpen(false);
      setFormData({});
      showNotification('Parcelas salvas com sucesso!');
  };

  const updateTempInstallment = (index, field, value) => {
      const updated = [...tempInstallments];
      updated[index] = { ...updated[index], [field]: value };
      setTempInstallments(updated);
  };

  const handleDelete = (entity, id) => {
    if (entity === 'inventoryItems') {
        if (!['admin', 'gerente', 'almoxarifado'].includes(currentUser.role)) return showNotification('Sem permissão.', 'error');
    } else {
        if (currentUser?.role !== 'admin') return showNotification('Apenas admin pode excluir.', 'error');
    }
    
    setConfirmModal({
        open: true,
        title: 'Excluir Registro',
        msg: 'Tem a certeza que deseja excluir este registro permanentemente?',
        onConfirm: () => {
            const listKey = entity;
            const item = data[listKey].find(i => i.id === id);
            const newList = data[listKey].filter(i => i.id !== id);
            
            // Mapear entidade para constante
            const logEntity = entity === 'clients' ? 'clientes' :
              entity === 'suppliers' ? 'fornecedores' :
              entity === 'products' ? 'produtos' :
              entity === 'sales' ? 'vendas' :
              entity === 'purchases' ? 'compras' :
              entity === 'financials' ? 'financeiro' :
              entity === 'cashier' ? 'caixa' :
              entity === 'inventoryItems' ? 'estoque' :
              entity === 'users' ? 'usuários' : 'sistema';
            
            logAction(LOG_TYPES.DELETE, `Excluiu permanentemente: ${item?.name || item?.description || ('ID '+id)}`, logEntity);
            updateCompanyData(listKey, newList);
            showNotification('Excluído.');
        }
    });
  };

  const handleSettleFinancial = (id) => {
      const newList = [...(data.financials || [])];
      const idx = newList.findIndex(f => f.id === id);
      if (idx > -1) {
          const item = newList[idx];
          const newStatus = item.type === 'payable' ? 'Pago' : 'Recebido';
          const today = new Date().toISOString().split('T')[0];
          
          setConfirmModal({
              open: true,
              title: `Baixar Conta (${newStatus})`,
              msg: `Confirmar baixa de: ${item.description}?\nValor: ${safeFormatCurrency(item.value)}`,
              onConfirm: () => {
                  newList[idx] = { ...item, status: newStatus, settlementDate: today, settledBy: currentUser.name };
                  updateCompanyData('financials', newList);
                  logAction(LOG_TYPES.UPDATE, `Baixou conta #${id} (${newStatus}) - Valor: ${safeFormatCurrency(item.value)}`, 'financeiro');
                  showNotification('Baixa realizada com sucesso!');
              }
          });
      }
  };

  const handlePrintFinancialReport = (list, title) => {
      logAction(LOG_TYPES.PRINT, `Imprimiu relatório financeiro: ${title}`, 'financeiro');
      
      const printWindow = window.open('', '_blank');
      const logoHtml = data.company.logoUrl || DEFAULT_LOGO ? `<img src="${data.company.logoUrl || DEFAULT_LOGO}" style="height: 50px; margin-bottom: 10px;" onerror="this.style.display='none'"/>` : '';
      
      const rows = list.map(item => `
        <tr>
            <td>${formatDate(item.issueDate)}</td>
            <td>${formatDate(item.dueDate)}</td>
            <td>${formatDate(item.settlementDate)}</td>
            <td>${item.docNumber || item.docType || '-'}</td>
            <td>${item.partnerName || '-'}</td>
            <td>${item.description}</td>
            <td>${safeFormatCurrency(item.value)}</td>
            <td>${item.status}</td>
            <td>${item.settledBy || '-'}</td>
        </tr>
      `).join('');

      printWindow.document.write(`
        <html>
        <head>
            <title>${title}</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    padding: 20px; 
                    color: #000; 
                    margin: 0;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-top: 20px; 
                    font-size: 11px; 
                }
                th { 
                    background: #f3f4f6; 
                    text-align: left; 
                    padding: 8px; 
                    border-bottom: 2px solid #000; 
                    font-weight: bold; 
                }
                td { 
                    padding: 8px; 
                    border-bottom: 1px solid #ddd; 
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 30px; 
                    border-bottom: 2px solid #333; 
                    padding-bottom: 20px; 
                }
                .summary { 
                    margin-top: 20px; 
                    text-align: right; 
                    font-weight: bold; 
                    font-size: 14px; 
                    padding-top: 10px;
                    border-top: 2px solid #333;
                }
                @media print {
                    body { padding: 10px; }
                    table { font-size: 10px; }
                    .header { margin-bottom: 15px; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                ${logoHtml}
                <h1>${data.company.name}</h1>
                <h2>${title}</h2>
                <p>Período: ${financialFilters.start ? formatDate(financialFilters.start) : 'Início'} até ${financialFilters.end ? formatDate(financialFilters.end) : 'Hoje'}</p>
                <p>Data de emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Emissão</th>
                        <th>Vencimento</th>
                        <th>Baixa</th>
                        <th>Nº Doc / Tipo</th>
                        <th>Empresa/Parceiro</th>
                        <th>Descrição</th>
                        <th>Valor</th>
                        <th>Status</th>
                        <th>Responsável/Baixa</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
            <div class="summary">
                Total: ${safeFormatCurrency(list.reduce((acc, i) => acc + (parseFloat(i.value) || 0), 0))}
            </div>
            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                        setTimeout(function() {
                            window.close();
                        }, 500);
                    }, 500);
                }
            </script>
        </body>
        </html>
      `);
      printWindow.document.close();
  };

  const handleSaveOrder = (type) => {
    if (!formData.partnerId || orderItems.length === 0) return showNotification('Preencha os dados.', 'error');
    const partner = data[type === 'sales' ? 'clients' : 'suppliers'].find(p => p.id === parseInt(formData.partnerId));
    const totalValue = orderItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
    const allDelivered = orderItems.every(i => i.delivered >= i.quantity);
    const someDelivered = orderItems.some(i => i.delivered > 0);
    const finalStatus = formData.generalStatus === 'Cancelado' ? 'Cancelado' : (allDelivered ? 'Entregue' : (someDelivered ? 'Parcialmente' : 'Aberto'));
    const orderId = editingOrderId || (data[type].length > 0 ? Math.max(...data[type].map(o=>o.id || 0))+1 : 1);
      
    const orderPayload = {
      id: orderId,
      partnerName: partner?.name || 'Desconhecido', 
      partnerId: partner?.id,
      customerOrderNumber: formData.customerOrderNumber || 'N/A', 
      issueDate: formData.issueDate || new Date().toISOString().split('T')[0],
      generalStatus: finalStatus, 
      total: totalValue, 
      items: orderItems
    };
      
    let newList = [...data[type]];
    if (editingOrderId) {
        const idx = newList.findIndex(o => o.id === editingOrderId);
        if(idx > -1) {
            const oldOrder = newList[idx];
            let detailsParts = [];
            if (oldOrder.generalStatus !== finalStatus) detailsParts.push(`Status: ${oldOrder.generalStatus} -> ${finalStatus}`);
            if (oldOrder.total !== totalValue) detailsParts.push(`Total: ${safeFormatCurrency(oldOrder.total)} -> ${safeFormatCurrency(totalValue)}`);
            const itemDiff = detectOrderChanges(oldOrder.items, orderItems);
            if(itemDiff !== "Nenhuma alteração nos itens.") detailsParts.push(`Itens: [ ${itemDiff} ]`);

            const finalLog = detailsParts.length > 0 ? detailsParts.join(' | ') : "Salvou sem alterações.";
            newList[idx] = orderPayload;
            logAction(LOG_TYPES.UPDATE, `Editou Pedido #${orderId}. ${finalLog}`, type === 'sales' ? 'vendas' : 'compras');
        }
    } else {
        newList.push(orderPayload);
        const itemNames = orderItems.map(i => `${i.quantity}x ${i.name}`).join(', ');
        logAction(LOG_TYPES.CREATE, `Criou Pedido #${orderId} p/ ${partner?.name}. Valor: ${safeFormatCurrency(totalValue)}. Itens: [ ${itemNames} ]`, type === 'sales' ? 'vendas' : 'compras');
    }
      
    let newProducts = [...data.products];
    if (!editingOrderId) {
       orderItems.forEach(item => {
           const pIdx = newProducts.findIndex(p => p.id === item.id);
           if (pIdx > -1) newProducts[pIdx].stock = type === 'sales' ? (newProducts[pIdx].stock || 0) - item.quantity : (newProducts[pIdx].stock || 0) + item.quantity;
       });
    }
    updateCompanyData(type, newList);
    updateCompanyData('products', newProducts);
    setEditingOrderId(null); 
    setOrderItems([]); 
    setFormData({});
    setActiveTab(type === 'sales' ? 'sales_list' : 'purchases_list');
    showNotification(`Pedido salvo: ${finalStatus}.`);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const allUsers = COMPANIES.flatMap(comp => allCompaniesData[comp.cnpj]?.users || []);
    const userFound = allUsers.find(u => u.user === loginForm.user && u.pass === loginForm.pass);
      
    if (userFound) {
      setCurrentUser(userFound);
      const firstCnpj = COMPANIES[0].cnpj;
      
      const loginLog = { 
        id: Date.now(), 
        timestamp: new Date().toISOString(), 
        user: userFound.user, 
        role: userFound.role, 
        action: LOG_TYPES.LOGIN, 
        details: 'Usuário realizou login com sucesso.', 
        module: 'login'
      };
      
      setAllCompaniesData(prev => {
          const logs = prev[firstCnpj]?.logs || [];
          return { ...prev, [firstCnpj]: { ...prev[firstCnpj], logs: [loginLog, ...logs].slice(0,1000) } };
      });

      if(COMPANIES.length === 1) handleSelectCompany(COMPANIES[0].cnpj);
      else setIsCompanySelectionOpen(true);
    } else {
      // Log de tentativa de login falha
      const failedLoginLog = { 
        id: Date.now(), 
        timestamp: new Date().toISOString(), 
        user: loginForm.user, 
        role: 'N/A', 
        action: LOG_TYPES.SYSTEM, 
        details: 'Tentativa de login falha - usuário/senha incorretos.', 
        module: 'login'
      };
      
      setAllCompaniesData(prev => {
          const firstCnpj = COMPANIES[0].cnpj;
          const logs = prev[firstCnpj]?.logs || [];
          return { ...prev, [firstCnpj]: { ...prev[firstCnpj], logs: [failedLoginLog, ...logs].slice(0,1000) } };
      });
      
      showNotification('Usuário ou senha inválidos', 'error');
    }
  };
    
  const handleSelectCompany = (cnpj) => {
      setCurrentCompanyCNPJ(cnpj);
      if(currentUser) {
        logAction(LOG_TYPES.SYSTEM, `Acessou empresa: ${COMPANIES.find(c=>c.cnpj===cnpj)?.name}`, 'sistema');
      }
      setActiveTab('dashboard');
      setIsCompanySelectionOpen(false);
  }

  const handleLogout = () => { 
      if(currentUser) {
        logAction(LOG_TYPES.LOGOUT, 'Usuário realizou logout.', 'login');
      }
      setCurrentUser(null); 
      setCurrentCompanyCNPJ(null); 
      setLoginForm({ user: '', pass: '' }); 
  };
    
  const handleUpdateCompanyInfo = (field, val) => { 
      setAllCompaniesData(prev => ({ 
        ...prev, 
        [currentCompanyCNPJ]: { 
          ...prev[currentCompanyCNPJ], 
          company: { ...prev[currentCompanyCNPJ].company, [field]: val } 
        } 
      }));
  };
    
  const handleUnlockMonth = () => {
      const currentMonthKey = new Date().toISOString().slice(0, 7);
      handleUpdateCompanyInfo('lastUnlockedMonth', currentMonthKey);
      logAction(LOG_TYPES.UPDATE, `Liberou acesso ao mês ${currentMonthKey}`, 'sistema');
      showNotification(`Sistema liberado para ${currentMonthKey}!`);
  };
    
  const handleAddUser = () => {
      if (!newUser.name || !newUser.user || !newUser.pass) return showNotification('Preencha todos os campos', 'error');
      
      // Define módulos padrão baseados no role se não foram especificados
      const defaultModules = {
        'admin': AVAILABLE_MODULES.map(m => m.id),
        'gerente': ['dashboard', 'clients', 'suppliers', 'products', 'sales', 'purchases', 'history_items', 'delivery_report', 'financial_payable', 'financial_receivable', 'cashier', 'inventory_report', 'audit_report', 'sales_history', 'purchases_history'],
        'vendedor': ['dashboard', 'clients', 'products', 'sales', 'history_items', 'delivery_report', 'sales_history'],
        'almoxarifado': ['dashboard', 'suppliers', 'products', 'purchases', 'delivery_report', 'inventory_report', 'purchases_history'],
        'financeiro': ['dashboard', 'clients', 'suppliers', 'financial_payable', 'financial_receivable', 'cashier', 'audit_report'],
        'user': ['dashboard', 'clients', 'products', 'sales', 'history_items', 'sales_history']
      };
      
      const nextId = data.users.length > 0 ? Math.max(...data.users.map(u => u.id)) + 1 : 1;
      const userData = {
        ...newUser, 
        id: nextId,
        modules: newUser.modules && newUser.modules.length > 0 ? newUser.modules : defaultModules[newUser.role] || []
      };
      
      const newList = [...data.users, userData];
      updateCompanyData('users', newList);
      logAction(LOG_TYPES.CREATE, `Criou novo usuário: ${newUser.user} (Permissão: ${newUser.role})`, 'configurações');
      setNewUser({ name: '', user: '', pass: '', role: 'user', modules: [] });
      showNotification('Usuário criado com módulos configurados!');
  };
    
  const handleDeleteUser = (id) => {
      if (id === currentUser.id) return showNotification('Não pode excluir a si mesmo.', 'error');
      
      setConfirmModal({
          open: true,
          title: 'Excluir Usuário',
          msg: 'Tem a certeza que deseja excluir este usuário?',
          onConfirm: () => {
              const userToDelete = data.users.find(u => u.id === id);
              const newList = data.users.filter(u => u.id !== id);
              updateCompanyData('users', newList);
              logAction(LOG_TYPES.DELETE, `Excluiu usuário: ${userToDelete?.user}`, 'configurações');
              showNotification('Usuário removido.');
          }
      });
  };
    
  const handleChangeAdminPass = () => {
      if (!passChangeForm.current || !passChangeForm.new || !passChangeForm.confirm) return showNotification('Preencha tudo.', 'error');
      if (passChangeForm.current !== currentUser.pass) return showNotification('Senha atual errada.', 'error');
      if (passChangeForm.new !== passChangeForm.confirm) return showNotification('Confirmação não bate.', 'error');
      const updatedUsers = data.users.map(u => u.id === currentUser.id ? { ...u, pass: passChangeForm.new } : u);
      updateCompanyData('users', updatedUsers);
      logAction(LOG_TYPES.UPDATE, 'Alterou a própria senha administrativa', 'configurações');
      setCurrentUser(prev => ({...prev, pass: passChangeForm.new}));
      setPassChangeForm({ current: '', new: '', confirm: '' });
      showNotification('Senha alterada com sucesso!');
  };
    
  const handleEditEntity = (item, type) => { 
    setFormData(item || {}); 
    setCurrentEditItem(type); 
    setIsModalOpen(true); 
  };
    
  const handlePrintOrder = (order, type) => {
    logAction(LOG_TYPES.PRINT, `Imprimiu pedido #${order.id}`, type === 'sales' ? 'vendas' : 'compras');
    
    const isSale = type === 'sales';
    const title = isSale ? 'PEDIDO DE VENDA' : 'PEDIDO DE COMPRA';
    const items = order.items || [];
    const printWindow = window.open('', '_blank');
    const logoHtml = data.company.logoUrl || DEFAULT_LOGO ? `<img src="${data.company.logoUrl || DEFAULT_LOGO}" style="height: 50px; margin-bottom: 10px;" onerror="this.style.display='none'"/>` : '';
    printWindow.document.write(`<html><head><title>Imprimir</title><style>body{font-family:sans-serif;padding:40px;color:#000}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#f3f4f6;text-align:left;padding:12px;border-bottom:2px solid #e5e7eb}td{padding:12px;border-bottom:1px solid #eee}.header{text-align:center;margin-bottom:40px;border-bottom:2px solid #333;padding-bottom:20px}.total{text-align:right;font-size:20px;font-weight:bold;margin-top:30px}img{height:50px;margin-bottom:10px}</style></head><body><div class="header">${logoHtml}<h1>${data.company.name}</h1><h2>${title} #${order.id}</h2></div><p><strong>${isSale?'Cliente':'Fornecedor'}:</strong> ${order.partnerName}</p><p><strong>Data:</strong> ${new Date(order.issueDate).toLocaleDateString()}</p><table><thead><tr><th>Produto</th><th>Qtd</th><th style="text-align:right">Total</th></tr></thead><tbody>${items.map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td style="text-align:right">R$ ${(i.quantity*i.unitPrice).toFixed(2)}</td></tr>`).join('')}</tbody></table><div class="total">Total: R$ ${order.total.toFixed(2)}</div><script>window.onload=function(){window.print();}</script></body></html>`);
    printWindow.document.close();
  };
    
  const handlePrintList = (title, listData, columns) => {
      logAction(LOG_TYPES.PRINT, `Imprimiu lista: ${title}`, 'sistema');
      
      const printWindow = window.open('', '_blank');
      const logoHtml = data.company.logoUrl || DEFAULT_LOGO ? `<img src="${data.company.logoUrl || DEFAULT_LOGO}" style="height: 50px; margin-bottom: 10px;" onerror="this.style.display='none'"/>` : '';
      const headers = columns.map(c => `<th>${c.head}</th>`).join('');
      const rows = listData.map(item => {
          return '<tr>' + columns.map(col => {
              let cellValue = '-';
              if (col.key && !col.format) cellValue = item[col.key];
              else if (col.format) cellValue = col.format(item[col.key]);
              else if (col.render) { if(col.head === 'Status') cellValue = item.generalStatus || item.status; else if(col.head === 'Estoque') cellValue = `${item.stock} ${item.unit || ''}`; else cellValue = item[col.key] || '-'; }
              return `<td>${cellValue}</td>`;
          }).join('') + '</tr>';
      }).join('');
      printWindow.document.write(`<html><head><title>Relatório - ${title}</title><style>body { font-family: sans-serif; padding: 20px; color: #000; } table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; } th { background: #f3f4f6; text-align: left; padding: 8px; border-bottom: 2px solid #000; font-weight: bold; } td { padding: 8px; border-bottom: 1px solid #ddd; } .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }</style></head><body><div class="header">${logoHtml}<h1>${data.company.name}</h1><h2>Relatório de ${title}</h2><p>Gerado em: ${new Date().toLocaleString()}</p></div><table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table><script>window.onload=function(){window.print();}</script></body></html>`);
      printWindow.document.close();
  };

  // --- FUNÇÕES PARA GERENCIAR MÓDULOS ---
  const openModuleSelector = (user, title = 'Selecionar Módulos') => {
    setModuleSelectorModal({
      open: true,
      user: user,
      title: title,
      onSave: (modules) => {
        handleSaveUserModules(user.id, modules);
      }
    });
  };

  const handleSaveUserModules = (userId, modules) => {
    const updatedUsers = data.users.map(u => 
      u.id === userId 
        ? { ...u, modules: modules }
        : u
    );
    
    updateCompanyData('users', updatedUsers);
    
    // Atualiza o usuário atual se for ele mesmo
    if (currentUser && currentUser.id === userId) {
      const updatedCurrentUser = updatedUsers.find(u => u.id === userId);
      setCurrentUser(updatedCurrentUser);
    }
    
    const userName = data.users.find(u => u.id === userId)?.name || 'Usuário';
    logAction(LOG_TYPES.UPDATE, `Atualizou módulos do usuário: ${userName}`, 'configurações');
    showNotification(`Módulos atualizados para ${userName}!`);
  };

  const loadDefaultModules = (role) => {
    const defaultModules = {
      'admin': AVAILABLE_MODULES.map(m => m.id),
      'gerente': ['dashboard', 'clients', 'suppliers', 'products', 'sales', 'purchases', 'history_items', 'delivery_report', 'financial_payable', 'financial_receivable', 'cashier', 'inventory_report', 'audit_report', 'sales_history', 'purchases_history'],
      'vendedor': ['dashboard', 'clients', 'products', 'sales', 'history_items', 'delivery_report', 'sales_history'],
      'almoxarifado': ['dashboard', 'suppliers', 'products', 'purchases', 'delivery_report', 'inventory_report', 'purchases_history'],
      'financeiro': ['dashboard', 'clients', 'suppliers', 'financial_payable', 'financial_receivable', 'cashier', 'audit_report'],
      'user': ['dashboard', 'clients', 'products', 'sales', 'history_items', 'sales_history']
    };
    
    setNewUser(prev => ({
      ...prev,
      modules: defaultModules[role] || []
    }));
    
    showNotification(`Módulos padrão do cargo "${role}" carregados!`);
  };

  const startNewOrder = (type) => { 
    setEditingOrderId(null); 
    setOrderItems([]); 
    setFormData({}); 
    setActiveTab(type === 'sales' ? 'sales_new' : 'purchases_new'); 
  };
  
  const startEditOrder = (order, type) => { 
    setEditingOrderId(order.id); 
    setFormData({ 
      partnerId: order.partnerId, 
      customerOrderNumber: order.customerOrderNumber, 
      issueDate: order.issueDate, 
      generalStatus: order.generalStatus 
    }); 
    setOrderItems([...order.items]); 
    setActiveTab(type === 'sales' ? 'sales_new' : 'purchases_new'); 
  };
  
  const addOrUpdateOrderItem = () => {
    const { tempProdId, tempQtd, tempDate, tempDeliveredQtd, tempSupplierId, tempClientId } = formData;
    const isSale = activeTab.includes('sales');
    if (!tempProdId || !tempQtd) return showNotification('Dados incompletos', 'error');
    const product = data.products?.find(p => p.id === parseInt(tempProdId));
    if (!product) return showNotification('Produto não encontrado', 'error');
    const supplier = isSale ? data.suppliers?.find(s => s.id === parseInt(tempSupplierId)) : null;
    const client = !isSale ? data.clients?.find(c => c.id === parseInt(tempClientId)) : null;
    const total = parseInt(tempQtd);
    const delivered = parseInt(tempDeliveredQtd) || 0;
    const itemStatus = delivered >= total ? 'Entregue' : (delivered > 0 ? 'Parcial' : 'Pendente');
    const newItem = { ...product, name: product.name || 'Item Sem Nome', quantity: total, delivered, deliveryDate: tempDate || new Date().toISOString().split('T')[0], itemStatus, unitPrice: isSale ? product.price : product.cost, cost: product.cost, supplierId: supplier?.id, supplierName: supplier?.name, clientId: client?.id, clientName: client?.name };
    setOrderItems([...orderItems, newItem]);
    setFormData({ ...formData, tempProdId: '', tempQtd: '', tempDeliveredQtd: 0, tempSupplierId: '', tempClientId: '' });
  };
  
  const editItemInCart = (index) => { 
    const item = orderItems[index]; 
    setFormData({ 
      ...formData, 
      tempProdId: item.id, 
      tempQtd: item.quantity, 
      tempDeliveredQtd: item.delivered, 
      tempDate: item.deliveryDate, 
      tempSupplierId: item.supplierId, 
      tempClientId: item.clientId 
    }); 
    const newItems = [...orderItems]; 
    newItems.splice(index, 1); 
    setOrderItems(newItems); 
  };
  
  const removeOrderItem = (index) => { 
    setOrderItems(orderItems.filter((_, i) => i !== index)); 
  };

  const handlePrintCashierReport = (filteredList) => {
    logAction(LOG_TYPES.PRINT, 'Imprimiu relatório do livro caixa', 'caixa');
    
    const printWindow = window.open('', '_blank');
    const logoHtml = data.company.logoUrl || DEFAULT_LOGO ? `<img src="${data.company.logoUrl || DEFAULT_LOGO}" style="height: 50px; margin-bottom: 10px;" onerror="this.style.display='none'"/>` : '';
    
    const rows = filteredList.sort((a,b) => new Date(b.date) - new Date(a.date)).map(item => {
        const supplier = data.suppliers?.find(s => s.id === parseInt(item.supplierId));
        const supplierName = supplier ? supplier.name : '-';
        
        return `
        <tr>
            <td>${formatDate(item.date)}</td>
            <td>${item.type === 'entry' ? 'ENTRADA' : 'SAÍDA'}</td>
            <td>${item.entryInvoice || '-'}</td>
            <td>${item.exitInvoice || '-'}</td>
            <td>${supplierName}</td>
        </tr>
        `;
    }).join('');

    printWindow.document.write(`
        <html>
        <head>
            <title>Relatório de Fechamento - Livro Caixa</title>
            <style>
                body { 
                    font-family: sans-serif; 
                    padding: 20px; 
                    color: #000; 
                    font-size: 12px;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-top: 20px; 
                }
                th { 
                    background: #f3f4f6; 
                    text-align: left; 
                    padding: 8px; 
                    border-bottom: 2px solid #000; 
                    font-weight: bold; 
                    font-size: 11px;
                }
                td { 
                    padding: 8px; 
                    border-bottom: 1px solid #ddd; 
                    font-size: 11px;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 30px; 
                    border-bottom: 2px solid #333; 
                    padding-bottom: 20px; 
                }
                .footer { 
                    margin-top: 30px; 
                    text-align: right; 
                    font-weight: bold; 
                    font-size: 12px;
                    padding-top: 20px;
                    border-top: 2px solid #333;
                }
                .title {
                    font-size: 16px;
                    font-weight: bold;
                    margin: 10px 0;
                }
                .period {
                    font-size: 12px;
                    color: #666;
                    margin-bottom: 20px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                ${logoHtml}
                <div class="title">${data.company.name}</div>
                <div>RELATÓRIO DE FECHAMENTO - LIVRO CAIXA</div>
                <div class="period">
                    Período: ${cashierFilters.start ? formatDate(cashierFilters.start) : 'Início'} 
                    até ${cashierFilters.end ? formatDate(cashierFilters.end) : 'Hoje'}
                </div>
                <div>Gerado em: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Tipo</th>
                        <th>N.F. Entrada</th>
                        <th>N.F. Saída</th>
                        <th>Fornecedor</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
            <div class="footer">
                Total de Lançamentos: ${filteredList.length}
            </div>
            <script>
                window.onload = function() {
                    window.print();
                }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
  };

  const handlePrintDeliveryReport = (items) => {
    logAction(LOG_TYPES.PRINT, 'Imprimiu relatório de entregas', 'vendas');
    
    const printWindow = window.open('', '_blank');
    const logoHtml = data.company.logoUrl || DEFAULT_LOGO ? `<img src="${data.company.logoUrl || DEFAULT_LOGO}" style="height: 50px; margin-bottom: 10px;" onerror="this.style.display='none'"/>` : '';
    const groupedData = items.reduce((acc, item) => { 
      const key = item.customerOrderNumber; 
      if (!acc[key]) acc[key] = { items: [], meta: { supplier: item.supplierName, orderId: item.orderId } }; 
      acc[key].items.push(item); 
      return acc; 
    }, {});
    
    const rows = Object.entries(groupedData).map(([orderNum, group]) => {
        const header = `<tr style="background:#e0e7ff; color:#1e40af;"><td colspan="6" style="padding:10px; font-weight:bold;">PEDIDO CLIENTE: ${orderNum} <span style="font-weight:normal; font-size:10px;">(Ref: #${group.meta.orderId} - ${group.meta.supplier})</span></td></tr>`;
        const itemsRows = group.items.sort((a,b) => new Date(a.deliveryDate) - new Date(b.deliveryDate)).map(item => `
          <tr>
            <td>${new Date(item.deliveryDate).toLocaleDateString()}</td>
            <td>${item.deliveryDate < new Date().toISOString().split('T')[0] ? 'ATRASADO' : 'No Prazo'}</td>
            <td>${item.supplierName}</td>
            <td>${item.supplierPhone || '-'}</td>
            <td>${item.name}</td>
            <td style="text-align:right;">${item.pendingQtd}</td>
          </tr>
        `).join('');
        return header + itemsRows;
    }).join('');
    
    printWindow.document.write(`
      <html>
      <head>
        <title>Relatório de Entregas</title>
        <style>
          body { font-family: sans-serif; padding: 20px; color: #000; } 
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; } 
          th { background: #f3f4f6; text-align: left; padding: 8px; border-bottom: 2px solid #000; font-weight: bold; } 
          td { padding: 8px; border-bottom: 1px solid #ddd; } 
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          ${logoHtml}
          <h1>${data.company.name}</h1>
          <h2>Relatório de Cobrança (Entregas Pendentes)</h2>
          <p>Gerado em: ${new Date().toLocaleString()}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Data Prevista</th>
              <th>Status</th>
              <th>Fornecedor</th>
              <th>Telefone</th>
              <th>Produto</th>
              <th style="text-align:right">Qtd Pendente</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <script>window.onload=function(){window.print();}</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // --- FUNÇÕES DE RENDERIZAÇÃO ---
  const renderOrderForm = (type) => {
    // Verifica acesso
    const requiredModule = type === 'sales' ? 'sales' : 'purchases';
    if (!checkModuleAccess(currentUser, requiredModule)) {
      return <AccessDenied moduleName={type === 'sales' ? 'Vendas' : 'Compras'} />;
    }

    const isSale = type === 'sales';
    const title = editingOrderId ? `Editando #${editingOrderId}` : (isSale ? 'Novo Pedido Venda' : 'Novo Pedido Compra');
    const partnerList = (isSale ? data.clients : data.suppliers) || [];

    const totalOrderValue = orderItems.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0);
    
    let totalCost = 0;
    let potentialRevenue = 0;

    if (isSale) {
        totalCost = orderItems.reduce((acc, i) => acc + (i.quantity * (i.cost || 0)), 0);
        potentialRevenue = totalOrderValue;
    } else {
        totalCost = totalOrderValue; 
        potentialRevenue = orderItems.reduce((acc, i) => acc + (i.quantity * (i.price || 0)), 0);
    }

    const profitValue = potentialRevenue - totalCost;
    const marginVal = totalCost > 0 ? (profitValue / totalCost) * 100 : 0;
    const marginColor = marginVal < 0 ? 'text-red-600 bg-red-50' : (marginVal < 20 ? 'text-yellow-600 bg-yellow-50' : 'text-emerald-600 bg-emerald-50');

    return (
      <div className="space-y-6 animate-fade-in pb-10">
        <div className="flex justify-between items-center border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              {editingOrderId && <Edit2 className="text-blue-600"/>} {title}
            </h2>
            <p className="text-sm text-gray-500">Gerencie os itens deste pedido.</p>
          </div>
          <div className="flex gap-2">
            {editingOrderId && (
              <Button onClick={() => handlePrintOrder(isSale ? data.sales.find(s => s.id === editingOrderId) : data.purchases.find(p => p.id === editingOrderId), type)} variant="secondary">
                <Printer size={18}/> Imprimir
              </Button>
            )}
            <Button onClick={() => setActiveTab(isSale ? 'sales_list' : 'purchases_list')} variant="secondary">
              Voltar
            </Button>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isSale ? 'Cliente' : 'Fornecedor'}
            </label>
            <select 
              className="w-full p-2 border rounded-md outline-none" 
              value={formData.partnerId || ''} 
              onChange={(e) => setFormData({...formData, partnerId: e.target.value})}
            >
              <option value="">Selecione...</option>
              {partnerList.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">N° Pedido Cliente</label>
            <input 
              type="text" 
              className="w-full p-2 border rounded-md outline-none" 
              placeholder="#123" 
              value={formData.customerOrderNumber || ''} 
              onChange={(e) => setFormData({...formData, customerOrderNumber: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status (Auto)</label>
            <select 
              className="w-full p-2 border rounded-md font-medium bg-gray-50" 
              value={formData.generalStatus || 'Aberto'} 
              onChange={(e) => setFormData({...formData, generalStatus: e.target.value})}
            >
              <option value="Aberto">Aberto (Auto)</option>
              <option value="Parcialmente">Parcial (Auto)</option>
              <option value="Entregue">Entregue (Auto)</option>
              <option value="Cancelado">Cancelado (Manual)</option>
            </select>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Package size={20}/> Itens
          </h3>
          
          <div className={`bg-slate-50 p-4 rounded-md border border-slate-200 mb-6 ${formData.tempProdId ? 'ring-2 ring-blue-100 bg-blue-50' : ''}`}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-1">
                <label className="block text-xs font-bold mb-1">ID</label>
                <input 
                  type="number" 
                  className="w-full p-2 border rounded text-center text-sm" 
                  placeholder="ID" 
                  value={formData.tempProdId || ''} 
                  onChange={(e) => setFormData({...formData, tempProdId: e.target.value})}
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-xs font-bold mb-1">PRODUTO</label>
                <select 
                  className="w-full p-2 border rounded text-sm" 
                  value={formData.tempProdId || ''} 
                  onChange={(e) => setFormData({...formData, tempProdId: e.target.value})}
                >
                  <option value="">Selecione...</option>
                  {(data.products || []).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.id} - {p.name ? p.name.substring(0,30) : 'Item'}...
                    </option>
                  ))}
                </select>
              </div>
              
              {isSale ? (
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold mb-1">ORIGEM</label>
                  <select 
                    className="w-full p-2 border rounded text-sm bg-blue-50" 
                    value={formData.tempSupplierId || ''} 
                    onChange={(e) => setFormData({...formData, tempSupplierId: e.target.value})}
                  >
                    <option value="">Selecione...</option>
                    {(data.suppliers || []).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold mb-1">DESTINO</label>
                  <select 
                    className="w-full p-2 border rounded text-sm bg-blue-50" 
                    value={formData.tempClientId || ''} 
                    onChange={(e) => setFormData({...formData, tempClientId: e.target.value})}
                  >
                    <option value="">Selecione...</option>
                    {(data.clients || []).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="md:col-span-1">
                <label className="block text-xs font-bold mb-1">QTD</label>
                <input 
                  type="number" 
                  className="w-full p-2 border rounded text-sm" 
                  value={formData.tempQtd ?? ''} 
                  onChange={(e) => setFormData({...formData, tempQtd: e.target.value})}
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs font-bold mb-1">ENTR.</label>
                <input 
                  type="number" 
                  className="w-full p-2 border rounded text-sm bg-yellow-50" 
                  value={formData.tempDeliveredQtd ?? ''} 
                  onChange={(e) => setFormData({...formData, tempDeliveredQtd: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold mb-1">DATA</label>
                <input 
                  type="date" 
                  className="w-full p-2 border rounded text-sm" 
                  value={formData.tempDate || ''} 
                  onChange={(e) => setFormData({...formData, tempDate: e.target.value})}
                />
              </div>
              <div className="md:col-span-12 flex justify-end mt-2">
                <Button onClick={addOrUpdateOrderItem} variant="primary">
                  {formData.tempProdId ? 'Salvar Item' : 'Adicionar'}
                </Button>
              </div>
            </div>
          </div>
          
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase border-b">
              <tr>
                <th className="p-3 text-left">Produto</th>
                {isSale ? <th className="p-3">Origem</th> : <th className="p-3">Destino</th>}
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Entrega</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {orderItems.map((item, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{item.name ? item.name.substring(0,40) : 'Item'}...</td>
                  {isSale ? (
                    <td className="p-3 text-xs text-gray-500">{item.supplierName}</td>
                  ) : (
                    <td className="p-3 text-xs text-gray-500">{item.clientName}</td>
                  )}
                  <td className="p-3 text-center">
                    <StatusBadge status={item.itemStatus}/>
                  </td>
                  <td className="p-3 text-center font-bold">{item.delivered} / {item.quantity}</td>
                  <td className="p-3 text-right text-green-700 font-medium">
                    R$ {(item.quantity*item.unitPrice).toFixed(2)}
                  </td>
                  <td className="p-3 text-center flex justify-center gap-4">
                    <button onClick={() => editItemInCart(idx)} className="text-blue-500 hover:text-blue-700">
                      <Edit2 size={16}/>
                    </button>
                    <button onClick={() => removeOrderItem(idx)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={16}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            
            <tfoot className="border-t border-gray-200 bg-gray-50">
              <tr>
                <td colSpan={isSale ? 5 : 4} className="p-4 text-right font-bold text-gray-600">
                  <div className="flex flex-col items-end gap-1">
                    <span>TOTAL:</span>
                    <span className="text-[10px] font-normal uppercase tracking-wider text-gray-400">
                      {isSale ? 'Lucro Real' : 'Lucro Projetado'}:
                    </span>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-bold text-xl text-blue-600">
                      R$ {totalOrderValue.toFixed(2)}
                    </span>
                    {orderItems.length > 0 && (
                      <span className={`text-xs font-bold px-2 py-1 rounded flex items-center gap-1 ${marginColor}`}>
                        {marginVal >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                        R$ {safeFormatCurrency(profitValue).replace('R$ ', '')} ({marginVal.toFixed(2)}%)
                      </span>
                    )}
                  </div>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
          
          <div className="mt-8 flex justify-end">
            <Button onClick={() => handleSaveOrder(type)} variant="success" size="lg">
              <Save size={20}/> Salvar Pedido
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => {
    // Dashboard sempre acessível para usuários logados
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const today = new Date();
    const getLocalTodayStr = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    const todayStr = getLocalTodayStr();
      
    const canViewFinancials = checkModuleAccess(currentUser, 'financial_payable') || checkModuleAccess(currentUser, 'financial_receivable');
    const lateDeliveriesCount = (data.purchases || []).flatMap(p => p.items).filter(i => i.delivered < i.quantity && i.deliveryDate < todayStr).length;
      
    const billsToPayToday = (data.financials || []).filter(f => f.type === 'payable' && f.dueDate <= todayStr && f.status === 'Pendente').length;
    const billsToReceiveToday = (data.financials || []).filter(f => f.type === 'receivable' && f.dueDate <= todayStr && f.status === 'Pendente').length;

    if (!canViewFinancials) {
        return (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-800">Visão Geral</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card title="Clientes Cadastrados" value={(data.clients || []).length} icon={Users} color="bg-blue-600" />
                <Card title="Produtos Cadastrados" value={(data.products || []).length} icon={Package} color="bg-purple-600" />
              </div>
              <div className={`p-4 rounded-lg border flex items-center justify-between ${lateDeliveriesCount > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${lateDeliveriesCount > 0 ? 'bg-red-200 text-red-700' : 'bg-green-200 text-green-700'}`}>
                    {lateDeliveriesCount > 0 ? <AlertTriangle size={20}/> : <CheckCircle size={20}/>}
                  </div>
                  <div>
                    <h3 className={`font-bold text-sm ${lateDeliveriesCount > 0 ? 'text-red-800' : 'text-green-800'}`}>
                      {lateDeliveriesCount > 0 ? 'Entregas Atrasadas' : 'Entregas em dia!'}
                    </h3>
                    <p className="text-xs text-gray-600">
                      {lateDeliveriesCount > 0 ? `${lateDeliveriesCount} itens atrasados.` : 'Tudo certo.'}
                    </p>
                  </div>
                </div>
                {lateDeliveriesCount > 0 && checkModuleAccess(currentUser, 'delivery_report') && (
                  <Button variant="danger" size="sm" onClick={() => setActiveTab('delivery_report')}>
                    Ver Relatório
                  </Button>
                )}
              </div>
            </div>
        );
    }

    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const salesTotal = (data.sales || []).filter(s => s.issueDate.startsWith(monthKey) && s.generalStatus !== 'Cancelado').reduce((acc, curr) => acc + curr.total, 0);
      const purchasesTotal = (data.purchases || []).filter(p => p.issueDate.startsWith(monthKey) && p.generalStatus !== 'Cancelado').reduce((acc, curr) => acc + curr.total, 0);
      chartData.push({ label: months[d.getMonth()], sales: salesTotal, purchases: purchasesTotal });
    }
    const maxVal = Math.max(...chartData.map(d => Math.max(d.sales, d.purchases)), 100);
    const currentMonthKey = today.toISOString().slice(0, 7);
    const currentMonthSales = (data.sales || []).filter(s => s.issueDate.startsWith(currentMonthKey) && s.generalStatus !== 'Cancelado');
    let netProfit = 0;
    currentMonthSales.forEach(sale => { sale.items.forEach(item => { const cost = item.cost || (data.products.find(p => p.id === item.id)?.cost) || 0; const revenue = item.unitPrice * item.quantity; const totalCost = cost * item.quantity; netProfit += (revenue - totalCost); }); });
    const validSales = (data.sales || []).filter(s => s.generalStatus !== 'Cancelado');
    const productStats = {};
    validSales.forEach(sale => { sale.items.forEach(item => { const name = item.name || 'Sem Nome'; if (!productStats[name]) productStats[name] = 0; productStats[name] += item.quantity; }); });
    const topProducts = Object.entries(productStats).map(([name, qtd]) => ({ name, qtd })).sort((a, b) => b.qtd - a.qtd).slice(0, 5);
    const clientStats = {};
    validSales.forEach(s => { const name = s.partnerName || 'Desconhecido'; clientStats[name] = (clientStats[name] || 0) + s.total; });
    const topClients = Object.entries(clientStats).map(([name, val]) => ({name, val})).sort((a,b) => b.val - a.val).slice(0, 5);
    const validPurchases = (data.purchases || []).filter(p => p.generalStatus !== 'Cancelado');
    const supplierStats = {};
    validPurchases.forEach(p => { const name = p.partnerName || 'Desconhecido'; supplierStats[name] = (supplierStats[name] || 0) + p.total; });
    const topSuppliers = Object.entries(supplierStats).map(([name, val]) => ({name, val})).sort((a,b) => b.val - a.val).slice(0, 5);

    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-800">Visão Geral</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card title="Clientes" value={(data.clients || []).length} icon={Users} color="bg-blue-600" />
          <Card title="Produtos" value={(data.products || []).length} icon={Package} color="bg-purple-600" />
          <Card title="Vendas (Mês)" value={`R$ ${chartData[chartData.length-1].sales.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} icon={DollarSign} color="bg-green-600" />
          <Card title="Compras (Mês)" value={`R$ ${chartData[chartData.length-1].purchases.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} icon={Truck} color="bg-orange-600" />
          <Card title="Lucro Líquido (Mês)" value={safeFormatCurrency(netProfit)} icon={Wallet} color="bg-emerald-600" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg border flex items-center justify-between ${lateDeliveriesCount > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${lateDeliveriesCount > 0 ? 'bg-red-200 text-red-700' : 'bg-green-200 text-green-700'}`}>
                {lateDeliveriesCount > 0 ? <AlertTriangle size={20}/> : <CheckCircle size={20}/>}
              </div>
              <div>
                <h3 className={`font-bold text-sm ${lateDeliveriesCount > 0 ? 'text-red-800' : 'text-green-800'}`}>
                  {lateDeliveriesCount > 0 ? 'Entregas Atrasadas' : 'Entregas em dia!'}
                </h3>
                <p className="text-xs text-gray-600">
                  {lateDeliveriesCount > 0 ? `${lateDeliveriesCount} itens atrasados.` : 'Tudo certo.'}
                </p>
              </div>
            </div>
            {lateDeliveriesCount > 0 && checkModuleAccess(currentUser, 'delivery_report') && (
              <Button variant="danger" size="sm" onClick={() => setActiveTab('delivery_report')}>
                Ver
              </Button>
            )}
          </div>

          <div className={`p-4 rounded-lg border flex items-center justify-between ${billsToPayToday > 0 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${billsToPayToday > 0 ? 'bg-orange-200 text-orange-700' : 'bg-gray-200 text-gray-600'}`}>
                <TrendingDown size={20}/>
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-800">A Pagar (Hoje/Atrasado)</h3>
                <p className={`text-xs ${billsToPayToday > 0 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                  {billsToPayToday} contas pendentes.
                </p>
              </div>
            </div>
            {billsToPayToday > 0 && checkModuleAccess(currentUser, 'financial_payable') && (
              <Button variant="secondary" size="sm" onClick={() => { setActiveTab('financial_manual'); setActiveFinancialTab('payable'); }}>
                Ver
              </Button>
            )}
          </div>

          <div className={`p-4 rounded-lg border flex items-center justify-between ${billsToReceiveToday > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${billsToReceiveToday > 0 ? 'bg-blue-200 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
                <TrendingUp size={20}/>
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-800">A Receber (Hoje/Atrasado)</h3>
                <p className={`text-xs ${billsToReceiveToday > 0 ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                  {billsToReceiveToday} recebimentos pendentes.
                </p>
              </div>
            </div>
            {billsToReceiveToday > 0 && checkModuleAccess(currentUser, 'financial_receivable') && (
              <Button variant="secondary" size="sm" onClick={() => { setActiveTab('financial_manual'); setActiveFinancialTab('receivable'); }}>
                Ver
              </Button>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-700 mb-6 flex items-center gap-2">
            <BarChart2 className="text-blue-600"/> Evolução Financeira (6 Meses)
          </h3>
          <div className="h-48 flex items-end justify-between gap-4 px-2">
            {chartData.map((d, idx) => (
              <div key={idx} className="flex flex-col items-center flex-1 gap-1">
                <div className="w-full flex items-end justify-center gap-1 h-full relative group">
                  <div 
                    className="w-1/2 bg-green-500 rounded-t relative hover:bg-green-600 transition-colors" 
                    style={{ height: `${(d.sales / maxVal) * 100}%`, minHeight: '4px' }} 
                    title={`Vendas: R$ ${d.sales}`}
                  ></div>
                  <div 
                    className="w-1/2 bg-orange-500 rounded-t relative hover:bg-orange-600 transition-colors" 
                    style={{ height: `${(d.purchases / maxVal) * 100}%`, minHeight: '4px' }} 
                    title={`Compras: R$ ${d.purchases}`}
                  ></div>
                </div>
                <span className="text-xs font-medium text-gray-500 mt-2">{d.label}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-4 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div> Vendas
            </span>
            <span className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-500 rounded"></div> Compras
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Package size={18} className="text-purple-600"/> Top 5 Produtos (Qtd)
            </h3>
            <ul className="space-y-3">
              {topProducts.length === 0 ? (
                <li className="text-gray-400 text-sm">Sem dados.</li>
              ) : topProducts.map((p, i) => (
                <li key={i} className="flex justify-between text-sm border-b border-gray-50 pb-1">
                  <span className="text-gray-600 truncate w-32" title={p.name}>{i+1}. {p.name}</span>
                  <span className="font-bold text-gray-800">{p.qtd} un</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Users size={18} className="text-blue-600"/> Top 5 Clientes ($)
            </h3>
            <ul className="space-y-3">
              {topClients.length === 0 ? (
                <li className="text-gray-400 text-sm">Sem dados.</li>
              ) : topClients.map((c, i) => (
                <li key={i} className="flex justify-between text-sm border-b border-gray-50 pb-1">
                  <span className="text-gray-600 truncate w-32" title={c.name}>{i+1}. {c.name}</span>
                  <span className="font-bold text-green-600">
                    R$ {c.val.toLocaleString('pt-BR', {maximumFractionDigits:0})}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Truck size={18} className="text-orange-600"/> Top 5 Fornecedores ($)
            </h3>
            <ul className="space-y-3">
              {topSuppliers.length === 0 ? (
                <li className="text-gray-400 text-sm">Sem dados.</li>
              ) : topSuppliers.map((f, i) => (
                <li key={i} className="flex justify-between text-sm border-b border-gray-50 pb-1">
                  <span className="text-gray-600 truncate w-32" title={f.name}>{i+1}. {f.name}</span>
                  <span className="font-bold text-orange-600">
                    R$ {f.val.toLocaleString('pt-BR', {maximumFractionDigits:0})}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const renderFinancialModule = () => {
    // Verifica se tem acesso a pelo menos um dos módulos financeiros
    const hasPayableAccess = checkModuleAccess(currentUser, 'financial_payable');
    const hasReceivableAccess = checkModuleAccess(currentUser, 'financial_receivable');
    
    if (!hasPayableAccess && !hasReceivableAccess) {
      return <AccessDenied moduleName="Financeiro" />;
    }

    // Se não tem acesso à aba ativa, muda para uma que tenha acesso
    if (activeFinancialTab === 'payable' && !hasPayableAccess && hasReceivableAccess) {
      setActiveFinancialTab('receivable');
      return null;
    } else if (activeFinancialTab === 'receivable' && !hasReceivableAccess && hasPayableAccess) {
      setActiveFinancialTab('payable');
      return null;
    }

    const rawList = (data.financials || []).filter(f => f.type === activeFinancialTab);
    
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const summary = rawList.reduce((acc, item) => {
        const val = parseFloat(item.value) || 0;
        if (item.status === 'Pendente') {
            if (item.dueDate < todayStr) acc.overdue += val;
            else if (item.dueDate === todayStr) acc.today += val;
            else acc.future += val;
        } else if (item.status === 'Pago' || item.status === 'Recebido') {
            acc.settled += val;
        }
        return acc;
    }, { overdue: 0, today: 0, future: 0, settled: 0 });

    const filteredList = rawList.filter(f => {
        if (financialViewMode === 'open' && f.status !== 'Pendente') return false;
        if (financialViewMode === 'settled' && f.status === 'Pendente') return false;

        if (!financialFilters.start && !financialFilters.end) return true;
        const dateToCheck = financialViewMode === 'settled' ? (f.settlementDate || f.dueDate) : f.dueDate;
        const start = financialFilters.start;
        const end = financialFilters.end;
        
        if (start && dateToCheck < start) return false;
        if (end && dateToCheck > end) return false;
        return true;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-2">
                <div className="flex items-center gap-2">
                    {activeFinancialTab === 'payable' ? 
                      <TrendingDown className="text-red-600" size={28}/> : 
                      <TrendingUp className="text-blue-600" size={28}/>
                    }
                    <h2 className="text-2xl font-bold text-gray-800">
                        {activeFinancialTab === 'payable' ? 'Contas a Pagar' : 'Contas a Receber'}
                    </h2>
                </div>
                
                <div className="bg-gray-200 p-1 rounded-lg flex gap-1">
                    <button 
                      onClick={() => setFinancialViewMode('open')}
                      className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${financialViewMode === 'open' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      <Clock size={16}/> Em Aberto
                    </button>
                    <button 
                      onClick={() => setFinancialViewMode('settled')}
                      className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all flex items-center gap-2 ${financialViewMode === 'settled' ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      <CheckCircle size={16}/> Baixadas
                    </button>
                </div>

                <div className="flex gap-2 items-center">
                    <Button 
                      size="sm" 
                      onClick={() => { 
                        setIsModalOpen(true); 
                        setCurrentEditItem('financials'); 
                        setFormData({ 
                          type: activeFinancialTab, 
                          status: 'Pendente', 
                          issueDate: new Date().toISOString().split('T')[0], 
                          installments: 1 
                        }); 
                      }}
                    >
                      <Plus size={16}/> Novo Lançamento
                    </Button>
                </div>
            </div>

            {financialViewMode === 'open' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card title="Vencidos (Atraso)" value={safeFormatCurrency(summary.overdue)} icon={AlertCircle} color="bg-red-600" />
                  <Card title="Vence Hoje" value={safeFormatCurrency(summary.today)} icon={Calendar} color="bg-yellow-500" />
                  <Card title="A Vencer (Futuro)" value={safeFormatCurrency(summary.future)} icon={Clock} color="bg-blue-500" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <Card title={`Total ${activeFinancialTab === 'payable' ? 'Pago' : 'Recebido'} (Geral)`} value={safeFormatCurrency(summary.settled)} icon={CheckCircle} color="bg-green-600" />
                </div>
            )}

            <div className="flex flex-col gap-4 mt-4">
                <div className="flex gap-2 items-center bg-white p-3 rounded-lg border shadow-sm flex-wrap justify-between">
                    <div className="flex gap-4 items-center">
                      <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-500 uppercase">
                            {financialViewMode === 'settled' ? 'Data Baixa De:' : 'Vencimento De:'}
                          </span>
                          <input 
                            type="date" 
                            className="p-1.5 border rounded text-sm" 
                            value={financialFilters.start} 
                            onChange={e=>setFinancialFilters({...financialFilters, start: e.target.value})} 
                          />
                      </div>
                      <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-500 uppercase">Até:</span>
                          <input 
                            type="date" 
                            className="p-1.5 border rounded text-sm" 
                            value={financialFilters.end} 
                            onChange={e=>setFinancialFilters({...financialFilters, end: e.target.value})} 
                          />
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        onClick={() => handlePrintFinancialReport(filteredList, `Relatório ${activeFinancialTab === 'payable' ? 'Contas a Pagar' : 'Contas a Receber'} (${financialViewMode === 'open' ? 'Em Aberto' : 'Baixadas'})`)}
                      >
                        <Printer size={16}/> Imprimir Lista
                      </Button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="p-3 text-gray-600">Doc</th>
                        <th className="p-3 text-gray-600">Empresa/Parceiro</th>
                        <th className="p-3 text-gray-600">Emissão</th>
                        <th className="p-3 text-gray-600">Vencimento</th>
                        <th className="p-3 text-gray-600">Baixa</th>
                        <th className="p-3 text-gray-600">Descrição</th>
                        <th className="p-3 text-gray-600">Valor</th>
                        <th className="p-3 text-gray-600 text-center">Status</th>
                        <th className="p-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredList.map((item) => {
                        const isPending = item.status === 'Pendente';
                        const isOverdue = isPending && item.dueDate < todayStr;
                        const isOnTime = isPending && item.dueDate >= todayStr;
                        
                        let dateClass = "text-gray-700";
                        if (isOverdue) dateClass = "text-red-600 font-bold bg-red-50 px-2 py-1 rounded w-fit";
                        else if (isOnTime) dateClass = "text-green-600 font-bold bg-green-50 px-2 py-1 rounded w-fit";

                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="p-3 text-xs font-bold text-gray-500">
                              {item.docNumber || item.docType || '-'}
                            </td>
                            <td className="p-3 text-gray-800 font-medium">
                              {item.partnerName || '-'}
                            </td>
                            <td className="p-3 text-gray-600">{formatDate(item.issueDate)}</td>
                            
                            <td className="p-3">
                              <div className={dateClass}>
                                {formatDate(item.dueDate)}
                              </div>
                            </td>
                            <td className="p-3 text-green-700 font-medium">
                              {formatDate(item.settlementDate)}
                            </td>
                            <td className="p-3 text-gray-600 truncate max-w-xs">
                              {item.description}
                            </td>
                            <td className="p-3 text-gray-800">
                              {safeFormatCurrency(item.value)}
                            </td>
                            <td className="p-3 text-center">
                              <StatusBadge status={item.status} />
                            </td>
                            <td className="p-3 text-right flex justify-end gap-2">
                              {item.status === 'Pendente' && (
                                <button 
                                  onClick={() => handleSettleFinancial(item.id)} 
                                  className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200" 
                                  title="Baixar (Pagar/Receber)"
                                >
                                  <Check size={16}/>
                                </button>
                              )}
                              <button 
                                onClick={() => handleEditEntity(item, 'financials')} 
                                className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200" 
                                title="Editar"
                              >
                                <Edit size={16}/>
                              </button>
                              <button 
                                onClick={() => handleDelete('financials', item.id)} 
                                className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200" 
                                title="Excluir"
                              >
                                <Trash2 size={16}/>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredList.length === 0 && (
                        <tr>
                          <td colSpan={9} className="p-6 text-center text-gray-400">
                            Nenhum registro encontrado nesta aba.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
            </div>
        </div>
    );
  };

  const renderCashierModule = () => {
    // Verifica acesso
    if (!checkModuleAccess(currentUser, 'cashier')) {
      return <AccessDenied moduleName="Livro Caixa" />;
    }

    const list = data.cashier || [];
    const filteredList = list.filter(item => {
        if (!cashierFilters.start && !cashierFilters.end) return true;
        return item.date >= cashierFilters.start && item.date <= cashierFilters.end;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Wallet className="text-blue-600" /> Livro Caixa (Cruzamento de Notas)
                </h2>
                <div className="flex gap-2">
                     <Button onClick={() => handlePrintCashierReport(filteredList)} variant="secondary">
                        <Printer size={18}/> Relatório de Fechamento
                     </Button>
                     <Button onClick={() => { setIsModalOpen(true); setCurrentEditItem('cashier'); setFormData({ date: new Date().toISOString().split('T')[0], type: 'entry' }); }}>
                        <Plus size={18}/> Novo Lançamento
                     </Button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-600">Período De:</span>
                    <input 
                      type="date" 
                      className="p-2 border rounded" 
                      value={cashierFilters.start} 
                      onChange={e => setCashierFilters({...cashierFilters, start: e.target.value})} 
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-600">Até:</span>
                    <input 
                      type="date" 
                      className="p-2 border rounded" 
                      value={cashierFilters.end} 
                      onChange={e => setCashierFilters({...cashierFilters, end: e.target.value})} 
                    />
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4 text-gray-600 font-semibold">Data</th>
                            <th className="p-4 text-gray-600 font-semibold">Tipo</th>
                            <th className="p-4 text-gray-600 font-semibold">N.F. Entrada</th>
                            <th className="p-4 text-gray-600 font-semibold">N.F. Saída</th>
                            <th className="p-4 text-gray-600 font-semibold">Fornecedor</th>
                            <th className="p-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredList.sort((a,b) => new Date(b.date) - new Date(a.date)).map(item => {
                            const supplier = data.suppliers?.find(s => s.id === parseInt(item.supplierId));
                            const supplierName = supplier ? supplier.name : '-';
                            
                            return (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="p-4 text-gray-700">{formatDate(item.date)}</td>
                                    <td className="p-4">
                                        <StatusBadge status={item.type} />
                                    </td>
                                    <td className="p-4 text-gray-700 font-medium">{item.entryInvoice || '-'}</td>
                                    <td className="p-4 text-gray-700 font-medium">{item.exitInvoice || '-'}</td>
                                    <td className="p-4 text-gray-700">{supplierName}</td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        <button 
                                          onClick={() => { setFormData(item); setCurrentEditItem('cashier'); setIsModalOpen(true); }} 
                                          className="text-blue-500 hover:text-blue-700 p-1"
                                        >
                                          <Edit size={16}/>
                                        </button>
                                        <button 
                                          onClick={() => handleDelete('cashier', item.id)} 
                                          className="text-red-500 hover:text-red-700 p-1"
                                        >
                                          <Trash2 size={16}/>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredList.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-gray-400">
                                Nenhum lançamento neste período.
                              </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
  };

  const renderInventoryReport = () => {
    // Verifica acesso
    if (!checkModuleAccess(currentUser, 'inventory_report')) {
      return <AccessDenied moduleName="Estoque Independente" />;
    }

    const stockItems = (data.inventoryItems || []).sort((a,b) => (a.name || '').localeCompare(b.name || ''));
    const totalStockValue = stockItems.reduce((acc, p) => acc + ((p.stock || 0) * (p.cost || 0)), 0);
    
    const handlePrintStock = () => {
        logAction(LOG_TYPES.PRINT, 'Imprimiu relatório de estoque', 'estoque');
        
        const printWindow = window.open('', '_blank');
        const logoHtml = data.company.logoUrl || DEFAULT_LOGO ? `<img src="${data.company.logoUrl || DEFAULT_LOGO}" style="height: 50px; margin-bottom: 10px;" onerror="this.style.display='none'"/>` : '';
        const rows = stockItems.map(p => `
          <tr>
            <td>${p.id}</td>
            <td>${p.name}</td>
            <td>${p.ncm || '-'}</td>
            <td>${p.lastEntryInvoice || '-'}</td>
            <td style="text-align:center">${p.stock} ${p.unit || 'UN'}</td>
            <td style="text-align:right">${safeFormatCurrency(p.cost || 0)}</td>
            <td style="text-align:right">${safeFormatCurrency((p.stock || 0) * (p.cost || 0))}</td>
          </tr>
        `).join('');
        
        printWindow.document.write(`
          <html>
          <head>
            <title>Relatório de Estoque (Físico/Fiscal)</title>
            <style>
              body { font-family: sans-serif; padding: 20px; color: #000; } 
              h1, h2 { margin: 0 0 10px 0; } 
              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; } 
              th { background: #f3f4f6; text-align: left; padding: 8px; border-bottom: 2px solid #000; font-weight: bold; } 
              td { padding: 8px; border-bottom: 1px solid #ddd; } 
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; } 
              .footer { margin-top: 30px; text-align: right; font-weight: bold; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="header">
              ${logoHtml}
              <h1>${data.company.name}</h1>
              <h2>Relatório de Estoque Físico & Valor (Independente)</h2>
              <p>Gerado em: ${new Date().toLocaleString()}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th style="width: 50px;">ID</th>
                  <th>Produto</th>
                  <th>NCM</th>
                  <th>NFe Entrada</th>
                  <th style="text-align:center">Qtd</th>
                  <th style="text-align:right">Custo Unit.</th>
                  <th style="text-align:right">Valor Total</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            <div class="footer">
              Valor Total em Estoque: ${safeFormatCurrency(totalStockValue)}
            </div>
            <script>window.onload=function(){window.print();}</script>
          </body>
          </html>
        `);
        printWindow.document.close();
    };

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList /> Relatório de Estoque (Controle Independente)
          </h2>
          <Button onClick={handlePrintStock} variant="secondary">
            <Printer size={18}/> Imprimir Relatório
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Card title="Itens no Relatório" value={stockItems.length} icon={Package} color="bg-blue-600" />
          <Card title="Valor Total" value={safeFormatCurrency(totalStockValue)} icon={DollarSign} color="bg-green-600" />
          <button 
            onClick={() => { setIsModalOpen(true); setCurrentEditItem('inventoryItems'); setFormData({}); }} 
            className="bg-white p-6 rounded-lg shadow-sm border-2 border-dashed border-blue-300 flex items-center justify-center gap-2 text-blue-600 font-bold hover:bg-blue-50 transition-colors"
          >
            <Plus size={24} /> Novo Item de Estoque
          </button>
        </div>
        
        <GenericList 
          title="Itens do Estoque (Independente)" 
          data={stockItems} 
          columns={[
            { head: 'ID', key: 'id' }, 
            { head: 'Produto', key: 'name' }, 
            { head: 'NCM', key: 'ncm' }, 
            { head: 'NFe Entrada', key: 'lastEntryInvoice' }, 
            { head: 'Estoque', render: (p) => <span className="font-bold">{p.stock} {p.unit}</span> }, 
            { head: 'Custo', key: 'cost', format: safeFormatCurrency }, 
            { head: 'Total', render: (p) => <span className="text-green-700 font-bold">{safeFormatCurrency((p.stock||0)*(p.cost||0))}</span> }
          ]} 
          onEdit={(item) => handleEditEntity(item, 'inventoryItems')} 
          onDelete={(id) => handleDelete('inventoryItems', id)} 
          currentUser={currentUser}
          moduleId="inventory_report"
        />
      </div>
    );
  };

  // COMPONENTE SIMPLIFICADO PARA LOGS
  const SimpleLogItem = ({ log }) => {
    const getActionColor = (action) => {
      switch(action) {
        case LOG_TYPES.CREATE: return 'bg-green-100 text-green-700';
        case LOG_TYPES.UPDATE: return 'bg-blue-100 text-blue-700';
        case LOG_TYPES.DELETE: return 'bg-red-100 text-red-700';
        case LOG_TYPES.LOGIN: return 'bg-purple-100 text-purple-700';
        case LOG_TYPES.LOGOUT: return 'bg-gray-100 text-gray-700';
        case LOG_TYPES.PRINT: return 'bg-indigo-100 text-indigo-700';
        default: return 'bg-gray-100 text-gray-700';
      }
    };

    return (
      <div className="p-4 border-b border-gray-100 hover:bg-gray-50">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${getActionColor(log.action)}`}>
                {log.action.toUpperCase()}
              </span>
              <span className="text-sm font-medium text-gray-700">{log.user}</span>
              <span className="text-xs text-gray-500">({log.role})</span>
            </div>
            <p className="text-gray-600 text-sm">{log.details}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              <span>{formatDateTime(log.timestamp)}</span>
              <span>•</span>
              <span>{log.module}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAuditReport = () => {
    // Verifica acesso
    if (!checkModuleAccess(currentUser, 'audit_report')) {
      return <AccessDenied moduleName="Logs do Sistema" />;
    }

    const logs = data.logs || [];
    const filteredLogs = logSearch ? logs.filter(log => 
      log.user?.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.details?.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.action?.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.module?.toLowerCase().includes(logSearch.toLowerCase())
    ) : logs;
    
    const handlePrintLogs = () => {
      logAction(LOG_TYPES.PRINT, 'Imprimiu relatório de logs', 'logs');
      
      const printWindow = window.open('', '_blank');
      const logoHtml = data.company.logoUrl || DEFAULT_LOGO ? `<img src="${data.company.logoUrl || DEFAULT_LOGO}" style="height: 50px; margin-bottom: 10px;" onerror="this.style.display='none'"/>` : '';
      const rows = filteredLogs.map(l => `
        <tr>
          <td>${formatDateTime(l.timestamp)}</td>
          <td>${l.user} (${l.role})</td>
          <td>${l.action.toUpperCase()}</td>
          <td>${l.details}</td>
          <td>${l.module || 'sistema'}</td>
        </tr>
      `).join('');
      
      printWindow.document.write(`
        <html>
        <head>
          <title>Relatório de Logs do Sistema</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
            th { background: #f3f4f6; text-align: left; padding: 8px; border-bottom: 2px solid #000; font-weight: bold; }
            td { padding: 8px; border-bottom: 1px solid #ddd; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .footer { margin-top: 20px; text-align: right; font-weight: bold; font-size: 12px; padding-top: 10px; border-top: 2px solid #333; }
            .create { background: #d1fae5; }
            .update { background: #dbeafe; }
            .delete { background: #fee2e2; }
            .login { background: #ede9fe; }
            .logout { background: #f3f4f6; }
            .print { background: #e0e7ff; }
            .system { background: #f1f5f9; }
          </style>
        </head>
        <body>
          <div class="header">
            ${logoHtml}
            <h1>${data.company.name}</h1>
            <h2>Relatório de Logs do Sistema</h2>
            <p>Data de emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</p>
            <p>Total de registros: ${filteredLogs.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Usuário</th>
                <th>Ação</th>
                <th>Detalhes</th>
                <th>Módulo</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="footer">
            Sistema VControlPro - Relatório gerado automaticamente
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    };

    const stats = {
      total: filteredLogs.length,
      byAction: filteredLogs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {})
    };

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileSearch /> Logs do Sistema
          </h2>
          <div className="flex gap-2">
            <Button onClick={handlePrintLogs} variant="primary">
              <Printer size={18}/> Imprimir Relatório
            </Button>
          </div>
        </div>
        
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card title="Total de Logs" value={stats.total} icon={Database} color="bg-blue-600" />
          <Card title="Criações" value={stats.byAction.criar || 0} icon={Plus} color="bg-green-600" />
          <Card title="Alterações" value={stats.byAction.alterar || 0} icon={Edit} color="bg-yellow-500" />
          <Card title="Exclusões" value={stats.byAction.excluir || 0} icon={Trash2} color="bg-red-600" />
          <Card title="Impressões" value={stats.byAction.imprimir || 0} icon={Printer} color="bg-indigo-600" />
        </div>
        
        {/* Barra de busca */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 flex gap-4 items-center shadow-sm">
          <Search className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por usuário, ação ou detalhe..." 
            className="flex-1 outline-none bg-transparent text-gray-700 placeholder-gray-400" 
            value={logSearch} 
            onChange={e => setLogSearch(e.target.value)}
          />
          {logSearch && (
            <button onClick={() => setLogSearch('')} className="text-gray-400 hover:text-red-500">
              <X size={18} />
            </button>
          )}
          <span className="text-xs text-gray-500">
            {filteredLogs.length} de {logs.length} registros
          </span>
        </div>
        
        {/* Lista de Logs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                {logSearch ? 'Nenhum registro encontrado.' : 'Nenhum registro de log.'}
              </div>
            ) : filteredLogs.map(log => (
              <SimpleLogItem key={log.id} log={log} />
            ))}
          </div>
        </div>
      </div>
    );
  };
   
  const renderDeliveryReport = () => {
    // Verifica acesso
    if (!checkModuleAccess(currentUser, 'delivery_report')) {
      return <AccessDenied moduleName="Relatório de Entregas" />;
    }

    const allPendingItems = (data.purchases || []).flatMap(order => 
      order.items.filter(item => item.delivered < item.quantity).map(item => ({ 
        ...item, 
        orderId: order.id, 
        customerOrderNumber: order.customerOrderNumber || 'Sem Número', 
        supplierName: order.partnerName, 
        supplierPhone: (data.suppliers || []).find(s => s.name === order.partnerName)?.phone || 'N/A', 
        pendingQtd: item.quantity - item.delivered 
      }))
    );
    
    const filteredItems = allPendingItems.filter(item => (
      !deliverySearch || 
      (item.name?.toLowerCase() || '').includes(deliverySearch.toLowerCase()) || 
      (item.supplierName?.toLowerCase() || '').includes(deliverySearch.toLowerCase()) || 
      String(item.orderId).includes(deliverySearch) || 
      String(item.customerOrderNumber).toLowerCase().includes(deliverySearch.toLowerCase())
    ));
    
    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <CalendarClock className="text-blue-600"/> Relatório de Cobrança (Entregas)
        </h2>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex gap-4 items-center">
          <Search className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="flex-1 outline-none bg-transparent text-gray-700 placeholder-gray-400" 
            value={deliverySearch} 
            onChange={(e) => setDeliverySearch(e.target.value)}
          />
          <Button onClick={() => handlePrintDeliveryReport(filteredItems)} variant="secondary">
            <Printer size={18}/> Imprimir Relatório
          </Button>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-gray-600">Data Prevista</th>
                <th className="p-4 text-gray-600">Status</th>
                <th className="p-4 text-gray-600">Fornecedor</th>
                <th className="p-4 text-gray-600">Telefone</th>
                <th className="p-4 text-gray-600">Produto</th>
                <th className="p-4 text-right text-gray-600">Qtd Pend.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Object.entries(filteredItems.reduce((acc, item) => { 
                const key = item.customerOrderNumber; 
                if (!acc[key]) acc[key] = { items: [], meta: { supplier: item.supplierName, orderId: item.orderId } }; 
                acc[key].items.push(item); 
                return acc; 
              }, {})).map(([orderNum, group]) => (
                <React.Fragment key={orderNum}>
                  <tr className="bg-blue-50 border-b border-blue-100">
                    <td colSpan={6} className="p-3 text-blue-800 font-bold uppercase text-xs tracking-wider">
                      <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded mr-2">
                        PEDIDO CLIENTE: {orderNum}
                      </span>
                      <span className="text-gray-500 font-normal ml-2">
                        (Ref Interna: #{group.meta.orderId} - {group.meta.supplier})
                      </span>
                    </td>
                  </tr>
                  {group.items.sort((a,b) => new Date(a.deliveryDate) - new Date(b.deliveryDate)).map((item, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="p-4 text-gray-700">
                        {new Date(item.deliveryDate).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        {item.deliveryDate < new Date().toISOString().split('T')[0] ? (
                          <span className="text-red-600 font-bold">Atrasado</span>
                        ) : (
                          <span className="text-green-600 font-bold">No Prazo</span>
                        )}
                      </td>
                      <td className="p-4 text-gray-800">{item.supplierName}</td>
                      <td className="p-4 text-gray-500">{item.supplierPhone}</td>
                      <td className="p-4 text-gray-700">{item.name}</td>
                      <td className="p-4 text-right font-bold text-gray-800">{item.pendingQtd}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderConfig = () => {
    // Verifica acesso
    if (!checkModuleAccess(currentUser, 'config')) {
      return <AccessDenied moduleName="Configurações" />;
    }

    const currentCompanyInfo = COMPANIES.find(c => c.cnpj === currentCompanyCNPJ);
    if (!currentCompanyInfo) return <div className="text-red-500">Erro: Empresa não selecionada.</div>;
    
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-800">Configurações do Sistema</h2>
        
        {/* Seção de identidade visual */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="font-bold text-lg text-gray-700 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
            <ImageIcon size={20}/> Identidade Visual & Empresa
          </h3>
          <p className="text-sm text-blue-600 font-medium mb-4">
            Empresa Ativa: {currentCompanyInfo.name} (CNPJ: {currentCompanyInfo.cnpj})
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Nome da Empresa</label>
              <input 
                className="w-full p-2.5 bg-white border border-gray-300 rounded-md text-gray-800" 
                value={data.company.name} 
                onChange={e=>handleUpdateCompanyInfo('name', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">URL/Caminho do Logo</label>
              <input 
                className="w-full p-2.5 bg-white border border-gray-300 rounded-md text-gray-800" 
                value={data.company.logoUrl || ''} 
                onChange={e=>handleUpdateCompanyInfo('logoUrl', e.target.value)}
                placeholder="Ex: ./V.png"
              />
            </div>
          </div>
        </div>
        
        {/* Seção de gerenciamento de usuários */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="font-bold text-lg text-gray-700 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
            <Shield size={20} className="text-blue-600"/> Gerenciar Usuários e Módulos
          </h3>
          
          {currentUser.role === 'admin' && (
            <div className="bg-gray-50 p-4 rounded-md mb-6 border border-gray-200">
              <div className="text-sm font-bold text-gray-600 mb-2 uppercase">Adicionar Novo Usuário</div>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Nome</label>
                  <input 
                    type="text" 
                    className="w-full p-2 bg-white border border-gray-300 rounded text-sm text-gray-800" 
                    value={newUser.name} 
                    onChange={e => setNewUser({...newUser, name: e.target.value})} 
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-xs text-gray-500 mb-1">Login</label>
                  <input 
                    type="text" 
                    className="w-full p-2 bg-white border border-gray-300 rounded text-sm text-gray-800" 
                    value={newUser.user} 
                    onChange={e => setNewUser({...newUser, user: e.target.value})} 
                    placeholder="Ex: joao"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-xs text-gray-500 mb-1">Senha</label>
                  <input 
                    type="password" 
                    className="w-full p-2 bg-white border border-gray-300 rounded text-sm text-gray-800" 
                    value={newUser.pass} 
                    onChange={e => setNewUser({...newUser, pass: e.target.value})} 
                    placeholder="***"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-xs text-gray-500 mb-1">Permissão</label>
                  <select 
                    className="w-full p-2 bg-white border border-gray-300 rounded text-sm text-gray-800" 
                    value={newUser.role} 
                    onChange={e => setNewUser({...newUser, role: e.target.value})}
                  >
                    <option value="user">Vendedor</option>
                    <option value="gerente">Gerente</option>
                    <option value="almoxarifado">Almoxarifado</option>
                    <option value="financeiro">Financeiro</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="md:col-span-1">
                  <Button onClick={handleAddUser} className="w-full" variant="success">
                    <Plus size={16}/> Criar
                  </Button>
                </div>
              </div>
              
              {/* Seleção de módulos para novo usuário */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-500 mb-1">Módulos de Acesso</label>
                  <button 
                    type="button"
                    onClick={() => loadDefaultModules(newUser.role)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Usar padrão do cargo
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded">
                  {AVAILABLE_MODULES.map(module => {
                    const Icon = module.icon;
                    const isSelected = (newUser.modules || []).includes(module.id);
                    
                    return (
                      <div 
                        key={module.id}
                        onClick={() => {
                          setNewUser(prev => {
                            const currentModules = prev.modules || [];
                            const newModules = currentModules.includes(module.id)
                              ? currentModules.filter(id => id !== module.id)
                              : [...currentModules, module.id];
                            return { ...prev, modules: newModules };
                          });
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-1 cursor-pointer transition-colors ${isSelected ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'}`}
                      >
                        <Icon size={12}/>
                        {module.label}
                        {isSelected && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewUser(prev => ({
                                ...prev,
                                modules: (prev.modules || []).filter(id => id !== module.id)
                              }));
                            }}
                            className="ml-1 text-gray-500 hover:text-red-500"
                          >
                            <X size={10}/>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {newUser.modules && newUser.modules.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    {newUser.modules.length} módulo(s) selecionado(s)
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Lista de usuários */}
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-600">
                <th className="p-3">Nome</th>
                <th className="p-3">Login</th>
                <th className="p-3">Permissão</th>
                <th className="p-3">Módulos</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.users.map(u => {
                const moduleCount = u.modules ? u.modules.length : 0;
                
                return (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-800">{u.name}</td>
                    <td className="p-3 text-gray-600">{u.user}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {moduleCount > 0 ? (
                          <>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              {moduleCount} módulo(s)
                            </span>
                            <button 
                              onClick={() => openModuleSelector(u, `Módulos: ${u.name}`)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Ver/Editar
                            </button>
                            </>
                        ) : (
                          <span className="text-xs text-gray-400">Sem módulos específicos</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      {u.id !== currentUser.id && (
                        <button 
                          onClick={() => handleDeleteUser(u.id)} 
                          className="text-red-500 hover:text-red-600 p-2 rounded transition-colors"
                          title="Excluir usuário"
                        >
                          <Trash2 size={16}/>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Seção de alteração de senha */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="font-bold text-lg text-gray-700 mb-4 border-b border-gray-200 pb-2 flex items-center gap-2">
            <Key size={20}/> Alterar Senha de Administrador
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-1">
              <label className="block text-xs text-gray-500 mb-1">Senha Atual</label>
              <input 
                className="w-full p-2.5 bg-white border border-gray-300 rounded-md text-gray-800" 
                type="password" 
                value={passChangeForm.current} 
                onChange={e=>setPassChangeForm({...passChangeForm, current:e.target.value})}
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs text-gray-500 mb-1">Nova Senha</label>
              <input 
                className="w-full p-2.5 bg-white border border-gray-300 rounded-md text-gray-800" 
                type="password" 
                value={passChangeForm.new} 
                onChange={e=>setPassChangeForm({...passChangeForm, new:e.target.value})}
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs text-gray-500 mb-1">Confirmar Nova</label>
              <input 
                className="w-full p-2.5 bg-white border border-gray-300 rounded-md text-gray-800" 
                type="password" 
                value={passChangeForm.confirm} 
                onChange={e=>setPassChangeForm({...passChangeForm, confirm:e.target.value})}
              />
            </div>
            <div className="md:col-span-1">
              <Button onClick={handleChangeAdminPass} className="w-full" variant="primary">
                Alterar Senha
              </Button>
            </div>
          </div>
        </div>
        
        {/* Seção de controle mensal */}
        <div className="bg-orange-50 p-6 rounded-lg shadow-sm border border-orange-200">
          <h3 className="font-bold text-lg text-orange-800 mb-4 border-b border-orange-200 pb-2 flex items-center gap-2">
            <Lock size={20}/> Controle Mensal (Dia 5)
          </h3>
          <p className="text-sm text-orange-700 mb-4">
            Status Atual: {isMonthlyLocked ? 
              <span className="text-red-600 font-bold uppercase">Bloqueado</span> : 
              <span className="text-green-600 font-bold uppercase">Liberado</span>
            }
          </p>
          <div className="flex gap-4">
            <Button onClick={handleUnlockMonth} variant="primary" className="bg-orange-600 hover:bg-orange-700">
              <Unlock size={18}/> Liberar Acesso Mês Atual
            </Button>
          </div>
        </div>
        
        {/* Seção de logs e auditoria */}
        <div className="bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-700">
          <h3 className="font-bold text-lg text-slate-100 mb-4 border-b border-slate-600 pb-2 flex items-center gap-2">
            <Database size={20}/> Gerenciamento de Logs
          </h3>
          <p className="text-sm text-slate-300 mb-4">
            Sistema registra automaticamente todas as atividades dos usuários. Atualmente existem {data.logs?.length || 0} registros de log.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
              <h4 className="font-bold text-slate-100 mb-2 flex items-center gap-2">
                <Activity size={16}/> Estatísticas de Logs
              </h4>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• Logs totais: {data.logs?.length || 0}</li>
                <li>• Logs de login: {(data.logs?.filter(l => l.action === 'login').length || 0)}</li>
                <li>• Logs de criação: {(data.logs?.filter(l => l.action === 'criar').length || 0)}</li>
                <li>• Logs de alteração: {(data.logs?.filter(l => l.action === 'alterar').length || 0)}</li>
              </ul>
            </div>
            <div className="p-4 bg-slate-700 rounded-lg border border-slate-600">
              <h4 className="font-bold text-slate-100 mb-2 flex items-center gap-2">
                <ShieldCheck size={16}/> Segurança e Auditoria
              </h4>
              <p className="text-xs text-slate-300 mb-3">
                Todos os logs são armazenados localmente. Acesso restrito a administradores.
              </p>
              <Button 
                onClick={() => setActiveTab('audit_report')}
                variant="primary"
                className="bg-blue-600 hover:bg-blue-700 w-full"
              >
                <FileSearch size={16}/> Acessar Logs do Sistema
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderModalContent = () => {
      if (!formData) return null;
      const handleCurrencyBlur = (e, field) => { 
        const val = parseFloat(e.target.value); 
        if (!isNaN(val)) setFormData(prev => ({ ...prev, [field]: val.toFixed(2) })); 
      };
      
      if (currentEditItem === 'cashier') return (
        <div className="space-y-4 border-l-4 border-indigo-500 pl-4">
            <h4 className="text-sm font-bold text-indigo-600 uppercase mb-2">Lançamento de Caixa</h4>
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select 
                      className="w-full p-2 border rounded outline-none font-bold" 
                      value={formData.type} 
                      onChange={e => setFormData({...formData, type: e.target.value})}
                    >
                        <option value="entry">ENTRADA</option>
                        <option value="exit">SAÍDA</option>
                    </select>
                </div>
                <Input 
                  label="Data" 
                  type="date" 
                  value={formData.date} 
                  onChange={v => setFormData({...formData, date: v})} 
                />
            </div>
            <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
                <select 
                  className="w-full p-2 border rounded outline-none" 
                  value={formData.supplierId || ''} 
                  onChange={(e) => setFormData({...formData, supplierId: e.target.value})}
                >
                    <option value="">Selecione...</option>
                    {(data.suppliers || []).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
            </div>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-2 rounded border border-gray-200">
                <Input 
                  label="Nota de Entrada (Ref. Compra)" 
                  value={formData.entryInvoice} 
                  onChange={v => setFormData({...formData, entryInvoice: v})} 
                  placeholder="Ex: NF-123" 
                />
                <Input 
                  label="Nota de Saída (Ref. Venda)" 
                  value={formData.exitInvoice} 
                  onChange={v => setFormData({...formData, exitInvoice: v})} 
                  placeholder="Ex: NFCe-999" 
                />
            </div>
        </div>
      );
      
      if (currentEditItem === 'product') return (
        <div className="space-y-4">
          <Input 
            label="Nome do Produto" 
            type="textarea" 
            maxLength={1000} 
            value={formData.name || ''} 
            onChange={v=>setFormData({...formData, name: v})} 
            placeholder="Nome completo e descrição do produto..."
          /> 
          <Input 
            label="Descrição do Cliente" 
            type="textarea" 
            maxLength={1000} 
            value={formData.customerDescription || ''} 
            onChange={v=>setFormData({...formData, customerDescription: v})} 
            placeholder="Descrição como o cliente conhece o produto..."
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="N° Pedido Cliente (Ref)" 
              value={formData.staticOrderNumber || ''} 
              onChange={v=>setFormData({...formData, staticOrderNumber: v})} 
              placeholder="Ex: PO-1234"
            />
            <Input 
              label="Unidade" 
              value={formData.unit || ''} 
              onChange={v=>setFormData({...formData, unit: v})} 
              placeholder="UN, KG, CX..."
            />
            <Input 
              label="Preço Venda" 
              type="number" 
              value={formData.price || ''} 
              onChange={v=>setFormData({...formData, price: v})} 
              onBlur={(e) => handleCurrencyBlur(e, 'price')}
            />
            <Input 
              label="Custo" 
              type="number" 
              value={formData.cost || ''} 
              onChange={v=>setFormData({...formData, cost: v})} 
              onBlur={(e) => handleCurrencyBlur(e, 'cost')}
            />
            <Input 
              label="Estoque (Vendas)" 
              type="number" 
              value={formData.stock || ''} 
              onChange={v=>setFormData({...formData, stock: v})}
            />
            <Input 
              label="NCM (Opcional)" 
              value={formData.ncm || ''} 
              onChange={v=>{
                const formatted = formatNCM(v);
                setFormData({...formData, ncm: v});
              }}
              onBlur={(e) => {
                const formatted = formatNCM(e.target.value);
                setFormData({...formData, ncm: formatted});
              }}
              placeholder="0000.00.00"
            />
          </div>
        </div>
      );
      
      if (currentEditItem === 'inventoryItems') return (
        <div className="space-y-4 border-l-4 border-blue-500 pl-4">
          <h4 className="text-sm font-bold text-blue-600 uppercase mb-2">
            Novo Item de Estoque (Independente)
          </h4>
          <Input 
            label="Descrição do Item" 
            type="textarea" 
            value={formData.name || ''} 
            onChange={v=>setFormData({...formData, name: v})} 
            placeholder="Descrição completa..."
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="NCM" 
              value={formData.ncm || ''} 
              onChange={v=>{
                const formatted = formatNCM(v);
                setFormData({...formData, ncm: v});
              }}
              onBlur={(e) => {
                const formatted = formatNCM(e.target.value);
                setFormData({...formData, ncm: formatted});
              }}
              placeholder="0000.00.00"
            />
            <Input 
              label="NFe Entrada" 
              value={formData.lastEntryInvoice || ''} 
              onChange={v=>setFormData({...formData, lastEntryInvoice: v})} 
              placeholder="Nº Nota"
            />
            <Input 
              label="Quantidade" 
              type="number" 
              value={formData.stock || ''} 
              onChange={v=>setFormData({...formData, stock: v})}
            />
            <Input 
              label="Unidade" 
              value={formData.unit || ''} 
              onChange={v=>setFormData({...formData, unit: v})} 
              placeholder="UN"
            />
            <Input 
              label="Custo Unitário" 
              type="number" 
              value={formData.cost || ''} 
              onChange={v=>setFormData({...formData, cost: v})} 
              onBlur={(e) => handleCurrencyBlur(e, 'cost')}
            />
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-500 mb-1">Total Estimado</label>
              <div className="p-2 bg-gray-100 rounded text-gray-700 font-bold">
                {safeFormatCurrency((parseFloat(formData.stock || 0) * parseFloat(formData.cost || 0)))}
              </div>
            </div>
          </div>
        </div>
      );
      
      if (currentEditItem === 'financials') return (
        <div className="space-y-4 border-l-4 border-emerald-500 pl-4">
          <h4 className="text-sm font-bold text-emerald-600 uppercase mb-2">Lançamento Financeiro</h4>
          {!formData.id && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Layers size={18} className="text-emerald-600" />
                <span className="text-sm font-bold text-emerald-800 uppercase">Geração em Lote</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
                    Quantidade de Parcelas
                  </label>
                  <input 
                    type="number" 
                    min="1" 
                    max="60" 
                    className="w-full p-2 border border-emerald-300 rounded text-center font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 outline-none" 
                    value={formData.installments || 1} 
                    onChange={e => setFormData({...formData, installments: parseInt(e.target.value) || 1})} 
                  />
                  <span className="text-xs text-gray-400 mt-1 block">
                    Deixe "1" para lançamento único.
                  </span>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Empresa / {formData.type === 'payable' ? 'Fornecedor' : 'Cliente'}
              </label>
              <select 
                className="w-full p-2 border rounded-md outline-none" 
                value={formData.partnerId || ''} 
                onChange={(e) => setFormData({...formData, partnerId: e.target.value})}
              >
                <option value="">Selecione...</option>
                {(formData.type === 'payable' ? data.suppliers : data.clients || []).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Documento</label>
              <select 
                className="w-full p-2 border rounded-md outline-none" 
                value={formData.docType || ''} 
                onChange={(e) => setFormData({...formData, docType: e.target.value})}
              >
                <option value="">Selecione...</option>
                {DOC_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          
          <Input 
            label="Descrição / Histórico" 
            type="textarea" 
            value={formData.description || ''} 
            onChange={v=>setFormData({...formData, description: v})} 
            placeholder="Detalhes do pagamento/recebimento..."
          />
          
          <div className="grid grid-cols-3 gap-4">
            <Input 
              label="Valor da Parcela (R$)" 
              type="number" 
              value={formData.value || ''} 
              onChange={v=>setFormData({...formData, value: v})} 
              onBlur={(e) => handleCurrencyBlur(e, 'value')}
            />
            <Input 
              label="Nº Documento" 
              value={formData.docNumber || ''} 
              onChange={v=>setFormData({...formData, docNumber: v})} 
              placeholder="Ex: 12345/A"
            />
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                className="w-full p-2 border rounded-md outline-none" 
                value={formData.status || 'Pendente'} 
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                <option value="Pendente">Pendente</option>
                <option value={formData.type === 'payable' ? 'Pago' : 'Recebido'}>
                  {formData.type === 'payable' ? 'Pago' : 'Recebido'}
                </option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 bg-gray-50 p-3 rounded border">
            <Input 
              label="Data Emissão" 
              type="date" 
              value={formData.issueDate || ''} 
              onChange={v=>setFormData({...formData, issueDate: v})}
            />
            <Input 
              label="1º Vencimento" 
              type="date" 
              value={formData.dueDate || ''} 
              onChange={v=>setFormData({...formData, dueDate: v})}
            />
            <Input 
              label="Data da Baixa" 
              type="date" 
              value={formData.settlementDate || ''} 
              onChange={v=>setFormData({...formData, settlementDate: v})}
            />
          </div>
        </div>
      );
      
      return (
        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Nome/Razão" 
            value={formData.name || ''} 
            onChange={v=>setFormData({...formData, name: v})} 
            colSpan="col-span-2"
          />
          <Input 
            label="CNPJ / CPF" 
            value={formData.doc || ''} 
            onChange={v=>{
              const formatted = formatCNPJCPF(v);
              setFormData({...formData, doc: v});
            }}
            onBlur={(e) => {
              const formatted = formatCNPJCPF(e.target.value);
              setFormData({...formData, doc: formatted});
            }}
            placeholder="00.000.000/0000-00 ou 000.000.000-00"
          />
          <Input 
            label="Telefone" 
            value={formData.phone || ''} 
            onChange={v=>{
              const formatted = formatPhone(v);
              setFormData({...formData, phone: v});
            }}
            onBlur={(e) => {
              const formatted = formatPhone(e.target.value);
              setFormData({...formData, phone: formatted});
            }}
            placeholder="(11) 98765-4321"
          />
          <Input 
            label="Endereço" 
            value={formData.address || ''} 
            onChange={v=>setFormData({...formData, address: v})} 
            colSpan="col-span-2"
          />
          <Input 
            label="Cidade" 
            value={formData.city || ''} 
            onChange={v=>setFormData({...formData, city: v})}
          />
          <Input 
            label="CEP" 
            value={formData.zip || ''} 
            onChange={v=>setFormData({...formData, zip: v})}
          />
        </div>
      );
  }

  const renderInstallmentEditModal = () => {
      if (!isInstallmentEditOpen) return null;
      
      const totalValue = tempInstallments.reduce((acc, item) => acc + (parseFloat(item.value) || 0), 0);

      return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden border border-emerald-500 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-200 bg-emerald-50 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-emerald-800 text-lg flex items-center gap-2">
                            <Layers size={20}/> Confirmar Parcelas
                        </h3>
                        <p className="text-sm text-emerald-600">Edite as datas e valores antes de salvar.</p>
                    </div>
                    <button onClick={() => { setIsInstallmentEditOpen(false); setTempInstallments([]); }} className="text-gray-500 hover:text-red-500">
                      <X size={24}/>
                    </button>
                </div>
                
                <div className="p-0 overflow-y-auto flex-1">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100 sticky top-0 shadow-sm">
                            <tr>
                                <th className="p-3 text-gray-600 w-16 text-center">#</th>
                                <th className="p-3 text-gray-600">Descrição</th>
                                <th className="p-3 text-gray-600 w-40">Vencimento</th>
                                <th className="p-3 text-gray-600 w-32 text-right">Valor (R$)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {tempInstallments.map((inst, idx) => (
                                <tr key={idx} className="hover:bg-emerald-50/30">
                                    <td className="p-3 text-center font-bold text-gray-500">{idx + 1}</td>
                                    <td className="p-3 text-gray-700">{inst.description}</td>
                                    <td className="p-3">
                                        <input 
                                            type="date" 
                                            className="w-full p-1 border rounded text-sm focus:ring-1 focus:ring-emerald-500"
                                            value={inst.dueDate}
                                            onChange={(e) => updateTempInstallment(idx, 'dueDate', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-3 text-right">
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            className="w-full p-1 border rounded text-sm text-right font-medium focus:ring-1 focus:ring-emerald-500"
                                            value={inst.value}
                                            onChange={(e) => updateTempInstallment(idx, 'value', parseFloat(e.target.value))}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                    <div className="text-sm font-bold text-gray-600">
                        Total: <span className="text-emerald-700 text-lg ml-1">
                          {safeFormatCurrency(totalValue)}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => { setIsInstallmentEditOpen(false); setTempInstallments([]); }} variant="secondary">
                          Cancelar
                        </Button>
                        <Button onClick={handleConfirmInstallments} variant="success">
                          Confirmar Lançamento
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      );
  };

  const renderContent = () => {
    // Fallback de segurança
    if (!currentUser) return null;
    
    // Verifica se o usuário tem acesso à aba ativa
    const moduleAccessMap = {
      'dashboard': 'dashboard',
      'clients': 'clients',
      'suppliers': 'suppliers',
      'products': 'products',
      'sales_list': 'sales',
      'purchases_list': 'purchases',
      'sales_new': 'sales',
      'purchases_new': 'purchases',
      'history_items': 'history_items',
      'delivery_report': 'delivery_report',
      'financial_manual': activeFinancialTab === 'payable' ? 'financial_payable' : 'financial_receivable',
      'cashier': 'cashier',
      'inventory_report': 'inventory_report',
      'audit_report': 'audit_report',
      'sales_history': 'sales_history',
      'purchases_history': 'purchases_history',
      'config': 'config'
    };
    
    const requiredModule = moduleAccessMap[activeTab];
    
    // Se for uma página que requer módulo específico e o usuário não tem acesso
    if (requiredModule && !checkModuleAccess(currentUser, requiredModule)) {
      // Se for dashboard, sempre permite (é a página inicial)
      if (activeTab === 'dashboard') {
        return renderDashboard();
      }
      
      // Para outras páginas sem acesso, mostra mensagem
      const moduleName = AVAILABLE_MODULES.find(m => m.id === requiredModule)?.label || requiredModule;
      return <AccessDenied moduleName={moduleName} />;
    }

    switch(activeTab) {
      case 'dashboard': 
        return renderDashboard();
      
      case 'financial_manual': 
        return renderFinancialModule();
      
      case 'clients': 
        const clientCols = [
          { head: 'ID', key: 'id' }, 
          { head: 'Nome', key: 'name' }, 
          { head: 'CNPJ / CPF', render: (c) => formatCNPJCPF(c.doc) }, 
          { head: 'Fone', render: (c) => formatPhone(c.phone) }
        ];
        return (
          <GenericList 
            title="Clientes" 
            data={data.clients} 
            columns={clientCols} 
            onAdd={() => { setIsModalOpen(true); setCurrentEditItem('client'); setFormData({}); }} 
            onEdit={(item) => handleEditEntity(item, 'client')} 
            onDelete={(id) => handleDelete('clients', id)} 
            currentUser={currentUser} 
            onPrintList={() => handlePrintList('Clientes', data.clients, clientCols)}
            moduleId="clients"
          />
        );
      
      case 'suppliers': 
        const suppCols = [
          { head: 'ID', key: 'id' }, 
          { head: 'Nome', key: 'name' }, 
          { head: 'CNPJ / CPF', render: (s) => formatCNPJCPF(s.doc) }, 
          { head: 'Contato', key: 'contact' }
        ];
        return (
          <GenericList 
            title="Fornecedores" 
            data={data.suppliers} 
            columns={suppCols} 
            onAdd={() => { setIsModalOpen(true); setCurrentEditItem('supplier'); setFormData({}); }} 
            onEdit={(item) => handleEditEntity(item, 'supplier')} 
            onDelete={(id) => handleDelete('suppliers', id)} 
            currentUser={currentUser} 
            onPrintList={() => handlePrintList('Fornecedores', data.suppliers, suppCols)}
            moduleId="suppliers"
          />
        );
      
      case 'products': 
        const prodCols = [
          { head: 'ID', key: 'id' }, 
          { head: 'NOME / DESCRIÇÃO', render: (p) => (
            <div className="whitespace-normal min-w-[300px]">
              <span className="font-medium text-gray-900 block">{p.name}</span>
              {p.customerDescription && (
                <span className="text-xs text-gray-500 mt-1 block">
                  {p.customerDescription}
                </span>
              )}
            </div>
          )}, 
          { head: 'ESTOQUE', render: (p) => (
            <div className="font-bold text-gray-700">
              {p.stock} <span className="text-xs text-gray-500 ml-1">{p.unit || 'UN'}</span>
            </div>
          )}, 
          { head: 'CUSTO', key: 'cost', format: safeFormatCurrency }, 
          { head: 'VENDA', key: 'price', format: safeFormatCurrency }
        ];
        return (
          <GenericList 
            title="Produtos (Vendas)" 
            data={data.products} 
            columns={prodCols} 
            onAdd={() => { setIsModalOpen(true); setCurrentEditItem('product'); setFormData({}); }} 
            onEdit={(item) => handleEditEntity(item, 'product')} 
            onDelete={(id) => handleDelete('products', id)} 
            currentUser={currentUser}
            moduleId="products"
          />
        );
      
      case 'sales_list': 
        const salesCols = [
          { head: 'ID', key: 'id' }, 
          { head: 'Data', render: i => new Date(i.issueDate).toLocaleDateString() }, 
          { head: 'N° Ped. Cliente', key: 'customerOrderNumber' }, 
          { head: 'Cliente', key: 'partnerName' }, 
          { head: 'Status', render: i => <StatusBadge status={i.generalStatus}/> }, 
          { head: 'Total', key: 'total', format: v => safeFormatCurrency(v) },
          { head: 'Cancelar', render: i => (
            <button 
              onClick={() => handleCancelOrder(i.id, 'sales')} 
              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors flex items-center gap-1 text-xs font-bold" 
              title="Cancelar e Estornar"
            >
              <X size={14}/> Cancelar
            </button>
          )}
        ]; 
        return (
          <GenericList 
            title="Vendas (Ativas)" 
            data={data.sales.filter(s => s.generalStatus !== 'Entregue' && s.generalStatus !== 'Cancelado')} 
            columns={salesCols} 
            onAdd={() => startNewOrder('sales')} 
            onEdit={(item) => startEditOrder(item, 'sales')} 
            onDelete={(id) => handleDelete('sales', id)} 
            onPrint={(item) => handlePrintOrder(item, 'sales')} 
            currentUser={currentUser} 
            addLabel="Novo Pedido" 
            onPrintList={() => handlePrintList('Vendas Ativas', data.sales.filter(s => s.generalStatus !== 'Entregue' && s.generalStatus !== 'Cancelado'), salesCols)}
            moduleId="sales"
          />
        );
      
      case 'sales_history': 
        const salesHistCols = [
          { head: 'ID', key: 'id' }, 
          { head: 'Data', render: i => new Date(i.issueDate).toLocaleDateString() }, 
          { head: 'N° Ped. Cliente', key: 'customerOrderNumber' }, 
          { head: 'Cliente', key: 'partnerName' }, 
          { head: 'Status', render: i => <StatusBadge status={i.generalStatus}/> }, 
          { head: 'Total', key: 'total', format: v => safeFormatCurrency(v) }
        ]; 
        return (
          <GenericList 
            title="Vendas Finalizadas" 
            data={data.sales.filter(s => s.generalStatus === 'Entregue' || s.generalStatus === 'Cancelado')} 
            columns={salesHistCols} 
            onAdd={() => startNewOrder('sales')} 
            onEdit={currentUser?.role === 'admin' ? (item) => startEditOrder(item, 'sales') : undefined} 
            onDelete={(id) => handleDelete('sales', id)} 
            onPrint={(item) => handlePrintOrder(item, 'sales')} 
            currentUser={currentUser} 
            addLabel="Novo Pedido" 
            onPrintList={() => handlePrintList('Vendas Finalizadas', data.sales.filter(s => s.generalStatus === 'Entregue' || s.generalStatus === 'Cancelado'), salesHistCols)}
            moduleId="sales_history"
          />
        );
      
      case 'purchases_list': 
        const purchCols = [
          { head: 'ID', key: 'id' }, 
          { head: 'Data', render: i => new Date(i.issueDate).toLocaleDateString() }, 
          { head: 'N° Ped. Cliente', key: 'customerOrderNumber' }, 
          { head: 'Fornecedor', key: 'partnerName' }, 
          { head: 'Status', render: i => <StatusBadge status={i.generalStatus}/> }, 
          { head: 'Total', key: 'total', format: v => safeFormatCurrency(v) },
          { head: 'Cancelar', render: i => (
            <button 
              onClick={() => handleCancelOrder(i.id, 'purchases')} 
              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors flex items-center gap-1 text-xs font-bold" 
              title="Cancelar Compra"
            >
              <X size={14}/> Cancelar
            </button>
          )}
        ]; 
        return (
          <GenericList 
            title="Compras (Ativas)" 
            data={data.purchases.filter(p => p.generalStatus !== 'Entregue' && p.generalStatus !== 'Cancelado')} 
            columns={purchCols} 
            onAdd={() => startNewOrder('purchases')} 
            onEdit={(item) => startEditOrder(item, 'purchases')} 
            onDelete={(id) => handleDelete('purchases', id)} 
            onPrint={(item) => handlePrintOrder(item, 'purchases')} 
            currentUser={currentUser} 
            addLabel="Novo Pedido" 
            onPrintList={() => handlePrintList('Compras Ativas', data.purchases.filter(p => p.generalStatus !== 'Entregue' && p.generalStatus !== 'Cancelado'), purchCols)}
            moduleId="purchases"
          />
        );
      
      case 'purchases_history': 
        const purchHistCols = [
          { head: 'ID', key: 'id' }, 
          { head: 'Data', render: i => new Date(i.issueDate).toLocaleDateString() }, 
          { head: 'N° Ped. Cliente', key: 'customerOrderNumber' }, 
          { head: 'Fornecedor', key: 'partnerName' }, 
          { head: 'Status', render: i => <StatusBadge status={i.generalStatus}/> }, 
          { head: 'Total', key: 'total', format: v => safeFormatCurrency(v) }
        ]; 
        return (
          <GenericList 
            title="Compras Finalizadas" 
            data={data.purchases.filter(p => p.generalStatus === 'Entregue' || p.generalStatus === 'Cancelado')} 
            columns={purchHistCols} 
            onAdd={() => startNewOrder('purchases')} 
            onEdit={currentUser?.role === 'admin' ? (item) => startEditOrder(item, 'purchases') : undefined} 
            onDelete={(id) => handleDelete('purchases', id)} 
            onPrint={(item) => handlePrintOrder(item, 'purchases')} 
            currentUser={currentUser} 
            addLabel="Novo Pedido" 
            onPrintList={() => handlePrintList('Compras Finalizadas', data.purchases.filter(p => p.generalStatus === 'Entregue' || p.generalStatus === 'Cancelado'), purchHistCols)}
            moduleId="purchases_history"
          />
        );
      
      case 'sales_new': 
        return renderOrderForm('sales');
      
      case 'purchases_new': 
        return renderOrderForm('purchases');
      
      case 'history_items': 
        if (!checkModuleAccess(currentUser, 'history_items')) {
          return <AccessDenied moduleName="Histórico de Itens" />;
        }
        
        return (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <HistoryIcon /> Histórico Itens
            </h2>
            <div className="bg-white p-4 rounded-lg border border-gray-200 flex gap-4 items-center">
              <Search className="text-gray-400"/>
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="flex-1 outline-none bg-transparent text-gray-700 placeholder-gray-400" 
                value={historySearch} 
                onChange={e=>setHistorySearch(e.target.value)}
              />
            </div>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-4 text-gray-600">Venda</th>
                    <th className="p-4 text-gray-600">Data</th>
                    <th className="p-4 text-gray-600">N° Ped. Cliente</th>
                    <th className="p-4 text-gray-600">Cliente</th>
                    <th className="p-4 text-gray-600">Produto</th>
                    <th className="p-4 text-gray-600 text-center">NFe Entrada</th>
                    <th className="p-4 text-gray-600 text-right">Qtd</th>
                    <th className="p-4 text-gray-600 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(data.sales || [])
                    .flatMap(s => s.items.map(i => ({
                      ...i, 
                      saleId: s.id, 
                      date: s.issueDate, 
                      client: s.partnerName, 
                      customerOrderNumber: s.customerOrderNumber
                    })))
                    .filter(i => (
                      i.client?.toLowerCase().includes(historySearch.toLowerCase()) || 
                      i.name?.toLowerCase().includes(historySearch.toLowerCase())
                    ))
                    .map((i,idx) => {
                      const stockItem = data.inventoryItems.find(inv => inv.id === i.id);
                      const nfeEntrada = stockItem ? stockItem.lastEntryInvoice : '-';
                      
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-4 text-gray-500 font-mono">#{i.saleId}</td>
                          <td className="p-4 text-gray-700">{new Date(i.date).toLocaleDateString()}</td>
                          <td className="p-4 text-blue-700 font-medium">{i.customerOrderNumber || '-'}</td>
                          <td className="p-4 text-blue-600">{i.client}</td>
                          <td className="p-4 text-gray-700">{i.name}</td>
                          <td className="p-4 text-center text-xs font-bold text-slate-500 bg-slate-50 rounded border border-slate-100 mx-2 block w-fit self-center">
                            {nfeEntrada}
                          </td>
                          <td className="p-4 text-right text-gray-700">{i.quantity}</td>
                          <td className="p-4 text-right font-bold text-gray-800">
                            R$ {safeFormatCurrency(i.quantity*i.unitPrice)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      case 'delivery_report': 
        return renderDeliveryReport(); 
      
      case 'inventory_report': 
        return renderInventoryReport(); 
      
      case 'audit_report': 
        return renderAuditReport();
      
      case 'config': 
        return renderConfig();
      
      case 'cashier': 
        return renderCashierModule();
      
      default: 
        return renderDashboard();
    }
  };

  const CompanySelectionModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-10 rounded-lg shadow-2xl w-full max-w-lg text-center border border-gray-200">
        <img src={DEFAULT_LOGO} alt="Logo" className="h-64 mx-auto mb-6 object-contain" style={{ display: 'block' }}/>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Selecione a Empresa</h1>
        <p className="text-gray-600 mb-8">Você está logado como {currentUser?.name}.</p>
        <div className="space-y-4">
          {COMPANIES.map(company => (
            <div 
              key={company.cnpj} 
              onClick={() => handleSelectCompany(company.cnpj)} 
              className="p-4 bg-gray-50 border border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-500 transition-all text-left flex items-center justify-between"
            >
              <div>
                <p className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                  <Building size={20} className='text-blue-600'/> {company.name}
                </p>
                <p className="text-sm text-gray-500 mt-1">CNPJ: {company.cnpj}</p>
              </div>
              <Button size="sm" variant='primary'>Acessar</Button>
            </div>
          ))}
        </div>
        <button onClick={handleLogout} className="mt-8 text-gray-500 hover:text-red-600 flex items-center gap-2 mx-auto">
          <LogOut size={16} /> Sair
        </button>
      </div>
    </div>
  );

  // Função para renderizar navegação com verificação de módulos
  const renderNavigation = () => {
    // Agrupa módulos por categoria
    const modulesByCategory = {};
    AVAILABLE_MODULES.forEach(module => {
      if (!modulesByCategory[module.category]) {
        modulesByCategory[module.category] = [];
      }
      modulesByCategory[module.category].push(module);
    });
    
    // Verifica se há pelo menos um módulo visível em cada categoria
    const hasVisibleModulesInCategory = (category) => {
      return modulesByCategory[category]?.some(module => checkModuleAccess(currentUser, module.id));
    };

    return (
      <nav className="flex-1 py-6 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600">
        {/* Dashboard - sempre visível para usuários logados */}
        {checkModuleAccess(currentUser, 'dashboard') && (
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={LayoutDashboard} 
            label="Visão Geral" 
          />
        )}
        
        {/* Cadastros */}
        {hasVisibleModulesInCategory('cadastros') && (
          <>
            <SectionTitle>Cadastros</SectionTitle>
            {checkModuleAccess(currentUser, 'clients') && (
              <NavButton 
                active={activeTab === 'clients'} 
                onClick={() => setActiveTab('clients')} 
                icon={Users} 
                label="Clientes" 
              />
            )}
            {checkModuleAccess(currentUser, 'suppliers') && (
              <NavButton 
                active={activeTab === 'suppliers'} 
                onClick={() => setActiveTab('suppliers')} 
                icon={Truck} 
                label="Fornecedores" 
              />
            )}
            {checkModuleAccess(currentUser, 'products') && (
              <NavButton 
                active={activeTab === 'products'} 
                onClick={() => setActiveTab('products')} 
                icon={Package} 
                label="Produtos" 
              />
            )}
          </>
        )}
        
        {/* Movimentação */}
        {hasVisibleModulesInCategory('movimentacao') && (
          <>
            <SectionTitle>Movimentação</SectionTitle>
            {checkModuleAccess(currentUser, 'sales') && (
              <NavButton 
                active={activeTab.includes('sales_list')} 
                onClick={() => setActiveTab('sales_list')} 
                icon={ShoppingCart} 
                label="Vendas" 
              />
            )}
            {checkModuleAccess(currentUser, 'purchases') && (
              <NavButton 
                active={activeTab.includes('purchases_list')} 
                onClick={() => setActiveTab('purchases_list')} 
                icon={FileText} 
                label="Compras" 
              />
            )}
            {checkModuleAccess(currentUser, 'history_items') && (
              <NavButton 
                active={activeTab === 'history_items'} 
                onClick={() => setActiveTab('history_items')} 
                icon={HistoryIcon} 
                label="Histórico Itens" 
              />
            )}
            {checkModuleAccess(currentUser, 'delivery_report') && (
              <NavButton 
                active={activeTab === 'delivery_report'} 
                onClick={() => setActiveTab('delivery_report')} 
                icon={CalendarClock} 
                label="Relatório Entregas" 
              />
            )}
          </>
        )}
        
        {/* Financeiro */}
        {hasVisibleModulesInCategory('financeiro') && (
          <>
            <SectionTitle>Financeiro</SectionTitle>
            {checkModuleAccess(currentUser, 'financial_payable') && (
              <NavButton 
                active={activeTab === 'financial_manual' && activeFinancialTab === 'payable'} 
                onClick={() => { setActiveTab('financial_manual'); setActiveFinancialTab('payable'); }} 
                icon={TrendingDown} 
                label="Contas a Pagar" 
              />
            )}
            {checkModuleAccess(currentUser, 'financial_receivable') && (
              <NavButton 
                active={activeTab === 'financial_manual' && activeFinancialTab === 'receivable'} 
                onClick={() => { setActiveTab('financial_manual'); setActiveFinancialTab('receivable'); }} 
                icon={TrendingUp} 
                label="Contas a Receber" 
              />
            )}
          </>
        )}
        
        {/* Controle Interno */}
        {hasVisibleModulesInCategory('controle_interno') && (
          <>
            <SectionTitle>Controle Interno</SectionTitle>
            {checkModuleAccess(currentUser, 'cashier') && (
              <NavButton 
                active={activeTab === 'cashier'} 
                onClick={() => setActiveTab('cashier')} 
                icon={Wallet} 
                label="Livro Caixa" 
              />
            )}
          </>
        )}
        
        {/* Relatórios & Auditoria */}
        {hasVisibleModulesInCategory('relatorios') && (
          <>
            <SectionTitle>Relatórios & Auditoria</SectionTitle>
            {checkModuleAccess(currentUser, 'inventory_report') && (
              <NavButton 
                active={activeTab === 'inventory_report'} 
                onClick={() => setActiveTab('inventory_report')} 
                icon={ClipboardList} 
                label="Estoque (Independente)" 
              />
            )}
            {checkModuleAccess(currentUser, 'audit_report') && (
              <NavButton 
                active={activeTab === 'audit_report'} 
                onClick={() => setActiveTab('audit_report')} 
                icon={FileSearch} 
                label="Logs do Sistema" 
              />
            )}
          </>
        )}
        
        {/* Pedidos Concluídos */}
        {hasVisibleModulesInCategory('concluidos') && (
          <>
            <SectionTitle>Pedidos Concluídos</SectionTitle>
            {checkModuleAccess(currentUser, 'sales_history') && (
              <NavButton 
                active={activeTab === 'sales_history'} 
                onClick={() => setActiveTab('sales_history')} 
                icon={Archive} 
                label="Vendas Finalizadas" 
              />
            )}
            {checkModuleAccess(currentUser, 'purchases_history') && (
              <NavButton 
                active={activeTab === 'purchases_history'} 
                onClick={() => setActiveTab('purchases_history')} 
                icon={CheckSquare} 
                label="Compras Finalizadas" 
              />
            )}
          </>
        )}
        
        {/* Administração */}
        {hasVisibleModulesInCategory('administracao') && (
          <>
            <SectionTitle>Administração</SectionTitle>
            {checkModuleAccess(currentUser, 'config') && (
              <NavButton 
                active={activeTab === 'config'} 
                onClick={() => setActiveTab('config')} 
                icon={Settings} 
                label="Configurações" 
              />
            )}
          </>
        )}
      </nav>
    );
  };

  if (currentUser && !currentCompanyCNPJ) return <CompanySelectionModal />;
  
  if (currentUser && currentUser.role !== 'admin' && isMonthlyLocked) return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-lg shadow-2xl w-full max-w-md text-center border-t-4 border-orange-500">
        <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock size={40} className="text-orange-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Sistema Bloqueado</h1>
        <p className="text-gray-500 mb-8">
          Bloqueio automático (Dia 5).<br/>Contate o administrador.
        </p>
        <div className="flex justify-center">
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-500 hover:text-orange-600 underline">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </div>
    </div>
  );
  
  if (!currentUser) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-sm text-center border border-gray-200">
        <img src={DEFAULT_LOGO} alt="Logo" className="h-64 mx-auto mb-8 object-contain" style={{ display: 'block' }} onError={(e) => {e.target.onerror = null; e.target.style.display = 'none'}}/>
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="text" 
            className="w-full p-3 border rounded-lg placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none" 
            placeholder="Usuário" 
            value={loginForm.user} 
            onChange={e => setLoginForm({...loginForm, user: e.target.value})} 
          />
          <input 
            type="password" 
            className="w-full p-3 border rounded-lg placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none" 
            placeholder="Senha" 
            value={loginForm.pass} 
            onChange={e => setLoginForm({...loginForm, pass: e.target.value})} 
          />
          <Button className="w-full py-3" onClick={handleLogin}>
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );

  const currentCompany = COMPANIES.find(c => c.cnpj === currentCompanyCNPJ);
  const companyShortName = currentCompany ? currentCompany.shortName : 'N/A';

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-800">
      {isCompanySelectionOpen && <CompanySelectionModal />}
      
      {/* Modal de seleção de módulos */}
      <ModuleSelectorModal 
        isOpen={moduleSelectorModal.open}
        onClose={() => setModuleSelectorModal({ open: false, user: null, title: '', onSave: null })}
        user={moduleSelectorModal.user}
        onSave={moduleSelectorModal.onSave}
        title={moduleSelectorModal.title}
      />
      
      <aside className="w-64 bg-slate-800 border-r border-gray-700 text-white flex flex-col shadow-2xl z-10">
        <div className="p-6 border-b border-gray-700 flex flex-col items-center gap-4 bg-slate-900/50">
          <img src={data.company.logoUrl || DEFAULT_LOGO} alt="Logo" className="h-32 object-contain" style={{ display: 'block' }} onError={(e) => {e.target.onerror = null; e.target.style.display = 'none'}}/>
          <span className='text-sm text-gray-400 font-medium'>{companyShortName}</span>
        </div>
        
        {renderNavigation()}
        
        <div className="p-4 border-t border-gray-700 bg-slate-900/30">
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-white w-full transition-colors">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col overflow-hidden relative bg-gray-100">
        <header className="h-16 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-8 z-0">
          <div className="flex items-center gap-2 text-gray-500 font-medium">
            <Calendar size={16}/> {new Date().toLocaleDateString()}
            {isMonthlyLocked && currentUser.role === 'admin' && (
              <span className="ml-4 bg-orange-100 text-orange-600 border border-orange-200 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                <Lock size={12}/> BLOQUEIO ATIVO
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => setIsCompanySelectionOpen(true)} 
              variant='secondary' 
              size='sm' 
              className='text-blue-600 border border-blue-200 hover:bg-blue-50'
            >
              <SwitchCamera size={16} /> Trocar Empresa
            </Button>
            <div className="text-right">
              <div className="text-sm font-bold text-gray-800">{currentUser?.name}</div>
              <div className="text-xs text-gray-500 capitalize">
                {currentUser?.role} | {companyShortName}
              </div>
            </div>
            <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
              {currentUser?.name?.charAt(0)}
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-8">
          {renderContent()}
        </div>
      </main>
      
      {/* MODAL DE CONFIRMAÇÃO GENÉRICO */}
      {confirmModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70]">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-6 border border-gray-200 animate-fade-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-100 text-red-600 rounded-full">
                <AlertOctagon size={24} />
              </div>
              <h3 className="font-bold text-gray-800 text-lg">{confirmModal.title}</h3>
            </div>
            <p className="text-gray-600 mb-6 text-sm whitespace-pre-line leading-relaxed">
              {confirmModal.msg}
            </p>
            <div className="flex justify-end gap-3">
              <Button onClick={() => setConfirmModal({ ...confirmModal, open: false })} variant="secondary" className="bg-gray-100 hover:bg-gray-200 text-gray-700">
                Cancelar
              </Button>
              <Button onClick={() => { 
                if (confirmModal.onConfirm) confirmModal.onConfirm(); 
                setConfirmModal({ ...confirmModal, open: false }); 
              }} variant="danger" className="bg-red-600 hover:bg-red-700 text-white">
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PARCELAS */}
      {isInstallmentEditOpen && renderInstallmentEditModal()}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden p-6 border border-gray-200">
            <h3 className="font-bold text-gray-800 text-lg mb-4 uppercase border-b border-gray-200 pb-2">
              Editar / Novo Registro
            </h3>
            {renderModalContent()}
            <div className="mt-6 flex justify-end gap-2">
              <Button onClick={() => setIsModalOpen(false)} variant="secondary">
                Cancelar
              </Button>
              <Button onClick={() => handleSaveEntity(currentEditItem === 'client' ? 'clients' : currentEditItem === 'supplier' ? 'suppliers' : currentEditItem === 'inventoryItems' ? 'inventoryItems' : currentEditItem === 'financials' ? 'financials' : currentEditItem === 'cashier' ? 'cashier' : 'products')}>
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-md shadow-lg text-white z-50 flex items-center gap-2 ${notification.type === 'error' ? 'bg-red-600' : 'bg-green-600'} animate-bounce`}>
          {notification.msg}
        </div>
      )}
    </div>
  );
}
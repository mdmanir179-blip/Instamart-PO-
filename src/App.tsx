import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  getDocs
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, DEFAULT_ITEMS, DEFAULT_WAREHOUSES } from './lib/firebase';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { PurchaseOrder, DNRecord, ItemMaster, UserRole, POStatus } from './types';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { PoModal } from './components/PoModal';
import { DNModal } from './components/DNModal';
import { ItemMasterModal } from './components/ItemMasterModal';
import { UserManagementModal } from './components/UserManagementModal';
import { GrnModal } from './components/GrnModal';
import { PoDetailModal } from './components/PoDetailModal';
import { ExportBar } from './components/ExportBar';
import { OfflineSheetView } from './components/OfflineSheetView';
import { DashboardView } from './components/DashboardView';
import { ExpiryNotificationModal } from './components/ExpiryNotificationModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  FileText, 
  Database, 
  Plus, 
  Search, 
  Filter, 
  Layers, 
  Edit, 
  Trash2, 
  Eye, 
  Lock, 
  Unlock, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Building,
  Calendar,
  Box,
  FileCheck,
  UserCheck,
  Smartphone,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ClipboardList,
  FileSpreadsheet,
  LayoutDashboard
} from 'lucide-react';

type ActiveTab = 'dashboard' | 'all_pos' | 'in_transit' | 'grn' | 'dn_tracker' | 'offline_sheet' | 'catalog' | 'analytics';

const TODAY_DATE = new Date().toISOString().split('T')[0];

const INITIAL_DEMO_POS: PurchaseOrder[] = [
  {
    id: 'po-demo-01',
    poNumber: 'PO-INST-2026-9021',
    orderDate: TODAY_DATE,
    warehouseName: DEFAULT_WAREHOUSES[0],
    items: [
      { itemId: 'INST-SKU-1001', itemName: 'Amul Taaza Homogenised Toned Milk 1L', qty: 120, boxCount: 10, expiryDate: TODAY_DATE },
      { itemId: 'INST-SKU-1002', itemName: 'Aashirvaad Superior MP Shudh Chakki Atta 5kg', qty: 50, boxCount: 5 }
    ],
    totalQty: 170,
    invoiceNo: 'INV-WB-4401',
    shipDate: TODAY_DATE,
    appointmentId: 'APT-KOL-8912',
    appointmentDate: TODAY_DATE,
    expiryDate: TODAY_DATE,
    so: 'SO-IN-7712',
    status: 'New PO',
    noOfBoxes: 15,
    boxDimensions: '50 x 40 x 30 cm',
    logisticsPortal: 'Delhivery Logistics',
    pickupTrackingId: 'DEL-TRK-9921',
    puc: 'PUC-901',
    asn: 'ASN-KOL-01',
    clearBagNo: 'CBG-412',
    comment: 'Fresh batch dairy and grain delivery. Store at standard darkstore temperature.',
    pickupStatus: 'NO',
    hasDN: false,
    createdBy: 'admin-manir',
    createdByName: 'Md Manir (System Admin)',
    createdByEmpId: 'EMP-ADM-001',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'po-demo-today-2',
    poNumber: 'PO-INST-2026-9140',
    orderDate: TODAY_DATE,
    warehouseName: DEFAULT_WAREHOUSES[1],
    items: [
      { itemId: 'INST-SKU-1004', itemName: 'Tata Salt Vaccum Evaporated Iodised 1kg', qty: 180, boxCount: 12 },
      { itemId: 'INST-SKU-1007', itemName: 'Coca-Cola Zero Sugar Can 300ml', qty: 120, boxCount: 6 }
    ],
    totalQty: 300,
    invoiceNo: 'INV-WB-4415',
    shipDate: TODAY_DATE,
    appointmentId: 'APT-KOL-9011',
    appointmentDate: TODAY_DATE,
    so: 'SO-IN-7780',
    status: 'In Transit',
    noOfBoxes: 18,
    boxDimensions: '45 x 35 x 30 cm',
    logisticsPortal: 'Instamart Dedicated Fleet',
    pickupTrackingId: 'INST-FLT-4102',
    puc: 'PUC-915',
    asn: 'ASN-KOL-05',
    clearBagNo: 'CBG-430',
    comment: 'Afternoon rapid replenishment darkstore run.',
    pickupStatus: 'YES',
    hasDN: false,
    createdBy: 'admin-manir',
    createdByName: 'Md Manir (System Admin)',
    createdByEmpId: 'EMP-ADM-001',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'po-demo-yesterday',
    poNumber: 'PO-INST-2026-8955',
    orderDate: '2026-10-07',
    warehouseName: DEFAULT_WAREHOUSES[0],
    items: [
      { itemId: 'INST-SKU-1003', itemName: 'Fortune Sunlite Refined Sunflower Oil 1L Pouch', qty: 240, boxCount: 24 }
    ],
    totalQty: 240,
    invoiceNo: 'INV-WB-4399',
    shipDate: '2026-10-08',
    appointmentId: 'APT-KOL-8890',
    appointmentDate: '2026-10-08',
    so: 'SO-IN-7705',
    status: 'In Transit',
    noOfBoxes: 24,
    boxDimensions: '50 x 35 x 30 cm',
    logisticsPortal: 'Delhivery Logistics',
    pickupTrackingId: 'DEL-TRK-9870',
    puc: 'PUC-898',
    asn: 'ASN-KOL-03',
    clearBagNo: 'CBG-425',
    comment: 'Edible oils restock shipment dispatched to Kolkata Central darkstore.',
    pickupStatus: 'YES',
    hasDN: false,
    createdBy: 'emp-bo-102',
    createdByName: 'Rohit Sharma (Backoffice Lead)',
    createdByEmpId: 'EMP-BO-102',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'po-demo-02',
    poNumber: 'PO-INST-2026-8840',
    orderDate: '2026-10-06',
    warehouseName: DEFAULT_WAREHOUSES[1],
    items: [
      { itemId: 'INST-SKU-1005', itemName: 'Maggi 2-Minute Masala Instant Noodles 280g (Pack of 4)', qty: 300, boxCount: 15 },
      { itemId: 'INST-SKU-1006', itemName: 'Cadbury Dairy Milk Silk Chocolate Bar 60g', qty: 150, boxCount: 6 }
    ],
    totalQty: 450,
    invoiceNo: 'INV-WB-4392',
    shipDate: '2026-10-07',
    appointmentId: 'APT-KOL-8750',
    appointmentDate: '2026-10-07',
    so: 'SO-IN-7601',
    status: 'In Transit',
    noOfBoxes: 21,
    boxDimensions: '60 x 40 x 35 cm',
    logisticsPortal: 'Instamart Dedicated Fleet',
    pickupTrackingId: 'INST-FLT-3320',
    puc: 'PUC-882',
    asn: 'ASN-KOL-02',
    clearBagNo: 'CBG-418',
    comment: 'Pickup verified by driver Mohan. Dispatched to Rajarhat Newtown darkstore.',
    pickupStatus: 'YES',
    hasDN: false,
    createdBy: 'emp-bo-102',
    createdByName: 'Rohit Sharma (Backoffice Lead)',
    createdByEmpId: 'EMP-BO-102',
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'po-demo-03',
    poNumber: 'PO-INST-2026-7710',
    orderDate: '2026-10-05',
    warehouseName: DEFAULT_WAREHOUSES[2],
    items: [
      { itemId: 'INST-SKU-1003', itemName: 'Fortune Sunlite Refined Sunflower Oil 1L Pouch', qty: 200, boxCount: 20 }
    ],
    totalQty: 200,
    invoiceNo: 'INV-BLR-1102',
    shipDate: '2026-10-06',
    appointmentId: 'APT-BLR-5510',
    appointmentDate: '2026-10-06',
    so: 'SO-BLR-904',
    status: 'GRN Completed',
    noOfBoxes: 20,
    boxDimensions: '45 x 35 x 30 cm',
    logisticsPortal: 'BlueDart Express',
    pickupTrackingId: 'BLU-TRK-5541',
    puc: 'PUC-771',
    asn: 'ASN-BLR-09',
    clearBagNo: 'CBG-221',
    comment: 'Inward completed with GRN. Discrepancy logged for 2 damaged pouches.',
    pickupStatus: 'YES',
    hasDN: true,
    grnNumber: 'GRN-INST-77102',
    grnDate: '2026-10-07',
    createdBy: 'emp-bo-102',
    createdByName: 'Rohit Sharma (Backoffice Lead)',
    createdByEmpId: 'EMP-BO-102',
    createdAt: new Date(Date.now() - 3600000 * 60).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'po-demo-04',
    poNumber: 'PO-INST-2026-6990',
    orderDate: '2026-10-04',
    warehouseName: DEFAULT_WAREHOUSES[3],
    items: [
      { itemId: 'INST-SKU-1008', itemName: 'Lays India\'s Magic Masala Potato Chips 50g', qty: 400, boxCount: 20 }
    ],
    totalQty: 400,
    invoiceNo: 'INV-MUM-8812',
    shipDate: '2026-10-05',
    appointmentId: 'APT-MUM-3310',
    appointmentDate: '2026-10-05',
    so: 'SO-MUM-441',
    status: 'GRN Completed',
    noOfBoxes: 20,
    boxDimensions: '50 x 40 x 30 cm',
    logisticsPortal: 'BlueDart Express',
    pickupTrackingId: 'BLU-TRK-6612',
    puc: 'PUC-662',
    asn: 'ASN-MUM-11',
    clearBagNo: 'CBG-305',
    comment: 'Snack inventory inward verified at Andheri West darkstore.',
    pickupStatus: 'YES',
    hasDN: false,
    grnNumber: 'GRN-INST-69901',
    grnDate: '2026-10-06',
    createdBy: 'emp-bo-102',
    createdByName: 'Rohit Sharma (Backoffice Lead)',
    createdByEmpId: 'EMP-BO-102',
    createdAt: new Date(Date.now() - 3600000 * 84).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'po-demo-05',
    poNumber: 'PO-INST-2026-6420',
    orderDate: '2026-10-03',
    warehouseName: DEFAULT_WAREHOUSES[0],
    items: [
      { itemId: 'INST-SKU-1001', itemName: 'Amul Taaza Homogenised Toned Milk 1L', qty: 250, boxCount: 20 }
    ],
    totalQty: 250,
    invoiceNo: 'INV-WB-4288',
    shipDate: '2026-10-04',
    appointmentId: 'APT-KOL-8601',
    appointmentDate: '2026-10-04',
    so: 'SO-IN-7520',
    status: 'GRN Completed',
    noOfBoxes: 20,
    boxDimensions: '45 x 35 x 30 cm',
    logisticsPortal: 'Instamart Dedicated Fleet',
    pickupTrackingId: 'INST-FLT-2910',
    puc: 'PUC-840',
    asn: 'ASN-KOL-01',
    clearBagNo: 'CBG-395',
    comment: 'Morning milk delivery accepted and GRN closed.',
    pickupStatus: 'YES',
    hasDN: false,
    grnNumber: 'GRN-INST-64201',
    grnDate: '2026-10-04',
    createdBy: 'admin-manir',
    createdByName: 'Md Manir (System Admin)',
    createdByEmpId: 'EMP-ADM-001',
    createdAt: new Date(Date.now() - 3600000 * 108).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'po-demo-06',
    poNumber: 'PO-INST-2026-6101',
    orderDate: '2026-10-02',
    warehouseName: DEFAULT_WAREHOUSES[2],
    items: [
      { itemId: 'INST-SKU-1002', itemName: 'Aashirvaad Superior MP Shudh Chakki Atta 5kg', qty: 100, boxCount: 10 }
    ],
    totalQty: 100,
    invoiceNo: 'INV-BLR-0994',
    shipDate: '2026-10-03',
    appointmentId: 'APT-BLR-5110',
    appointmentDate: '2026-10-03',
    so: 'SO-BLR-810',
    status: 'GRN Completed',
    noOfBoxes: 10,
    boxDimensions: '50 x 40 x 30 cm',
    logisticsPortal: 'Delhivery Logistics',
    pickupTrackingId: 'DEL-TRK-8810',
    puc: 'PUC-710',
    asn: 'ASN-BLR-04',
    clearBagNo: 'CBG-190',
    comment: 'Pantry staples shipment complete.',
    pickupStatus: 'YES',
    hasDN: false,
    grnNumber: 'GRN-INST-61010',
    grnDate: '2026-10-03',
    createdBy: 'admin-manir',
    createdByName: 'Md Manir (System Admin)',
    createdByEmpId: 'EMP-ADM-001',
    createdAt: new Date(Date.now() - 3600000 * 132).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const INITIAL_DEMO_DNS: DNRecord[] = [
  {
    id: 'dn-demo-01',
    dnDate: TODAY_DATE,
    dnNumber: 'DN-INST-4402',
    facilityName: DEFAULT_WAREHOUSES[2],
    parentPoNumber: 'PO-INST-2026-7710',
    parentPoDate: '2026-10-05',
    parentSo: 'SO-BLR-904',
    skuId: 'INST-SKU-1003',
    itemName: 'Fortune Sunlite Refined Sunflower Oil 1L Pouch',
    dnQty: 2,
    whPocName: 'Sanjay WH Manager',
    whPocContact: '+91 98301 23456',
    lrNo: 'LR-BLR-9901',
    trackingNo: 'RET-DEL-2201',
    status: 'Accepted',
    acceptedAt: '2026-10-07T10:30:00.000Z',
    acceptedBy: 'Sanjay Das (EMP-WH-504)',
    createdBy: 'emp-wh-504',
    createdByName: 'Sanjay Das (Warehouse Manager)',
    createdByEmpId: 'EMP-WH-504',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

function MainApp() {
  const { 
    currentUser, 
    userProfile, 
    isAdmin, 
    isBackoffice, 
    isWarehouse, 
    isActive 
  } = useAuth();
  
  const { theme } = useTheme();

  // State: Default active tab is Dashboard!
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMobilePreview, setIsMobilePreview] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Data collections with LocalStorage persistence fallback (Starts clean without unwanted default demo data)
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    try {
      const saved = localStorage.getItem('instamart_pos');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Remove legacy demo records if any exist in storage
          return parsed.filter(p => !p.id || !String(p.id).startsWith('po-demo-'));
        }
      }
    } catch (e) {
      console.warn(e);
    }
    return [];
  });

  const [dnRecords, setDnRecords] = useState<DNRecord[]>(() => {
    try {
      const saved = localStorage.getItem('instamart_dns');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(d => !d.id || !String(d.id).startsWith('dn-demo-'));
        }
      }
    } catch (e) {
      console.warn(e);
    }
    return [];
  });

  const [itemsCatalog, setItemsCatalog] = useState<ItemMaster[]>(() => {
    try {
      const saved = localStorage.getItem('instamart_skus');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return DEFAULT_ITEMS.map((it, idx) => ({ id: `sku-${idx}`, ...it }));
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('instamart_pos', JSON.stringify(purchaseOrders));
    } catch (e) {
      console.warn(e);
    }
  }, [purchaseOrders]);

  useEffect(() => {
    try {
      localStorage.setItem('instamart_dns', JSON.stringify(dnRecords));
    } catch (e) {
      console.warn(e);
    }
  }, [dnRecords]);

  useEffect(() => {
    try {
      localStorage.setItem('instamart_skus', JSON.stringify(itemsCatalog));
    } catch (e) {
      console.warn(e);
    }
  }, [itemsCatalog]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [editingPo, setEditingPo] = useState<PurchaseOrder | null>(null);

  const [isDnModalOpen, setIsDnModalOpen] = useState(false);
  const [editingDn, setEditingDn] = useState<DNRecord | null>(null);

  const [isGrnModalOpen, setIsGrnModalOpen] = useState(false);
  const [grnTargetPo, setGrnTargetPo] = useState<PurchaseOrder | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailPo, setDetailPo] = useState<PurchaseOrder | null>(null);

  const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [isExpiryModalOpen, setIsExpiryModalOpen] = useState(false);

  // Expiry calculation for Header badge
  const expiringTodayCount = purchaseOrders.reduce((count, po) => {
    let hit = 0;
    if (po.expiryDate === TODAY_DATE || po.appointmentDate === TODAY_DATE) hit++;
    po.items?.forEach((it) => {
      if (it.expiryDate === TODAY_DATE) hit++;
    });
    return count + hit;
  }, 0);

  // 1. Subscribe to Items Catalog in real time
  useEffect(() => {
    try {
      const q = collection(db, 'items');
      const unsub = onSnapshot(q, (snapshot) => {
        const list: ItemMaster[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as ItemMaster);
        });
        if (list.length > 0) {
          setItemsCatalog(list);
        }
      }, (error) => {
        console.warn('Realtime catalog sync:', error.message);
      });
      return () => unsub();
    } catch (e) {
      console.warn('Offline mode for items');
    }
  }, []);

  // 2. Subscribe to Purchase Orders in real time (Immediate sync for Backoffice, Admin, Warehouse, Logistics, Print)
  useEffect(() => {
    try {
      const q = collection(db, 'purchase_orders');
      const unsub = onSnapshot(q, (snapshot) => {
        const list: PurchaseOrder[] = [];
        snapshot.forEach((d) => {
          if (!d.id.startsWith('po-demo-')) {
            list.push({ id: d.id, ...d.data() } as PurchaseOrder);
          }
        });
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setPurchaseOrders(list);
      }, (error) => {
        console.warn('Realtime PO sync:', error.message);
      });
      return () => unsub();
    } catch (e) {
      console.warn('Offline mode for purchase orders');
    }
  }, []);

  // 3. Subscribe to DN Records in real time
  useEffect(() => {
    try {
      const q = collection(db, 'dn_records');
      const unsub = onSnapshot(q, (snapshot) => {
        const list: DNRecord[] = [];
        snapshot.forEach((d) => {
          if (!d.id.startsWith('dn-demo-')) {
            list.push({ id: d.id, ...d.data() } as DNRecord);
          }
        });
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setDnRecords(list);
      }, (error) => {
        console.warn('Realtime DN sync:', error.message);
      });
      return () => unsub();
    } catch (e) {
      console.warn('Offline mode for DN records');
    }
  }, []);

  // PO handlers with immediate real-time cloud sync
  const handleSavePo = async (poData: Partial<PurchaseOrder>) => {
    const nowIso = new Date().toISOString();
    if (editingPo?.id) {
      const updated: PurchaseOrder = { 
        ...editingPo, 
        ...poData, 
        id: editingPo.id,
        updatedAt: nowIso,
        updatedBy: userProfile?.uid,
        updatedByName: userProfile?.displayName,
        updatedByEmpId: userProfile?.employeeId,
      };
      setPurchaseOrders(prev => prev.map(p => p.id === editingPo.id ? updated : p));
      try {
        await setDoc(doc(db, 'purchase_orders', editingPo.id), updated, { merge: true });
      } catch (e) {
        console.warn('Cloud update failed:', e);
      }
    } else {
      const newId = `po-${Date.now()}`;
      const newPo: PurchaseOrder = { 
        ...poData, 
        id: newId,
        createdAt: poData.createdAt || nowIso,
        updatedAt: nowIso,
        createdBy: userProfile?.uid || 'user-emp',
        createdByName: userProfile?.displayName || 'Instamart Employee',
        createdByEmpId: userProfile?.employeeId || 'EMP',
      } as PurchaseOrder;
      setPurchaseOrders(prev => [newPo, ...prev]);
      try {
        await setDoc(doc(db, 'purchase_orders', newId), newPo);
      } catch (e) {
        console.warn('Cloud create failed:', e);
      }
    }
  };

  const handleDeletePo = async (id: string, poNum: string) => {
    if (!isAdmin) {
      alert('Only Admins can delete Purchase Orders.');
      return;
    }
    if (confirm(`Are you sure you want to delete PO ${poNum}?`)) {
      setPurchaseOrders(prev => prev.filter(p => p.id !== id));
      try {
        await deleteDoc(doc(db, 'purchase_orders', id));
      } catch (e) {
        console.warn('Cloud delete failed:', e);
      }
    }
  };

  const handleLoadSamplePos = () => {
    const today = new Date();
    const generatedSample: PurchaseOrder[] = Array.from({ length: 6 }, (_, i) => {
      const dayDate = new Date(today);
      dayDate.setDate(dayDate.getDate() - (5 - i));
      const y = dayDate.getFullYear();
      const m = String(dayDate.getMonth() + 1).padStart(2, '0');
      const d = String(dayDate.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      const isPast = i < 4;
      return {
        id: `po-sample-${Date.now()}-${i}`,
        poNumber: `PO-INST-2026-${8800 + i * 15}`,
        orderDate: dateStr,
        warehouseName: DEFAULT_WAREHOUSES[i % DEFAULT_WAREHOUSES.length],
        items: [
          { itemId: 'INST-SKU-1001', itemName: 'Amul Taaza Homogenised Toned Milk 1L', qty: 100 + i * 20, boxCount: 10 + i },
          { itemId: 'INST-SKU-1002', itemName: 'Aashirvaad Superior MP Shudh Chakki Atta 5kg', qty: 50 + i * 10, boxCount: 5 + i },
        ],
        totalQty: 150 + i * 30,
        invoiceNo: `INV-WB-${4400 + i}`,
        shipDate: dateStr,
        appointmentId: `APT-KOL-${8900 + i}`,
        appointmentDate: dateStr,
        expiryDate: dateStr,
        so: `SO-IN-${7700 + i}`,
        status: (isPast ? (i % 2 === 0 ? 'GRN Completed' : 'In Transit') : 'New PO') as POStatus,
        noOfBoxes: 15 + i * 2,
        boxDimensions: '50 x 40 x 30 cm',
        logisticsPortal: i % 3 === 0 ? 'Delhivery Logistics' : i % 3 === 1 ? 'Instamart Dedicated Fleet' : 'BlueDart Express',
        pickupTrackingId: `TRK-${8800 + i}`,
        puc: `PUC-${900 + i}`,
        asn: `ASN-${i + 1}`,
        clearBagNo: `CBG-${400 + i}`,
        comment: `Operational shipment for ${dateStr}`,
        pickupStatus: (isPast ? 'YES' : 'NO') as 'YES' | 'NO',
        hasDN: false,
        createdBy: userProfile?.uid || 'user-admin',
        createdByName: userProfile?.displayName || 'System Admin',
        createdByEmpId: userProfile?.employeeId || 'EMP-001',
        createdAt: dayDate.toISOString(),
        updatedAt: new Date().toISOString(),
      };
    });
    setPurchaseOrders(generatedSample);
    localStorage.setItem('instamart_pos', JSON.stringify(generatedSample));
    // Immediately broadcast to Firestore so all connected team members get the update in real time
    generatedSample.forEach(po => {
      setDoc(doc(db, 'purchase_orders', po.id), po).catch(e => console.warn(e));
    });
  };

  // DN handlers with immediate real-time cloud sync
  const handleSaveDn = async (dnData: Partial<DNRecord>) => {
    const nowIso = new Date().toISOString();
    if (editingDn?.id) {
      const updated = { 
        ...editingDn, 
        ...dnData, 
        id: editingDn.id,
        updatedAt: nowIso,
      } as DNRecord;
      setDnRecords(prev => prev.map(d => d.id === editingDn.id ? updated : d));
      try {
        await setDoc(doc(db, 'dn_records', editingDn.id), updated, { merge: true });
      } catch (e) {
        console.warn('Cloud update failed:', e);
      }
    } else {
      const newId = `dn-${Date.now()}`;
      const newDn = { 
        ...dnData, 
        id: newId,
        createdAt: dnData.createdAt || nowIso,
        updatedAt: nowIso,
        createdByName: userProfile?.displayName || 'Instamart Employee',
        createdByEmpId: userProfile?.employeeId || 'EMP',
      } as DNRecord;
      setDnRecords(prev => [newDn, ...prev]);
      try {
        await setDoc(doc(db, 'dn_records', newId), newDn);
      } catch (e) {
        console.warn('Cloud create failed:', e);
      }
    }
  };

  const handleDeleteDn = async (id: string, dnNum: string) => {
    if (!isAdmin) {
      alert('Only Admins can delete DN records.');
      return;
    }
    if (confirm(`Delete Debit Note ${dnNum}?`)) {
      setDnRecords(prev => prev.filter(d => d.id !== id));
      try {
        await deleteDoc(doc(db, 'dn_records', id));
      } catch (e) {
        console.warn('Cloud delete failed:', e);
      }
    }
  };

  // Catalog item handlers with immediate cloud sync
  const handleSaveCatalogItem = async (itemData: Partial<ItemMaster>) => {
    if (itemData.id) {
      setItemsCatalog(prev => prev.map(it => it.id === itemData.id ? { ...it, ...itemData } as ItemMaster : it));
      try {
        await setDoc(doc(db, 'items', itemData.id), itemData, { merge: true });
      } catch (e) {
        console.warn('Cloud item update failed:', e);
      }
    } else {
      const newId = `sku-${Date.now()}`;
      const newItem = { ...itemData, id: newId } as ItemMaster;
      setItemsCatalog(prev => [newItem, ...prev]);
      try {
        await setDoc(doc(db, 'items', newId), newItem);
      } catch (e) {
        console.warn('Cloud item create failed:', e);
      }
    }
  };

  const handleDeleteCatalogItem = async (id: string) => {
    setItemsCatalog(prev => prev.filter(it => it.id !== id));
    try {
      await deleteDoc(doc(db, 'items', id));
    } catch (e) {
      console.warn('Cloud item delete failed:', e);
    }
  };

  // GRN Inward Confirmation (Warehouse team updates status immediately for Backoffice, Admin, Logistics)
  const handleConfirmGrn = async (
    poId: string, 
    grnData: { grnNumber: string; grnDate: string; hasDN: boolean; comment: string }
  ) => {
    const patch = {
      status: 'GRN Completed' as POStatus,
      grnNumber: grnData.grnNumber,
      grnDate: grnData.grnDate,
      hasDN: grnData.hasDN,
      comment: grnData.comment || '',
      updatedAt: new Date().toISOString(),
      updatedBy: userProfile?.uid,
      updatedByName: userProfile?.displayName,
      updatedByEmpId: userProfile?.employeeId,
    };

    setPurchaseOrders(prev => prev.map(p => p.id === poId ? { ...p, ...patch } : p));
    try {
      await setDoc(doc(db, 'purchase_orders', poId), patch, { merge: true });
    } catch (e) {
      console.warn('Cloud GRN update failed:', e);
    }
  };

  // Offline Sheet direct handlers (Immediate real-time cloud sync)
  const handleUpdatePoFromSheet = async (updatedPo: PurchaseOrder) => {
    const updated = { ...updatedPo, updatedAt: new Date().toISOString() };
    setPurchaseOrders(prev => prev.map(p => p.id === updated.id ? updated : p));
    try {
      await setDoc(doc(db, 'purchase_orders', updated.id), updated, { merge: true });
    } catch (e) {
      console.warn('Cloud sheet PO update failed:', e);
    }
  };

  const handleCreatePoFromSheet = async (newPo: Partial<PurchaseOrder>) => {
    await handleSavePo(newPo);
  };

  const handleUpdateDnFromSheet = async (updatedDn: DNRecord) => {
    const updated = { ...updatedDn, updatedAt: new Date().toISOString() };
    setDnRecords(prev => prev.map(d => d.id === updated.id ? updated : d));
    try {
      await setDoc(doc(db, 'dn_records', updated.id), updated, { merge: true });
    } catch (e) {
      console.warn('Cloud sheet DN update failed:', e);
    }
  };

  const handleCreateDnFromSheet = async (newDn: Partial<DNRecord>) => {
    await handleSaveDn(newDn);
  };

  // Open DN modal pre-filled for a specific PO
  const handleOpenDnForPo = (po: PurchaseOrder) => {
    setEditingDn({
      id: '',
      dnDate: TODAY_DATE,
      dnNumber: `DN-INST-${Math.floor(1000 + Math.random() * 9000)}`,
      facilityName: po.warehouseName,
      parentPoNumber: po.poNumber,
      parentPoDate: po.orderDate,
      parentSo: po.so,
      skuId: po.items?.[0]?.itemId || '',
      itemName: po.items?.[0]?.itemName || '',
      dnQty: 1,
      whPocName: userProfile?.displayName || '',
      whPocContact: '+91 98765 43210',
      lrNo: `LR-${Math.floor(10000 + Math.random() * 90000)}`,
      trackingNo: '',
      status: 'Pending',
      createdBy: userProfile?.uid || '',
      createdByName: userProfile?.displayName || '',
      createdByEmpId: userProfile?.employeeId || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsDnModalOpen(true);
  };

  // Filtered lists with resilient null-safety
  const filteredPOs = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return (purchaseOrders || []).filter((po) => {
      if (!po) return false;

      const matchWh = warehouseFilter === 'ALL' || po.warehouseName === warehouseFilter;
      const matchStatus = statusFilter === 'ALL' || po.status === statusFilter;
      if (!matchWh || !matchStatus) return false;

      if (!q) return true;

      const poNum = String(po.poNumber || '').toLowerCase();
      const whName = String(po.warehouseName || '').toLowerCase();
      const invNo = String(po.invoiceNo || '').toLowerCase();
      const soNum = String(po.so || '').toLowerCase();
      const trackId = String(po.pickupTrackingId || '').toLowerCase();

      if (
        poNum.includes(q) ||
        whName.includes(q) ||
        invNo.includes(q) ||
        soNum.includes(q) ||
        trackId.includes(q)
      ) {
        return true;
      }

      if (Array.isArray(po.items)) {
        return po.items.some((i) => {
          if (!i) return false;
          const itemId = String(i.itemId || '').toLowerCase();
          const itemName = String(i.itemName || '').toLowerCase();
          return itemId.includes(q) || itemName.includes(q);
        });
      }

      return false;
    });
  }, [purchaseOrders, searchQuery, warehouseFilter, statusFilter]);

  const inTransitPOs = useMemo(() => {
    return (filteredPOs || []).filter(
      (po) => po && (po.pickupStatus === 'YES' || po.status === 'In Transit')
    );
  }, [filteredPOs]);

  const grnPOs = useMemo(() => {
    return (filteredPOs || []).filter(
      (po) => po && (po.status === 'In Transit' || po.status === 'Inwarded' || po.status === 'GRN Completed')
    );
  }, [filteredPOs]);

  const filteredDNs = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    return (dnRecords || []).filter((dn) => {
      if (!dn) return false;
      if (!q) return true;

      const dnNum = String(dn.dnNumber || '').toLowerCase();
      const facName = String(dn.facilityName || '').toLowerCase();
      const parPo = String(dn.parentPoNumber || '').toLowerCase();
      const sku = String(dn.skuId || '').toLowerCase();
      const itName = String(dn.itemName || '').toLowerCase();
      const lr = String(dn.lrNo || '').toLowerCase();

      return (
        dnNum.includes(q) ||
        facName.includes(q) ||
        parPo.includes(q) ||
        sku.includes(q) ||
        itName.includes(q) ||
        lr.includes(q)
      );
    });
  }, [dnRecords, searchQuery]);

  // Export prepared data
  const exportPoHeaders = [
    'PO Number', 'Order Date', 'Warehouse', 'Status', 'Pickup Status', 
    'Total Qty', 'Boxes', 'Invoice No', 'SO', 'Logistics Portal', 'Tracking ID', 
    'GRN Number', 'Created By', 'Emp ID'
  ];

  const exportPoRows = (filteredPOs || []).map((po) => [
    po?.poNumber || 'N/A',
    po?.orderDate || 'N/A',
    po?.warehouseName || 'N/A',
    po?.status || 'N/A',
    po?.pickupStatus || 'N/A',
    po?.totalQty ?? 0,
    po?.noOfBoxes ?? 0,
    po?.invoiceNo || 'N/A',
    po?.so || 'N/A',
    po?.logisticsPortal || 'N/A',
    po?.pickupTrackingId || 'N/A',
    po?.grnNumber || 'N/A',
    po?.createdByName || 'System',
    po?.createdByEmpId || 'N/A'
  ]);

  const exportPoJson = (filteredPOs || []).map((po) => ({
    'PO Number': po?.poNumber || '',
    'Order Date': po?.orderDate || '',
    'Warehouse Name': po?.warehouseName || '',
    'Status': po?.status || '',
    'Pickup Status': po?.pickupStatus || '',
    'Total Qty': po?.totalQty ?? 0,
    'No of Boxes': po?.noOfBoxes ?? 0,
    'Box Dimensions': po?.boxDimensions || '',
    'Invoice No': po?.invoiceNo || '',
    'SO': po?.so || '',
    'Logistics Portal': po?.logisticsPortal || '',
    'Tracking ID': po?.pickupTrackingId || '',
    'ASN': po?.asn || '',
    'PUC': po?.puc || '',
    'GRN No': po?.grnNumber || 'Pending',
    'Created By': po?.createdByName || '',
    'Created By Emp ID': po?.createdByEmpId || '',
  }));

  const exportDnHeaders = [
    'DN Number', 'DN Date', 'Facility', 'Parent PO', 'SKU ID', 
    'Item Name', 'DN Qty', 'WH POC', 'Contact', 'LR No', 'Status', 'Updated By'
  ];

  const exportDnRows = (filteredDNs || []).map((dn) => [
    dn?.dnNumber || 'N/A',
    dn?.dnDate || 'N/A',
    dn?.facilityName || 'N/A',
    dn?.parentPoNumber || 'N/A',
    dn?.skuId || 'N/A',
    dn?.itemName || 'N/A',
    dn?.dnQty ?? 0,
    dn?.whPocName || 'N/A',
    dn?.whPocContact || 'N/A',
    dn?.lrNo || 'N/A',
    dn?.status || 'N/A',
    dn?.updatedByName || dn?.createdByName || 'N/A'
  ]);

  const exportDnJson = (filteredDNs || []).map((dn) => ({
    'DN Number': dn?.dnNumber || '',
    'DN Date': dn?.dnDate || '',
    'Facility Name': dn?.facilityName || '',
    'Parent PO Number': dn?.parentPoNumber || '',
    'Parent SO': dn?.parentSo || '',
    'SKU ID': dn?.skuId || '',
    'Item Name': dn?.itemName || '',
    'DN Qty': dn?.dnQty ?? 0,
    'WH POC Name': dn?.whPocName || '',
    'Contact': dn?.whPocContact || '',
    'LR No': dn?.lrNo || '',
    'Tracking No': dn?.trackingNo || '',
    'Status': dn?.status || '',
    'File Attached': dn?.fileName || 'None',
    'Created By': dn?.createdByName || '',
    'Created By Emp ID': dn?.createdByEmpId || '',
  }));

  // Not logged in view: Show Auth Screen matching screenshots!
  if (!currentUser) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0b1120] text-slate-100' : 'bg-[#f1f5f9] text-slate-800'} flex flex-col justify-center items-center`}>
        <AuthModal isOpen={true} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors ${
      theme === 'dark' 
        ? 'bg-[#0b1120] text-slate-200' 
        : theme === 'grey' 
        ? 'bg-[#1e293b] text-slate-100' 
        : 'bg-[#f1f5f9] text-slate-800'
    }`}>
      {/* Header with Live Expiry notification counter */}
      <Header
        isMobilePreview={isMobilePreview}
        setIsMobilePreview={setIsMobilePreview}
        onOpenItemsModal={() => setIsItemsModalOpen(true)}
        onOpenUsersModal={() => setIsUsersModalOpen(true)}
        onOpenNewPoModal={() => { setEditingPo(null); setIsPoModalOpen(true); }}
        onOpenNewDnModal={() => { setEditingDn(null); setIsDnModalOpen(true); }}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenExpiryModal={() => setIsExpiryModalOpen(true)}
        expiringCount={expiringTodayCount}
      />

      {/* Account Inactive Alert Banner if user deactivated by Admin */}
      {!isActive && (
        <div className="bg-rose-600 text-white px-4 py-2.5 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-md">
          <AlertTriangle className="w-4 h-4 animate-bounce" />
          <span>Notice: Your employee profile has been deactivated by the Administrator. You have read-only access.</span>
        </div>
      )}

      {/* Container - Desktop Computer Full Screen Layout */}
      <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-5">
        <div>
          {/* Navigation Tabs Bar */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 rounded-2xl mb-6 overflow-x-auto">
            
            {/* 1. Dashboard Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border border-slate-200/90 dark:border-slate-700 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Live Dashboard
              {expiringTodayCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>

            {/* 2. All POs */}
            <button
              type="button"
              onClick={() => setActiveTab('all_pos')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap cursor-pointer ${
                activeTab === 'all_pos'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200/90 dark:border-slate-700 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" />
              All POs ({purchaseOrders.length})
            </button>

            {/* 3. In Transit */}
            <button
              type="button"
              onClick={() => setActiveTab('in_transit')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap cursor-pointer ${
                activeTab === 'in_transit'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border border-slate-200/90 dark:border-slate-700 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Truck className="w-4 h-4" />
              In Transit ({inTransitPOs.length})
            </button>

            {/* 4. WH Inward & GRN */}
            <button
              type="button"
              onClick={() => setActiveTab('grn')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap cursor-pointer ${
                activeTab === 'grn'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border border-slate-200/90 dark:border-slate-700 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              WH Inward & GRN ({grnPOs.length})
            </button>

            {/* 5. DN Tracker */}
            <button
              type="button"
              onClick={() => setActiveTab('dn_tracker')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap cursor-pointer ${
                activeTab === 'dn_tracker'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border border-slate-200/90 dark:border-slate-700 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              Instamart DN Tracker ({dnRecords.length})
            </button>

            {/* 6. Offline Sheet */}
            <button
              type="button"
              onClick={() => setActiveTab('offline_sheet')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap cursor-pointer ${
                activeTab === 'offline_sheet'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 border border-slate-200/90 dark:border-slate-700 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-teal-600" />
              Offline Sheet (Google Sheet Mode)
            </button>

            {/* 7. Catalog */}
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap cursor-pointer ${
                activeTab === 'catalog'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 border border-slate-200/90 dark:border-slate-700 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Database className="w-4 h-4" />
              SKU Catalog ({itemsCatalog.length})
            </button>

            {/* 8. Overview */}
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-200/90 dark:border-slate-700 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Analytics & Audit
            </button>
          </div>

          {/* TAB: DASHBOARD (Home View) */}
          {activeTab === 'dashboard' && (
            <DashboardView
              purchaseOrders={purchaseOrders}
              dnRecords={dnRecords}
              itemsCatalog={itemsCatalog}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenNewPo={() => { setEditingPo(null); setIsPoModalOpen(true); }}
              onOpenNewDn={() => { setEditingDn(null); setIsDnModalOpen(true); }}
              onOpenExpiryCenter={() => setIsExpiryModalOpen(true)}
            />
          )}

          {/* Action Row & Global Filters (shown for standard data views) */}
          {activeTab !== 'dashboard' && activeTab !== 'offline_sheet' && (
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
                {/* Search */}
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search PO, SKU, Invoice, Warehouse, LR..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none shadow-xs"
                  />
                </div>

                {/* Warehouse filter */}
                <select
                  value={warehouseFilter}
                  onChange={(e) => setWarehouseFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-medium bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none shadow-xs"
                >
                  <option value="ALL">All Warehouses</option>
                  {DEFAULT_WAREHOUSES.map((wh) => (
                    <option key={wh} value={wh}>{wh}</option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-medium bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl outline-none shadow-xs"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="New PO">New PO</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Inwarded">Inwarded</option>
                  <option value="GRN Completed">GRN Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Primary Action Buttons */}
              <div className="flex items-center gap-2">
                {activeTab === 'all_pos' && purchaseOrders.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to clear all POs and start with an empty table?')) {
                        const idsToDelete = purchaseOrders.map(p => p.id);
                        setPurchaseOrders([]);
                        localStorage.setItem('instamart_pos', JSON.stringify([]));
                        idsToDelete.forEach(id => {
                          deleteDoc(doc(db, 'purchase_orders', id)).catch(e => console.warn(e));
                        });
                      }
                    }}
                    className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition cursor-pointer"
                    title="Clear all PO records to start with an empty sheet"
                  >
                    Clear All POs
                  </button>
                )}

                {activeTab === 'dn_tracker' ? (
                  <button
                    type="button"
                    onClick={() => { setEditingDn(null); setIsDnModalOpen(true); }}
                    disabled={!isActive}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 transition shadow-md shadow-rose-600/20 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" /> Create DN Entry
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setEditingPo(null); setIsPoModalOpen(true); }}
                    disabled={!isActive}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Create New PO
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Export bar for active data tabs */}
          {activeTab !== 'dashboard' && activeTab !== 'offline_sheet' && (
            <div className="mb-5">
              {activeTab === 'dn_tracker' ? (
                <ExportBar
                  title="Instamart DN Tracker Report"
                  filename={`Instamart_DN_Tracker_${TODAY_DATE}`}
                  data={exportDnJson}
                  headers={exportDnHeaders}
                  pdfRows={exportDnRows}
                  subtitle="Discrepancy Notes, LR Numbers & Warehouse Acceptance"
                />
              ) : (
                <ExportBar
                  title="Instamart Purchase Orders & Logistics Report"
                  filename={`Instamart_PO_Logistics_${TODAY_DATE}`}
                  data={exportPoJson}
                  headers={exportPoHeaders}
                  pdfRows={exportPoRows}
                  subtitle="Complete PO Lifecycle, Dispatch & In-Transit Tracking"
                />
              )}
            </div>
          )}

          {/* TAB: OFFLINE SHEET (GOOGLE SHEET MODE) */}
          {activeTab === 'offline_sheet' && (
            <OfflineSheetView
              purchaseOrders={purchaseOrders}
              dnRecords={dnRecords}
              onUpdatePo={handleUpdatePoFromSheet}
              onCreatePo={handleCreatePoFromSheet}
              onUpdateDn={handleUpdateDnFromSheet}
              onCreateDn={handleCreateDnFromSheet}
              canEdit={isActive}
            />
          )}

          {/* TAB 1: ALL POs */}
          {activeTab === 'all_pos' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                      Backoffice Purchase Orders ({filteredPOs.length})
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      Fill and manage all 21 logistics data points. Multiple items supported with automatic item lookup.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-400 font-bold border-b border-slate-200 dark:border-zinc-800">
                      <tr>
                        <th className="py-3 px-3">PO Number</th>
                        <th className="py-3 px-3">Order Date</th>
                        <th className="py-3 px-3">Warehouse Name</th>
                        <th className="py-3 px-3">SKU Items / Qty</th>
                        <th className="py-3 px-3 text-center">Pickup Status</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-3">Boxes / Logistics</th>
                        <th className="py-3 px-3">Created By</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-medium">
                      {filteredPOs.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-zinc-500">
                            <div className="max-w-md mx-auto space-y-2.5">
                              <p className="font-semibold text-slate-700 dark:text-zinc-300">
                                No Purchase Orders in database
                              </p>
                              <p className="text-xs text-slate-400 dark:text-zinc-500">
                                Default mock records removed. Create real consignments or optionally load sample 7-day data to preview velocity trends.
                              </p>
                              <div className="flex items-center justify-center gap-2 pt-2">
                                <button
                                  type="button"
                                  onClick={() => { setEditingPo(null); setIsPoModalOpen(true); }}
                                  className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer"
                                >
                                  + Create New PO
                                </button>
                                <button
                                  type="button"
                                  onClick={handleLoadSamplePos}
                                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                                  title="Load dynamic sample consignments with last 7 days dates"
                                >
                                  Load Sample 7-Day POs
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredPOs.map((po) => {
                          const isLocked = Boolean(
                            (po.pickupStatus === 'YES' || po.status === 'In Transit') && !isAdmin
                          );

                          return (
                            <tr key={po.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition">
                              <td className="py-3 px-3">
                                <div className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                  {po.poNumber}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                                  SO: {po.so || 'N/A'} • Inv: {po.invoiceNo || 'N/A'}
                                </div>
                              </td>

                              <td className="py-3 px-3 text-slate-700 dark:text-zinc-300">
                                {po.orderDate}
                              </td>

                              <td className="py-3 px-3">
                                <div className="text-slate-900 dark:text-zinc-100 font-semibold line-clamp-1 max-w-[180px]">
                                  {po.warehouseName}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  Apt: {po.appointmentId || 'N/A'}
                                </div>
                              </td>

                              <td className="py-3 px-3">
                                <div className="font-bold text-slate-900 dark:text-zinc-100">
                                  {po.totalQty} Units
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-zinc-400">
                                  {po.items?.length || 1} SKU(s)
                                </div>
                              </td>

                              <td className="py-3 px-3 text-center">
                                {po.pickupStatus === 'YES' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                    ✓ YES (In Transit)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-300 dark:border-zinc-700">
                                    ✕ NO (Pending)
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-3 text-center">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  po.status === 'In Transit'
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                    : po.status === 'GRN Completed'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : po.status === 'Inwarded'
                                    ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                }`}>
                                  {po.status}
                                </span>
                              </td>

                              <td className="py-3 px-3">
                                <div className="text-slate-800 dark:text-zinc-200">
                                  {po.noOfBoxes} bxs • {po.logisticsPortal || 'Delhivery'}
                                </div>
                                <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                                  {po.pickupTrackingId || 'No Track ID'}
                                </div>
                              </td>

                              <td className="py-3 px-3">
                                <div className="font-bold text-slate-800 dark:text-zinc-200">
                                  {po.createdByName || 'System'}
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  {po.createdByEmpId || 'N/A'}
                                </div>
                              </td>

                              <td className="py-3 px-3 text-right">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => { setDetailPo(po); setIsDetailModalOpen(true); }}
                                    className="p-1.5 text-slate-500 hover:text-orange-600 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                                    title="View Full PO Details"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => { setEditingPo(po); setIsPoModalOpen(true); }}
                                    className={`p-1.5 rounded-lg transition ${
                                      isLocked
                                        ? 'text-slate-400 hover:text-slate-600'
                                        : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-zinc-800'
                                    }`}
                                    title={isLocked ? 'Locked (In Transit) - Read Only for Employees' : 'Edit PO'}
                                  >
                                    {isLocked ? <Lock className="w-4 h-4 text-amber-500" /> : <Edit className="w-4 h-4" />}
                                  </button>

                                  {isAdmin && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeletePo(po.id, po.poNumber)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                                      title="Delete PO (Admin)"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IN TRANSIT */}
          {activeTab === 'in_transit' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-blue-950 dark:text-blue-200">
                      In-Transit Dispatch Monitor ({inTransitPOs.length} Active Shipments)
                    </h3>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      When Pickup Status is YES, PO shifts here automatically. Employees cannot edit in transit; Admin can edit.
                    </p>
                  </div>
                </div>
                {isAdmin ? (
                  <span className="px-2.5 py-1 text-xs font-bold bg-purple-100 text-purple-700 rounded-lg flex items-center gap-1">
                    <Unlock className="w-3.5 h-3.5" /> Admin Override Enabled
                  </span>
                ) : (
                  <span className="px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-700 rounded-lg flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Locked for Employees
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inTransitPOs.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-slate-400 dark:text-zinc-500 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl">
                    No POs currently In Transit. Set "Pickup Status: YES" in any PO to shift it here!
                  </div>
                ) : (
                  inTransitPOs.map((po) => (
                    <div 
                      key={po.id} 
                      className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xs hover:border-blue-500 transition space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                          {po.poNumber}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded-md">
                          In Transit
                        </span>
                      </div>

                      <div className="text-xs space-y-1">
                        <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                          {po.warehouseName}
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          Ship Date: <strong>{po.shipDate || po.orderDate}</strong> • Apt Date: <strong>{po.appointmentDate}</strong>
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          Logistics: <strong>{po.logisticsPortal}</strong>
                        </div>
                        <div className="font-mono text-[11px] text-blue-600 dark:text-blue-400">
                          Track ID: {po.pickupTrackingId || 'Pending'}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-zinc-300">
                          {po.totalQty} Units ({po.noOfBoxes} boxes)
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => { setDetailPo(po); setIsDetailModalOpen(true); }}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200"
                          >
                            View
                          </button>
                          {(isWarehouse || isAdmin) && po.status !== 'GRN Completed' && (
                            <button
                              type="button"
                              onClick={() => { setGrnTargetPo(po); setIsGrnModalOpen(true); }}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                            >
                              Inward (WH)
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: WAREHOUSE INWARD & GRN */}
          {activeTab === 'grn' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-emerald-950 dark:text-emerald-200">
                      Warehouse Inward & Goods Receipt Note (GRN) Desk
                    </h3>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      When POs are inwarded, they automatically move to GRN. If discrepancy/damage is found, raise a DN directly!
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-400 font-bold border-b border-slate-200 dark:border-zinc-800">
                      <tr>
                        <th className="py-3 px-3">PO Number</th>
                        <th className="py-3 px-3">Warehouse / Facility</th>
                        <th className="py-3 px-3">Items & Qty</th>
                        <th className="py-3 px-3">GRN Number</th>
                        <th className="py-3 px-3">GRN Date</th>
                        <th className="py-3 px-3 text-center">Discrepancy (DN)</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-3 text-right">Warehouse Inward Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-medium">
                      {grnPOs.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-zinc-500">
                            No shipments awaiting or completed GRN inwarding.
                          </td>
                        </tr>
                      ) : (
                        grnPOs.map((po) => (
                          <tr key={po.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition">
                            <td className="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                              {po.poNumber}
                            </td>
                            <td className="py-3 px-3 text-slate-800 dark:text-zinc-200 font-semibold">
                              {po.warehouseName}
                            </td>
                            <td className="py-3 px-3">
                              {po.totalQty} Units ({po.noOfBoxes} boxes)
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {po.grnNumber || 'Pending Inward'}
                            </td>
                            <td className="py-3 px-3 text-slate-600 dark:text-zinc-400">
                              {po.grnDate || '—'}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {po.hasDN ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300">
                                  ⚠️ DN Flagged
                                </span>
                              ) : po.status === 'GRN Completed' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  ✓ Clear (No DN)
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10px]">—</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                po.status === 'GRN Completed' 
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              }`}>
                                {po.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                {po.status !== 'GRN Completed' ? (
                                  <button
                                    type="button"
                                    onClick={() => { setGrnTargetPo(po); setIsGrnModalOpen(true); }}
                                    className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                  >
                                    Inward & Generate GRN
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDnForPo(po)}
                                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900 hover:bg-rose-100"
                                  >
                                    + Add DN
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: INSTAMART DN TRACKER */}
          {activeTab === 'dn_tracker' && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-rose-950 dark:text-rose-200">
                      Instamart DN Tracker ({filteredDNs.length} Discrepancy Records)
                    </h3>
                    <p className="text-xs text-rose-700 dark:text-rose-300">
                      Debit Note Date, DN Number, Facility Name, Parent PO Details, SKU ID & Item Name, DN Qty, WH POC, Upload DN Report (PDF / Spreadsheet max 10MB), LR No.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setEditingDn(null); setIsDnModalOpen(true); }}
                  disabled={!isActive}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> + New DN Entry
                </button>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-600 dark:text-zinc-400 font-bold border-b border-slate-200 dark:border-zinc-800">
                      <tr>
                        <th className="py-3 px-3">DN Number</th>
                        <th className="py-3 px-3">DN Date</th>
                        <th className="py-3 px-3">Facility Name</th>
                        <th className="py-3 px-3">Parent PO Details</th>
                        <th className="py-3 px-3">DN SKU ID | Item Name</th>
                        <th className="py-3 px-3 text-center">DN QTY</th>
                        <th className="py-3 px-3">WH POC / Contact</th>
                        <th className="py-3 px-3">Report File & LR No</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-medium">
                      {filteredDNs.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-12 text-center text-slate-400 dark:text-zinc-500">
                            No Debit Notes recorded yet. Click "Create DN Entry" to add one.
                          </td>
                        </tr>
                      ) : (
                        filteredDNs.map((dn) => (
                          <tr key={dn.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 transition">
                            <td className="py-3 px-3 font-mono font-bold text-rose-600 dark:text-rose-400">
                              {dn.dnNumber}
                            </td>

                            <td className="py-3 px-3 text-slate-700 dark:text-zinc-300">
                              {dn.dnDate}
                            </td>

                            <td className="py-3 px-3 text-slate-900 dark:text-zinc-100 font-semibold max-w-[160px] truncate">
                              {dn.facilityName}
                            </td>

                            <td className="py-3 px-3">
                              <div className="font-mono font-bold text-slate-800 dark:text-zinc-200">
                                {dn.parentPoNumber}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                SO: {dn.parentSo || 'N/A'} • {dn.parentPoDate || ''}
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <div className="font-mono font-bold text-purple-700 dark:text-purple-300">
                                {dn.skuId}
                              </div>
                              <div className="text-[11px] text-slate-800 dark:text-zinc-200 font-semibold max-w-[200px] truncate">
                                {dn.itemName}
                              </div>
                            </td>

                            <td className="py-3 px-3 text-center font-bold text-rose-600 text-sm">
                              {dn.dnQty}
                            </td>

                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-800 dark:text-zinc-200">
                                {dn.whPocName}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {dn.whPocContact}
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <div className="font-mono text-slate-800 dark:text-zinc-200 font-bold">
                                LR: {dn.lrNo}
                              </div>
                              {dn.fileName ? (
                                <a
                                  href={dn.fileData}
                                  download={dn.fileName}
                                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold mt-0.5"
                                  title="Download uploaded DN report"
                                >
                                  📎 {dn.fileName}
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-400">No report file</span>
                              )}
                            </td>

                            <td className="py-3 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                dn.status === 'Accepted'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : dn.status === 'Dispatched'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  : dn.status === 'Closed'
                                  ? 'bg-slate-200 text-slate-800 dark:bg-zinc-800 dark:text-zinc-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}>
                                {dn.status}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => { setEditingDn(dn); setIsDnModalOpen(true); }}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                                  title="Edit DN (Warehouse or Backoffice)"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteDn(dn.id, dn.dnNumber)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                                    title="Delete DN"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: MASTER SKU CATALOG */}
          {activeTab === 'catalog' && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-purple-950 dark:text-purple-200">
                      Instamart Master Item Catalog & SKU Mapping
                    </h3>
                    <p className="text-xs text-purple-700 dark:text-purple-300">
                      When backend team types or selects Item ID, Item Name is automatically filled. Admin can add, edit, and delete items.
                    </p>
                  </div>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsItemsModalOpen(true)}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Manage Master SKUs
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {itemsCatalog.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-purple-600 dark:text-purple-400">
                        {item.itemId}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-md">
                        {item.category || 'General'}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                      {item.itemName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex justify-between pt-1 border-t border-slate-100 dark:border-zinc-800">
                      <span>UOM: {item.unit || 'Pcs'}</span>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setIsItemsModalOpen(true)}
                          className="text-purple-600 hover:underline font-semibold"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: ANALYTICS & AUDIT */}
          {activeTab === 'analytics' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    PO Lifecycle Breakdown
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span>New PO (Backoffice):</span>
                      <strong className="text-amber-600 font-mono">
                        {(purchaseOrders || []).filter((p) => p && p.status === 'New PO').length}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>In Transit (Dispatched):</span>
                      <strong className="text-blue-600 font-mono">
                        {(purchaseOrders || []).filter((p) => p && p.status === 'In Transit').length}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>GRN Completed (Inwarded):</span>
                      <strong className="text-emerald-600 font-mono">
                        {(purchaseOrders || []).filter((p) => p && p.status === 'GRN Completed').length}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Cancelled / Void:</span>
                      <strong className="text-rose-600 font-mono">
                        {(purchaseOrders || []).filter((p) => p && p.status === 'Cancelled').length}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Logistics Carriers Distribution
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span>Delhivery Logistics:</span>
                      <strong className="font-mono">
                        {(purchaseOrders || []).filter((p) => p && p.logisticsPortal?.includes('Delhivery')).length}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Instamart Fleet:</span>
                      <strong className="font-mono">
                        {(purchaseOrders || []).filter((p) => p && p.logisticsPortal?.includes('Instamart')).length}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>BlueDart / Shadowfax:</span>
                      <strong className="font-mono">
                        {(purchaseOrders || []).filter((p) => p && (p.logisticsPortal?.includes('BlueDart') || p.logisticsPortal?.includes('Shadowfax'))).length}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Discrepancy Resolution (DNs)
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span>Total Debit Notes:</span>
                      <strong className="font-mono text-rose-600">{(dnRecords || []).length}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Accepted by WH:</span>
                      <strong className="font-mono text-emerald-600">
                        {(dnRecords || []).filter((d) => d && d.status === 'Accepted').length}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Pending Review:</span>
                      <strong className="font-mono text-amber-600">
                        {(dnRecords || []).filter((d) => d && d.status === 'Pending').length}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Audit Stream */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-3">
                  Recent Employee Activity & PO Audit Log
                </h4>
                <div className="divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
                  {purchaseOrders.slice(0, 5).map((po) => (
                    <div key={po.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                        <div>
                          <strong className="font-mono text-slate-800 dark:text-zinc-200">{po.poNumber}</strong>
                          <span className="text-slate-500 ml-1.5">
                            assigned to {po.warehouseName}
                          </span>
                        </div>
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        By: <strong className="text-slate-700 dark:text-zinc-300">{po.createdByName || 'System'} ({po.createdByEmpId || 'N/A'})</strong> • {new Date(po.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Bottom Bar for Mobile View */}
          {isMobilePreview && (
            <div className="sticky bottom-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-slate-200 dark:border-zinc-800 -mx-3 -mb-3 p-2 flex justify-around text-[10px] font-bold text-slate-500 mt-6">
              <button 
                type="button" 
                onClick={() => setActiveTab('dashboard')}
                className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-blue-600 font-bold' : ''}`}
              >
                <LayoutDashboard className="w-4 h-4" /> Home
              </button>
              <button 
                type="button" 
                onClick={() => setActiveTab('all_pos')}
                className={`flex flex-col items-center gap-1 ${activeTab === 'all_pos' ? 'text-blue-600 font-bold' : ''}`}
              >
                <Package className="w-4 h-4" /> POs
              </button>
              <button 
                type="button" 
                onClick={() => setActiveTab('in_transit')}
                className={`flex flex-col items-center gap-1 ${activeTab === 'in_transit' ? 'text-blue-600' : ''}`}
              >
                <Truck className="w-4 h-4" /> Transit
              </button>
              <button 
                type="button" 
                onClick={() => setActiveTab('offline_sheet')}
                className={`flex flex-col items-center gap-1 ${activeTab === 'offline_sheet' ? 'text-teal-600' : ''}`}
              >
                <FileSpreadsheet className="w-4 h-4" /> Sheet
              </button>
              <button 
                type="button" 
                onClick={() => setActiveTab('dn_tracker')}
                className={`flex flex-col items-center gap-1 ${activeTab === 'dn_tracker' ? 'text-rose-600' : ''}`}
              >
                <FileText className="w-4 h-4" /> DNs
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <PoModal
        isOpen={isPoModalOpen}
        onClose={() => { setIsPoModalOpen(false); setEditingPo(null); }}
        onSave={handleSavePo}
        editingPo={editingPo}
        itemsCatalog={itemsCatalog}
      />

      <DNModal
        isOpen={isDnModalOpen}
        onClose={() => { setIsDnModalOpen(false); setEditingDn(null); }}
        onSave={handleSaveDn}
        editingDn={editingDn}
        poList={purchaseOrders}
        itemsCatalog={itemsCatalog}
      />

      {grnTargetPo && (
        <GrnModal
          isOpen={isGrnModalOpen}
          onClose={() => { setIsGrnModalOpen(false); setGrnTargetPo(null); }}
          po={grnTargetPo}
          onConfirmGrn={handleConfirmGrn}
          onOpenDnForPo={handleOpenDnForPo}
        />
      )}

      {detailPo && (
        <PoDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => { setIsDetailModalOpen(false); setDetailPo(null); }}
          po={detailPo}
          onEdit={() => { setEditingPo(detailPo); setIsPoModalOpen(true); }}
          canEdit={isAdmin || (detailPo.pickupStatus !== 'YES' && detailPo.status !== 'In Transit')}
        />
      )}

      <ItemMasterModal
        isOpen={isItemsModalOpen}
        onClose={() => setIsItemsModalOpen(false)}
        items={itemsCatalog}
        onSaveItem={handleSaveCatalogItem}
        onDeleteItem={handleDeleteCatalogItem}
        onSeedDefaults={async () => {}}
      />

      <UserManagementModal
        isOpen={isUsersModalOpen}
        onClose={() => setIsUsersModalOpen(false)}
      />

      <ExpiryNotificationModal
        isOpen={isExpiryModalOpen}
        onClose={() => setIsExpiryModalOpen(false)}
        purchaseOrders={purchaseOrders}
        onSelectPo={(po) => {
          setDetailPo(po);
          setIsDetailModalOpen(true);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

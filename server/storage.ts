import {
  type User,
  type InsertUser,
  type Member,
  type InsertMember,
  type Deposit,
  type InsertDeposit,
  type Withdrawal,
  type InsertWithdrawal,
  type Notification,
  type InsertNotification,
  type ActivityLog,
  type InsertActivityLog,
  type SystemBank,
  type InsertSystemBank,
  type Product,
  type InsertProduct,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByInvitationCode(code: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // Members
  getAllMembers(): Promise<Member[]>;
  getMembersByAgentId(agentId: string): Promise<Member[]>;
  getMember(id: string): Promise<Member | undefined>;
  getMemberByEmail(email: string): Promise<Member | undefined>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: string, updates: Partial<Member>): Promise<Member | undefined>;
  deleteMember(id: string): Promise<boolean>;

  // Deposits
  getAllDeposits(): Promise<Deposit[]>;
  getDepositsByMemberIds(memberIds: string[]): Promise<Deposit[]>;
  getDeposit(id: string): Promise<Deposit | undefined>;
  createDeposit(deposit: InsertDeposit): Promise<Deposit>;
  updateDeposit(id: string, updates: Partial<Deposit>): Promise<Deposit | undefined>;

  // Withdrawals
  getAllWithdrawals(): Promise<Withdrawal[]>;
  getWithdrawalsByMemberIds(memberIds: string[]): Promise<Withdrawal[]>;
  getWithdrawal(id: string): Promise<Withdrawal | undefined>;
  createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal>;
  updateWithdrawal(id: string, updates: Partial<Withdrawal>): Promise<Withdrawal | undefined>;

  // Notifications
  getAllNotifications(): Promise<Notification[]>;
  getNotificationsByMember(memberId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotification(id: string, data: Partial<Notification>): Promise<Notification | undefined>;

  // Activity Logs
  getAllActivities(): Promise<ActivityLog[]>;
  createActivity(activity: InsertActivityLog): Promise<ActivityLog>;

  // System Banks
  getAllSystemBanks(): Promise<SystemBank[]>;
  getActiveSystemBanks(): Promise<SystemBank[]>;
  getSystemBank(id: string): Promise<SystemBank | undefined>;
  createSystemBank(bank: InsertSystemBank): Promise<SystemBank>;
  updateSystemBank(id: string, updates: Partial<SystemBank>): Promise<SystemBank | undefined>;
  deleteSystemBank(id: string): Promise<boolean>;

  // Products
  getAllProducts(): Promise<Product[]>;
  getActiveProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private members: Map<string, Member>;
  private deposits: Map<string, Deposit>;
  private withdrawals: Map<string, Withdrawal>;
  private notifications: Map<string, Notification>;
  private activities: Map<string, ActivityLog>;
  private systemBanks: Map<string, SystemBank>;
  private products: Map<string, Product>;

  constructor() {
    this.users = new Map();
    this.members = new Map();
    this.deposits = new Map();
    this.withdrawals = new Map();
    this.notifications = new Map();
    this.activities = new Map();
    this.systemBanks = new Map();
    this.products = new Map();

    // Seed some sample data
    this.seedData();
  }

  private seedData() {
    // Seed system users with hierarchy (Master > Admin > Agent)
    const systemUsers: User[] = [
      {
        id: "user-master-1",
        username: "master@system.com",
        password: "master123",
        name: "Super Admin",
        email: "master@system.com",
        phone: null,
        role: "master",
        parentId: null,
        createdBy: null,
        invitationCode: null,
        isActive: true,
        createdAt: new Date("2024-01-01"),
      },
      {
        id: "user-admin-1",
        username: "admin@system.com",
        password: "admin123",
        name: "Administrator",
        email: "admin@system.com",
        phone: null,
        role: "admin",
        parentId: "user-master-1",
        createdBy: "user-master-1",
        invitationCode: null,
        isActive: true,
        createdAt: new Date("2024-01-01"),
      },
      {
        id: "user-admin-2",
        username: "admin2@system.com",
        password: "admin123",
        name: "Admin Dua",
        email: "admin2@system.com",
        phone: null,
        role: "admin",
        parentId: "user-master-1",
        createdBy: "user-master-1",
        invitationCode: null,
        isActive: true,
        createdAt: new Date("2024-01-02"),
      },
      {
        id: "user-agent-1",
        username: "agent@system.com",
        password: "agent123",
        name: "Agen Cahaya",
        email: "agent@system.com",
        phone: "+6281234567001",
        role: "agent",
        parentId: "user-admin-1",
        createdBy: "user-admin-1",
        invitationCode: "CAHAYA001",
        isActive: true,
        createdAt: new Date("2024-01-01"),
      },
      {
        id: "user-agent-2",
        username: "agent2@system.com",
        password: "agent123",
        name: "Agen Bintang",
        email: "agent2@system.com",
        phone: "+6281234567002",
        role: "agent",
        parentId: "user-admin-1",
        createdBy: "user-admin-1",
        invitationCode: "BINTANG02",
        isActive: true,
        createdAt: new Date("2024-01-02"),
      },
    ];

    systemUsers.forEach((u) => this.users.set(u.id, u));

    // Sample members (customers) - assigned to agents
    const sampleMembers: Member[] = [
      {
        id: "m1",
        name: "Ahmad Rizki",
        email: "ahmad.rizki@email.com",
        password: "password123",
        phone: "+6281234567890",
        balance: 2500000,
        isLocked: false,
        lockReason: null,
        withdrawalLocked: false,
        withdrawalLockReason: null,
        status: "active",
        assignedAgentId: "user-agent-1",
        bankName: "BCA",
        bankAccountNumber: "1234567890",
        bankAccountName: "Ahmad Rizki",
        creditScore: 100,
        createdAt: new Date("2024-01-15"),
      },
      {
        id: "m2",
        name: "Siti Nurhaliza",
        email: "siti.nur@email.com",
        password: "password123",
        phone: "+6281234567891",
        balance: 1750000,
        isLocked: false,
        lockReason: null,
        withdrawalLocked: false,
        withdrawalLockReason: null,
        status: "active",
        assignedAgentId: "user-agent-1",
        bankName: "Mandiri",
        bankAccountNumber: "5555666677",
        bankAccountName: "Siti Nurhaliza",
        creditScore: 85,
        createdAt: new Date("2024-01-20"),
      },
      {
        id: "m3",
        name: "Budi Santoso",
        email: "budi.s@email.com",
        password: "password123",
        phone: "+6281234567892",
        balance: 500000,
        isLocked: true,
        lockReason: "Aktivitas mencurigakan terdeteksi",
        withdrawalLocked: true,
        withdrawalLockReason: "Verifikasi identitas diperlukan",
        status: "suspended",
        assignedAgentId: "user-agent-2",
        bankName: null,
        bankAccountNumber: null,
        bankAccountName: null,
        creditScore: 50,
        createdAt: new Date("2024-02-01"),
      },
      {
        id: "m4",
        name: "Dewi Lestari",
        email: "dewi.l@email.com",
        password: "password123",
        phone: "+6281234567893",
        balance: 3200000,
        isLocked: false,
        lockReason: null,
        withdrawalLocked: false,
        withdrawalLockReason: null,
        status: "active",
        assignedAgentId: "user-agent-2",
        bankName: "BNI",
        bankAccountNumber: "9876543210",
        bankAccountName: "Dewi Lestari",
        creditScore: 120,
        createdAt: new Date("2024-02-10"),
      },
      {
        id: "m5",
        name: "Eko Prasetyo",
        email: "eko.p@email.com",
        password: "password123",
        phone: "+6281234567894",
        balance: 800000,
        isLocked: false,
        lockReason: null,
        withdrawalLocked: true,
        withdrawalLockReason: "Batas penarikan harian tercapai",
        status: "active",
        assignedAgentId: "user-agent-1",
        bankName: null,
        bankAccountNumber: null,
        bankAccountName: null,
        creditScore: 75,
        createdAt: new Date("2024-02-15"),
      },
      {
        id: "m6",
        name: "Calon Member Pending",
        email: "pending@email.com",
        password: "password123",
        phone: "+6281234567895",
        balance: 0,
        isLocked: false,
        lockReason: null,
        withdrawalLocked: false,
        withdrawalLockReason: null,
        status: "pending",
        assignedAgentId: "user-agent-1",
        bankName: null,
        bankAccountNumber: null,
        bankAccountName: null,
        creditScore: 100,
        createdAt: new Date("2024-02-20"),
      },
    ];

    sampleMembers.forEach((m) => this.members.set(m.id, m));

    // Sample deposits
    const sampleDeposits: Deposit[] = [
      {
        id: "d1",
        memberId: "m1",
        amount: 500000,
        status: "pending",
        rejectionReason: null,
        proofUrl: null,
        processedBy: null,
        createdAt: new Date(),
        processedAt: null,
      },
      {
        id: "d2",
        memberId: "m2",
        amount: 1000000,
        status: "pending",
        rejectionReason: null,
        proofUrl: null,
        processedBy: null,
        createdAt: new Date(Date.now() - 3600000),
        processedAt: null,
      },
      {
        id: "d3",
        memberId: "m4",
        amount: 250000,
        status: "approved",
        rejectionReason: null,
        proofUrl: null,
        processedBy: "user-admin-1",
        createdAt: new Date(Date.now() - 86400000),
        processedAt: new Date(Date.now() - 82800000),
      },
      {
        id: "d4",
        memberId: "m3",
        amount: 750000,
        status: "rejected",
        rejectionReason: "Bukti transfer tidak valid",
        proofUrl: null,
        processedBy: "user-admin-1",
        createdAt: new Date(Date.now() - 172800000),
        processedAt: new Date(Date.now() - 169200000),
      },
    ];

    sampleDeposits.forEach((d) => this.deposits.set(d.id, d));

    // Sample withdrawals
    const sampleWithdrawals: Withdrawal[] = [
      {
        id: "w1",
        memberId: "m1",
        amount: 300000,
        status: "pending",
        rejectionReason: null,
        bankName: "BCA",
        accountNumber: "1234567890",
        accountName: "Ahmad Rizki",
        processedBy: null,
        createdAt: new Date(),
        processedAt: null,
      },
      {
        id: "w2",
        memberId: "m4",
        amount: 500000,
        status: "pending",
        rejectionReason: null,
        bankName: "BNI",
        accountNumber: "9876543210",
        accountName: "Dewi Lestari",
        processedBy: null,
        createdAt: new Date(Date.now() - 7200000),
        processedAt: null,
      },
      {
        id: "w3",
        memberId: "m2",
        amount: 200000,
        status: "approved",
        rejectionReason: null,
        bankName: "Mandiri",
        accountNumber: "5555666677",
        accountName: "Siti Nurhaliza",
        processedBy: "user-admin-1",
        createdAt: new Date(Date.now() - 86400000),
        processedAt: new Date(Date.now() - 82800000),
      },
    ];

    sampleWithdrawals.forEach((w) => this.withdrawals.set(w.id, w));

    // Sample activities
    const sampleActivities: ActivityLog[] = [
      {
        id: "a1",
        action: "Deposit Disetujui",
        description: "Deposit sebesar Rp 250.000 untuk Dewi Lestari telah disetujui",
        memberId: "m4",
        userId: "user-admin-1",
        userRole: "admin",
        userName: "Administrator",
        createdAt: new Date(Date.now() - 82800000),
      },
      {
        id: "a2",
        action: "Akun Dikunci",
        description: "Akun Budi Santoso telah dikunci karena aktivitas mencurigakan",
        memberId: "m3",
        userId: "user-agent-1",
        userRole: "agent",
        userName: "Agent Team 1",
        createdAt: new Date(Date.now() - 86400000),
      },
      {
        id: "a3",
        action: "Penarikan Disetujui",
        description: "Penarikan sebesar Rp 200.000 untuk Siti Nurhaliza telah diproses",
        memberId: "m2",
        userId: "user-agent-2",
        userRole: "agent",
        userName: "Agent Team 2",
        createdAt: new Date(Date.now() - 82800000),
      },
      {
        id: "a4",
        action: "Top Up Saldo",
        description: "Saldo Ahmad Rizki ditambahkan Rp 1.000.000 oleh admin",
        memberId: "m1",
        userId: "user-admin-1",
        userRole: "admin",
        userName: "Administrator",
        createdAt: new Date(Date.now() - 172800000),
      },
    ];

    sampleActivities.forEach((a) => this.activities.set(a.id, a));

    // Sample notifications
    const sampleNotifications: Notification[] = [
      {
        id: "n1",
        memberId: "m3",
        title: "Akun Anda Dikunci",
        message: "Akun Anda telah dikunci karena aktivitas mencurigakan terdeteksi. Silakan hubungi admin untuk informasi lebih lanjut.",
        type: "error",
        isRead: false,
        createdAt: new Date(Date.now() - 86400000),
      },
      {
        id: "n2",
        memberId: "m5",
        title: "Penarikan Dikunci",
        message: "Penarikan Anda telah dikunci karena batas penarikan harian tercapai. Silakan coba lagi besok.",
        type: "warning",
        isRead: false,
        createdAt: new Date(Date.now() - 43200000),
      },
    ];

    sampleNotifications.forEach((n) => this.notifications.set(n.id, n));

    // Sample system banks
    const sampleSystemBanks: SystemBank[] = [
      {
        id: "sb1",
        bankName: "BCA",
        accountNumber: "1234567890",
        accountName: "PT Koperasi Sejahtera",
        isActive: true,
        createdBy: "user-master-1",
        createdAt: new Date(),
      },
      {
        id: "sb2",
        bankName: "BNI",
        accountNumber: "0987654321",
        accountName: "PT Koperasi Sejahtera",
        isActive: true,
        createdBy: "user-master-1",
        createdAt: new Date(),
      },
      {
        id: "sb3",
        bankName: "Mandiri",
        accountNumber: "1122334455",
        accountName: "PT Koperasi Sejahtera",
        isActive: true,
        createdBy: "user-admin-1",
        createdAt: new Date(),
      },
    ];

    sampleSystemBanks.forEach((b) => this.systemBanks.set(b.id, b));

    // Sample products
    const sampleProducts: Product[] = [
      { id: "p1", name: "iPhone 15 Pro Max", price: 21999000, category: "Elektronik", imageUrl: null, rating: 48, reviews: 120, isActive: true, createdBy: "user-master-1", createdAt: new Date() },
      { id: "p2", name: "Samsung Galaxy S24", price: 18999000, category: "Elektronik", imageUrl: null, rating: 48, reviews: 120, isActive: true, createdBy: "user-master-1", createdAt: new Date() },
      { id: "p3", name: "MacBook Pro M3", price: 35999000, category: "Elektronik", imageUrl: null, rating: 49, reviews: 85, isActive: true, createdBy: "user-master-1", createdAt: new Date() },
      { id: "p4", name: "AirPods Pro 2", price: 3999000, category: "Elektronik", imageUrl: null, rating: 47, reviews: 200, isActive: true, createdBy: "user-admin-1", createdAt: new Date() },
      { id: "p5", name: "Nike Air Max", price: 2499000, category: "Fashion", imageUrl: null, rating: 46, reviews: 150, isActive: true, createdBy: "user-admin-1", createdAt: new Date() },
      { id: "p6", name: "Vitamin C Serum", price: 299000, category: "Kesehatan", imageUrl: null, rating: 45, reviews: 300, isActive: true, createdBy: "user-agent-1", createdAt: new Date() },
    ];

    sampleProducts.forEach((p) => this.products.set(p.id, p));
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort(
      (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values())
      .filter((u) => u.role === role)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      id,
      username: insertUser.username,
      password: insertUser.password,
      name: insertUser.name,
      email: insertUser.email ?? null,
      phone: insertUser.phone ?? null,
      role: insertUser.role ?? "customer",
      parentId: insertUser.parentId ?? null,
      createdBy: insertUser.createdBy ?? null,
      invitationCode: insertUser.invitationCode ?? null,
      isActive: insertUser.isActive ?? true,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getUserByInvitationCode(code: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (u) => u.invitationCode?.toUpperCase() === code.toUpperCase() && u.role === "agent" && u.isActive
    );
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Members
  async getAllMembers(): Promise<Member[]> {
    return Array.from(this.members.values()).sort(
      (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getMember(id: string): Promise<Member | undefined> {
    return this.members.get(id);
  }

  async getMemberByEmail(email: string): Promise<Member | undefined> {
    return Array.from(this.members.values()).find(
      (member) => member.email.toLowerCase() === email.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email?.toLowerCase() === email.toLowerCase() || user.username.toLowerCase() === email.toLowerCase()
    );
  }

  async createMember(insertMember: InsertMember): Promise<Member> {
    const id = randomUUID();
    const member: Member = {
      id,
      name: insertMember.name,
      email: insertMember.email,
      password: insertMember.password ?? "password123",
      phone: insertMember.phone ?? null,
      balance: insertMember.balance ?? 0,
      isLocked: insertMember.isLocked ?? false,
      lockReason: insertMember.lockReason ?? null,
      withdrawalLocked: insertMember.withdrawalLocked ?? false,
      withdrawalLockReason: insertMember.withdrawalLockReason ?? null,
      status: insertMember.status ?? "pending",
      assignedAgentId: insertMember.assignedAgentId ?? null,
      bankName: insertMember.bankName ?? null,
      bankAccountNumber: insertMember.bankAccountNumber ?? null,
      bankAccountName: insertMember.bankAccountName ?? null,
      creditScore: insertMember.creditScore ?? 100,
      createdAt: new Date(),
    };
    this.members.set(id, member);
    return member;
  }

  async updateMember(id: string, updates: Partial<Member>): Promise<Member | undefined> {
    const member = this.members.get(id);
    if (!member) return undefined;
    const updated = { ...member, ...updates };
    this.members.set(id, updated);
    return updated;
  }

  async deleteMember(id: string): Promise<boolean> {
    return this.members.delete(id);
  }

  async getMembersByAgentId(agentId: string): Promise<Member[]> {
    return Array.from(this.members.values())
      .filter((m) => m.assignedAgentId === agentId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  // Deposits
  async getAllDeposits(): Promise<Deposit[]> {
    return Array.from(this.deposits.values()).sort(
      (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getDepositsByMemberIds(memberIds: string[]): Promise<Deposit[]> {
    return Array.from(this.deposits.values())
      .filter((d) => memberIds.includes(d.memberId))
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getDeposit(id: string): Promise<Deposit | undefined> {
    return this.deposits.get(id);
  }

  async createDeposit(insertDeposit: InsertDeposit): Promise<Deposit> {
    const id = randomUUID();
    const deposit: Deposit = {
      id,
      memberId: insertDeposit.memberId,
      amount: insertDeposit.amount,
      status: insertDeposit.status ?? "pending",
      rejectionReason: insertDeposit.rejectionReason ?? null,
      proofUrl: insertDeposit.proofUrl ?? null,
      processedBy: insertDeposit.processedBy ?? null,
      createdAt: new Date(),
      processedAt: null,
    };
    this.deposits.set(id, deposit);
    return deposit;
  }

  async updateDeposit(id: string, updates: Partial<Deposit>): Promise<Deposit | undefined> {
    const deposit = this.deposits.get(id);
    if (!deposit) return undefined;
    const updated = { ...deposit, ...updates };
    this.deposits.set(id, updated);
    return updated;
  }

  // Withdrawals
  async getAllWithdrawals(): Promise<Withdrawal[]> {
    return Array.from(this.withdrawals.values()).sort(
      (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getWithdrawalsByMemberIds(memberIds: string[]): Promise<Withdrawal[]> {
    return Array.from(this.withdrawals.values())
      .filter((w) => memberIds.includes(w.memberId))
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getWithdrawal(id: string): Promise<Withdrawal | undefined> {
    return this.withdrawals.get(id);
  }

  async createWithdrawal(insertWithdrawal: InsertWithdrawal): Promise<Withdrawal> {
    const id = randomUUID();
    const withdrawal: Withdrawal = {
      id,
      memberId: insertWithdrawal.memberId,
      amount: insertWithdrawal.amount,
      status: insertWithdrawal.status ?? "pending",
      rejectionReason: insertWithdrawal.rejectionReason ?? null,
      bankName: insertWithdrawal.bankName ?? null,
      accountNumber: insertWithdrawal.accountNumber ?? null,
      accountName: insertWithdrawal.accountName ?? null,
      processedBy: insertWithdrawal.processedBy ?? null,
      createdAt: new Date(),
      processedAt: null,
    };
    this.withdrawals.set(id, withdrawal);
    return withdrawal;
  }

  async updateWithdrawal(id: string, updates: Partial<Withdrawal>): Promise<Withdrawal | undefined> {
    const withdrawal = this.withdrawals.get(id);
    if (!withdrawal) return undefined;
    const updated = { ...withdrawal, ...updates };
    this.withdrawals.set(id, updated);
    return updated;
  }

  // Notifications
  async getAllNotifications(): Promise<Notification[]> {
    return Array.from(this.notifications.values()).sort(
      (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getNotificationsByMember(memberId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter((n) => n.memberId === memberId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = {
      ...insertNotification,
      id,
      type: insertNotification.type ?? "info",
      isRead: insertNotification.isRead ?? false,
      createdAt: new Date(),
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async updateNotification(id: string, data: Partial<Notification>): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;
    const updated = { ...notification, ...data };
    this.notifications.set(id, updated);
    return updated;
  }

  // Activities
  async getAllActivities(): Promise<ActivityLog[]> {
    return Array.from(this.activities.values()).sort(
      (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async createActivity(insertActivity: InsertActivityLog): Promise<ActivityLog> {
    const id = randomUUID();
    const activity: ActivityLog = {
      id,
      action: insertActivity.action,
      description: insertActivity.description,
      memberId: insertActivity.memberId ?? null,
      userId: insertActivity.userId ?? null,
      userRole: insertActivity.userRole ?? null,
      userName: insertActivity.userName ?? null,
      createdAt: new Date(),
    };
    this.activities.set(id, activity);
    return activity;
  }

  // System Banks
  async getAllSystemBanks(): Promise<SystemBank[]> {
    return Array.from(this.systemBanks.values()).sort(
      (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getActiveSystemBanks(): Promise<SystemBank[]> {
    return Array.from(this.systemBanks.values())
      .filter((b) => b.isActive)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getSystemBank(id: string): Promise<SystemBank | undefined> {
    return this.systemBanks.get(id);
  }

  async createSystemBank(insertBank: InsertSystemBank): Promise<SystemBank> {
    const id = randomUUID();
    const bank: SystemBank = {
      id,
      bankName: insertBank.bankName,
      accountNumber: insertBank.accountNumber,
      accountName: insertBank.accountName,
      isActive: insertBank.isActive ?? true,
      createdBy: insertBank.createdBy ?? null,
      createdAt: new Date(),
    };
    this.systemBanks.set(id, bank);
    return bank;
  }

  async updateSystemBank(id: string, updates: Partial<SystemBank>): Promise<SystemBank | undefined> {
    const bank = this.systemBanks.get(id);
    if (!bank) return undefined;
    const updated = { ...bank, ...updates };
    this.systemBanks.set(id, updated);
    return updated;
  }

  async deleteSystemBank(id: string): Promise<boolean> {
    return this.systemBanks.delete(id);
  }

  // Products
  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).sort(
      (a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getActiveProducts(): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter((p) => p.isActive)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = {
      id,
      name: insertProduct.name,
      price: insertProduct.price,
      category: insertProduct.category,
      imageUrl: insertProduct.imageUrl ?? null,
      rating: insertProduct.rating ?? 0,
      reviews: insertProduct.reviews ?? 0,
      isActive: insertProduct.isActive ?? true,
      createdBy: insertProduct.createdBy ?? null,
      createdAt: new Date(),
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    const updated = { ...product, ...updates };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }
}

import { DatabaseStorage } from "./dbStorage";

export const storage = new DatabaseStorage();

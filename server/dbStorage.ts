import { eq, desc, inArray, and, or, ilike } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  members,
  deposits,
  withdrawals,
  notifications,
  activityLogs,
  systemBanks,
  products,
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
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      or(
        ilike(users.email, email),
        ilike(users.username, email)
      )
    );
    return user;
  }

  async getUserByInvitationCode(code: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      and(
        ilike(users.invitationCode, code),
        eq(users.role, "agent"),
        eq(users.isActive, true)
      )
    );
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, role)).orderBy(desc(users.createdAt));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async getAllMembers(): Promise<Member[]> {
    return db.select().from(members).orderBy(desc(members.createdAt));
  }

  async getMembersByAgentId(agentId: string): Promise<Member[]> {
    return db.select().from(members).where(eq(members.assignedAgentId, agentId)).orderBy(desc(members.createdAt));
  }

  async getMember(id: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member;
  }

  async getMemberByEmail(email: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(ilike(members.email, email));
    return member;
  }

  async createMember(insertMember: InsertMember): Promise<Member> {
    const [member] = await db.insert(members).values(insertMember).returning();
    return member;
  }

  async updateMember(id: string, updates: Partial<Member>): Promise<Member | undefined> {
    const [member] = await db.update(members).set(updates).where(eq(members.id, id)).returning();
    return member;
  }

  async deleteMember(id: string): Promise<boolean> {
    const result = await db.delete(members).where(eq(members.id, id)).returning();
    return result.length > 0;
  }

  async getAllDeposits(): Promise<Deposit[]> {
    return db.select().from(deposits).orderBy(desc(deposits.createdAt));
  }

  async getDepositsByMemberIds(memberIds: string[]): Promise<Deposit[]> {
    if (memberIds.length === 0) return [];
    return db.select().from(deposits).where(inArray(deposits.memberId, memberIds)).orderBy(desc(deposits.createdAt));
  }

  async getDeposit(id: string): Promise<Deposit | undefined> {
    const [deposit] = await db.select().from(deposits).where(eq(deposits.id, id));
    return deposit;
  }

  async createDeposit(insertDeposit: InsertDeposit): Promise<Deposit> {
    const [deposit] = await db.insert(deposits).values(insertDeposit).returning();
    return deposit;
  }

  async updateDeposit(id: string, updates: Partial<Deposit>): Promise<Deposit | undefined> {
    const [deposit] = await db.update(deposits).set(updates).where(eq(deposits.id, id)).returning();
    return deposit;
  }

  async getAllWithdrawals(): Promise<Withdrawal[]> {
    return db.select().from(withdrawals).orderBy(desc(withdrawals.createdAt));
  }

  async getWithdrawalsByMemberIds(memberIds: string[]): Promise<Withdrawal[]> {
    if (memberIds.length === 0) return [];
    return db.select().from(withdrawals).where(inArray(withdrawals.memberId, memberIds)).orderBy(desc(withdrawals.createdAt));
  }

  async getWithdrawal(id: string): Promise<Withdrawal | undefined> {
    const [withdrawal] = await db.select().from(withdrawals).where(eq(withdrawals.id, id));
    return withdrawal;
  }

  async createWithdrawal(insertWithdrawal: InsertWithdrawal): Promise<Withdrawal> {
    const [withdrawal] = await db.insert(withdrawals).values(insertWithdrawal).returning();
    return withdrawal;
  }

  async updateWithdrawal(id: string, updates: Partial<Withdrawal>): Promise<Withdrawal | undefined> {
    const [withdrawal] = await db.update(withdrawals).set(updates).where(eq(withdrawals.id, id)).returning();
    return withdrawal;
  }

  async getAllNotifications(): Promise<Notification[]> {
    return db.select().from(notifications).orderBy(desc(notifications.createdAt));
  }

  async getNotificationsByMember(memberId: string): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.memberId, memberId)).orderBy(desc(notifications.createdAt));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(insertNotification).returning();
    return notification;
  }

  async updateNotification(id: string, data: Partial<Notification>): Promise<Notification | undefined> {
    const [notification] = await db.update(notifications).set(data).where(eq(notifications.id, id)).returning();
    return notification;
  }

  async getAllActivities(): Promise<ActivityLog[]> {
    return db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt));
  }

  async createActivity(insertActivity: InsertActivityLog): Promise<ActivityLog> {
    const [activity] = await db.insert(activityLogs).values(insertActivity).returning();
    return activity;
  }

  async getAllSystemBanks(): Promise<SystemBank[]> {
    return db.select().from(systemBanks).orderBy(desc(systemBanks.createdAt));
  }

  async getActiveSystemBanks(): Promise<SystemBank[]> {
    return db.select().from(systemBanks).where(eq(systemBanks.isActive, true)).orderBy(desc(systemBanks.createdAt));
  }

  async getSystemBank(id: string): Promise<SystemBank | undefined> {
    const [bank] = await db.select().from(systemBanks).where(eq(systemBanks.id, id));
    return bank;
  }

  async createSystemBank(insertBank: InsertSystemBank): Promise<SystemBank> {
    const [bank] = await db.insert(systemBanks).values(insertBank).returning();
    return bank;
  }

  async updateSystemBank(id: string, updates: Partial<SystemBank>): Promise<SystemBank | undefined> {
    const [bank] = await db.update(systemBanks).set(updates).where(eq(systemBanks.id, id)).returning();
    return bank;
  }

  async deleteSystemBank(id: string): Promise<boolean> {
    const result = await db.delete(systemBanks).where(eq(systemBanks.id, id)).returning();
    return result.length > 0;
  }

  async getAllProducts(): Promise<Product[]> {
    return db.select().from(products).orderBy(desc(products.createdAt));
  }

  async getActiveProducts(): Promise<Product[]> {
    return db.select().from(products).where(eq(products.isActive, true)).orderBy(desc(products.createdAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const [product] = await db.update(products).set(updates).where(eq(products.id, id)).returning();
    return product;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id)).returning();
    return result.length > 0;
  }
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMemberSchema, insertDepositSchema, insertWithdrawalSchema, insertProductSchema, type Withdrawal } from "@shared/schema";
import { z } from "zod";

// Login schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Register schema
const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(6),
  invitationCode: z.string().min(1, "Kode undangan wajib diisi"),
});

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ============ AUTHENTICATION ============

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      // First check system users (master, admin, agent)
      const systemUser = await storage.getUserByEmail(email);
      if (systemUser) {
        if (systemUser.password !== password) {
          return res.status(401).json({ error: "Password salah" });
        }
        if (!systemUser.isActive) {
          return res.status(403).json({ error: "Akun Anda tidak aktif. Hubungi administrator." });
        }
        // Return user info (exclude password)
        const { password: _, ...userWithoutPassword } = systemUser;
        return res.json({
          user: {
            id: systemUser.id,
            name: systemUser.name,
            email: systemUser.email,
            role: systemUser.role,
          },
          message: "Login berhasil",
        });
      }

      // Check members (customers)
      const member = await storage.getMemberByEmail(email);
      if (!member) {
        return res.status(401).json({ error: "Email tidak ditemukan" });
      }

      if (member.password !== password) {
        return res.status(401).json({ error: "Password salah" });
      }

      // Check member status
      if (member.status === "pending") {
        return res.status(403).json({ 
          error: "Akun Anda masih menunggu persetujuan Admin. Silakan tunggu konfirmasi.",
          status: "pending"
        });
      }

      if (member.status === "suspended" || member.isLocked) {
        return res.status(403).json({ 
          error: member.lockReason || "Akun Anda telah dikunci. Hubungi admin untuk informasi lebih lanjut.",
          status: "locked"
        });
      }

      if (member.status === "rejected") {
        return res.status(403).json({ 
          error: "Pendaftaran Anda ditolak. Hubungi admin untuk informasi lebih lanjut.",
          status: "rejected"
        });
      }

      // Return member info as customer
      return res.json({
        user: {
          id: member.id,
          name: member.name,
          email: member.email,
          role: "customer",
        },
        message: "Login berhasil",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Data login tidak valid" });
      }
      res.status(500).json({ error: "Gagal melakukan login" });
    }
  });

  // Session refresh endpoint
  app.get("/api/auth/session", async (req, res) => {
    try {
      const email = req.query.email as string;
      if (!email) {
        return res.status(400).json({ error: "Email diperlukan" });
      }

      // Check system users first
      const systemUser = await storage.getUserByEmail(email);
      if (systemUser) {
        if (!systemUser.isActive) {
          return res.status(403).json({ error: "Akun tidak aktif" });
        }
        return res.json({
          user: {
            id: systemUser.id,
            name: systemUser.name,
            email: systemUser.email,
            role: systemUser.role,
          },
        });
      }

      // Check members
      const member = await storage.getMemberByEmail(email);
      if (!member) {
        return res.status(404).json({ error: "User tidak ditemukan" });
      }

      if (member.status !== "active" || member.isLocked) {
        return res.status(403).json({ error: "Akun tidak aktif" });
      }

      return res.json({
        user: {
          id: member.id,
          name: member.name,
          email: member.email,
          role: "customer",
        },
      });
    } catch {
      res.status(500).json({ error: "Gagal memperbarui sesi" });
    }
  });

  // Register endpoint (for customers only)
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);

      // Validate invitation code - find the agent
      const agent = await storage.getUserByInvitationCode(data.invitationCode);
      if (!agent) {
        return res.status(400).json({ error: "Kode undangan tidak valid atau agent tidak aktif" });
      }

      // Check if email already exists
      const existingMember = await storage.getMemberByEmail(data.email);
      if (existingMember) {
        return res.status(400).json({ error: "Email sudah terdaftar" });
      }

      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email sudah terdaftar" });
      }

      // Create new member with pending status - assigned to the agent from invitation code
      const member = await storage.createMember({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        status: "pending",
        balance: 0,
        isLocked: false,
        withdrawalLocked: false,
        assignedAgentId: agent.id, // Assign to the agent who owns the invitation code
      });

      // Create activity log
      await storage.createActivity({
        action: "Pendaftaran Baru",
        description: `${member.name} mendaftar melalui kode undangan ${agent.name} dan menunggu persetujuan`,
        memberId: member.id,
        userId: agent.id,
        userRole: "agent",
        userName: agent.name,
      });

      res.status(201).json({
        message: `Pendaftaran berhasil! Anda terdaftar di bawah Agent ${agent.name}. Akun Anda akan diaktifkan setelah disetujui.`,
        status: "pending",
        agentName: agent.name,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Gagal melakukan pendaftaran" });
    }
  });

  // Verify invitation code endpoint
  app.get("/api/verify-invitation/:code", async (req, res) => {
    try {
      const code = req.params.code;
      const agent = await storage.getUserByInvitationCode(code);
      
      if (!agent) {
        return res.status(404).json({ valid: false, error: "Kode undangan tidak ditemukan" });
      }
      
      return res.json({ 
        valid: true, 
        agentName: agent.name,
        agentId: agent.id 
      });
    } catch (error) {
      res.status(500).json({ valid: false, error: "Gagal memverifikasi kode" });
    }
  });

  // ============ USER MANAGEMENT ============

  // Get all users (filtered by role)
  app.get("/api/users", async (req, res) => {
    try {
      const { role } = req.query;
      let users;
      if (role) {
        users = await storage.getUsersByRole(role as string);
      } else {
        users = await storage.getAllUsers();
      }
      // Remove password from response
      const safeUsers = users.map(({ password, ...rest }) => rest);
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ error: "Gagal mengambil data user" });
    }
  });

  // Get single user
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User tidak ditemukan" });
      }
      const { password, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ error: "Gagal mengambil data user" });
    }
  });

  // Create new user (admin/agent)
  app.post("/api/users", async (req, res) => {
    try {
      const { name, email, password, role, parentId, createdBy, phone } = req.body;
      
      // Check if email already exists
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: "Email sudah terdaftar" });
      }

      // Generate invitation code for agents
      let invitationCode: string | null = null;
      if (role === "agent") {
        // Generate unique code based on name
        const namePrefix = name.replace(/\s+/g, '').toUpperCase().slice(0, 6);
        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        invitationCode = `${namePrefix}${randomSuffix}`;
        
        // Check if code already exists and regenerate if needed
        let existingCode = await storage.getUserByInvitationCode(invitationCode);
        let attempts = 0;
        while (existingCode && attempts < 10) {
          const newSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
          invitationCode = `${namePrefix}${newSuffix}`;
          existingCode = await storage.getUserByInvitationCode(invitationCode);
          attempts++;
        }
      }

      const user = await storage.createUser({
        username: email,
        email,
        password,
        name,
        phone: phone || null,
        role,
        parentId: parentId || null,
        createdBy: createdBy || null,
        invitationCode,
        isActive: true,
      });

      await storage.createActivity({
        action: `${role === "admin" ? "Admin" : "Agent"} Baru Dibuat`,
        description: `${name} ditambahkan sebagai ${role}${invitationCode ? ` dengan kode undangan ${invitationCode}` : ''}`,
        userId: createdBy,
        userRole: role,
      });

      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      res.status(500).json({ error: "Gagal membuat user" });
    }
  });

  // Update user
  app.patch("/api/users/:id", async (req, res) => {
    try {
      const updates = req.body;
      const user = await storage.getUser(req.params.id);
      
      if (!user) {
        return res.status(404).json({ error: "User tidak ditemukan" });
      }

      const updated = await storage.updateUser(req.params.id, updates);
      if (updated) {
        const { password, ...safeUser } = updated;
        res.json(safeUser);
      } else {
        res.status(404).json({ error: "Gagal mengupdate user" });
      }
    } catch (error) {
      res.status(500).json({ error: "Gagal mengupdate user" });
    }
  });

  // Delete user
  app.delete("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User tidak ditemukan" });
      }
      
      const deleted = await storage.deleteUser(req.params.id);
      if (deleted) {
        res.json({ message: "User berhasil dihapus" });
      } else {
        res.status(500).json({ error: "Gagal menghapus user" });
      }
    } catch (error) {
      res.status(500).json({ error: "Gagal menghapus user" });
    }
  });

  // Update member status (for ACC/reject) - requires processedBy info for audit trail
  app.patch("/api/members/:id", async (req, res) => {
    try {
      const { status, processedBy, processedByRole, rejectionReason, ...updateData } = req.body;
      const member = await storage.getMember(req.params.id);
      
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      // Server-side validation: If agent is processing, verify member belongs to them
      if (processedByRole === "agent" && processedBy) {
        const agentMembers = await storage.getMembersByAgentId(processedBy);
        const isOwned = agentMembers.some(m => m.id === member.id);
        if (!isOwned) {
          return res.status(403).json({ error: "Tidak memiliki akses ke anggota ini" });
        }
      }

      // Build update object with all provided fields
      const fieldsToUpdate: Record<string, any> = { ...updateData };
      if (status !== undefined) {
        fieldsToUpdate.status = status;
      }

      const updated = await storage.updateMember(req.params.id, fieldsToUpdate);

      // Create notification for member
      if (status === "active") {
        await storage.createNotification({
          memberId: member.id,
          title: "Akun Disetujui",
          message: "Selamat! Akun Anda telah disetujui. Anda sekarang dapat login ke sistem.",
          type: "success",
        });
        const approver = await storage.getUser(processedBy);
        await storage.createActivity({
          action: "Akun Disetujui",
          description: `Akun ${member.name} telah disetujui`,
          memberId: member.id,
          userId: processedBy,
          userRole: processedByRole,
          userName: approver?.name || null,
        });
      } else if (status === "rejected") {
        await storage.createNotification({
          memberId: member.id,
          title: "Pendaftaran Ditolak",
          message: rejectionReason || "Maaf, pendaftaran Anda telah ditolak. Silakan hubungi admin untuk informasi lebih lanjut.",
          type: "error",
        });
        const rejecter = await storage.getUser(processedBy);
        await storage.createActivity({
          action: "Pendaftaran Ditolak",
          description: `Pendaftaran ${member.name} telah ditolak. Alasan: ${rejectionReason || "-"}`,
          memberId: member.id,
          userId: processedBy,
          userRole: processedByRole,
          userName: rejecter?.name || null,
        });
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update member" });
    }
  });

  // ============ MEMBERS ============

  // Get all members (filtered by agentId for agents)
  app.get("/api/members", async (req, res) => {
    try {
      const { agentId } = req.query;
      let members;
      if (agentId) {
        // Agent can only see their assigned members
        members = await storage.getMembersByAgentId(agentId as string);
      } else {
        // Master/Admin can see all members
        members = await storage.getAllMembers();
      }
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch members" });
    }
  });

  // Get single member
  app.get("/api/members/:id", async (req, res) => {
    try {
      const member = await storage.getMember(req.params.id);
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }
      res.json(member);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch member" });
    }
  });

  // Register member (agent registers a new customer)
  app.post("/api/members/register", async (req, res) => {
    try {
      const { name, email, phone, password, agentId, invitationCode } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: "Nama, email, dan kata sandi wajib diisi" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Kata sandi minimal 6 karakter" });
      }

      // Check if email already exists
      const existingMember = await storage.getMemberByEmail(email);
      if (existingMember) {
        return res.status(400).json({ error: "Email sudah terdaftar" });
      }

      // Create the member with status active (direct registration by agent)
      const member = await storage.createMember({
        name,
        email,
        phone: phone || null,
        password,
        assignedAgentId: agentId || null,
        status: "active",
        balance: 0,
        isLocked: false,
        withdrawalLocked: false,
      });

      await storage.createActivity({
        action: "Registrasi Pelanggan",
        description: `${member.name} telah didaftarkan oleh agent`,
        memberId: member.id,
      });

      res.status(201).json(member);
    } catch (error) {
      console.error("Register member error:", error);
      res.status(500).json({ error: "Gagal mendaftarkan pelanggan" });
    }
  });

  // Create member
  app.post("/api/members", async (req, res) => {
    try {
      const data = insertMemberSchema.parse(req.body);
      const member = await storage.createMember(data);
      
      await storage.createActivity({
        action: "Anggota Baru",
        description: `${member.name} telah ditambahkan sebagai anggota baru`,
        memberId: member.id,
      });

      res.status(201).json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create member" });
    }
  });

  // Lock/Unlock member account
  app.patch("/api/members/:id/lock", async (req, res) => {
    try {
      const { isLocked, lockReason } = req.body;
      const member = await storage.getMember(req.params.id);
      
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      const updated = await storage.updateMember(req.params.id, {
        isLocked,
        lockReason: isLocked ? lockReason : null,
        status: isLocked ? "suspended" : "active",
      });

      // Create notification for member
      if (isLocked) {
        await storage.createNotification({
          memberId: member.id,
          title: "Akun Anda Dikunci",
          message: lockReason || "Akun Anda telah dikunci oleh admin. Silakan hubungi admin untuk informasi lebih lanjut.",
          type: "error",
        });
      }

      await storage.createActivity({
        action: isLocked ? "Akun Dikunci" : "Akun Dibuka",
        description: isLocked
          ? `Akun ${member.name} telah dikunci. Alasan: ${lockReason}`
          : `Akun ${member.name} telah dibuka kembali`,
        memberId: member.id,
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update member" });
    }
  });

  // Top up member balance
  app.post("/api/members/:id/topup", async (req, res) => {
    try {
      const { amount } = req.body;
      const member = await storage.getMember(req.params.id);
      
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      const newBalance = (member.balance || 0) + amount;
      const updated = await storage.updateMember(req.params.id, {
        balance: newBalance,
      });

      await storage.createActivity({
        action: "Top Up Saldo",
        description: `Saldo ${member.name} ditambahkan ${formatCurrency(amount)} oleh admin`,
        memberId: member.id,
      });

      await storage.createNotification({
        memberId: member.id,
        title: "Saldo Ditambahkan",
        message: `Saldo Anda telah ditambahkan sebesar ${formatCurrency(amount)}. Saldo saat ini: ${formatCurrency(newBalance)}`,
        type: "success",
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to top up balance" });
    }
  });

  // Lock withdrawal
  app.patch("/api/members/:id/lock-withdrawal", async (req, res) => {
    try {
      const { reason, userId, userRole, userName } = req.body;
      const member = await storage.getMember(req.params.id);
      
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      const updated = await storage.updateMember(req.params.id, {
        withdrawalLocked: true,
        withdrawalLockReason: reason || "Penarikan dikunci oleh admin",
      });

      await storage.createNotification({
        memberId: member.id,
        title: "Penarikan Dikunci",
        message: `Fitur penarikan Anda telah dikunci. Alasan: ${reason || "Silakan hubungi admin untuk informasi lebih lanjut."}`,
        type: "warning",
      });

      await storage.createActivity({
        action: "Penarikan Dikunci",
        description: `Penarikan untuk ${member.name} telah dikunci. Alasan: ${reason || "-"}`,
        memberId: member.id,
        userId: userId || null,
        userRole: userRole || null,
        userName: userName || null,
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to lock withdrawal" });
    }
  });

  // Unlock withdrawal
  app.patch("/api/members/:id/unlock-withdrawal", async (req, res) => {
    try {
      const member = await storage.getMember(req.params.id);
      
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      const updated = await storage.updateMember(req.params.id, {
        withdrawalLocked: false,
        withdrawalLockReason: null,
      });

      await storage.createNotification({
        memberId: member.id,
        title: "Penarikan Dibuka",
        message: "Anda sekarang dapat melakukan penarikan kembali.",
        type: "success",
      });

      await storage.createActivity({
        action: "Penarikan Dibuka",
        description: `Penarikan untuk ${member.name} telah dibuka kembali`,
        memberId: member.id,
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to unlock withdrawal" });
    }
  });

  // ============ DEPOSITS ============

  // Get all deposits (filtered by agentId for agents)
  app.get("/api/deposits", async (req, res) => {
    try {
      const { agentId } = req.query;
      let deposits;
      
      if (agentId) {
        // Agent can only see deposits from their assigned members
        const agentMembers = await storage.getMembersByAgentId(agentId as string);
        const memberIds = agentMembers.map(m => m.id);
        deposits = await storage.getDepositsByMemberIds(memberIds);
      } else {
        // Master/Admin can see all deposits
        deposits = await storage.getAllDeposits();
      }
      res.json(deposits);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deposits" });
    }
  });

  // Create deposit
  app.post("/api/deposits", async (req, res) => {
    try {
      const data = insertDepositSchema.parse(req.body);
      const deposit = await storage.createDeposit(data);
      res.status(201).json(deposit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create deposit" });
    }
  });

  // Approve deposit - with ownership validation and audit trail
  app.post("/api/deposits/:id/approve", async (req, res) => {
    try {
      const { processedBy, processedByRole } = req.body;
      const deposit = await storage.getDeposit(req.params.id);
      
      if (!deposit) {
        return res.status(404).json({ error: "Deposit not found" });
      }

      if (deposit.status !== "pending") {
        return res.status(400).json({ error: "Deposit already processed" });
      }

      // Server-side validation: If agent is processing, verify deposit belongs to their member
      if (processedByRole === "agent" && processedBy) {
        const agentMembers = await storage.getMembersByAgentId(processedBy);
        const memberIds = agentMembers.map(m => m.id);
        if (!memberIds.includes(deposit.memberId)) {
          return res.status(403).json({ error: "Tidak memiliki akses ke deposit ini" });
        }
      }

      // Update deposit status
      const updated = await storage.updateDeposit(req.params.id, {
        status: "approved",
        processedBy,
        processedAt: new Date(),
      });

      // Add balance to member
      const member = await storage.getMember(deposit.memberId);
      if (member) {
        const newBalance = (member.balance || 0) + deposit.amount;
        await storage.updateMember(deposit.memberId, {
          balance: newBalance,
        });

        await storage.createNotification({
          memberId: member.id,
          title: "Deposit Disetujui",
          message: `Deposit Anda sebesar ${formatCurrency(deposit.amount)} telah disetujui. Saldo saat ini: ${formatCurrency(newBalance)}`,
          type: "success",
        });

        const depositApprover = await storage.getUser(processedBy);
        await storage.createActivity({
          action: "Deposit Disetujui",
          description: `Deposit sebesar ${formatCurrency(deposit.amount)} untuk ${member.name} telah disetujui`,
          memberId: member.id,
          userId: processedBy,
          userRole: processedByRole,
          userName: depositApprover?.name || null,
        });
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to approve deposit" });
    }
  });

  // Reject deposit - with ownership validation and audit trail
  app.post("/api/deposits/:id/reject", async (req, res) => {
    try {
      const { reason, processedBy, processedByRole } = req.body;
      const deposit = await storage.getDeposit(req.params.id);
      
      if (!deposit) {
        return res.status(404).json({ error: "Deposit not found" });
      }

      if (deposit.status !== "pending") {
        return res.status(400).json({ error: "Deposit already processed" });
      }

      // Server-side validation: If agent is processing, verify deposit belongs to their member
      if (processedByRole === "agent" && processedBy) {
        const agentMembers = await storage.getMembersByAgentId(processedBy);
        const memberIds = agentMembers.map(m => m.id);
        if (!memberIds.includes(deposit.memberId)) {
          return res.status(403).json({ error: "Tidak memiliki akses ke deposit ini" });
        }
      }

      const updated = await storage.updateDeposit(req.params.id, {
        status: "rejected",
        rejectionReason: reason,
        processedBy,
        processedAt: new Date(),
      });

      const member = await storage.getMember(deposit.memberId);
      if (member) {
        await storage.createNotification({
          memberId: member.id,
          title: "Deposit Ditolak",
          message: `Deposit Anda sebesar ${formatCurrency(deposit.amount)} telah ditolak. Alasan: ${reason}`,
          type: "error",
        });

        const depositRejecter = await storage.getUser(processedBy);
        await storage.createActivity({
          action: "Deposit Ditolak",
          description: `Deposit sebesar ${formatCurrency(deposit.amount)} untuk ${member.name} ditolak. Alasan: ${reason}`,
          memberId: member.id,
          userId: processedBy,
          userRole: processedByRole,
          userName: depositRejecter?.name || null,
        });
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to reject deposit" });
    }
  });

  // ============ WITHDRAWALS ============

  // Get all withdrawals (filtered by agentId for agents)
  app.get("/api/withdrawals", async (req, res) => {
    try {
      const { agentId } = req.query;
      let withdrawals;
      
      if (agentId) {
        // Agent can only see withdrawals from their assigned members
        const agentMembers = await storage.getMembersByAgentId(agentId as string);
        const memberIds = agentMembers.map(m => m.id);
        withdrawals = await storage.getWithdrawalsByMemberIds(memberIds);
      } else {
        // Master/Admin can see all withdrawals
        withdrawals = await storage.getAllWithdrawals();
      }
      res.json(withdrawals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch withdrawals" });
    }
  });

  // Create withdrawal - deduct balance immediately on pending
  app.post("/api/withdrawals", async (req, res) => {
    try {
      const data = insertWithdrawalSchema.parse(req.body);
      
      // Check if member has pending withdrawal
      const memberWithdrawals = await storage.getWithdrawalsByMemberIds([data.memberId]);
      const pendingWithdrawal = memberWithdrawals.find(
        (w: Withdrawal) => w.status === "pending"
      );
      if (pendingWithdrawal) {
        return res.status(400).json({ 
          error: "Anda masih memiliki penarikan yang sedang diproses. Silakan tunggu hingga penarikan sebelumnya disetujui atau ditolak." 
        });
      }
      
      // Check member balance
      const member = await storage.getMember(data.memberId);
      if (!member) {
        return res.status(404).json({ error: "Member tidak ditemukan" });
      }
      
      if ((member.balance || 0) < data.amount) {
        return res.status(400).json({ error: "Saldo tidak mencukupi" });
      }
      
      // Deduct balance FIRST before creating withdrawal (atomic-like behavior)
      const newBalance = (member.balance || 0) - data.amount;
      await storage.updateMember(data.memberId, { balance: newBalance });
      
      try {
        // Create withdrawal after balance is deducted
        const withdrawal = await storage.createWithdrawal(data);
        
        // Create notification
        await storage.createNotification({
          memberId: member.id,
          title: "Penarikan Diajukan",
          message: `Penarikan sebesar ${formatCurrency(data.amount)} sedang diproses. Saldo saat ini: ${formatCurrency(newBalance)}`,
          type: "info",
        });
        
        res.status(201).json(withdrawal);
      } catch (withdrawalError) {
        // Rollback: restore balance if withdrawal creation fails
        await storage.updateMember(data.memberId, { balance: member.balance || 0 });
        throw withdrawalError;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create withdrawal" });
    }
  });

  // Approve withdrawal - with ownership validation and audit trail
  app.post("/api/withdrawals/:id/approve", async (req, res) => {
    try {
      const { processedBy, processedByRole } = req.body;
      const withdrawal = await storage.getWithdrawal(req.params.id);
      
      if (!withdrawal) {
        return res.status(404).json({ error: "Withdrawal not found" });
      }

      if (withdrawal.status !== "pending") {
        return res.status(400).json({ error: "Withdrawal already processed" });
      }

      // Server-side validation: If agent is processing, verify withdrawal belongs to their member
      if (processedByRole === "agent" && processedBy) {
        const agentMembers = await storage.getMembersByAgentId(processedBy);
        const memberIds = agentMembers.map(m => m.id);
        if (!memberIds.includes(withdrawal.memberId)) {
          return res.status(403).json({ error: "Tidak memiliki akses ke penarikan ini" });
        }
      }

      const member = await storage.getMember(withdrawal.memberId);
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      // Balance already deducted when withdrawal was created (pending status)
      // Update withdrawal status only
      const updated = await storage.updateWithdrawal(req.params.id, {
        status: "approved",
        processedBy,
        processedAt: new Date(),
      });

      await storage.createNotification({
        memberId: member.id,
        title: "Penarikan Disetujui",
        message: `Penarikan Anda sebesar ${formatCurrency(withdrawal.amount)} telah diproses dan akan segera ditransfer.`,
        type: "success",
      });

      const withdrawalApprover = await storage.getUser(processedBy);
      await storage.createActivity({
        action: "Penarikan Disetujui",
        description: `Penarikan sebesar ${formatCurrency(withdrawal.amount)} untuk ${member.name} telah diproses`,
        memberId: member.id,
        userId: processedBy,
        userRole: processedByRole,
        userName: withdrawalApprover?.name || null,
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to approve withdrawal" });
    }
  });

  // Reject withdrawal - with ownership validation and audit trail
  app.post("/api/withdrawals/:id/reject", async (req, res) => {
    try {
      const { reason, lockWithdrawal, processedBy, processedByRole } = req.body;
      const withdrawal = await storage.getWithdrawal(req.params.id);
      
      if (!withdrawal) {
        return res.status(404).json({ error: "Withdrawal not found" });
      }

      if (withdrawal.status !== "pending") {
        return res.status(400).json({ error: "Withdrawal already processed" });
      }

      // Server-side validation: If agent is processing, verify withdrawal belongs to their member
      if (processedByRole === "agent" && processedBy) {
        const agentMembers = await storage.getMembersByAgentId(processedBy);
        const memberIds = agentMembers.map(m => m.id);
        if (!memberIds.includes(withdrawal.memberId)) {
          return res.status(403).json({ error: "Tidak memiliki akses ke penarikan ini" });
        }
      }

      const updated = await storage.updateWithdrawal(req.params.id, {
        status: "rejected",
        rejectionReason: reason,
        processedBy,
        processedAt: new Date(),
      });

      const member = await storage.getMember(withdrawal.memberId);
      if (member) {
        // Refund the balance since withdrawal was rejected (only once - status already checked above)
        const newBalance = (member.balance || 0) + withdrawal.amount;
        await storage.updateMember(withdrawal.memberId, { balance: newBalance });
        
        // Add refund notification
        await storage.createNotification({
          memberId: member.id,
          title: "Saldo Dikembalikan",
          message: `Saldo sebesar ${formatCurrency(withdrawal.amount)} telah dikembalikan karena penarikan ditolak. Saldo saat ini: ${formatCurrency(newBalance)}`,
          type: "info",
        });
        
        // Lock withdrawal if requested
        if (lockWithdrawal) {
          await storage.updateMember(withdrawal.memberId, {
            withdrawalLocked: true,
            withdrawalLockReason: reason,
          });

          await storage.createNotification({
            memberId: member.id,
            title: "Penarikan Anda Dikunci",
            message: `Penarikan Anda telah dikunci. Alasan: ${reason}. Silakan hubungi admin untuk informasi lebih lanjut.`,
            type: "warning",
          });
        }

        await storage.createNotification({
          memberId: member.id,
          title: "Penarikan Ditolak",
          message: `Penarikan Anda sebesar ${formatCurrency(withdrawal.amount)} telah ditolak. Alasan: ${reason}`,
          type: "error",
        });

        const withdrawalRejecter = await storage.getUser(processedBy);
        await storage.createActivity({
          action: "Penarikan Ditolak",
          description: `Penarikan sebesar ${formatCurrency(withdrawal.amount)} untuk ${member.name} ditolak. Alasan: ${reason}${lockWithdrawal ? ". Penarikan dikunci." : ""}`,
          memberId: member.id,
          userId: processedBy,
          userRole: processedByRole,
          userName: withdrawalRejecter?.name || null,
        });
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to reject withdrawal" });
    }
  });

  // ============ NOTIFICATIONS ============

  // Get all notifications
  app.get("/api/notifications", async (req, res) => {
    try {
      const notifications = await storage.getAllNotifications();
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Get notifications by member
  app.get("/api/notifications/member/:memberId", async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByMember(req.params.memberId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const updated = await storage.updateNotification(req.params.id, { isRead: true });
      if (!updated) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read for a member
  app.patch("/api/notifications/member/:memberId/read-all", async (req, res) => {
    try {
      const notifications = await storage.getNotificationsByMember(req.params.memberId);
      const unreadNotifications = notifications.filter(n => !n.isRead);
      
      for (const notification of unreadNotifications) {
        await storage.updateNotification(notification.id, { isRead: true });
      }
      
      res.json({ success: true, count: unreadNotifications.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notifications as read" });
    }
  });

  // ============ ACTIVITIES ============

  // Get all activities
  app.get("/api/activities", async (req, res) => {
    try {
      const activities = await storage.getAllActivities();
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  // ============ SYSTEM BANKS ============

  // Get all system banks
  app.get("/api/system-banks", async (req, res) => {
    try {
      const banks = await storage.getAllSystemBanks();
      res.json(banks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch system banks" });
    }
  });

  // Get active system banks (for customer deposit)
  app.get("/api/system-banks/active", async (req, res) => {
    try {
      const banks = await storage.getActiveSystemBanks();
      res.json(banks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active system banks" });
    }
  });

  // Create system bank
  app.post("/api/system-banks", async (req, res) => {
    try {
      const bank = await storage.createSystemBank(req.body);
      res.status(201).json(bank);
    } catch (error) {
      res.status(500).json({ error: "Failed to create system bank" });
    }
  });

  // Update system bank
  app.patch("/api/system-banks/:id", async (req, res) => {
    try {
      const bank = await storage.updateSystemBank(req.params.id, req.body);
      if (!bank) {
        return res.status(404).json({ error: "System bank not found" });
      }
      res.json(bank);
    } catch (error) {
      res.status(500).json({ error: "Failed to update system bank" });
    }
  });

  // Delete system bank
  app.delete("/api/system-banks/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSystemBank(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "System bank not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete system bank" });
    }
  });

  // ============ ACTIVITY LOGS (AUDIT TRAIL) ============

  // Get all activity logs with optional filters
  app.get("/api/activity-logs", async (req, res) => {
    try {
      const activities = await storage.getAllActivities();
      
      // Apply filters if provided
      const { action, userRole, userId, memberId, startDate, endDate } = req.query;
      
      let filtered = activities;
      
      if (action) {
        filtered = filtered.filter(a => a.action === action);
      }
      if (userRole) {
        filtered = filtered.filter(a => a.userRole === userRole);
      }
      if (userId) {
        filtered = filtered.filter(a => a.userId === userId);
      }
      if (memberId) {
        filtered = filtered.filter(a => a.memberId === memberId);
      }
      if (startDate) {
        const start = new Date(startDate as string);
        filtered = filtered.filter(a => a.createdAt && new Date(a.createdAt) >= start);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        filtered = filtered.filter(a => a.createdAt && new Date(a.createdAt) <= end);
      }
      
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  // Create activity log (for manual logging if needed)
  app.post("/api/activity-logs", async (req, res) => {
    try {
      const { action, description, memberId, userId, userRole, userName } = req.body;
      
      if (!action || !description) {
        return res.status(400).json({ error: "Action and description are required" });
      }
      
      const activity = await storage.createActivity({
        action,
        description,
        memberId,
        userId,
        userRole,
        userName,
      });
      
      res.status(201).json(activity);
    } catch (error) {
      res.status(500).json({ error: "Failed to create activity log" });
    }
  });

  // ============ PRODUCTS ============

  // Get all products (for management)
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Get active products (for customer mall)
  app.get("/api/products/active", async (req, res) => {
    try {
      const products = await storage.getActiveProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Create product
  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      res.status(400).json({ error: "Invalid product data" });
    }
  });

  // Update product
  app.patch("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.updateProduct(req.params.id, req.body);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  // Delete product
  app.delete("/api/products/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProduct(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  return httpServer;
}

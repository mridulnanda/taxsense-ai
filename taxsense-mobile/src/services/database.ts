import SQLite from 'react-native-sqlite-storage';
import { Scenario, IncomeEntry, DeductionEntry, TaxComputation } from '@/types';

SQLite.DEBUG(false);

const DB_NAME = 'taxsense.db';
const DB_VERSION = 1;

let db: SQLite.SQLiteDatabase | null = null;

export const database = {
  async initialize(): Promise<void> {
    try {
      db = await SQLite.openDatabase({
        name: DB_NAME,
        location: 'default',
        createFromLocation: 0,
      });

      await this.createTables();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  },

  private async createTables(): Promise<void> {
    if (!db) throw new Error('Database not initialized');

    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS scenarios (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        financialYear TEXT NOT NULL,
        savings REAL,
        status TEXT,
        templateId TEXT,
        createdAt TEXT,
        updatedAt TEXT
      );
    `);

    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS income_entries (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        scenarioId TEXT,
        type TEXT NOT NULL,
        description TEXT,
        amount REAL NOT NULL,
        financialYear TEXT NOT NULL,
        source TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY(scenarioId) REFERENCES scenarios(id)
      );
    `);

    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS deduction_entries (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        scenarioId TEXT,
        section TEXT NOT NULL,
        description TEXT,
        amount REAL NOT NULL,
        financialYear TEXT NOT NULL,
        category TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY(scenarioId) REFERENCES scenarios(id)
      );
    `);

    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS tax_computations (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        scenarioId TEXT,
        financialYear TEXT NOT NULL,
        totalIncome REAL NOT NULL,
        totalDeductions REAL NOT NULL,
        taxableIncome REAL NOT NULL,
        taxAmount REAL NOT NULL,
        surcharge REAL,
        cess REAL,
        totalTaxPayable REAL NOT NULL,
        effectiveTaxRate REAL,
        regime TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY(scenarioId) REFERENCES scenarios(id)
      );
    `);

    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        entity TEXT NOT NULL,
        entityId TEXT NOT NULL,
        data TEXT NOT NULL,
        createdAt TEXT,
        synced INTEGER DEFAULT 0
      );
    `);
  },

  async addScenario(scenario: Scenario): Promise<void> {
    if (!db) throw new Error('Database not initialized');

    await db.executeSql(
      `
      INSERT INTO scenarios (id, userId, name, description, financialYear, savings, status, templateId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        scenario.id,
        scenario.userId,
        scenario.name,
        scenario.description,
        scenario.financialYear,
        scenario.savings || 0,
        scenario.status,
        scenario.templateId || null,
        scenario.createdAt,
        scenario.updatedAt,
      ]
    );
  },

  async getScenarios(userId: string): Promise<Scenario[]> {
    if (!db) throw new Error('Database not initialized');

    const result = await db.executeSql(
      'SELECT * FROM scenarios WHERE userId = ? ORDER BY updatedAt DESC',
      [userId]
    );

    return result[0].rows._array;
  },

  async getScenario(scenarioId: string): Promise<Scenario | null> {
    if (!db) throw new Error('Database not initialized');

    const result = await db.executeSql(
      'SELECT * FROM scenarios WHERE id = ?',
      [scenarioId]
    );

    return result[0].rows.length > 0 ? result[0].rows._array[0] : null;
  },

  async updateScenario(scenarioId: string, updates: Partial<Scenario>): Promise<void> {
    if (!db) throw new Error('Database not initialized');

    const fields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(', ');
    const values = Object.values(updates);

    await db.executeSql(
      `UPDATE scenarios SET ${fields}, updatedAt = ? WHERE id = ?`,
      [...values, new Date().toISOString(), scenarioId]
    );
  },

  async deleteScenario(scenarioId: string): Promise<void> {
    if (!db) throw new Error('Database not initialized');

    await db.executeSql('DELETE FROM scenarios WHERE id = ?', [scenarioId]);
    await db.executeSql('DELETE FROM income_entries WHERE scenarioId = ?', [
      scenarioId,
    ]);
    await db.executeSql('DELETE FROM deduction_entries WHERE scenarioId = ?', [
      scenarioId,
    ]);
    await db.executeSql('DELETE FROM tax_computations WHERE scenarioId = ?', [
      scenarioId,
    ]);
  },

  async addIncomeEntry(entry: IncomeEntry): Promise<void> {
    if (!db) throw new Error('Database not initialized');

    await db.executeSql(
      `
      INSERT INTO income_entries (id, userId, type, description, amount, financialYear, source, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        entry.id,
        entry.userId,
        entry.type,
        entry.description,
        entry.amount,
        entry.financialYear,
        entry.source,
        entry.createdAt,
        entry.updatedAt,
      ]
    );
  },

  async getIncomeEntries(userId: string, financialYear: string): Promise<IncomeEntry[]> {
    if (!db) throw new Error('Database not initialized');

    const result = await db.executeSql(
      'SELECT * FROM income_entries WHERE userId = ? AND financialYear = ? ORDER BY createdAt DESC',
      [userId, financialYear]
    );

    return result[0].rows._array;
  },

  async addDeductionEntry(entry: DeductionEntry): Promise<void> {
    if (!db) throw new Error('Database not initialized');

    await db.executeSql(
      `
      INSERT INTO deduction_entries (id, userId, section, description, amount, financialYear, category, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        entry.id,
        entry.userId,
        entry.section,
        entry.description,
        entry.amount,
        entry.financialYear,
        entry.category,
        entry.createdAt,
        entry.updatedAt,
      ]
    );
  },

  async getDeductionEntries(userId: string, financialYear: string): Promise<DeductionEntry[]> {
    if (!db) throw new Error('Database not initialized');

    const result = await db.executeSql(
      'SELECT * FROM deduction_entries WHERE userId = ? AND financialYear = ? ORDER BY createdAt DESC',
      [userId, financialYear]
    );

    return result[0].rows._array;
  },

  async saveTaxComputation(computation: TaxComputation): Promise<void> {
    if (!db) throw new Error('Database not initialized');

    await db.executeSql(
      `
      INSERT OR REPLACE INTO tax_computations
      (id, userId, financialYear, totalIncome, totalDeductions, taxableIncome, taxAmount, surcharge, cess, totalTaxPayable, effectiveTaxRate, regime, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        computation.id,
        computation.userId,
        computation.financialYear,
        computation.totalIncome,
        computation.totalDeductions,
        computation.taxableIncome,
        computation.taxAmount,
        computation.surcharge || 0,
        computation.cess || 0,
        computation.totalTaxPayable,
        computation.effectiveTaxRate,
        computation.regime,
        computation.createdAt,
        computation.updatedAt,
      ]
    );
  },

  async queueSyncAction(
    action: string,
    entity: string,
    entityId: string,
    data: any
  ): Promise<void> {
    if (!db) throw new Error('Database not initialized');

    const id = `${Date.now()}-${Math.random()}`;
    await db.executeSql(
      `
      INSERT INTO sync_queue (id, action, entity, entityId, data, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        action,
        entity,
        entityId,
        JSON.stringify(data),
        new Date().toISOString(),
      ]
    );
  },

  async getSyncQueue(): Promise<any[]> {
    if (!db) throw new Error('Database not initialized');

    const result = await db.executeSql(
      'SELECT * FROM sync_queue WHERE synced = 0 ORDER BY createdAt ASC'
    );

    return result[0].rows._array;
  },

  async markSynced(id: string): Promise<void> {
    if (!db) throw new Error('Database not initialized');

    await db.executeSql('UPDATE sync_queue SET synced = 1 WHERE id = ?', [id]);
  },

  async close(): Promise<void> {
    if (db) {
      await db.close();
      db = null;
    }
  },
};

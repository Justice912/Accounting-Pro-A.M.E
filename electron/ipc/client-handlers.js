import crypto from 'crypto';

function normalizeBooleanFlag(value) {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on'
      ? 1
      : 0;
  }
  return value ? 1 : 0;
}

function normalizeOptionalString(value) {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized || null;
}

function normalizeOptionalNumber(value) {
  if (value == null || String(value).trim() === '') return null;
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : null;
}

/**
 * Register IPC handlers for client management operations
 */
export default function registerClientHandlers(ipcMain, services) {
  const { database } = services;

  ipcMain.handle('client:create', async (event, data) => {
    try {
      const id = crypto.randomUUID();
      database.insert('clients', {
        id,
        name: data.name,
        trading_name: data.trading_name || null,
        registration_number: data.registration_number || null,
        vat_number: data.vat_number || null,
        type: data.type || 'individual',
        address: data.address || null,
        email: data.email || null,
        phone: data.phone || null,
        contact_person: data.contact_person || null,
        contact_details: data.contact_details ? JSON.stringify(data.contact_details) : null,
        industry: data.industry || null,
        financial_year_end: data.financial_year_end || null,
        tax_history: data.tax_history || null,
        notes: data.notes || null,
        vat_registered: normalizeBooleanFlag(data.vat_registered),
        vat_category: normalizeOptionalString(data.vat_category),
        has_mixed_supplies: normalizeBooleanFlag(data.has_mixed_supplies),
        apportionment_ratio: normalizeOptionalNumber(data.apportionment_ratio),
        penalty_interest_rate: normalizeOptionalNumber(data.penalty_interest_rate),
      });
      return { success: true, id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('client:update', async (event, id, data) => {
    try {
      const fields = [];
      const values = [];
      const allowed = [
        'name', 'trading_name', 'registration_number', 'vat_number', 'type',
        'address', 'email', 'phone', 'contact_person', 'industry',
        'financial_year_end', 'tax_history', 'notes',
      ];
      for (const key of allowed) {
        if (data[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(data[key]);
        }
      }
      if (data.contact_details !== undefined) {
        fields.push('contact_details = ?');
        values.push(JSON.stringify(data.contact_details));
      }
      if (data.vat_registered !== undefined) {
        fields.push('vat_registered = ?');
        values.push(normalizeBooleanFlag(data.vat_registered));
      }
      if (data.vat_category !== undefined) {
        fields.push('vat_category = ?');
        values.push(normalizeOptionalString(data.vat_category));
      }
      if (data.has_mixed_supplies !== undefined) {
        fields.push('has_mixed_supplies = ?');
        values.push(normalizeBooleanFlag(data.has_mixed_supplies));
      }
      if (data.apportionment_ratio !== undefined) {
        fields.push('apportionment_ratio = ?');
        values.push(normalizeOptionalNumber(data.apportionment_ratio));
      }
      if (data.penalty_interest_rate !== undefined) {
        fields.push('penalty_interest_rate = ?');
        values.push(normalizeOptionalNumber(data.penalty_interest_rate));
      }
      if (!fields.length) return { success: false, error: 'No fields to update' };
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      database.run(`UPDATE clients SET ${fields.join(', ')} WHERE id = ?`, values);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('client:delete', async (event, id) => {
    try {
      database.run('DELETE FROM clients WHERE id = ?', [id]);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('client:get', async (event, id) => {
    try {
      return database.getOne('SELECT * FROM clients WHERE id = ?', [id]);
    } catch {
      return null;
    }
  });

  ipcMain.handle('client:list', async () => {
    try {
      return database.getAll('SELECT * FROM clients ORDER BY name ASC');
    } catch {
      return [];
    }
  });

  ipcMain.handle('client:search', async (event, query) => {
    try {
      return database.getAll(
        `SELECT * FROM clients WHERE
         name LIKE ? OR trading_name LIKE ? OR registration_number LIKE ? OR email LIKE ?
         ORDER BY name ASC LIMIT 20`,
        [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]
      );
    } catch {
      return [];
    }
  });
}

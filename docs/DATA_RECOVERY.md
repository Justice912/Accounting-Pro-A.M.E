# Client data recovery

AME has two apps, and they store data in different places. **Neither app keeps
a copy on a server**, so data can only be recovered from the computer and
browser where it was entered.

| App | Where data lives |
|-----|------------------|
| Web app (`accounting-pro-a-m-e-t3l2.vercel.app`, `src/App_remote.jsx`) | Browser `localStorage`, tied to the exact site address **and** the browser profile |
| Desktop app (Electron) | `database.sqlite` in the app's userData folder, with up to 7 daily backups in `backups/` |

## Do this first

1. **Stop entering data** in the app where the data is missing. In the web
   app, every save rewrites the whole list for that record type (all clients,
   all invoices, and so on).
2. Don't clear browser data. Don't uninstall or reinstall the desktop app.

## Web app

### 1. Check the address you opened

Each address has its own separate storage. Data entered at one address does not
appear at another. These are all different to the browser:

- `https://accounting-pro-a-m-e-t3l2.vercel.app` (production — use this one)
- Any deployment-specific link such as
  `https://accounting-pro-a-m-e-t3l2-<random>-justices-projects-637fa3c1.vercel.app`.
  Vercel creates a new link like this for every deployment and pull request, and
  GitHub and Vercel emails point to them.
- `http://localhost:5173` or another local dev address.

Open your browser history, search for `vercel.app`, and open each distinct
address you have used. Then run the scan (step 3) at each one.

### 2. Check the browser and profile

Storage is also separate per browser (Chrome, Edge, Firefox), per profile, and
per device. Incognito/private windows lose everything when they close.

### 3. Run the recovery script

At each candidate address:

1. Press **F12** and open the **Console** tab.
2. Paste the whole of `scripts/recovery/ame-web-recovery.js` and press Enter.
   Chrome may ask you to type `allow pasting` first.
3. Run `AME_RECOVERY.scan()`.
   - It prints how many records each data type holds.
   - It lists **deleted clients whose invoices, bank lines, VAT, payroll or
     assets still exist**. Deleting a client removed only the client record,
     not the records linked to it.
4. Run `AME_RECOVERY.backup()` to download a JSON copy of everything. Do this
   before running any other command.
5. If the scan found orphaned data, run `AME_RECOVERY.rebuildMissingClients()`
   and reload the page. Each client comes back as
   "Recovered client (created YYYY-MM-DD)", with its data linked again. Use
   **Edit** to put back its name and details. Those details were stored only on
   the deleted client record, so they can't be recovered automatically.
6. To move data from another address or browser: run `backup()` there, open the
   file, copy its contents, then at the production address run
   `AME_RECOVERY.restore(<paste file contents>)`. This **overwrites** what is
   stored at the destination, so back that up first.

### 4. If the browser's site data was cleared

If `scan()` finds nothing at any address, in any browser, the data was probably
removed by clearing browsing data or by a cleanup tool. The only remaining
source is a file-level backup of the browser profile made before the loss, such
as Windows File History, a system restore point, or backup software. Chrome and
Edge keep localStorage in the profile's `Local Storage\leveldb` folder. Close the
browser completely before restoring that folder. How well this works depends on
the backup tool, and it has not been tested with this app.

## Desktop app (Electron)

1. Close the app.
2. Open the userData folder. On Windows it is under `%APPDATA%`, named either
   `AME Pro AI Workstation` or `ame-pro-workstation`, depending on how the app
   was launched. Check both.
3. **Copy the whole `backups` folder somewhere safe now.** The app keeps only
   the 7 newest backups and makes one each day it starts, so good backups get
   deleted as it keeps running.
4. Find the newest `backup-<date>.sqlite` from before the loss. Rename the
   current `database.sqlite` (and any `database.sqlite-wal` and
   `database.sqlite-shm`) to keep them. Then copy the backup in as
   `database.sqlite`.
5. Start the app and check the clients.

## Code defects fixed alongside this guide

- Deleting a client happened on a single click, with no confirmation. It now
  asks first.
- The VAT tab's **Clear All** deleted *every* client's VAT transactions when no
  company was selected. It now does nothing without a selected company and asks
  for confirmation.
- On startup, one unreadable stored value stopped all the values after it from
  loading. The next save then overwrote those with empty lists. Each value now
  loads on its own, and an unreadable value is copied aside before anything
  can overwrite it.

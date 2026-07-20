/**
 * Dev bootstrap — must run before electron-store or any userData access.
 * Gives Shifty its own Application Support folder so it doesn't collide
 * with other Electron dev apps (Stasho, etc.) on the same machine.
 */
import { app } from 'electron';
import path from 'node:path';

if (!app.isPackaged) {
  app.setName('Shifty');
  app.setPath('userData', path.join(app.getPath('appData'), 'Shifty'));
}

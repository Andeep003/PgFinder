const DB_NAME = 'pgfinder-private-documents';
const STORE_NAME = 'identity-proofs';
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('Browser storage is unavailable. Please use a supported browser.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open private document storage.'));
    request.onblocked = () => reject(new Error('Private document storage is blocked by another browser tab.'));
  });
}

export function validateIdentityProof(file) {
  if (!file) throw new Error('Please upload an identity proof photo.');
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error('Upload a JPEG, PNG, or WebP image.');
  }
  if (file.size === 0 || file.size > MAX_FILE_SIZE) {
    throw new Error('The identity proof photo must be non-empty and no larger than 10 MB.');
  }
}

function hasImageSignature(type, bytes) {
  if (type === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (type === 'image/png') {
    return bytes.length >= 8
      && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
      && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  }
  if (type === 'image/webp') {
    return bytes.length >= 12
      && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
      && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  }
  return false;
}

export async function saveIdentityProof(file) {
  validateIdentityProof(file);
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasImageSignature(file.type, bytes)) {
    throw new Error('The selected file is not a valid JPEG, PNG, or WebP image.');
  }

  const database = await openDatabase();
  const id = `proof-${window.crypto.randomUUID()}`;
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).add({ blob: file, type: file.type }, id);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error('Could not save the identity proof photo.'));
      transaction.onabort = () => reject(transaction.error || new Error('Could not save the identity proof photo.'));
    });
    return id;
  } finally {
    database.close();
  }
}

export async function getIdentityProof(id) {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error('Could not load the identity proof photo.'));
    });
  } finally {
    database.close();
  }
}

export async function deleteIdentityProof(id) {
  const database = await openDatabase();
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).delete(id);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error('Could not remove the identity proof photo.'));
      transaction.onabort = () => reject(transaction.error || new Error('Could not remove the identity proof photo.'));
    });
  } finally {
    database.close();
  }
}

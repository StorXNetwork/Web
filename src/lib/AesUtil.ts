// AES Encryption/Decryption with AES-256-GCM using random Initialization Vector + Salt
// ----------------------------------------------------------------------------------------
// the encrypted datablock is base64 encoded for easy data exchange.
// if you have the option to store data binary save consider to remove the encoding to reduce storage size
// ----------------------------------------------------------------------------------------
// format of encrypted data - used by this example. not an official format
//
// +--------------------+-----------------------+----------------+----------------+
// | SALT               | Initialization Vector | Auth Tag       | Payload        |
// | Used to derive key | AES GCM XOR Init      | Data Integrity | Encrypted Data |
// | 64 Bytes, random   | 16 Bytes, random      | 16 Bytes       | (N-96) Bytes   |
// +--------------------+-----------------------+----------------+----------------+
//
// ----------------------------------------------------------------------------------------
// Input/Output Vars
//
// MASTERKEY: the key used for encryption/decryption.
//            it has to be cryptographic safe - this means randomBytes or derived by pbkdf2 (for example)
// TEXT:      data (utf8 string) which should be encoded. modify the code to use Buffer for binary data!
// ENCDATA:   encrypted data as base64 string (format mentioned on top)

// load the build-in crypto functions
const _crypto = require('crypto');

// encrypt/decrypt functions
const AesFunctions = {
  /**
   * Encrypts text by given key
   * @param String text to encrypt
   * @param Buffer masterkey
   * @returns String encrypted text, base64 encoded
   */
  encrypt(text, password, randomIv = false) {
    // load env variables for deterministic encrypt/decrypt
    const {
      REACT_APP_MAGIC_IV: MAGIC_IV,
      REACT_APP_MAGIC_SALT: MAGIC_SALT
    } = process.env;

    if (!MAGIC_IV || !MAGIC_SALT) {
      throw Error('Missing secrets on ENV file');
    }

    // random initialization vector
    const iv = randomIv ? _crypto.randomBytes(16) : Buffer.from(MAGIC_IV as string, 'hex');

    // random salt
    const salt = randomIv ? _crypto.randomBytes(64) : Buffer.from(MAGIC_SALT as string, 'hex');

    // derive encryption key: 32 byte key length
    // in assumption the masterkey is a cryptographic and NOT a password there is no need for
    // a large number of iterations. It may can replaced by HKDF
    // the value of 2145 is randomly chosen!
    const key = _crypto.pbkdf2Sync(`${password}`, salt, 9999, 32, 'sha512');

    // AES 256 GCM Mode
    const cipher = _crypto.createCipheriv('aes-256-gcm', key, iv);

    // encrypt the given text
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

    // extract the auth tag
    const tag = cipher.getAuthTag();

    // generate output
    return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
  },

  /**
   * Decrypts text by given key
   * @param String base64 encoded input data
   * @param Buffer masterkey
   * @returns String decrypted (original) text
   */
  decrypt(encdata, password) {
    // base64 decoding
    const bData = Buffer.from(encdata, 'base64');

    // convert data to buffers
    const salt = bData.slice(0, 64);
    const iv = bData.slice(64, 80);
    const tag = bData.slice(80, 96);
    const text = bData.slice(96);

    if (salt.length === 0 || iv.length === 0 || tag.length === 0 || text.length === 0) {
      // One empty param makes Node crash
      throw new Error('Length 0, cannot decrypt');
    }

    // derive key using; 32 byte key length
    const key = _crypto.pbkdf2Sync(password, salt, 9999, 32, 'sha512');

    // AES 256 GCM Mode
    const decipher = _crypto.createDecipheriv('aes-256-gcm', key, iv);

    decipher.setAuthTag(tag);

    // encrypt the given text
    const decrypted =
      decipher.update(text, 'binary', 'utf8') + decipher.final('utf8');

    return decrypted;
  }
};

export default AesFunctions;

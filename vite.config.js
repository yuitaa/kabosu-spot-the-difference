import { createCipheriv, createHash, randomBytes } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const PASSPHRASE = 'kabosu-server-ha-6-shuunenn';
const IMG_DIR = 'img/test';
const FACES = ['1', '3', '4', '5', '0', '2'].map((n) => `panorama_${n}`);

function getKey() {
  return createHash('sha256').update(PASSPHRASE).digest();
}

function decryptableBuffer(png) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(png), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]);
}

function encryptPanoramaImages() {
  return {
    name: 'encrypt-panorama-images',
    apply: 'build',
    async closeBundle() {
      const imgDir = path.join('dist', IMG_DIR);
      for (const face of FACES) {
        const pngPath = path.join(imgDir, `${face}.png`);
        let raw;
        try {
          raw = await fs.readFile(pngPath);
        } catch {
          continue;
        }
        await fs.writeFile(path.join(imgDir, `${face}.bin`), decryptableBuffer(raw));
        await fs.unlink(pngPath);
      }
    },
  };
}

export default {
  plugins: [encryptPanoramaImages()],
  build: {
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'panolens',
              test: /node_modules[\\/](panolens|three)[\\/]/,
            },
          ],
        },
      },
    },
  },
};

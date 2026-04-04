import 'react-native-get-random-values';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { getDirectS3ClientConfig, publicUrlForS3Key } from '@/lib/config';

const UPLOAD_LOG =
  (typeof __DEV__ !== 'undefined' && __DEV__) ||
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_DEBUG === 'true');

let s3Client: S3Client | null = null;
let s3ClientKey = '';

function getS3Client(cfg: ReturnType<typeof getDirectS3ClientConfig>): S3Client {
  const key = `${cfg.region}:${cfg.accessKeyId}`;
  if (!s3Client || s3ClientKey !== key) {
    s3Client = new S3Client({
      region: cfg.region,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
    });
    s3ClientKey = key;
  }
  return s3Client;
}

/** Called after each successful S3 put. Always logs confirmation; full URL when debug is on. */
export function logUploadConfirmation(context: string, publicUrl: string): void {
  console.log(`[upload] ✓ ${context} — image stored`);
  if (UPLOAD_LOG) {
    console.log(`[upload]   publicUrl: ${publicUrl}`);
  }
}

function safeFileSegment(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'image.jpg';
}

/**
 * Upload a local image to S3 from the device (no presign / backend upload API).
 *
 * **Security:** `EXPO_PUBLIC_*` values are embedded in the app binary — anyone can extract them.
 * Use an IAM user limited to `s3:PutObject` on `arn:aws:s3:::YOUR_BUCKET/driver-uploads/*` only.
 */
export async function uploadLocalImageToS3(options: {
  localUri: string;
  mimeType: string;
  fileName: string;
  logContext: string;
  purpose?: string;
}): Promise<string> {
  const cfg = getDirectS3ClientConfig();
  const prefix = cfg.objectKeyPrefix.replace(/\/$/, '');
  const purpose = (options.purpose ?? 'misc').replace(/[^a-zA-Z0-9/_-]/g, '_');
  const key = `${prefix}/${purpose}/${Date.now()}-${safeFileSegment(options.fileName)}`;

  const fileRes = await fetch(options.localUri);
  if (!fileRes.ok) {
    throw new Error('Could not read image file');
  }
  const buf = await fileRes.arrayBuffer();
  const body = new Uint8Array(buf);

  const client = getS3Client(cfg);

  await client.send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: body,
      ContentType: options.mimeType,
      ...(cfg.objectAcl ? { ACL: cfg.objectAcl } : {}),
    }),
  );

  const fileUrl = publicUrlForS3Key(cfg, key);
  logUploadConfirmation(options.logContext, fileUrl);
  return fileUrl;
}

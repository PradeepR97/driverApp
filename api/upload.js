import 'react-native-get-random-values';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getDirectS3ClientConfig, publicUrlForS3Key } from '@/config/appConfig';
const UPLOAD_LOG = (typeof __DEV__ !== 'undefined' && __DEV__) ||
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_DEBUG === 'true');
let s3Client = null;
let s3ClientKey = '';
function getS3Client(cfg) {
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
export function logUploadConfirmation(context, publicUrl) {
    console.log(`[upload] ✓ ${context} — image stored`);
    if (UPLOAD_LOG) {
        console.log(`[upload]   publicUrl: ${publicUrl}`);
    }
}
function safeFileSegment(name) {
    return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'image.jpg';
}
/**
 * Upload a local image to S3 from the device (no presign / backend upload API).
 *
 * **Security:** `EXPO_PUBLIC_*` values are embedded in the app binary — anyone can extract them.
 * Use an IAM user limited to `s3:PutObject` on `arn:aws:s3:::YOUR_BUCKET/driver-uploads/*` only.
 */
export async function uploadLocalImageToS3(options) {
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
    try {
        await client.send(new PutObjectCommand({
            Bucket: cfg.bucket,
            Key: key,
            Body: body,
            ContentType: options.mimeType,
            ...(cfg.objectAcl ? { ACL: cfg.objectAcl } : {}),
        }));
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[upload] S3 put failed", {
            context: options.logContext,
            bucket: cfg.bucket,
            key,
            region: cfg.region,
            message,
        });
        throw new Error(`S3 upload failed: ${message}`);
    }
    const fileUrl = publicUrlForS3Key(cfg, key);
    logUploadConfirmation(options.logContext, fileUrl);
    return fileUrl;
}

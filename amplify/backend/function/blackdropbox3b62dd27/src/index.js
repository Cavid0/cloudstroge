

const { S3Client, ListObjectVersionsCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const BUCKET = process.env.STORAGE_BLACKDROPBOXFILES_BUCKETNAME;
const REGION = process.env.REGION || 'us-east-1';
const s3 = new S3Client({ region: REGION });

const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Content-Type': 'application/json',
};

exports.handler = async (event) => {
    const method = event.httpMethod || 'GET';
    const path = event.path || '/files';
    const params = event.queryStringParameters || {};

    if (method === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (method === 'GET' && path.endsWith('/versions')) {
        const key = params.key;
        if (!key) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing key parameter' }) };
        }
        try {
            const cmd = new ListObjectVersionsCommand({ Bucket: BUCKET, Prefix: key });
            const result = await s3.send(cmd);
            const versions = (result.Versions || [])
                .filter(v => v.Key === key)
                .map(v => ({
                    versionId: v.VersionId,
                    lastModified: v.LastModified,
                    size: v.Size,
                    isLatest: v.IsLatest,
                }))
                .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
            return { statusCode: 200, headers, body: JSON.stringify({ versions }) };
        } catch (err) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
        }
    }

    if (method === 'GET' && path.endsWith('/download')) {
        const key = params.key;
        const versionId = params.versionId;
        if (!key || !versionId) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing key or versionId' }) };
        }
        try {
            const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key, VersionId: versionId });
            const url = await getSignedUrl(s3, cmd, { expiresIn: 3600 });
            return { statusCode: 200, headers, body: JSON.stringify({ url }) };
        } catch (err) {
            return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
        }
    }

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'BlackDropbox API', version: '1.0' }),
    };
};

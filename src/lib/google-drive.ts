import { google } from 'googleapis'
import { Readable } from 'stream'

function getDriveClient() {
  const keyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!keyRaw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not set')

  const key = JSON.parse(keyRaw)
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  })
  return google.drive({ version: 'v3', auth })
}

export async function uploadToDrive(
  pdfBuffer: Buffer,
  fileName: string,
  folderId: string
): Promise<string> {
  const drive = getDriveClient()

  const stream = new Readable()
  stream.push(pdfBuffer)
  stream.push(null)

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType: 'application/pdf',
      parents: [folderId],
    },
    media: {
      mimeType: 'application/pdf',
      body: stream,
    },
    fields: 'id,webViewLink',
  })

  return res.data.webViewLink ?? res.data.id ?? ''
}

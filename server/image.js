/**
 * Read an image's real dimensions from its header bytes.
 *
 * Header-only, never a full decode: the callers need width, height and format,
 * and decoding a megapixel to learn three numbers would be wasteful in a build
 * script and reckless in a serverless function taking uploads.
 *
 * Shared deliberately. The build check (scripts/check-og.js) and the upload
 * endpoint (api/poster-card.js) both have to agree on what "a 1200x630 JPEG"
 * means; two copies of a bit-twiddling parser would drift, and the drift would
 * show up as a card that passes the build and is rejected at upload, or worse,
 * the reverse.
 */

/** @returns {{w:number,h:number,type:string}|null} */
export function imageSize(buf) {
  if (!buf || buf.length < 16) return null

  // PNG: IHDR is always the first chunk, at a fixed offset.
  if (buf.readUInt32BE(0) === 0x89504e47) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), type: 'image/png' }
  }

  // WebP: a RIFF container whose three body formats each store size differently.
  if (
    buf.length > 30 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    const fourcc = buf.toString('ascii', 12, 16)
    if (fourcc === 'VP8X') {
      return {
        w: (buf.readUIntLE(24, 3) & 0xffffff) + 1,
        h: (buf.readUIntLE(27, 3) & 0xffffff) + 1,
        type: 'image/webp',
      }
    }
    if (fourcc === 'VP8 ') {
      return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff, type: 'image/webp' }
    }
    if (fourcc === 'VP8L') {
      const b = buf.readUInt32LE(21)
      return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1, type: 'image/webp' }
    }
    return null
  }

  // JPEG: walk the segment chain to a start-of-frame marker. Size lives there
  // and nowhere else, and it is height-then-width, which is the wrong way round
  // from every other format and the usual source of a transposed bug.
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) {
        i += 1
        continue
      }
      const marker = buf[i + 1]
      // SOF0..SOF15, less the four in that range that are not frame headers:
      // DHT (c4), JPG (c8) and DAC (cc).
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7), type: 'image/jpeg' }
      }
      // Standalone markers carry no length field to skip over.
      if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9)) {
        i += 2
        continue
      }
      const len = buf.readUInt16BE(i + 2)
      if (len < 2) return null // malformed; refuse rather than loop forever
      i += 2 + len
    }
  }

  return null
}

/** True when the bytes really begin as a JPEG, whatever the request claimed. */
export const isJpeg = (buf) =>
  Boolean(buf) && buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff

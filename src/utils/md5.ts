export function md5(str: string) {
  return crypto.subtle
    .digest('MD5', new TextEncoder().encode(str))
    .then((buf) => {
      const array = new Uint8Array(buf)
      return Array.from(array)
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('')
    })
}

export function sha1(str: string) {
  return crypto.subtle
    .digest('SHA-1', new TextEncoder().encode(str))
    .then((buf) => {
      const array = new Uint8Array(buf)
      return Array.from(array)
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('')
    })
}

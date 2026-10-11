const allowedAvatarTypes = new Set(['image/png', 'image/jpeg', 'image/webp'])
const maxSourceBytes = 8 * 1024 * 1024
const maxAvatarChars = 32 * 1024
const avatarEdge = 128

export class AvatarImageError extends Error {
  readonly reason: 'type' | 'size'

  constructor(reason: 'type' | 'size') {
    super(reason)
    this.reason = reason
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      resolve(typeof reader.result === 'string' ? reader.result : '')
    })
    reader.addEventListener('error', () => {
      reject(new AvatarImageError('type'))
    })
    reader.readAsDataURL(file)
  })
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.addEventListener('load', () => {
      URL.revokeObjectURL(url)
      resolve(image)
    })
    image.addEventListener('error', () => {
      URL.revokeObjectURL(url)
      reject(new AvatarImageError('type'))
    })
    image.src = url
  })
}

async function resizeAvatar(file: File): Promise<string> {
  const image = await loadImage(file)
  const canvas = document.createElement('canvas')
  canvas.width = avatarEdge
  canvas.height = avatarEdge
  const context = canvas.getContext('2d')
  if (!context) {
    if (file.size > 24 * 1024) throw new AvatarImageError('size')
    return readFileAsDataUrl(file)
  }
  const scale = Math.max(avatarEdge / image.width, avatarEdge / image.height)
  const width = image.width * scale
  const height = image.height * scale
  context.drawImage(
    image,
    (avatarEdge - width) / 2,
    (avatarEdge - height) / 2,
    width,
    height
  )
  return canvas.toDataURL('image/jpeg', 0.85)
}

export async function prepareAvatarDataUrl(file: File): Promise<string> {
  if (!allowedAvatarTypes.has(file.type)) throw new AvatarImageError('type')
  if (file.size > maxSourceBytes) throw new AvatarImageError('size')
  const dataUrl = await resizeAvatar(file)
  if (!dataUrl.startsWith('data:image/') || dataUrl.length > maxAvatarChars) {
    throw new AvatarImageError('size')
  }
  return dataUrl
}

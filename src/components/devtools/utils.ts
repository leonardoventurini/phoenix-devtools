// Format message data for single line display
export const formatData = (data: string) => {
  try {
    // Try to parse as JSON and format as compact string
    const jsonData = JSON.parse(data)
    return JSON.stringify(jsonData)
  } catch (e) {
    // If not JSON, display as plain text
    return data
  }
}

export const formatTimestamp = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString(undefined, {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  })
}

export const formatSize = (bytes: number) => {
  if (!bytes && bytes !== 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

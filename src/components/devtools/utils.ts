// Format message data for single line display
export const formatData = (data: string) => {
  try {
    // Try to parse as JSON and format as compact string
    const jsonData = JSON.parse(data);
    return JSON.stringify(jsonData);
  } catch (e) {
    // If not JSON, display as plain text
    return data;
  }
}; 
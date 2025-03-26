export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // diff in seconds

  if (diff < 10) return 'a couple seconds ago';
  if (diff < 60) return 'less than a minute ago';
  if (diff < 120) return 'a minute ago';
  if (diff < 180) return 'two minutes ago';
  if (diff < 300) return 'five minutes ago';
  if (diff < 600) return 'ten minutes ago';
  if (diff < 1800) return 'thirty minutes ago';
  
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  
  if (hours === 1) {
    if (minutes === 0) return '1 hour ago';
    return `1h ${minutes}m ago`;
  }
  
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  if (days === 1) {
    if (remainingHours === 0) return 'a day ago';
    return `a day and ${remainingHours}h ago`;
  }
  
  return `${days} days ago`;
}

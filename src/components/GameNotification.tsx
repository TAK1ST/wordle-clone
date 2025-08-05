interface NotificationProps {
  message: string;
}

export const Notification: React.FC<NotificationProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="mb-4 p-3 bg-blue-500 text-white rounded-lg text-center font-medium animate-pulse">
      {message}
    </div>
  );
};
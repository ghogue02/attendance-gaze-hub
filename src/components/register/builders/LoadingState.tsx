
export const LoadingState = () => {
  return (
    <div className="text-center py-10">
      <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
      <p>Loading builders...</p>
    </div>
  );
};

export default LoadingState;

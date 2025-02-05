import Loading from "@/assets/loading-spinner.svg";
const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <img src={Loading} />
    </div>
  );
};

export default LoadingSpinner;


// Utility to prevent duplicate API calls
const pendingRequests = new Map();

export const createDedupedApiCall = (apiFunction) => {
  return async (...args) => {
    const key = JSON.stringify(args);
    
    // If there's already a pending request with these args, return the existing promise
    if (pendingRequests.has(key)) {
      return pendingRequests.get(key);
    }
    
    // Create new request and store the promise
    const promise = apiFunction(...args).finally(() => {
      // Clean up when request completes
      pendingRequests.delete(key);
    });
    
    pendingRequests.set(key, promise);
    return promise;
  };
};

// Hook to prevent component re-renders from causing multiple API calls
export const useApiCallOnce = (apiCall, dependencies = []) => {
  const [hasCalledRef, setHasCalledRef] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!hasCalledRef) {
      setLoading(true);
      apiCall()
        .then(setResult)
        .catch(setError)
        .finally(() => {
          setLoading(false);
          setHasCalledRef(true);
        });
    }
  }, dependencies);
  
  return { result, loading, error, refetch: () => setHasCalledRef(false) };
};

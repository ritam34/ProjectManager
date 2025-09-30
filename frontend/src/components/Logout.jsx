import React from 'react'

const Logout = () => {
  useEffect(() => {
    const logout = async () => {
      await apiClient.logout();
      // Handle post-logout actions (e.g., redirect to login)
    };
    logout();
  }, []);

  return (
    <div>
        Logging out...
    </div>
  )
}

export default Logout
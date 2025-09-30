class ApiClient {
  constructor() {
    this.baseURL = "http://localhost:4000/api/v1";
    this.headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }
  async customFetch(endpoint, options = {}) {
    try {
      const config = {
        ...options,
        credentials: "include", // include cookies in requests,
        headers: {
          ...this.headers,
          ...options.headers,
        },
      };
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error:", error);
    }
  }
  async signup(fullname, username, email, password) {
    return this.customFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ fullname, username, email, password }),
    });
  }
  async login(email, password) {
    return this.customFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }
  async logout() {
    return this.customFetch("/auth/logout", {
      method: "POST",
    });
  }
}

const apiClient = new ApiClient();

export default apiClient;

//   signup(username, email, password) {
//     return fetch(`${this.baseURL}/api/v1/auth/signup`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ username, email, password }),
//     });
//   }
//             <button type="submit" disabled={loading}>
//               {loading ? "Loading..." : "Submit"}
//             </button>
//     console.log("Success:", data);

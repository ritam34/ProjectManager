import React, { use, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import apiClient from "../../service/apiClient";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const data = await apiClient.signup(fullname,username, email, password);
      console.log("Success:", data);
      
      // Handle successful signup (e.g., redirect to login)
      if(data.success){
        alert("Signup successful! Please login.");
        navigate("/login");
      }else{
        setError(data.message || "Signup failed");
      }
    } catch (error) {
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
      setUsername("");
      setFullname("");
      setEmail("");
      setPassword("");
    }
  };
  return (
    <div>
      Signup
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input 
         type="text"
          placeholder="fullname"
          name="fullname"
          id="fullname"
          value={fullname}
          onChange={(e) => setFullname(e.target.value)}
        />
        <input
          type="text"
          placeholder="username"
          name="username"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="email"
          placeholder="email"
          name="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="password"
          name="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div>
          <button type="submit" disabled={loading}>
            {loading ? "Loading..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Signup;

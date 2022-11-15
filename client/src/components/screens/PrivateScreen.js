import { useState, useEffect } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";
import "./PrivateScreen.css";

const PrivateScreen = () => {
  const history = useHistory();
  const [error, setError] = useState("");
  const [privateData, setPrivateData] = useState("");
  const role = `${localStorage.getItem("Role")}`;
  console.log("role", role);
  useEffect(() => {
    const fetchPrivateDate = async () => {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      };

      try {
        const { data } = await axios.get("/api/private", config);
        setPrivateData(data.data);
      } catch (error) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("Role");
        setError("You are not authorized please login");
      }
    };

    fetchPrivateDate();
  }, []);
  const logoutHandler = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("Role");
    history.push("/login");
  };
  if (role == "Admin") {
    return (
      <>
        <div style={{ background: "green", color: "white" }}>
          {privateData} {role}
        </div>
        <button onClick={logoutHandler}>Logout</button>
      </>
    );
  } else if (role == "User") {
    return (
      <>
        <div style={{ background: "red", color: "white" }}>
          {privateData} {role}
        </div>
        <button onClick={logoutHandler}>Logout</button>
      </>
    );
  } else {
    return error(<span className="error-message">{error}</span>);
  }
};

export default PrivateScreen;

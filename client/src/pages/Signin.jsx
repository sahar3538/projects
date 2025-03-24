import React from "react";

const Signin = () => {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Sign In</h2>
      <form>
        <input type="email" placeholder="Email" required /> <br /><br />
        <input type="password" placeholder="Password" required /> <br /><br />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Signin;
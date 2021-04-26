import React from "react";
import "../src/assets/css/backend.css";

const mainLoader = () => {
  return (
    <div id="loading">
      <div className="preloader loading">
        <span className="slice"></span>
        <span className="slice"></span>
        <span className="slice"></span>
        <span className="slice"></span>
        <span className="slice"></span>
        <span className="slice"></span>
      </div>
    </div>
  );
};

export default mainLoader;

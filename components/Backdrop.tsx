import React from "react";

type BackdropProps = {
  children: React.ReactNode;
};

const Backdrop: React.FC<BackdropProps> = (props) => {
  return <div className="bg-white w-full h-screen">{props.children}</div>;
};

export default Backdrop;

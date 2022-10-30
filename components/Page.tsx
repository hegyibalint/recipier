import React from "react";

type PageProps = {
  children: React.ReactNode;
};

const Page: React.FC<PageProps> = (props) => {
  return (
    <div className="flex flex-col container mx-auto p-5 h-screen ">
      <div className="flex-grow border-2 bg-gray-100 border-black rounded-2xl">
        <header className="px-2 py-2 border-b border-black">
          <p className="text-4xl font-bold text-center">Recepier</p>
        </header>
        <div className="flex-grow">{props.children}</div>
      </div>
    </div>
  );
};

export default Page;

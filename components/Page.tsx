import React from "react";

type PageProps = {
  children: React.ReactNode;
};

const Page: React.FC<PageProps> = (props) => {
  return (
    <div className="flex flex-col xl:container mx-auto xl:p-5 h-screen ">
      <div className="flex-grow bg-gray-100">
        <header className="py-3 bg-slate-800 xl:rounded-t-2xl">
          <p className="text-4xl font-bold text-white text-center">Recepier</p>
        </header>
        <div className="flex-grow border-l border-r border-slate-800">
          {props.children}
        </div>
        <footer className="py-3 bg-slate-800 xl:rounded-b-2xl">
          <p className="text-4xl font-bold text-white text-center">Recepier</p>
        </footer>
      </div>
    </div>
  );
};

export default Page;

import { useRouteError } from "react-router-dom";

export const Error = () => {
  const error = useRouteError();
  return (
    <div className="text-center p-10">
      <h1 className="text-4xl font-bold">Oops!</h1>
      <p className="mt-4 text-red-500">{error?.message || "Page not found."}</p>
    </div>
  );
};
